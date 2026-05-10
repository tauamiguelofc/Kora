// public/js/router.js — Roteador de IAs (client-side hint)
// Classifica a mensagem antes de enviar ao servidor.
// O servidor pode ou não respeitar o hint — ele tem a decisão final.
// Mas o hint melhora a precisão e reduz latência de classificação no backend.

const KoraRouter = (() => {

  // ─── Padrões de classificação ────────────────────────────────────────────
  const PATTERNS = {
    code: {
      weight: 10,
      tests: [
        /```[\s\S]/,                          // bloco de código
        /\b(function|const|let|var|class)\b/, // JS
        /\b(def |import |from \w+ import)\b/, // Python
        /\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)\b/i, // SQL
        /\b(bug|erro|exception|stacktrace|undefined|null pointer)\b/i,
        /\b(refatorar|implementar|debugar|compilar|deploy)\b/i,
        /\b(api|endpoint|rota|route|middleware|cors)\b/i,
        /\b(algoritmo|complexidade|big.?o|recursão|iteração)\b/i,
        /\b(docker|kubernetes|nginx|aws|lambda)\b/i,
        /\.(js|ts|py|java|go|rs|php|rb|css|html|json|yaml|yml)\b/i,
      ]
    },

    reasoning: {
      weight: 6,
      tests: [
        /\b(analise|analisa|analisar)\b/i,
        /\b(compare|compara|comparar)\b/i,
        /\b(explique|explica|explicar)\b/i,
        /\b(estratégia|planejamento|roadmap)\b/i,
        /\b(decisão|decidir|escolher entre)\b/i,
        /\b(prós e contras|vantagens|desvantagens)\b/i,
        /\b(arquitetura|estrutura|design)\b/i,
        /\b(por que|por quê|razão|motivo)\b/i,
        /\b(implicações|consequências|impacto)\b/i,
        /\b(hipótese|teoria|argumento)\b/i,
      ]
    },

    document: {
      weight: 8,
      tests: [
        /\b(resumo|resumir|sumarize)\b/i,
        /\b(pdf|documento|relatório|arquivo)\b/i,
        /\b(contexto longo|muitas páginas|texto extenso)\b/i,
        /\b(transcrição|transcrever)\b/i,
        /\b(extraia|extrair|liste os pontos)\b/i,
      ]
    },

    chat: {
      weight: 0, // fallback — score mais baixo vence
      tests: []  // é o padrão quando nada mais bate
    }
  };

  // ─── Score de uma mensagem por categoria ─────────────────────────────────
  function score(text, category) {
    const { tests, weight } = PATTERNS[category];
    if (!tests.length) return 0;

    let hits = 0;
    for (const pattern of tests) {
      if (pattern.test(text)) hits++;
    }
    return hits * weight;
  }

  // ─── Classificação principal ──────────────────────────────────────────────
  function classify(message, { hasFile = false, historyLength = 0 } = {}) {
    if (!message?.trim()) return { intent: 'chat', model: 'groq', confidence: 1.0 };

    // Arquivo presente → sempre Gemini
    if (hasFile) {
      return { intent: 'document', model: 'gemini', confidence: 1.0, reason: 'file attached' };
    }

    // Contexto muito longo → Gemini (melhor janela de contexto)
    if (historyLength > 20) {
      return { intent: 'document', model: 'gemini', confidence: 0.85, reason: 'long context' };
    }

    const scores = {
      code:      score(message, 'code'),
      reasoning: score(message, 'reasoning'),
      document:  score(message, 'document'),
      chat:      1  // mínimo 1 para sempre ter um fallback
    };

    // Encontra a categoria com maior score
    const winner = Object.entries(scores).reduce(
      (best, [cat, s]) => s > best.score ? { cat, score: s } : best,
      { cat: 'chat', score: 0 }
    );

    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    const confidence = total > 0 ? winner.score / total : 1.0;

    const modelMap = {
      code:      'deepseek',
      reasoning: 'gemini',
      document:  'gemini',
      chat:      'groq'
    };

    return {
      intent:     winner.cat,
      model:      modelMap[winner.cat],
      confidence: parseFloat(confidence.toFixed(2)),
      scores      // exposto para debug
    };
  }

  // ─── Hint para o servidor: injeta no body da requisição ──────────────────
  // O servidor pode usar ou ignorar. Se tiver dúvida, classifica novamente.
  function buildHint(message, options = {}) {
    const result = classify(message, options);
    return {
      _hint: {
        intent:     result.intent,
        model:      result.model,
        confidence: result.confidence
      }
    };
  }

  // ─── Label amigável para debug/UI ─────────────────────────────────────────
  function describeIntent(intent) {
    const labels = {
      code:      '⌨ Código',
      reasoning: '◈ Raciocínio',
      document:  '📄 Documento',
      chat:      '💬 Conversa'
    };
    return labels[intent] || intent;
  }

  // ─── Auto-aprendizado básico (baseado em feedback implícito) ──────────────
  // Se o usuário regenera a resposta ou manda "tente de novo", o roteamento
  // falhou — registra para análise futura.
  const _failures = [];
  function reportFailure(message, assignedModel) {
    _failures.push({ message: message.slice(0, 80), assignedModel, ts: Date.now() });
    if (_failures.length > 50) _failures.shift(); // mantém últimas 50
  }

  function getFailureStats() {
    const byModel = {};
    _failures.forEach(f => {
      byModel[f.assignedModel] = (byModel[f.assignedModel] || 0) + 1;
    });
    return { total: _failures.length, byModel };
  }

  // ─── API pública ──────────────────────────────────────────────────────────
  return {
    classify,
    buildHint,
    describeIntent,
    reportFailure,
    getFailureStats
  };

})();

// Disponível globalmente
window.KoraRouter = KoraRouter;

// ─── Integração com app.js ────────────────────────────────────────────────────
// Sobrescreve o fetch de /api/chat/send para injetar o hint automaticamente
// sem precisar mudar nada no app.js.
(function patchFetch() {
  const _originalFetch = window.fetch;

  window.fetch = function (url, options = {}) {
    // Só intercepta o endpoint de chat
    if (typeof url === 'string' && url.includes('/api/chat/send') && options.body) {
      try {
        const body = JSON.parse(options.body);
        const message = body.message || '';
        const hasFile = body.hasFile || false;
        const historyLength = (body.sessionHistory || []).length;

        const hint = KoraRouter.buildHint(message, { hasFile, historyLength });

        // Injeta o hint no body
        options.body = JSON.stringify({ ...body, ...hint });
      } catch {
        // Se falhar, ignora — não quebra o fluxo
      }
    }

    return _originalFetch.call(this, url, options);
  };
})();
