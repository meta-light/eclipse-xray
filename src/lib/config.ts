import type { Modal, ProgramInfo, TokenConfig } from "$lib/types";
import { ASSET_PROGRAM_ID } from "@nifty-oss/asset";
import Help from "$lib/components/modals/help.svelte";
import Menu from "$lib/components/modals/menu.svelte";
import TransactionFilter from "$lib/components/modals/transaction-filter.svelte";
import WalletSelector from "$lib/components/modals/wallets.svelte";
export const recentSearchesKey = "xray:searches";
export const modals: Record<string, Modal> = {HELP: {component: Help, title: "Help"}, MENU: {component: Menu, title: "XRAY"}, SELECT_MULTI_WALLET: {component: WalletSelector, title: "Select Wallet"}, TRANSACTION_FILTER: {component: TransactionFilter, title: "Filter",}};
export const TOKEN_2022_PROGRAM_ID = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
export const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
export const ATA_PROGRAM_ID = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
export const SOL = "So11111111111111111111111111111111111111112";
export const SWAP_PROGRAM_ID = "SwaPpA9LAaLfeLi3a68M4DjnLqgtticKg6CnyNwgAC8";
export const ETH = "So11111111111111111111111111111111111111112";
export const networks = {devnet: `https://staging-rpc.dev2.eclipsenetwork.xyz/`, mainnet: `https://mainnetbeta-rpc.eclipse.xyz`,};

