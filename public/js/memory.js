// public/js/memory.js — Engine de Memória Local do Kora
// Os dados ficam APENAS no dispositivo do usuário.
// Para o servidor só sobem metadados (contagem de nós, timestamps).

const MEMORY_VERSION = '0.1.0';
const STORAGE_KEY = 'kora_memory_v1';

class KoraMemory {
  constructor() {
    this.nodes = [];       // Nós do grafo de conhecimento
    this.edges = [];       // Conexões entre nós
    this.meta = {
      version: MEMORY_VERSION,
      createdAt: null,
      updatedAt: null,
      userName: null,
      userStyle: null,     // como o usuário pensa/trabalha
      currentFocus: null,  // o que está construindo agora
    };
    this.loaded = false;
  }

  // ─── Persistência (localStorage) ─────────────────────────────────────────
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      this.nodes = data.nodes || [];
      this.edges = data.edges || [];
      this.meta = { ...this.meta, ...data.meta };
      this.loaded = true;
      return true;
    } catch (e) {
      console.warn('[Memory] Falha ao carregar memória:', e);
      return false;
    }
  }

  save() {
    try {
      this.meta.updatedAt = new Date().toISOString();
      const data = {
        nodes: this.nodes,
        edges: this.edges,
        meta: this.meta
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('[Memory] Falha ao salvar:', e);
      return false;
    }
  }

  // ─── Inicialização da Memória (onboarding) ────────────────────────────────
  initialize({ userName, currentFocus, workStyle }) {
    this.meta.createdAt = new Date().toISOString();
    this.meta.userName = userName;
    this.meta.currentFocus = currentFocus;
    this.meta.userStyle = workStyle;
    this.loaded = true;

    // Nós iniciais da Fundação
    this.addNode({ type: 'identity', content: `Nome: ${userName}`, confidence: 1.0, sensitive: true });
    if (currentFocus) this.addNode({ type: 'focus', content: `Foco atual: ${currentFocus}`, confidence: 1.0 });
    if (workStyle) this.addNode({ type: 'style', content: `Estilo de trabalho: ${workStyle}`, confidence: 0.8 });

    this.save();
  }

  isInitialized() {
    return this.loaded && this.meta.createdAt !== null;
  }

  // ─── Gestão de nós ────────────────────────────────────────────────────────
  addNode({ type, content, confidence = 0.7, sensitive = false, tags = [] }) {
    const MAX_FREE_NODES = 50;
    const plan = this._getUserPlan();

    if (plan === 'free' && this.nodes.length >= MAX_FREE_NODES) {
      console.warn('[Memory] Limite de nós atingido no plano Free');
      return null;
    }

    const node = {
      id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type,          // 'identity' | 'focus' | 'style' | 'decision' | 'context' | 'learning'
      content,
      confidence,    // 0-1: quanto a Kora confia nessa informação
      sensitive,     // se true, não é enviado para a IA
      tags,
      createdAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      useCount: 0
    };

    this.nodes.push(node);
    this.save();
    return node;
  }

  updateNode(id, updates) {
    const idx = this.nodes.findIndex(n => n.id === id);
    if (idx === -1) return false;
    this.nodes[idx] = { ...this.nodes[idx], ...updates };
    this.save();
    return true;
  }

  addEdge(nodeIdA, nodeIdB, relation = 'related') {
    const edge = { from: nodeIdA, to: nodeIdB, relation, createdAt: new Date().toISOString() };
    this.edges.push(edge);
    this.save();
    return edge;
  }

  // ─── Aprendizado automático das conversas ─────────────────────────────────
  learnFromConversation(userMessage, assistantResponse) {
    const lower = userMessage.toLowerCase();

    // Detecta decisões
    const decisionPatterns = [/decidi /, /vou usar /, /escolhi /, /optei por /, /defini que /];
    if (decisionPatterns.some(p => p.test(lower))) {
      this.addNode({
        type: 'decision',
        content: userMessage.slice(0, 200),
        confidence: 0.85,
        tags: ['decision']
      });
    }

    // Detecta aprendizados
    const learningPatterns = [/aprendi /, /descobri /, /entendi /, /percebi /];
    if (learningPatterns.some(p => p.test(lower))) {
      this.addNode({
        type: 'learning',
        content: userMessage.slice(0, 200),
        confidence: 0.7,
        tags: ['learning']
      });
    }

    // Detecta contexto de projeto
    const projectPatterns = [/projeto /, /estou construindo /, /estou desenvolvendo /, /minha startup /];
    if (projectPatterns.some(p => p.test(lower))) {
      this.addNode({
        type: 'context',
        content: userMessage.slice(0, 200),
        confidence: 0.75,
        tags: ['project']
      });
    }
  }

  // ─── Geração de contexto para a IA ───────────────────────────────────────
  // Retorna apenas nós NÃO sensíveis, formatados para enviar à IA
  buildContextForAI(maxNodes = 8) {
    if (!this.isInitialized()) return null;

    const nonSensitive = this.nodes
      .filter(n => !n.sensitive)
      .sort((a, b) => new Date(b.lastUsedAt) - new Date(a.lastUsedAt))
      .slice(0, maxNodes);

    if (nonSensitive.length === 0) return null;

    const lines = [];

    if (this.meta.userStyle) lines.push(`Estilo de trabalho: ${this.meta.userStyle}`);
    if (this.meta.currentFocus) lines.push(`Foco atual: ${this.meta.currentFocus}`);

    const byType = {};
    nonSensitive.forEach(n => {
      if (!byType[n.type]) byType[n.type] = [];
      byType[n.type].push(n.content);
    });

    if (byType.decision?.length) {
      lines.push('\nDecisões recentes:');
      byType.decision.forEach(d => lines.push(`- ${d}`));
    }
    if (byType.context?.length) {
      lines.push('\nContexto de projetos:');
      byType.context.forEach(c => lines.push(`- ${c}`));
    }
    if (byType.learning?.length) {
      lines.push('\nAprendizados recentes:');
      byType.learning.forEach(l => lines.push(`- ${l}`));
    }

    return lines.join('\n');
  }

  // ─── Stats para UI ────────────────────────────────────────────────────────
  getStats() {
    const byType = {};
    this.nodes.forEach(n => { byType[n.type] = (byType[n.type] || 0) + 1; });
    return {
      totalNodes: this.nodes.length,
      totalEdges: this.edges.length,
      byType,
      userName: this.meta.userName,
      currentFocus: this.meta.currentFocus,
      createdAt: this.meta.createdAt,
      updatedAt: this.meta.updatedAt
    };
  }

  getRecentNodes(limit = 5) {
    return this.nodes
      .filter(n => !n.sensitive)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  }

  // ─── Export / Backup ──────────────────────────────────────────────────────
  export() {
    const data = {
      nodes: this.nodes,
      edges: this.edges,
      meta: this.meta
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const name = this.meta.userName?.toLowerCase().replace(/\s+/g, '_') || 'memoria';
    a.href = url;
    a.download = `${name}.kora`;
    a.click();
    URL.revokeObjectURL(url);
  }

  clear() {
    localStorage.removeItem(STORAGE_KEY);
    this.nodes = [];
    this.edges = [];
    this.meta = { version: MEMORY_VERSION, createdAt: null, updatedAt: null, userName: null };
    this.loaded = false;
  }

  // ─── Helpers privados ─────────────────────────────────────────────────────
  _getUserPlan() {
    try {
      const token = localStorage.getItem('kora_token');
      if (!token) return 'free';
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.plan || 'free';
    } catch { return 'free'; }
  }
}

// Singleton global
window.koraMemory = new KoraMemory();
window.koraMemory.load();
