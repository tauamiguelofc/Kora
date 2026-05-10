// api/auth/login.js
import { getDb } from '../../lib/db.js';
import { signToken } from '../../lib/jwt.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });
  
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }
    
    const db = await getDb();
    const users = db.collection('users');
    
    const emailHash = crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
    const user = await users.findOne({ emailHash });
    
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    // Reset contador diário se for novo dia
    const today = new Date().toDateString();
    const lastActive = new Date(user.lastActiveAt).toDateString();
    
    if (today !== lastActive) {
      await users.updateOne(
        { _id: user._id },
        { $set: { messageCount: 0, lastActiveAt: new Date() } }
      );
    } else {
      await users.updateOne(
        { _id: user._id },
        { $set: { lastActiveAt: new Date() } }
      );
    }
    
    const token = signToken({
      userId: user._id.toString(),
      internalId: user.internalId,
      plan: user.plan
    });
    
    return res.status(200).json({
      token,
      user: {
        id: user._id.toString(),
        displayName: user.displayName,
        plan: user.plan,
        onboardingDone: user.onboardingDone,
        messageCount: today !== lastActive ? 0 : user.messageCount,
        messageLimit: user.messageLimit || 50
      }
    });
    
  } catch (error) {
    console.error('[Login]', error);
    return res.status(500).json({ error: 'Erro interno. Tente novamente.' });
  }
}
