import type { EnrichedTransaction } from "helius-sdk";
import { Source, TransactionType } from "helius-sdk";
import * as parser from "./parsers";
import { PublicKey } from '@solana/web3.js';
import { ATA_PROGRAM_ID, TOKEN_PROGRAM_ID, SWAP_PROGRAM_ID } from "../../config";

export const SOL = "So11111111111111111111111111111111111111112";

export enum ProtonSupportedType {
    BURN,
    BURN_NFT,
    NFT_BID,
    NFT_BID_CANCELLED,
    NFT_CANCEL_LISTING,
    NFT_LISTING,
    NFT_SALE,
    NFT_MINT,
    SWAP,
    TRANSFER,
    UNKNOWN,
    TOKEN_MINT,
    EXECUTE_TRANSACTION,
    COMPRESSED_NFT_MINT,
    COMPRESSED_NFT_TRANSFER,
    COMPRESSED_NFT_UPDATE_METADATA,
    APPROVE_TRANSACTION,
    STAKE_SOL,
    SFT_MINT,
    OFFER_LOAN,
    RESCIND_LOAN,
    TAKE_LOAN,
    REPAY_LOAN,
    ADD_ITEM,
    UPDATE_ITEM,
    CANCEL_OFFER,
    LEND_FOR_NFT,
    REQUEST_LOAN,
    CANCEL_LOAN_REQUEST,
    BORROW_SOL_FOR_NFT,
    REBORROW_SOL_FOR_NFT,
    CLAIM_NFT,
    UPDATE_OFFER,
    FORECLOSE_LOAN,
    STAKE_TOKEN,
    UNSTAKE_TOKEN,
    BUY_ITEM,
    CLOSE_ITEM,
    CLOSE_ORDER,
    DELIST_ITEM,
    LIST_ITEM,
    CANCEL_ORDER,
    CREATE_ORDER,
    UPDATE_ORDER,
    FILL_ORDER,
    MIGRATE_TO_PNFT,
    COMPRESSED_NFT_BURN,
}

export enum ProtonSupportedActionType {
    "SENT",
    "RECEIVED",
    "TRANSFER",
    "TRANSFER_SENT",
    "TRANSFER_RECEIVED",
    "SWAP",
    "SWAP_SENT",
    "SWAP_RECEIVED",
    "UNKNOWN",
    "NFT_SALE",
    "NFT_BUY",
    "NFT_SELL",
    "NFT_LISTING",
    "NFT_CANCEL_LISTING",
    "NFT_BID",
    "NFT_BID_CANCELLED",
    "NFT_GLOBAL_BID",
    "NFT_MINT",
    "AIRDROP",
    "BURN",
    "FREEZE",
    "TOKEN_MINT",
    "EXECUTE_TRANSACTION",
    "COMPRESSED_NFT_MINT",
    "COMPRESSED_NFT_TRANSFER",
    "COMPRESSED_NFT_UPDATE_METADATA",
    "APPROVE_TRANSACTION",
    "STAKE_SOL",
    "SFT_MINT",
    "OFFER_LOAN",
    "RESCIND_LOAN",
    "TAKE_LOAN",
    "REPAY_LOAN",
    "ADD_ITEM",
    "UPDATE_ITEM",
    "CANCEL_OFFER",
    "CLAIM_NFT",
    "UPDATE_OFFER",
    "FORECLOSE_LOAN",
    "STAKE_TOKEN",
    "UNSTAKE_TOKEN",
    "BUY_ITEM",
    "CLOSE_ITEM",
    "CLOSE_ORDER",
    "DELIST_ITEM",
    "LIST_ITEM",
    "CANCEL_ORDER",
    "CREATE_ORDER",
    "UPDATE_ORDER",
    "FILL_ORDER",
    "COMPRESSED_NFT_BURN",
}

export const ProtonCustomActionLabelTypes = {AIRDROP: "Airdropped", BURN: "Burned", BURN_NFT: "Burned NFT", COMPRESSED_NFT_BURN: "Burned NFT", FREEZE: "Frozen"};
export type ProtonParser = (transaction: EnrichedTransaction, address?: string) => ProtonTransaction;
export interface ProtonTransactionAction {actionType: ProtonActionType; from: string | null; to: string; sent?: string; received?: string; amount: number;}

export interface ProtonTransaction {
    type: ProtonType | TransactionType | ProtonActionType;
    primaryUser: string;
    fee: number;
    signature: string;
    timestamp: number;
    blockTime?: number;
    source: Source;
    actions: ProtonTransactionAction[];
    accounts: ProtonAccount[];
    raw?: EnrichedTransaction;
    metadata?: { [key: string]: any };
    customType: CustomTransactionType;
}

export interface ProtonAccount {account: string; changes: ProtonAccountChange[]; label?: string;}
export interface ProtonAccountChange {mint: string; amount: number;}
export type ProtonParsers = Record<string, ProtonParser>;

