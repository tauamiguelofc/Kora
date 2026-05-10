// public/js/landing.js

// ─── Canvas background (partículas/constelações) ────────────────────────────
(function initCanvas() {
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let W, H, particles, animId;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function createParticles() {
    const count = Math.floor((W * H) / 18000);
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.2 + 0.2,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      opacity: Math.random() * 0.5 + 0.1
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // Linhas de conexão
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(232,184,75,${0.04 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
    // Partículas
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(232,184,75,${p.opacity})`;
      ctx.fill();
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;
    });
    animId = requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => {
    cancelAnimationFrame(animId);
    resize();
    createParticles();
    draw();
  });

  resize();
  createParticles();
  draw();
})();

// ─── Nav scroll ─────────────────────────────────────────────────────────────
window.addEventListener('scroll', () => {
  document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 40);
});

// ─── Efeito de digitação no hero ─────────────────────────────────────────────
const lines = [
  { el: 'typed-line-1', text: 'Ela não é mais um chatbot.' },
  { el: 'typed-line-2', text: 'Ela te conhece.' },
  { el: 'typed-line-3', text: 'Ela aprende como você pensa.' }
];

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function typeText(el, text, speed = 38) {
  const element = document.getElementById(el);
  const cursor = document.createElement('span');
  cursor.className = 'typing-cursor';
  element.appendChild(cursor);

  for (const char of text) {
    cursor.insertAdjacentText('beforebegin', char);
    await sleep(speed + Math.random() * 20);
  }
  return cursor;
}

async function runTyping() {
  await sleep(400);

  for (let i = 0; i < lines.length; i++) {
    const cursor = await typeText(lines[i].el, lines[i].text, i === 1 ? 45 : 38);
    if (i < lines.length - 1) {
      await sleep(300);
      cursor.remove();
      await sleep(200);
    } else {
      // Remove cursor final após pausa
      await sleep(800);
      cursor.remove();
      // Revela elementos abaixo
      document.getElementById('hero-sub').classList.add('visible');
      await sleep(200);
      document.getElementById('hero-cta').classList.add('visible');
      await sleep(200);
      document.getElementById('hero-proof').classList.add('visible');
    }
  }
}

runTyping();

// ─── Intersection Observer para animações de scroll ──────────────────────────
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.step').forEach(el => observer.observe(el));

// ─── Modal: Como funciona ────────────────────────────────────────────────────
const howBtn = document.getElementById('how-btn');
const modal = document.getElementById('how-modal');
const modalClose = document.getElementById('modal-close');

howBtn?.addEventListener('click', () => modal.classList.add('open'));
modalClose?.addEventListener('click', () => modal.classList.remove('open'));
modal?.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') modal?.classList.remove('open'); });

// ─── Smooth scroll para âncoras ───────────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(a.getAttribute('href'));
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// ─── Redireciona se já logado ─────────────────────────────────────────────────
const token = localStorage.getItem('kora_token');
if (token) {
  // Verifica rapidamente se o token ainda é válido
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && payload.exp * 1000 > Date.now()) {
      // Token válido — add botão "Abrir Kora" na nav
      const navActions = document.querySelector('.nav-actions');
      if (navActions) {
        const openBtn = document.createElement('a');
        openBtn.href = '/app.html';
        openBtn.className = 'btn btn-primary btn-sm';
        openBtn.textContent = 'Abrir Kora';
        navActions.innerHTML = '';
        navActions.appendChild(openBtn);
      }
    }
  } catch {}
}
