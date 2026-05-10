// api/memory/sync.js
// Sincroniza apenas METADADOS da memória (contagem de nós, timestamp)
// Os dados reais da memória NUNCA sobem para o servidor — ficam no device
import { getDb } from '../../lib/db.js';
import { requireAuth } from '../../lib/jwt.js';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
  
  const auth = requireAuth(req);
  if (!auth) return res.status(401).json({ error: 'Não autenticado' });
  
  try {
    const { nodeCount, lastUpdated, onboardingDone } = req.body;
    
    const db = await getDb();
    const update = { $set: {} };
    
    if (typeof nodeCount === 'number') update.$set.memoryNodes = nodeCount;
    if (lastUpdated) update.$set.memoryLastUpdated = new Date(lastUpdated);
    if (typeof onboardingDone === 'boolean') update.$set.onboardingDone = onboardingDone;
    
    await db.collection('users').updateOne(
      { _id: new ObjectId(auth.userId) },
      update
    );
    
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[Memory/Sync]', err);
    return res.status(500).json({ error: 'Erro ao sincronizar metadados' });
  }
}
