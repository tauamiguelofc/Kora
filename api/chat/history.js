// api/chat/history.js — Lista conversas do usuário
import { getDb } from '../../lib/db.js';
import { requireAuth } from '../../lib/jwt.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();
  
  const auth = requireAuth(req);
  if (!auth) return res.status(401).json({ error: 'Não autenticado' });
  
  try {
    const db = await getDb();
    const convs = await db.collection('conversations')
      .find({ userId: auth.userId })
      .sort({ updatedAt: -1 })
      .limit(20)
      .project({ title: 1, updatedAt: 1, messageCount: 1 })
      .toArray();
    
    return res.status(200).json({ conversations: convs });
  } catch (err) {
    console.error('[History]', err);
    return res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
}
