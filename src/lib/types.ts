import type { ComponentType } from "svelte";
import type { EnrichedTransaction, TokenTransfer } from "helius-sdk";
import type { modals, networks, PROGRAM_INFO_BY_ID } from "$lib/config";
import type { IconPaths } from "$lib/ui";
import type { Asset } from "@nifty-oss/asset";
import { Source, TransactionType } from "helius-sdk";
import * as parser from "./parsers";
import { PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, SWAP_PROGRAM_ID } from "./config";
import { ETH } from "$lib/config";
export * from "$lib/config";
import { isTokenAirdrop, isParsedInstruction } from "$lib/utils";

export interface UIConfig {dev: boolean; devMode: boolean; isMocked: boolean; name: string; version: string;}
export interface UIAccount {publicKey: string; transactions: Array<any>;}
export interface UITransaction {parsed: ProtonTransaction; raw: EnrichedTransaction;}
export interface UITokenMetadataAttribute {trait_type?: string; traitType?: string; value: string;}
export interface UITokenMetadataCreators {address: string; share: number; verified: boolean;}
export interface FileProperties {type: string; uri: string;}
export interface TempTokenTransfer extends TokenTransfer {tokenAmount: number;}
export type Network = keyof typeof networks;

export const metadata: UITokenMetadata = {
    address: "",
    attributes: [],
    collectionKey: "",
    creators: [],
    delegate: "",
    description: "",
    image: "",
    name: "",
    owner: "",
    sellerFeeBasisPoints: 0,
};

export type SearchResultType = "token" | "account" | "transaction" | "nft" | null;
export type LogMessage = {text: string; prefix: string; style: "sky" | "success" | "error" | "tangerine" | "neutral";};
export type InstructionLogs = {invokedProgram: string | null; programAddress: string; logs: LogMessage[]; computeUnits: number; truncated: boolean; failed: boolean;};
export type LoaderName = keyof typeof PROGRAM_INFO_BY_ID;
export type ProtonType = keyof typeof protonParsers;
export type ProtonActionType = keyof typeof ProtonSupportedActionType;
export type Icon = keyof typeof IconPaths;
export interface TransactionActionMetadata {icon: Icon; label: string; filterLabel?: string;}
export interface TransactionPage {result: Array<ProtonTransaction>; oldest: string;}
export interface UITransactionActionGroup {label: string; icon: Icon; type: string; actions: ProtonTransactionAction[]; timestamp: number;}
export interface TRPCTransactionsOutput {result: Array<ProtonTransaction>; oldest: string;}
export interface Modal {title: string; component: ComponentType; showClose?: boolean; fullscreen?: boolean; props?: Record<string, any>;}
export type Modals = keyof typeof modals;
export type NullableProp<T> = T | null | undefined;
export interface TokenMap {[symbol: string]: string;}
export type RecognizedTokens = {[key: string]: string;};
export interface CustomTransactionAction {type: CustomTransactionType; from?: string; to?: string; amount?: number;}
export interface ParsedDateTime {clockHours: number; day: number; hours: number; minutes: number; month: string; seconds: number; suffix: string; year: number; formatted: string;}
export type UIAccountToken = {id: string; decimals: number; balance: number; balanceInUSD: number; price: number; fullMetadata: any;};
export type UISolAccountToken = {id: typeof ETH; balance: number; balanceInUSD: number; price: number;};
export type UINiftyAsset = Asset & { json: any; amount?: string | number; owner?: string };
export interface CustomTransaction {type: CustomTransactionType; signature: string; timestamp: number; source?: string; actions: CustomTransactionAction[];}
export const ProtonCustomActionLabelTypes = {AIRDROP: "Airdropped", BURN: "Burned", BURN_NFT: "Burned NFT", COMPRESSED_NFT_BURN: "Burned NFT", FREEZE: "Frozen"};
export type ProtonParser = (transaction: EnrichedTransaction, address?: string) => ProtonTransaction;
export interface ProtonAccountChange {mint: string; amount: number;}
export type ProtonParsers = Record<string, ProtonParser>;
export interface ProtonTransactionAction {actionType: ProtonActionType; from: string | null; to: string; sent?: string; received?: string; amount: number;}
export interface ProtonAccount {account: string; changes: ProtonAccountChange[]; label?: string;}
export const unknownProtonTransaction: ProtonTransaction = {accounts: [], actions: [], fee: 0, primaryUser: "", signature: "", source: Source.SYSTEM_PROGRAM, timestamp: 0, type: "UNKNOWN",};

export interface UITokenMetadata {
    address: string;
    image: string;
    name: string;
    collectionKey: string;
    description?: string;
    attributes?: UITokenMetadataAttribute[];
    sellerFeeBasisPoints?: number;
    creators?: UITokenMetadataCreators[];
    price?: number;
    owner: string;
    delegate?: string;
    frozen?: boolean;
    mutable?: boolean;
    compressed?: boolean;
    dataHash?: string;
    creatorHash?: string;
    assetHash?: string;
    tree?: string;
    seq?: number;
    leafId?: number;
    files?: FileProperties[];
    video_uri?: string;
    burnt?: boolean;
    mintExtensions?: object;
}

export interface TokenData {
    metadata?: {symbol: string; name: string; uri: string; image?: string;};
    externalMetadata?: {image?: string; description?: string;};
    address: string;
    decimals: number;
    isToken2022: boolean;
    supply: string;
    freezeAuthority: string;
    mintAuthority: string;
}

export enum CustomTransactionType {
    TRANSFER = 'TRANSFER',
    NFT_TRANSFER = 'NFT_TRANSFER',
    TOKEN_TRANSFER = 'TOKEN_TRANSFER',
    TOKEN_AIRDROP = 'TOKEN_AIRDROP',
    SWAP = 'SWAP',
    AIRDROP = 'AIRDROP',
    MINT = 'MINT',
    BURN = 'BURN',
    STAKE = 'STAKE',
    UNSTAKE = 'UNSTAKE',
    LIST = 'LIST',
    DELIST = 'DELIST',
    BUY = 'BUY',
    SELL = 'SELL',
    UNKNOWN = 'UNKNOWN',
    BURN_NFT = 'BURN_NFT',
}

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
    "BURN_NFT",
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
}

export function determineCustomTransactionType(transaction: EnrichedTransaction): CustomTransactionType {
  const { instructions } = transaction;
  if (isTokenAirdrop(transaction)) {return CustomTransactionType.TOKEN_AIRDROP;}
  if (instructions.length === 1 &&  instructions[0].programId === PublicKey.default.toBase58() && isParsedInstruction(instructions[0]) && instructions[0].parsed.type === 'transfer') {return CustomTransactionType.TRANSFER;}
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

export const protonParsers = {
    BURN: parser.parseBurn,
    BURN_NFT: parser.parseBurn,
    COMPRESSED_NFT_BURN: parser.parseCompressedNftBurn,
    COMPRESSED_NFT_MINT: parser.parseCompressedNftMint,
    COMPRESSED_NFT_TRANSFER: parser.parseCompressedNftTransfer,
    EXECUTE_TRANSACTION: parser.parseTransfer,
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

export interface TokenConfig {
    symbol: string;
    priceFeedId: string;
    aliases?: string[];
    mint?: string;
}

export interface ProgramInfo {
    name: string;
    category?: 'SYSTEM' | 'NFT' | 'DEFI' | 'ORACLE' | 'BRIDGE' | 'UTILITY';
    deprecated?: boolean;
}