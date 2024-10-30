import { createHash as nodeCreateHash } from 'crypto-browserify';

export function createHash(algorithm: string) {
  return nodeCreateHash(algorithm);
} 