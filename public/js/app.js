// public/js/app.js — Lógica da aplicação principal

// ─── Auth guard ───────────────────────────────────────────────────────────────
const token = localStorage.getItem('kora_token');
const userRaw = localStorage.getItem('kora_user');

if (!token || !userRaw) {
  window.location.href = '/onboarding.html';
}

let user = {};
try {
  user = JSON.parse(userRaw);
  // Verifica expiração do token
  const payload = JSON.parse(atob(token.split('.')[1]));
  if (payload.exp && payload.exp * 1000 < Date.now()) {
    localStorage.removeItem('kora_token');
    localStorage.removeItem('kora_user');
    window.location.href = '/onboarding.html?mode=login';
  }
} catch {
  window.location.href = '/onboarding.html';
}

// ─── Estado da aplicação ──────────────────────────────────────────────────────
let currentConversationId = null;
let sessionHistory = [];
let isLoading = false;
let messageCount = user.messageCount || 0;
const MESSAGE_LIMIT = user.messageLimit || 50;

// ─── UI inicial ──────────────────────────────────────────────────────────────
initUI();
loadConversations();

function initUI() {
  // Nome e avatar
  const name = user.displayName || 'Usuário';
  document.getElementById('user-name').textContent = name;
  document.getElementById('user-avatar').textContent = name.charAt(0).toUpperCase();
  document.getElementById('user-plan').textContent = user.plan || 'free';

  // Welcome
  document.getElementById('welcome-title').textContent = `Olá, ${name.split(' ')[0]}.`;

  // Memória
  initMemoryPanel();

  // Barra de limite (só free)
  if (user.plan === 'free') {
    updateLimitBar();
    document.getElementById('msg-limit-bar').style.display = 'flex';
  }
}

// ─── Painel de Memória ────────────────────────────────────────────────────────
function initMemoryPanel() {
  const mem = window.koraMemory;
  if (!mem?.isInitialized()) return;

  const stats = mem.getStats();
  document.getElementById('mp-nodes').textContent = stats.totalNodes;
  document.getElementById('mp-focus').textContent =
    (stats.currentFocus || '—').slice(0, 30) + (stats.currentFocus?.length > 30 ? '...' : '');

  const recentNodes = mem.getRecentNodes(4);
  const listEl = document.getElementById('mp-nodes-list');
  listEl.innerHTML = recentNodes.map(n => `
    <div class="mp-node-item">
      <span class="node-type">${n.type}</span>${n.content.slice(0, 40)}${n.content.length > 40 ? '...' : ''}
    </div>
  `).join('');

  // Toggle expand
  const expandBtn = document.getElementById('mp-expand');
  const body = document.getElementById('mp-body');
  document.querySelector('.memory-panel-header').addEventListener('click', () => {
    const open = body.style.display !== 'none';
    body.style.display = open ? 'none' : 'block';
    expandBtn.classList.toggle('open', !open);
  });

  // Export
  document.getElementById('mp-export').addEventListener('click', () => {
    mem.export();
    toast('Memória exportada!', 'success');
  });
}

function updateMemoryPanel() {
  const mem = window.koraMemory;
  if (!mem?.isInitialized()) return;
  const stats = mem.getStats();
  document.getElementById('mp-nodes').textContent = stats.totalNodes;
}

// ─── Barra de limite de mensagens ─────────────────────────────────────────────
function updateLimitBar() {
  const pct = Math.min((messageCount / MESSAGE_LIMIT) * 100, 100);
  const fill = document.getElementById('mlb-fill');
  const text = document.getElementById('mlb-text');
  fill.style.width = pct + '%';
  fill.classList.toggle('warning', pct >= 70 && pct < 90);
  fill.classList.toggle('danger', pct >= 90);
  text.textContent = `${messageCount} / ${MESSAGE_LIMIT} mensagens hoje`;
}

