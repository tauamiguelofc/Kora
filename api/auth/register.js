// api/auth/register.js
import { getDb } from '../../lib/db.js';
import { signToken } from '../../lib/jwt.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }
  
  try {
    const { email, password, displayName } = req.body;
    
    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }
    
    if (password.length < 8) {
      return res.status(400).json({ error: 'Senha deve ter pelo menos 8 caracteres' });
    }
    
    const db = await getDb();
    const users = db.collection('users');
    
    // Verifica se email já existe (armazenamos apenas o hash)
    const emailHash = crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
    const existing = await users.findOne({ emailHash });
    
    if (existing) {
      return res.status(409).json({ error: 'Este email já está em uso' });
    }
    
    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 12);
    
    // ID interno único — nunca exposto
    const internalId = crypto.randomBytes(16).toString('hex');
    
    const now = new Date();
    const user = {
      internalId,
      emailHash,           // SHA-256 do email — não reversível
      displayName,         // Nome de exibição (pode ser apelido)
      passwordHash,
      plan: 'free',
      messageCount: 0,
      messageLimit: 50,    // Free: 50 mensagens/dia
      createdAt: now,
      lastActiveAt: now,
      memoryNodes: 0,
      onboardingDone: false
    };
    
    const result = await users.insertOne(user);
    
    const token = signToken({ 
      userId: result.insertedId.toString(),
      internalId,
      plan: 'free'
    });
    
    return res.status(201).json({
      token,
      user: {
        id: result.insertedId.toString(),
        displayName,
        plan: 'free',
        onboardingDone: false,
        messageLimit: 50
      }
    });
    
  } catch (error) {
    console.error('[Register]', error);
    return res.status(500).json({ error: 'Erro interno. Tente novamente.' });
  }
}