export const protonParsers = {
    BORROW_FOX: parser.parseBorrowFox,
    BURN: parser.parseBurn,
    BURN_NFT: parser.parseBurn,
    COMPRESSED_NFT_BURN: parser.parseCompressedNftBurn,
    COMPRESSED_NFT_MINT: parser.parseCompressedNftMint,
    COMPRESSED_NFT_TRANSFER: parser.parseCompressedNftTransfer,
    EXECUTE_TRANSACTION: parser.parseTransfer,
    LOAN_FOX: parser.parseLoanFox,
    NFT_BID: parser.parseNftBid,
    NFT_BID_CANCELLED: parser.parseNftCancelBid,
    NFT_CANCEL_LISTING: parser.parseNftCancelList,
    NFT_GLOBAL_BID: parser.parseNftGlobalBid,
    NFT_LISTING: parser.parseNftList,
    NFT_MINT: parser.parseNftMint,
    NFT_SALE: parser.parseNftSale,
    SWAP: parser.parseSwap,
    TOKEN_MINT: parser.parseTokenMint,
    TRANSFER: parser.parseTransfer,
    UNKNOWN: parser.parseUnknown,
};

export type ProtonType = keyof typeof protonParsers;
export type ProtonActionType = keyof typeof ProtonSupportedActionType;

export enum CustomTransactionType {
  UNKNOWN = 'UNKNOWN',
  TRANSFER = 'TRANSFER',
  NFT_TRANSFER = 'NFT_TRANSFER',
  TOKEN_TRANSFER = 'TOKEN_TRANSFER',
  SWAP = 'SWAP',
  TOKEN_AIRDROP = 'TOKEN_AIRDROP',
}

export const unknownProtonTransaction: ProtonTransaction = {
    accounts: [],
    actions: [],
    fee: 0,
    primaryUser: "",
    signature: "",
    source: Source.SYSTEM_PROGRAM,
    timestamp: 0,
    type: "UNKNOWN",
    customType: CustomTransactionType.UNKNOWN,
};

export function determineCustomTransactionType(transaction: EnrichedTransaction): CustomTransactionType {
  const { instructions, accountKeys } = transaction;
  if (isTokenAirdrop(transaction)) {return CustomTransactionType.TOKEN_AIRDROP;}
  if (instructions.length === 1 && 
      instructions[0].programId === PublicKey.default.toBase58() &&
      isParsedInstruction(instructions[0]) &&
      instructions[0].parsed.type === 'transfer') {
    return CustomTransactionType.TRANSFER;
  }
  if (instructions.some(instr => 
      instr.programId === TOKEN_PROGRAM_ID &&
      'parsed' in instr &&
      typeof instr.parsed === 'object' &&
      instr.parsed !== null &&
      'type' in instr.parsed &&
      instr.parsed.type === 'transferChecked' &&
      'info' in instr.parsed &&
      typeof instr.parsed.info === 'object' &&
      instr.parsed.info !== null &&
      'tokenAmount' in instr.parsed.info &&
      typeof instr.parsed.info.tokenAmount === 'object' &&
      instr.parsed.info.tokenAmount !== null &&
      'uiAmount' in instr.parsed.info.tokenAmount &&
      instr.parsed.info.tokenAmount.uiAmount === 1)) {
    return CustomTransactionType.NFT_TRANSFER;
  }
  if (instructions.length > 2 && instructions.some(instr => instr.programId === SWAP_PROGRAM_ID)) {return CustomTransactionType.SWAP;}
  return CustomTransactionType.UNKNOWN;
}

function isTokenAirdrop(transaction: EnrichedTransaction): boolean {
  const { instructions, accountKeys } = transaction;
  const hasAtaInstruction = instructions.some(instr => 'programId' in instr && instr.programId === ATA_PROGRAM_ID);
  const hasTokenTransfer = instructions.some(instr => 
    'programId' in instr && instr.programId === TOKEN_PROGRAM_ID &&
    'parsed' in instr && 
    typeof instr.parsed === 'object' &&
    instr.parsed !== null &&
    'type' in instr.parsed &&
    instr.parsed.type === 'transfer'
  );
  
  const newAccountCreated = transaction.meta?.postTokenBalances?.some((balance: any) => 
    !transaction.meta?.preTokenBalances?.some((preBalance:any) => 
      preBalance.accountIndex === balance.accountIndex
    )
  ) ?? false;
  
  return hasAtaInstruction && hasTokenTransfer && newAccountCreated;
}

// Add this type guard function
function isParsedInstruction(instruction: any): instruction is { parsed: { type: string } } {
  return 'parsed' in instruction && typeof instruction.parsed === 'object' && instruction.parsed !== null;
}

export function mapCustomTypeToProtonActionType(customType: CustomTransactionType): ProtonActionType {
  switch (customType) {
    case CustomTransactionType.TRANSFER:
      return "TRANSFER";
    case CustomTransactionType.NFT_TRANSFER:
      return "COMPRESSED_NFT_TRANSFER";
    case CustomTransactionType.TOKEN_TRANSFER:
      return "TRANSFER";
    case CustomTransactionType.SWAP:
      return "SWAP";
    case CustomTransactionType.TOKEN_AIRDROP:
      return "AIRDROP";
    default:
      return "UNKNOWN";
  }
}
