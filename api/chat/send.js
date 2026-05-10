// api/chat/send.js — Endpoint principal do chat
import { getDb } from '../../lib/db.js';
import { requireAuth } from '../../lib/jwt.js';
import { routeMessage } from '../../lib/ai-router.js';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });
  
  const auth = requireAuth(req);
  if (!auth) return res.status(401).json({ error: 'Não autenticado' });
  
  try {
    const { message, conversationId, memoryContext, sessionHistory } = req.body;
    
    if (!message?.trim()) {
      return res.status(400).json({ error: 'Mensagem vazia' });
    }
    
    const db = await getDb();
    const users = db.collection('users');
    const conversations = db.collection('conversations');
    const messages = db.collection('messages');
    
    // Busca usuário e verifica limite
    const user = await users.findOne({ _id: new ObjectId(auth.userId) });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    
    // Verifica limite de mensagens (plano Free: 50/dia)
    if (user.plan === 'free' && user.messageCount >= (user.messageLimit || 50)) {
      return res.status(429).json({ 
        error: 'Limite diário atingido',
        code: 'DAILY_LIMIT',
        limit: user.messageLimit || 50,
        resetAt: 'meia-noite'
      });
    }
    
    // Prepara histórico para a IA (últimas 10 mensagens + a atual)
    const history = (sessionHistory || []).slice(-10).map(m => ({
      role: m.role,
      content: m.content
    }));
    
    history.push({ role: 'user', content: message });
    
    // Chama o roteador de IAs
    const { response, model, intent } = await routeMessage({
      messages: history,
      memoryContext: memoryContext || null,
      hasFile: false
    });
    
    // Cria ou recupera conversa
    let convId = conversationId;
    if (!convId) {
      const conv = await conversations.insertOne({
        userId: auth.userId,
        title: message.slice(0, 60) + (message.length > 60 ? '...' : ''),
        createdAt: new Date(),
        updatedAt: new Date(),
        messageCount: 0
      });
      convId = conv.insertedId.toString();
    } else {
      await conversations.updateOne(
        { _id: new ObjectId(convId) },
        { $set: { updatedAt: new Date() }, $inc: { messageCount: 2 } }
      );
    }
    
    // Salva mensagens
    const now = new Date();
    await messages.insertMany([
      {
        conversationId: convId,
        userId: auth.userId,
        role: 'user',
        content: message,
        createdAt: now
      },
      {
        conversationId: convId,
        userId: auth.userId,
        role: 'assistant',
        content: response,
        model,
        intent,
        createdAt: new Date(now.getTime() + 1)
      }
    ]);
    
    // Incrementa contador de mensagens
    await users.updateOne(
      { _id: user._id },
      { $inc: { messageCount: 1 } }
    );
    
    return res.status(200).json({
      response,
      conversationId: convId,
      model,      // qual IA respondeu (debug/transparência opcional)
      intent,
      messageCount: user.messageCount + 1
    });
    
  } catch (error) {
    console.error('[Chat/Send]', error);
    return res.status(500).json({ 
      error: error.message || 'Erro ao processar mensagem. Tente novamente.'
    });
  }
}