// ─── Conversas recentes ───────────────────────────────────────────────────────
async function loadConversations() {
  try {
    const res = await fetch('/api/chat/history', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return;
    const { conversations } = await res.json();

    const list = document.getElementById('conv-list');
    if (!conversations?.length) return;

    list.innerHTML = conversations.map(c => `
      <button class="conv-item" data-id="${c._id}">
        ${escapeHtml(c.title)}
      </button>
    `).join('');

    list.querySelectorAll('.conv-item').forEach(btn => {
      btn.addEventListener('click', () => {
        // Por ora, inicia nova conversa com o contexto do título como hint
        startNewConversation();
        toast('Histórico completo em breve.', 'info');
      });
    });

  } catch {}
}

// ─── Envio de mensagens ────────────────────────────────────────────────────────
async function sendMessage(text) {
  if (!text?.trim() || isLoading) return;

  // Limite de mensagens
  if (user.plan === 'free' && messageCount >= MESSAGE_LIMIT) {
    toast(`Limite de ${MESSAGE_LIMIT} mensagens diárias atingido. Volta amanhã ou faça upgrade para Pro.`, 'error');
    return;
  }

  isLoading = true;
  setInputLoading(true);
  showMessages();
  hideWelcome();

  // Exibe mensagem do usuário
  appendMessage('user', text);

  // Adiciona ao histórico da sessão
  sessionHistory.push({ role: 'user', content: text });

  // Indicador de digitação
  const typingEl = showTypingIndicator();

  try {
    // Contexto de memória (anônimo)
    const memoryContext = window.koraMemory?.buildContextForAI(8) || null;

    const res = await fetch('/api/chat/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        message: text,
        conversationId: currentConversationId,
        memoryContext,
        sessionHistory: sessionHistory.slice(-10)
      })
    });

    const data = await res.json();

    if (!res.ok) {
      if (data.code === 'DAILY_LIMIT') {
        throw new Error(`Limite diário de ${data.limit} mensagens atingido. Volte amanhã ou faça upgrade para Pro.`);
      }
      throw new Error(data.error || 'Erro ao processar mensagem.');
    }

    typingEl.remove();

    // Exibe resposta
    const response = data.response;
    appendMessage('assistant', response);
    sessionHistory.push({ role: 'assistant', content: response });

    // Atualiza conversa
    currentConversationId = data.conversationId;
    messageCount = data.messageCount || messageCount + 1;

    // Aprende com a conversa
    window.koraMemory?.learnFromConversation(text, response);
    updateMemoryPanel();

    // Atualiza barra de limite
    if (user.plan === 'free') updateLimitBar();

    // Atualiza título da conversa
    if (sessionHistory.length === 2) {
      document.getElementById('chat-title').textContent = text.slice(0, 40);
    }

    // Recarrega lista de conversas a cada 5 mensagens
    if (messageCount % 5 === 0) loadConversations();

  } catch (err) {
    typingEl.remove();
    appendError(err.message);
  } finally {
    isLoading = false;
    setInputLoading(false);
  }
}

// ─── Renderização de mensagens ────────────────────────────────────────────────
function appendMessage(role, content) {
  const list = document.getElementById('messages-list');
  const row = document.createElement('div');
  row.className = `msg-row ${role}`;

  const label = role === 'user' ? 'Você' : '◈ Kora';
  const formatted = role === 'assistant' ? formatMarkdown(content) : escapeHtml(content);

  row.innerHTML = `
    <div class="msg-label">${label}</div>
    <div class="msg-bubble">${formatted}</div>
  `;

  list.appendChild(row);
  scrollToBottom();
}

function appendError(msg) {
  const list = document.getElementById('messages-list');
  const row = document.createElement('div');
  row.className = 'msg-row assistant';
  row.innerHTML = `
    <div class="msg-label">◈ Kora</div>
    <div class="msg-bubble" style="color: #ff6b6b;">${escapeHtml(msg)}</div>
  `;
  list.appendChild(row);
  scrollToBottom();
}

function showTypingIndicator() {
  const list = document.getElementById('messages-list');
  const row = document.createElement('div');
  row.className = 'typing-row';
  row.innerHTML = `
    <div class="typing-dots">
      <span></span><span></span><span></span>
    </div>
  `;
  list.appendChild(row);
  scrollToBottom();
  return row;
}

