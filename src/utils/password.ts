import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export const hashPassword = (value: string): Promise<string> => bcrypt.hash(value, SALT_ROUNDS);

export const comparePassword = (plain: string, hashed: string): Promise<boolean> => bcrypt.compare(plain, hashed);
