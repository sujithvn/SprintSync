import jwt from 'jsonwebtoken';

function getJwtSecret(): string {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not set in environment variables');
  }
  return JWT_SECRET;
}

function getJwtExpiresIn(): string {
  return process.env.JWT_EXPIRES_IN || '24h';
}

export interface JwtPayload {
  userId: number;
  username: string;
  isAdmin: boolean;
}

export const generateToken = (payload: JwtPayload): string => {
  const JWT_SECRET = getJwtSecret();
  const JWT_EXPIRES_IN = getJwtExpiresIn();
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
};

export const verifyToken = (token: string): JwtPayload => {
  const JWT_SECRET = getJwtSecret();
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
};