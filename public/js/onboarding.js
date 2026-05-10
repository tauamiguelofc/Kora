// public/js/onboarding.js

const API = '';  // relativo, funciona em qualquer ambiente

// ─── Utilitários ──────────────────────────────────────────────────────────────
function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

function showError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.style.display = 'block';
}

function hideError(id) {
  document.getElementById(id).style.display = 'none';
}

function setLoading(btnId, loading, text = '') {
  const btn = document.getElementById(btnId);
  btn.disabled = loading;
  if (text) btn.textContent = loading ? '...' : text;
}

function goToStep(id) {
  document.querySelectorAll('.ob-step').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ─── Verificação inicial ───────────────────────────────────────────────────
const params = new URLSearchParams(window.location.search);
const mode = params.get('mode');

// Se já está logado, vai direto para o app
const existingToken = localStorage.getItem('kora_token');
if (existingToken) {
  try {
    const payload = JSON.parse(atob(existingToken.split('.')[1]));
    if (payload.exp && payload.exp * 1000 > Date.now()) {
      // Token válido — verifica se onboarding já foi feito
      const user = JSON.parse(localStorage.getItem('kora_user') || '{}');
      if (user.onboardingDone) {
        window.location.href = '/app.html';
      }
    }
  } catch {}
}

// ─── Tab switcher (login / registro) ──────────────────────────────────────
document.getElementById('tab-register').addEventListener('click', () => {
  document.getElementById('tab-register').classList.add('active');
  document.getElementById('tab-login').classList.remove('active');
  document.getElementById('form-register').style.display = 'block';
  document.getElementById('form-login').style.display = 'none';
  hideError('auth-error');
});

document.getElementById('tab-login').addEventListener('click', () => {
  document.getElementById('tab-login').classList.add('active');
  document.getElementById('tab-register').classList.remove('active');
  document.getElementById('form-login').style.display = 'block';
  document.getElementById('form-register').style.display = 'none';
  hideError('auth-error');
});

// Se veio com ?mode=login, mostra o login
if (mode === 'login') {
  document.getElementById('tab-login').click();
}

// ─── Registro ─────────────────────────────────────────────────────────────
document.getElementById('btn-register').addEventListener('click', async () => {
  hideError('auth-error');
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass = document.getElementById('reg-pass').value;

  if (!name || !email || !pass) return showError('auth-error', 'Preencha todos os campos.');
  if (pass.length < 8) return showError('auth-error', 'Senha deve ter pelo menos 8 caracteres.');

  setLoading('btn-register', true, 'Criar minha conta');

  try {
    const res = await fetch(`${API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: name, email, password: pass })
    });
    const data = await res.json();

    if (!res.ok) return showError('auth-error', data.error || 'Erro ao criar conta.');

    localStorage.setItem('kora_token', data.token);
    localStorage.setItem('kora_user', JSON.stringify(data.user));

    // Inicia a Fundação
    startFoundation(name);

  } catch {
    showError('auth-error', 'Erro de conexão. Verifique sua internet.');
  } finally {
    setLoading('btn-register', false, 'Criar minha conta');
  }
});

// ─── Login ─────────────────────────────────────────────────────────────────
document.getElementById('btn-login').addEventListener('click', async () => {
  hideError('auth-error');
  const email = document.getElementById('log-email').value.trim();
  const pass = document.getElementById('log-pass').value;

  if (!email || !pass) return showError('auth-error', 'Preencha email e senha.');

  setLoading('btn-login', true, 'Entrar');

  try {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });
    const data = await res.json();

    if (!res.ok) return showError('auth-error', data.error || 'Credenciais inválidas.');

    localStorage.setItem('kora_token', data.token);
    localStorage.setItem('kora_user', JSON.stringify(data.user));

    if (data.user.onboardingDone) {
      window.location.href = '/app.html';
    } else {
      startFoundation(data.user.displayName);
    }

  } catch {
    showError('auth-error', 'Erro de conexão. Verifique sua internet.');
  } finally {
    setLoading('btn-login', false, 'Entrar');
  }
});

// Enter para submit
document.getElementById('reg-pass').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('btn-register').click();
});
document.getElementById('log-pass').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('btn-login').click();
});

// ─── Fundação: conversa de onboarding ─────────────────────────────────────

const FOUNDATION_QUESTIONS = [
  (name) => `Olá, ${name}. Eu sou a Kora.\n\nNos próximos dois minutos, vou criar sua Memória — o arquivo que vai me permitir te conhecer de verdade ao longo do tempo.\n\nPrimeira pergunta: **o que você está construindo agora?** Pode ser um projeto, um objetivo, um problema que está tentando resolver. Não precisa ser perfeito — só seja honesto.`,
  () => `Entendido. Agora me conta: **como você prefere pensar e trabalhar?** Por exemplo — você é mais analítico ou intuitivo? Prefere escrever longamente ou ir direto ao ponto? Trabalha melhor sozinho ou em contexto colaborativo?`,
  () => `Última pergunta: **o que você quer que eu nunca esqueça sobre você?** Pode ser um valor, uma forma de trabalhar, uma limitação, uma ambição. O que for mais importante para que eu te ajude de verdade.`
];

let foundationStep = 0;
let foundationAnswers = [];
let userName = '';

function startFoundation(name) {
  userName = name;
  goToStep('step-foundation');

  // Pequeno delay para a transição ser suave
  setTimeout(() => {
    showFoundationMessage(FOUNDATION_QUESTIONS[0](name), 'kora');
    setTimeout(() => showFoundationInput(), 800);
  }, 300);
}

function showFoundationMessage(text, role) {
  const chat = document.getElementById('foundation-chat');

  const msg = document.createElement('div');
  msg.className = `fc-msg ${role}`;

  const bubble = document.createElement('div');
  bubble.className = 'fc-bubble';

  // Converte **bold** simples
  bubble.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');

  msg.appendChild(bubble);
  chat.appendChild(msg);
  chat.scrollTop = chat.scrollHeight;
}

function showTypingIndicator() {
  const chat = document.getElementById('foundation-chat');
  const typing = document.createElement('div');
  typing.className = 'fc-msg kora';
  typing.id = 'fc-typing';
  typing.innerHTML = `
    <div class="fc-typing">
      <span></span><span></span><span></span>
    </div>`;
  chat.appendChild(typing);
  chat.scrollTop = chat.scrollHeight;
  return typing;
}

function removeTypingIndicator() {
  document.getElementById('fc-typing')?.remove();
}

function showFoundationInput() {
  const wrap = document.getElementById('foundation-input-wrap');
  wrap.style.display = 'flex';
  document.getElementById('foundation-input').focus();
}

function hideFoundationInput() {
  document.getElementById('foundation-input-wrap').style.display = 'none';
  document.getElementById('foundation-input').value = '';
}

async function handleFoundationAnswer() {
  const input = document.getElementById('foundation-input');
  const answer = input.value.trim();
  if (!answer) return;

  hideFoundationInput();
  showFoundationMessage(answer, 'user');
  foundationAnswers.push(answer);
  foundationStep++;

  if (foundationStep < FOUNDATION_QUESTIONS.length) {
    // Próxima pergunta com delay
    const typing = showTypingIndicator();
    await sleep(1200);
    removeTypingIndicator();
    showFoundationMessage(FOUNDATION_QUESTIONS[foundationStep](), 'kora');
    setTimeout(showFoundationInput, 400);
  } else {
    // Finaliza a fundação
    const typing = showTypingIndicator();
    await sleep(1500);
    removeTypingIndicator();

    const closingMsg = `Perfeito, ${userName}. Sua Memória está sendo criada agora.\n\nA partir de hoje, tudo que você me conta se torna parte de quem você é para mim. Não vou esquecer.`;
    showFoundationMessage(closingMsg, 'kora');

    await sleep(1000);
    finalizeFoundation();
  }
}

async function finalizeFoundation() {
  const [focus, style, neverForget] = foundationAnswers;

  // Inicializa a memória local
  window.koraMemory.initialize({
    userName,
    currentFocus: focus,
    workStyle: style
  });

  // Adiciona o "nunca esqueça" como nó de alta confiança
  if (neverForget) {
    window.koraMemory.addNode({
      type: 'identity',
      content: `O que nunca devo esquecer: ${neverForget}`,
      confidence: 1.0,
      sensitive: false,
      tags: ['never-forget']
    });
  }

  // Atualiza metadados no servidor (sem dados pessoais)
  try {
    const token = localStorage.getItem('kora_token');
    await fetch('/api/memory/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        nodeCount: window.koraMemory.nodes.length,
        lastUpdated: new Date().toISOString(),
        onboardingDone: true
      })
    });
  } catch {}

  // Atualiza usuário local
  const user = JSON.parse(localStorage.getItem('kora_user') || '{}');
  user.onboardingDone = true;
  localStorage.setItem('kora_user', JSON.stringify(user));

  // Mostra tela de conclusão
  const stats = window.koraMemory.getStats();
  const safeName = userName.toLowerCase().replace(/\s+/g, '_');

  document.getElementById('done-filename').textContent = `${safeName}.kora`;
  document.getElementById('done-title').textContent = `Sua Memória foi criada, ${userName}.`;

  const statsEl = document.getElementById('done-stats');
  statsEl.innerHTML = `
    <div class="done-stat">
      <div class="done-stat-num">${stats.totalNodes}</div>
      <div class="done-stat-label">Nós criados</div>
    </div>
    <div class="done-stat">
      <div class="done-stat-num">3</div>
      <div class="done-stat-label">IAs disponíveis</div>
    </div>
    <div class="done-stat">
      <div class="done-stat-num">∞</div>
      <div class="done-stat-label">Conversas possíveis</div>
    </div>
  `;

  await sleep(800);
  goToStep('step-done');
}

// ─── Event listeners do input de fundação ─────────────────────────────────
document.getElementById('foundation-send').addEventListener('click', handleFoundationAnswer);
document.getElementById('foundation-input').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleFoundationAnswer();
  }
});

// ─── Helpers ───────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