export const tokenConfig: Record<string, TokenConfig> = {
  SOL: {symbol: 'SOL', priceFeedId: '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d', aliases: ['Solana'], mint: 'BeRUj3h7BqkbdfFU7FBNYbodgf8GCHodzKvF9aVjNNfL'},
  ETH: {symbol: 'ETH', priceFeedId: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace', aliases: ['Ethereum', 'Wrapped ETH'], mint: 'So11111111111111111111111111111111111111112'},
  USDC: {symbol: 'USDC', priceFeedId: '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a', aliases: ['USD Coin'], mint: 'AKEWE7Bgh87GPp171b4cJPSSZfmZwQ3KaqYqXoKLNAEE'},
  WIF: {symbol: 'WIF', priceFeedId: '0x4ca4beeca86f0d164160323817a4e42b10010a724c2217c6ee41b54cd4cc61fc', aliases: ['dogwifhat'], mint: '841P4tebEgNux2jaWSjCoi9LhrVr9eHGjLc758Va3RPH'},
};

export const PROGRAM_INFO_BY_ID: Record<string, ProgramInfo> = {
  "BPFLoaderUpgradeab1e11111111111111111111111": { name: "BPF Loader Upgradeable", category: "SYSTEM" },
  "MoveLdr111111111111111111111111111111111111": { name: "Move Loader", category: "SYSTEM" },
  "NativeLoader1111111111111111111111111111111": { name: "Native Loader", category: "SYSTEM" },
  "1nc1nerator11111111111111111111111111111111": { name: "Incinerator", category: "SYSTEM" },
  "Sysvar1111111111111111111111111111111111111": { name: "SYSVAR", category: "SYSTEM" },
  "Sysvar1nstructions1111111111111111111111111": { name: "Sysvar: Instructions", category: "SYSTEM" },
  "SysvarEpochSchedu1e111111111111111111111111": { name: "Sysvar: Epoch Schedule", category: "SYSTEM" },
  "SysvarFees111111111111111111111111111111111": { name: "Sysvar: Fees", category: "SYSTEM" },
  "SysvarRecentB1ockHashes11111111111111111111": { name: "Sysvar: Recent Blockhashes", category: "SYSTEM" },
  "SysvarS1otHashes111111111111111111111111111": { name: "Sysvar: Slot Hashes", category: "SYSTEM" },
  "SysvarS1otHistory11111111111111111111111111": { name: "Sysvar: Slot History", category: "SYSTEM" },
  "SysvarC1ock11111111111111111111111111111111": { name: "Sysvar: Clock", category: "SYSTEM" },
  "SysvarRent111111111111111111111111111111111": { name: "Sysvar: Rent", category: "SYSTEM" },
  "SysvarStakeHistory1111111111111111111111111": { name: "Sysvar: Stake History", category: "SYSTEM" },
  "SysvarEpochRewards1111111111111111111111111": { name: "Sysvar: Epoch Rewards", category: "SYSTEM" },
  "Stake11111111111111111111111111111111111111": { name: "Stake Program", category: "SYSTEM" },
  "Vote111111111111111111111111111111111111111": { name: "Vote Program", category: "SYSTEM" },
  "KeccakSecp256k11111111111111111111111111111": { name: "Secp256k1 Program", category: "SYSTEM" },
  "Ed25519SigVerify111111111111111111111111111": { name: "Ed25519 Program", category: "SYSTEM" },
  [TOKEN_PROGRAM_ID]: { name: "Token Program", category: "UTILITY" },
  [TOKEN_2022_PROGRAM_ID]: { name: "Token-2022 Program", category: "UTILITY" },
  [ATA_PROGRAM_ID]: { name: "Associated Token Account Program", category: "UTILITY" },
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s": { name: "Token Metadata", category: "NFT" },
  "p1exdMJcjVao65QdewkaZRUnU6VPSXhus9n2GzWfh98": { name: "Metaplex", category: "NFT" },
  "vau1zxA2LbssAUEF7Gpw91zMM1LvXrvpzJtmZ58rPsn": { name: "Token Vault", category: "NFT" },
  "cmtDvXumGCrqC1Age74AVPhSRVXJMd8PJS91L8KbNCK": { name: "Account Compression", category: "SYSTEM" },
  "namesLPneVptA9Z5rqUDD9tMTWEJwofgaYwp8cawRkX": { name: "Name Service", category: "UTILITY" },
  "auctxRXPeJoc4817jDhf4HbjnhEcr1cCXenosMhK5R8": { name: "NFT Auction", category: "NFT" },
  "So11111111111111111111111111111111111111112": { name: "ETH", category: "SYSTEM" },
  "SwaPpA9LAaLfeLi3a68M4DjnLqgtticKg6CnyNwgAC8": { name: "SWAP", category: "SYSTEM" },
  "AddressLookupTab1e1111111111111111111111111": { name: "ADDRESS LOOKUP TABLE", category: "SYSTEM" },
  "ComputeBudget111111111111111111111111111111": { name: "COMPUTE BUDGET", category: "SYSTEM" },
  "Config1111111111111111111111111111111111111": { name: "CONFIG", category: "SYSTEM" },
  "Feat1YXHhH6t1juaWF74WLcfv4XoNocjXA6sPWHNgAse": { name: "FEATURE PROPOSAL", category: "SYSTEM" },
  "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo": { name: "MEMO", category: "SYSTEM" },
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr": { name: "MEMO 2", category: "SYSTEM" },
  "SPoo1Ku8WFXoNDMHPsrGSTSG1Y47rzgn41SLUNakuHy": { name: "STAKE POOL", category: "SYSTEM" },
  "11111111111111111111111111111111": { name: "SYSTEM PROGRAM", category: "SYSTEM" },
  "rec5EKMGg6MxZYaMdyBfgwp4d5rB9T1VQH5pJv5LtFJ": { name: "PYTH", category: "ORACLE" },
  "pythWSnswVUd12oZpeFP8e9CVaEqJg25g1Vtc2biRsT": { name: "PYTH PRICE FEED", category: "ORACLE" },
  "SBondMDrcV3K4kxZR1HNVT7osZxAHVHgYXL5Ze1oMUv": { name: "SWITCHBOARD", category: "ORACLE" },
  "br1xwubggTiEZ6b7iNZUwfA3psygFfaXGfZ1heaN9AW": { name: "BRIDGE PROGRAM", category: "BRIDGE" },
  "DcZMKcjz34CcXF1vx7CkfARZdmEja2Kcwvspu1Zw6Zmn": { name: "SHARP TRADE", category: "DEFI" },
  "4UsSbJQZJTfZDFrgvcPBRCSg5BbcQE6dobnriCafzj12": { name: "LIFINITY", category: "DEFI" },
  "iNvTyprs4TX8m6UeUEkeqDFjAL9zRCRWcexK9Sd4WEU": { name: "INVARIANT LP", category: "DEFI" },
  "ELexZoFHkSHYiAxw1jtY3se8RVPEjsL4HGqD4mfkMreZ": { name: "SHARP TRADE INITIATE PARTNER", category: "DEFI" },
  "PARrVs6F5egaNuz8g6pKJyU4ze3eX5xGZCFb3GLiVvu": { name: "HEDGEHOG", category: "DEFI" },
  [ASSET_PROGRAM_ID]: { name: "Nifty Asset", category: "NFT" },
};