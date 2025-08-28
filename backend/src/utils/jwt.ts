import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export interface JwtPayload {
  userId: number;
  username: string;
  isAdmin: boolean;
}

export const generateToken = (payload: JwtPayload): string => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not set in environment variables');
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
};

export const verifyToken = (token: string): JwtPayload => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not set in environment variables');
  }
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
};
