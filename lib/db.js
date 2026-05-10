// lib/db.js — Conexão MongoDB singleton para Vercel Functions
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {};

let client;
let clientPromise;

if (!uri) {
  throw new Error('MONGODB_URI não definida nas variáveis de ambiente');
}

if (process.env.NODE_ENV === 'development') {
  // Em desenvolvimento, reutiliza a conexão entre hot-reloads
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // Em produção, cria nova conexão por instância
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

export async function getDb() {
  const client = await clientPromise;
  return client.db('kora');
}
