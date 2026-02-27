import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'jaltrack_fallback_secret';

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: payload.sub,
      role: payload.role,
      name: payload.name,
      customerId: payload.customerId || null,
      businessId: payload.businessId || null,
    };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      name: user.full_name,
      customerId: user.customer_id || null,
      businessId: user.business_id || null,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}