// ─── Formatação Markdown básica ───────────────────────────────────────────────
function formatMarkdown(text) {
  let html = escapeHtml(text);

  // Code blocks (``` ```)
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) =>
    `<pre><code>${code.trim()}</code></pre>`
  );

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h4 style="margin:12px 0 4px;font-family:var(--font-display);font-size:15px">$1</h4>');
  html = html.replace(/^## (.+)$/gm, '<h3 style="margin:14px 0 6px;font-family:var(--font-display);font-size:17px">$1</h3>');

  // Unordered lists
  html = html.replace(/^\- (.+)$/gm, '<li style="margin-left:20px;margin-bottom:4px">$1</li>');

  // Line breaks
  html = html.replace(/\n\n/g, '<br><br>');
  html = html.replace(/\n/g, '<br>');

  return html;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Controle de UI ───────────────────────────────────────────────────────────
function showMessages() {
  document.getElementById('messages-list').style.display = 'flex';
}
function hideWelcome() {
  document.getElementById('welcome-screen').style.display = 'none';
}
function showWelcome() {
  document.getElementById('welcome-screen').style.display = 'flex';
  document.getElementById('messages-list').style.display = 'none';
}

function scrollToBottom() {
  const area = document.getElementById('messages-area');
  area.scrollTop = area.scrollHeight;
}

function setInputLoading(loading) {
  const btn = document.getElementById('send-btn');
  btn.disabled = loading;
  btn.classList.toggle('loading', loading);
  if (loading) {
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 18 18" class="spin" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" stroke-width="1.5" stroke-dasharray="22" stroke-dashoffset="8"/></svg>`;
  } else {
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9h12M11 5l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
}

function startNewConversation() {
  currentConversationId = null;
  sessionHistory = [];
  document.getElementById('messages-list').innerHTML = '';
  document.getElementById('chat-title').textContent = 'Nova conversa';
  showWelcome();
}

// ─── Event listeners ──────────────────────────────────────────────────────────
const textarea = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');

textarea.addEventListener('input', () => {
  // Auto-resize
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';

  // Enable/disable send button
  sendBtn.disabled = !textarea.value.trim() || isLoading;

  // Char count
  const len = textarea.value.length;
  const countEl = document.getElementById('char-count');
  if (len > 3000) {
    countEl.textContent = `${len}/4000`;
    countEl.style.color = len > 3800 ? '#ff3b30' : 'var(--text-muted)';
  } else {
    countEl.textContent = '';
  }
});

textarea.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (!sendBtn.disabled) {
      const msg = textarea.value.trim();
      textarea.value = '';
      textarea.style.height = 'auto';
      sendBtn.disabled = true;
      sendMessage(msg);
    }
  }
});

sendBtn.addEventListener('click', () => {
  if (!sendBtn.disabled) {
    const msg = textarea.value.trim();
    textarea.value = '';
    textarea.style.height = 'auto';
    sendBtn.disabled = true;
    sendMessage(msg);
  }
});

// Nova conversa
document.getElementById('btn-new-chat').addEventListener('click', startNewConversation);

// Suggestion chips
document.querySelectorAll('.suggestion-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const msg = chip.dataset.msg;
    sendMessage(msg);
  });
});

// Sidebar mobile
document.getElementById('sidebar-toggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('visible');
});
document.getElementById('sidebar-overlay').addEventListener('click', () => {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('visible');
});

// User menu
document.getElementById('user-menu-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  const dd = document.getElementById('user-dropdown');
  dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
});
document.addEventListener('click', () => {
  document.getElementById('user-dropdown').style.display = 'none';
});

// Logout
document.getElementById('dd-logout').addEventListener('click', () => {
  localStorage.removeItem('kora_token');
  localStorage.removeItem('kora_user');
  window.location.href = '/';
});

// ─── Toast ────────────────────────────────────────────────────────────────────
function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

// CSS para spinner inline
const style = document.createElement('style');
style.textContent = `
  @keyframes spin { to { transform: rotate(360deg); } }
  .spin { animation: spin 0.8s linear infinite; }
`;
document.head.appendChild(style);
