export default function handler(req, res) {
  return res.status(200).json({
    mongoExists: !!process.env.MONGODB_URI,
    mongoPrefix: process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 15) + '...' : 'não definida',
    jwtExists: !!process.env.JWT_SECRET,
    nodeEnv: process.env.NODE_ENV
  });
}
