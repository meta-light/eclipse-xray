export enum CustomTransactionType {
  TRANSFER = "TRANSFER",
  NFT_TRANSFER = "NFT_TRANSFER",
  TOKEN_TRANSFER = "TOKEN_TRANSFER",
  SWAP = "SWAP",
  AIRDROP = "AIRDROP",
  MINT = "MINT",
  BURN = "BURN",
  STAKE = "STAKE",
  UNSTAKE = "UNSTAKE",
  LIST = "LIST",
  DELIST = "DELIST",
  BUY = "BUY",
  SELL = "SELL",
  UNKNOWN = "UNKNOWN",
  // Add more types as needed
}

export interface CustomTransaction {
  type: CustomTransactionType;
  signature: string;
  timestamp: number;
  source?: string;
  actions: CustomTransactionAction[];
  // Add other relevant fields
}

export interface CustomTransactionAction {
  type: CustomTransactionType;
  from?: string;
  to?: string;
  amount?: number;
  // Add other relevant fields
}
