import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'change_me';

export type AuthTokenPayload = {
  userId: number;
  email: string;
};

export const signAuthToken = (payload: AuthTokenPayload) =>
  jwt.sign(payload, JWT_SECRET, {
    expiresIn: '1d',
  });

export const verifyAuthToken = (token: string): AuthTokenPayload =>
  jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
