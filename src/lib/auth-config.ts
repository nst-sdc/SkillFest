// Default fallback secret for development only
const DEFAULT_SECRET = 'development-secret-do-not-use-in-production';

export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production environment');
  }
  
  return secret || DEFAULT_SECRET;
};

export const JWT_CONFIG = {
  expiresIn: '24h',
  algorithm: 'HS256' as const,
};
