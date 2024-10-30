declare module 'crypto-browserify' {
  interface Hash {
    update(data: string | Buffer): Hash;
    digest(encoding?: string): Buffer | string;
  }

  export function createHash(algorithm: string): Hash;
} 