// lib/ai-router.js — Roteador inteligente entre as 3 IAs gratuitas
// Gemini (Google) · Groq (Llama) · DeepSeek
// O usuário nunca sabe qual modelo respondeu. Kora roteia por tipo de tarefa.

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GROQ_KEY = process.env.GROQ_API_KEY;
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;

// ─── Classificador de intenção ─────────────────────────────────────────────
function classifyMessage(message, hasFile = false) {
  if (hasFile) return 'document';
  
  const lower = message.toLowerCase();
  
  const codePatterns = [
    /\bcode\b/, /\bcódigo\b/, /\bfunção\b/, /\bfunction\b/, /\bapi\b/,
    /\bsql\b/, /\bjavascript\b/, /\bpython\b/, /\bbug\b/, /\berro\b/,
    /\bimplementar\b/, /\brefatorar\b/, /\bdebug\b/, /\balgorítmo\b/,
    /```/, /\bclasse\b/, /\barray\b/, /\bobjeto\b/
  ];
  
  const isCode = codePatterns.some(p => p.test(lower));
  if (isCode) return 'code';
  
  const reasoningPatterns = [
    /\bpor que\b/, /\bexplique\b/, /\banalisar\b/, /\bcomparar\b/,
    /\bestrategia\b/, /\bplanejar\b/, /\bpensar\b/, /\bdecisão\b/,
    /\barquitetura\b/, /\bvantagens\b/, /\bdesvantagens\b/
  ];
  
  const isReasoning = reasoningPatterns.some(p => p.test(lower));
  if (isReasoning) return 'reasoning';
  
  return 'chat'; // padrão: conversa rápida
}

// ─── Gemini (documentos, contexto longo) ──────────────────────────────────
async function callGemini(messages, systemPrompt) {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(GEMINI_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  
  const history = messages.slice(0, -1).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));
  
  const lastMessage = messages[messages.length - 1];
  
  const chat = model.startChat({
    history,
    generationConfig: { maxOutputTokens: 2048 }
  });
  
  const fullPrompt = systemPrompt 
    ? `${systemPrompt}\n\n${lastMessage.content}`
    : lastMessage.content;
    
  const result = await chat.sendMessage(fullPrompt);
  return result.response.text();
}

// ─── Groq (conversa rápida — Llama 3.3 70B) ────────────────────────────────
async function callGroq(messages, systemPrompt) {
  const body = {
    model: 'llama-3.3-70b-versatile',
    messages: [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      ...messages
    ],
    max_tokens: 1024,
    temperature: 0.7
  };
  
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  
  if (!res.ok) throw new Error(`Groq error: ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

// ─── DeepSeek (raciocínio, código) ────────────────────────────────────────
async function callDeepSeek(messages, systemPrompt) {
  const body = {
    model: 'deepseek-chat',
    messages: [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      ...messages
    ],
    max_tokens: 2048,
    temperature: 0.3 // mais determinístico para código
  };
  
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DEEPSEEK_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  
  if (!res.ok) throw new Error(`DeepSeek error: ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

// ─── Roteador principal ────────────────────────────────────────────────────
export async function routeMessage({ messages, memoryContext, hasFile = false }) {
  const lastMsg = messages[messages.length - 1]?.content || '';
  const intent = classifyMessage(lastMsg, hasFile);
  
  // System prompt com contexto de memória (anônimo)
  const systemPrompt = memoryContext
    ? `Você é Kora, uma IA pessoal que conhece profundamente este usuário. Use o contexto abaixo para dar respostas mais precisas e pessoais. Nunca mencione que tem um "contexto" — apenas use naturalmente.\n\nCONTEXTO DO USUÁRIO:\n${memoryContext}\n\nResponda sempre em português. Seja direto, profundo e genuíno.`
    : `Você é Kora, uma IA pessoal inteligente e empática. Responda sempre em português. Seja direto, profundo e genuíno.`;
  
  let model = 'groq'; // padrão
  let response;
  
  try {
    if (intent === 'document' || intent === 'reasoning') {
      model = 'gemini';
      response = await callGemini(messages, systemPrompt);
    } else if (intent === 'code') {
      model = 'deepseek';
      response = await callDeepSeek(messages, systemPrompt);
    } else {
      model = 'groq';
      response = await callGroq(messages, systemPrompt);
    }
  } catch (primaryError) {
    console.error(`[AI Router] ${model} falhou:`, primaryError.message);
    
    // Fallback: tenta Groq (mais estável e rápido)
    try {
      model = 'groq-fallback';
      response = await callGroq(messages, systemPrompt);
    } catch (fallbackError) {
      // Último recurso: Gemini
      try {
        model = 'gemini-fallback';
        response = await callGemini(messages, systemPrompt);
      } catch {
        throw new Error('Todas as IAs estão indisponíveis. Tente novamente em instantes.');
      }
    }
  }
  
  return { response, model, intent };
}
