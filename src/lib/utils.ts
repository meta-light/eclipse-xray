import type { ProtonTransactionAction } from "./types";
import { type ProtonAccount, SOL } from "./types";
import type { TokenTransfer, NativeTransfer, AccountData } from "helius-sdk";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { publicKeyMappings } from "./config";

interface TempTokenTransfer extends TokenTransfer {tokenAmount: number;}

export const groupActions = (actions: ProtonTransactionAction[]) => {
    const match = (a: ProtonTransactionAction, b: ProtonTransactionAction) => a.actionType === b.actionType && a.from === b.from && a.to === b.to && (a.sent === b.sent || a.received === b.received);
    const grouped = actions.reduce((acc: ProtonTransactionAction[], action) => {let idx = 0; const existing = acc.find((a, i) => {idx = i; return match(a, action);}); if (existing) {acc[idx].amount += action.amount;} else {acc.push(action);} return acc;}, []);
    return grouped;
};

export const rentTransferCheck = (amount: number) => {if (amount <= 4120320) {return true;} return false;};

export const traverseTokenTransfers = (tokenTransfers: TokenTransfer[], actions: ProtonTransactionAction[], address: string | undefined) => {
    for (let i = 0; i < tokenTransfers.length; i++) {
        const tx = tokenTransfers[i] as TempTokenTransfer;
        const from = tx.fromUserAccount || "";
        const to = tx.toUserAccount || "";
        const amount = tx.tokenAmount;
        if (!address) {const sent = tx.mint; actions.push({actionType: "TRANSFER", amount, from, sent, to});} 
        else {
            let actionType = "";
            if (tx.fromUserAccount === address) {actionType = "SENT";} 
            else if (tx.toUserAccount === address) {actionType = "RECEIVED";}
            if (actionType === "SENT") {const sent = tx.mint; actions.push({actionType, amount, from, sent, to});} 
            else if (actionType === "RECEIVED") {const received = tx.mint; actions.push({ actionType, amount, from, received, to });}
        }
    }
};

export const traverseNativeTransfers = (nativeTransfers: NativeTransfer[], actions: ProtonTransactionAction[], address: string | undefined) => {
    for (let i = 0; i < nativeTransfers.length; i++) {
        const tx = nativeTransfers[i];
        if (!rentTransferCheck(tx.amount)) {
            const from = tx.fromUserAccount || "";
            const to = tx.toUserAccount || "";
            const amount = tx.amount / LAMPORTS_PER_SOL;
            if (!address) {actions.push({actionType: "TRANSFER", amount, from, sent: SOL, to});} 
            else if (tx.fromUserAccount !== address && tx.toUserAccount !== address) {actions.push({actionType: "TRANSFER", amount, from, sent: SOL, to});} 
            else {
                let actionType = "";
                if (tx.fromUserAccount === address) {actionType = "SENT";} 
                else if (tx.toUserAccount === address) {actionType = "RECEIVED";}
                if (actionType === "SENT") {actions.push({actionType, amount, from, sent: SOL, to});} 
                else if (actionType === "RECEIVED") {actions.push({actionType, amount, from, received: SOL, to});}
            }
        }
    }
};

export const traverseAccountData = (accountData: AccountData[], accounts: ProtonAccount[]) => {
    accountData.forEach((data) => {
        if (data.nativeBalanceChange !== 0 || (data.tokenBalanceChanges && data.tokenBalanceChanges.length > 0)) {
            if (data.nativeBalanceChange !== 0) {
                const amount = data.nativeBalanceChange / LAMPORTS_PER_SOL;
                const mint = SOL;
                if (data.tokenBalanceChanges && data.tokenBalanceChanges.length > 0) {
                    const userAccount = data.tokenBalanceChanges[0].userAccount;
                    const index = accounts.findIndex((a) => a.account === userAccount);
                    indexChecker(accounts, index, userAccount, amount, mint);
                } else {
                    const account = data.account;
                    const index = accounts.findIndex((a) => a.account === account);
                    indexChecker(accounts, index, account, amount, mint);
                }
            }
            if (data.tokenBalanceChanges && data.tokenBalanceChanges.length !== null) {
                for (let j = 0; j < data.tokenBalanceChanges.length; j++) {
                    const tokenBalanceData = data.tokenBalanceChanges[j];
                    const mint = tokenBalanceData.mint;
                    const account = tokenBalanceData.userAccount;
                    const index = accounts.findIndex((a) => a.account === tokenBalanceData.userAccount);
                    const nativeIndex = accounts.findIndex((a) => a.account === account);
                    let amount;
                    if (tokenBalanceData.rawTokenAmount.decimals === 0) {amount = parseInt(tokenBalanceData.rawTokenAmount.tokenAmount);} 
                    else {amount =parseInt(tokenBalanceData.rawTokenAmount.tokenAmount) / 10 ** tokenBalanceData.rawTokenAmount.decimals;}
                    if (!(nativeIndex !== -1 && accounts[nativeIndex].changes[0].amount === amount)){indexChecker(accounts, index, account, amount, mint);}
                }
            }
        }
        const accountLabel = (publicKeyMappings as Record<string, string>)[data.account];
        if (accountLabel) {
            const accountIndex = accounts.findIndex(a => a.account === data.account);
            if (accountIndex !== -1) {accounts[accountIndex].label = accountLabel;}
        }
    });
};

const indexChecker = (accounts: ProtonAccount[], index: number, account: string, amount: number, mint: string) => {
    if (index !== -1) {
        const i = accounts[index].changes.findIndex((a) => a.mint === mint);
        if (i !== -1) {accounts[index].changes[i].amount += amount;} else {accounts[index].changes.push({ amount, mint });}
    } 
    else {accounts.push({account, changes: [{ amount, mint }]});}
};

export function getAPIUrl(path: string, isMainnet: boolean) {const baseUrl = isMainnet ? "https://api.helius.xyz" : "https://api-devnet.helius.xyz"; return `${baseUrl}${path}`;}

export const getMimeType = async (url: string) => {
    try {
        const response = await fetch(url, { method: "HEAD" });
        if (!response.ok) {
            console.error(
                `Failed to fetch MIME type: ${response.status} ${response.statusText}`
            );
            return null;
        }
        return response.headers.get("Content-Type");
    } catch (error: any) {
        return null;
    }
};

export const pasteFromClipboard = async () => {try {const text = await navigator.clipboard.readText(); return text;} catch (error) {console.log(`ERROR`, error);} return "";};

export const copyToClipboard = async (text: string) => {
    try {await navigator.clipboard.writeText(text);} 
    catch (error) {
        const el = document.createElement("textarea");
        el.value = text;
        el.setAttribute("readonly", "");
        el.style.position = "absolute";
        el.style.left = "-9999px";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
    }
};

export const downloadMedia = (url: string) => {
    let a = document.createElement("a");
    a.href = url;
    a.download = url.replace(/^.*[\\\/]/, "");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

export const formatKey = (key: string) =>
    key
        .replace(/_/g, " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

export const formatObject = (obj: any, indentLevel = 0): string => {
    const entries = Object.entries(obj).map(([key, value]) => {
        const formattedKey = formatKey(key);
        const boldClass = indentLevel === 0 ? "font-bold" : "";
        const valueClass = indentLevel > 0 ? "text-green-600" : "";
        const formattedValue =
            typeof value === "object" && value !== null && !Array.isArray(value)
                ? formatObject(value, indentLevel + 1) // Recursively format nested objects
                : `<span class="${valueClass}">${value}</span>`;

        return `<div>${" ".repeat(
            indentLevel * 4
        )}<span class="${boldClass}">${formattedKey}${
            typeof value === "object" ? "" : ":"
        }</span> ${formattedValue}</div>`;
    });

    // Join all the entries with a new line for top-level properties
    return entries.join(indentLevel === 0 ? '<div class="my-2"></div>' : "");
};

const PRIVATE_RPC_URL = process.env.PRIVATE_RPC_URL;
const MAINNET_URLS = [...(PRIVATE_RPC_URL ? [PRIVATE_RPC_URL] : []), "https://eclipse.helius-rpc.com/", "https://mainnetbeta-rpc.eclipse.xyz/", "https://eclipse.lgns.net/"].filter(Boolean);
const DEVNET_URLS = [...(PRIVATE_RPC_URL ? [PRIVATE_RPC_URL] : []), "https://staging-rpc.dev2.eclipsenetwork.xyz/", "https://staging-rpc-eu.dev2.eclipsenetwork.xyz/"].filter(Boolean);
const TESTNET_URLS = [...(PRIVATE_RPC_URL ? [PRIVATE_RPC_URL] : []), "https://testnet.dev2.eclipsenetwork.xyz/",].filter(Boolean);
export function getRPCUrl(network: "mainnet" | "devnet" | "testnet", index: number = 0): string {const urls = network === "mainnet" ? MAINNET_URLS : DEVNET_URLS; return urls[index % urls.length];}
export function getFallbackRPCUrl(network: "mainnet" | "devnet" | "testnet", currentIndex: number): string {const urls = network === "mainnet" ? MAINNET_URLS : DEVNET_URLS; return urls[(currentIndex + 1) % urls.length];}
export function getAllRPCUrls(network: "mainnet" | "devnet" | "testnet"): string[] {return network === "mainnet" ? MAINNET_URLS : DEVNET_URLS;}
export function getNetworkString(isMainnet: boolean): "mainnet" | "devnet" | "testnet" {return isMainnet ? "mainnet" : "devnet";}

import type { JupiterToken, TokenMap } from "$lib/types";
import { recognizedTokens } from "$lib/types";

export const getJupiterTokens = async (): Promise<TokenMap> => {
    try {
        const data = await fetch(`https://token.jup.ag/all`);
        const jsonData = await data.json();

        if (!Array.isArray(jsonData)) {
            throw new Error("Unexpected data format from Jupiter API");
        }

        const tokens: JupiterToken[] = jsonData as JupiterToken[];
        const tokenMap = tokens.reduce((acc: TokenMap, token: JupiterToken) => {
            if (
                (recognizedTokens[token.symbol] &&
                    recognizedTokens[token.symbol] === token.address) ||
                !recognizedTokens[token.symbol]
            ) {
                acc[token.symbol] = token.address;
            }
            return acc;
        }, {});

        return tokenMap;
    } catch (error: any) {
        throw new Error(
            `Failed to fetch tokens from Jupiter with error: ${error}`
        );
    }
};

import { PublicKey, Keypair, Connection, Transaction, VersionedTransaction } from "@solana/web3.js";
import { AnchorProvider, Program, type Idl } from "@coral-xyz/anchor";
import { idlStore } from "$lib/stores";

export async function grabIdl(accountAddress: string, isMainnetValue: boolean) {
    const network = isMainnetValue ? "mainnet" : "devnet";
    let index = 0;
    const getUrls = () => [getRPCUrl(network, index), getFallbackRPCUrl(network, index)];
    while (true) {
        const urls = getUrls();
        for (const url of urls) {
            try {
                const connection = new Connection(url, "confirmed");
                const accountInfo = await connection.getAccountInfo(new PublicKey(accountAddress));
                if (!accountInfo) {console.error(`Account ${accountAddress} not found on ${url}`); continue;}
                const dummyKeypair = Keypair.generate();
                const dummyWallet = {
                    publicKey: dummyKeypair.publicKey,
                    signAllTransactions: <T extends Transaction | VersionedTransaction>(
                        txs: T[]
                    ): Promise<T[]> => Promise.resolve(txs),
                    signTransaction: <T extends Transaction | VersionedTransaction>(
                        tx: T
                    ): Promise<T> => Promise.resolve(tx),
                };

                const provider = new AnchorProvider(
                    connection,
                    dummyWallet,
                    AnchorProvider.defaultOptions()
                );

                const accountPubkey = new PublicKey(accountAddress);
                
                // Fetch the IDL
                const idl = await Program.fetchIdl(accountPubkey, provider);

                if (idl) {
                    // If IDL is successfully fetched, update the idlStore
                    idlStore.set(idl);
                    return idl;
                } else {
                    return { accountExists: true, hasIdl: false };
                }
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
                console.error(`Error fetching IDL from ${url}:`, errorMessage);
                if (url === urls[urls.length - 1]) {
                    index++;
                    break; // Try the next set of URLs
                }
            }
        }
        if (index >= 3) break; // Add a maximum retry limit
    }

    return null;
}

interface ParsedDateTime {
    clockHours: number;
    day: number;
    hours: number;
    minutes: number;
    month: string;
    seconds: number;
    suffix: string;
    year: number;
    formatted: string;
}

const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
];

export const prettyDate = (timestamp: number): ParsedDateTime => {
    const date = new Date(timestamp * 1000);

    const hours = date.getHours();

    const clockHours = ((hours + 11) % 12) + 1;

    const result: ParsedDateTime = {
        clockHours,
        day: date.getDate(),
        formatted: "",
        hours: date.getHours(),
        minutes: date.getMinutes(),
        month: months[date.getMonth()],
        seconds: date.getSeconds(),
        suffix: hours >= 12 ? "pm" : "am",
        year: date.getFullYear(),
    };

    result.formatted = `${clockHours}:${result.minutes < 10 ? "0" : ""}${
        result.minutes
    } ${result.suffix} ${result.month} ${result.day} '${String(
        result.year
    ).slice(-2)}`;

    return result;
};

export type LogMessage = {
    text: string;
    prefix: string;
    style: "sky" | "success" | "error" | "tangerine" | "neutral";
};

export type InstructionLogs = {
    invokedProgram: string | null;
    programAddress: string;
    logs: LogMessage[];
    computeUnits: number;
    truncated: boolean;
    failed: boolean;
};

export const parseProgramLogs = (logs: string[]) => {
    let depth = 0;
    let parsedLogs: InstructionLogs[] = [];

    function prefixBuilder(
        // Indent level starts at 1.
        indentLevel: number
    ) {
        let prefix;
        if (indentLevel <= 0) {
            // Log should always be at index level 1 or higher
            prefix = "";
        } else {
            prefix = new Array(indentLevel - 1)
                .fill("\u00A0\u00A0\u00A0\u00A0")
                .join("");
        }
        return prefix + "> ";
    }

    logs.forEach((log) => {
        if (log.startsWith("Program log:")) {
            log = log.replace(/Program log: (.*)/g, (match, p1) => {
                return `Logged "${p1}"`;
            });

            parsedLogs[parsedLogs.length - 1].logs.push({
                prefix: prefixBuilder(depth),
                style: "tangerine",
                text: log,
            });
        } else if (log.startsWith("Log truncated")) {
            parsedLogs[parsedLogs.length - 1].truncated = true;
        } else {
            const regex = /Program (\w*) invoke \[(\d)\]/g;
            const matches = [...log.matchAll(regex)];

            if (matches.length > 0) {
                const programAddress = matches[0][1];
                const programName = getProgramName(programAddress);

                if (depth === 0) {
                    parsedLogs.push({
                        computeUnits: 0,
                        failed: false,
                        invokedProgram: programName,
                        logs: [],
                        programAddress,
                        truncated: false,
                    });
                } else {
                    parsedLogs[parsedLogs.length - 1].logs.push({
                        prefix: prefixBuilder(depth),
                        style: "sky",
                        text: `Invoked ${programName}`,
                    });
                }

                depth++;
            } else if (log.includes("success")) {
                parsedLogs[parsedLogs.length - 1].logs.push({
                    prefix: prefixBuilder(depth),
                    style: "success",
                    text: `Returned success`,
                });
                depth--;
            } else if (log.includes("failed")) {
                const instructionLog = parsedLogs[parsedLogs.length - 1];
                instructionLog.failed = true;

                let currText = `Returned error "${log.slice(
                    log.indexOf(": ") + 2
                )}"`;
                // failed to verify log of previous program so reset depth and print full log
                if (log.startsWith("failed")) {
                    depth++;
                    currText = log.charAt(0).toUpperCase() + log.slice(1);
                }

                instructionLog.logs.push({
                    prefix: prefixBuilder(depth),
                    style: "error",
                    text: currText,
                });
                depth--;
            } else {
                if (depth === 0) {
                    parsedLogs.push({
                        computeUnits: 0,
                        failed: false,
                        invokedProgram: null,
                        logs: [],
                        programAddress: "",
                        truncated: false,
                    });
                    depth++;
                }

                // Remove redundant program address from logs
                log = log.replace(
                    /Program \w* consumed (\d*) (.*)/g,
                    (match, p1, p2) => {
                        // eslint-disable-next-line write-good-comments/write-good-comments
                        // Aggregate compute units consumed from top-level tx instructions
                        // because they include inner ix compute units as well.
                        if (depth === 1) {
                            parsedLogs[parsedLogs.length - 1].computeUnits +=
                                Number.parseInt(p1);
                        }

                        return `Consumed ${p1} ${p2}`;
                    }
                );

                // native program logs don't start with "Program log:"
                parsedLogs[parsedLogs.length - 1].logs.push({
                    prefix: prefixBuilder(depth),
                    style: "neutral",
                    text: log,
                });
            }
        }
    });

    return parsedLogs;
};

export const shortenString = (address: string = "", size = 5): string => `${address.slice(0, size)}...${address.slice(-size)}`;
export const randomNumber = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);
export const percentage = (sellerFeeBasisPoints: number): string => `${sellerFeeBasisPoints / 100}%`;
export const formatMoney = (price: number = 0) => price.toLocaleString("en-US", {currency: "USD", style: "currency"});

export const formatDate = (timestamp: number) => {
    if (!timestamp) {return "";}
    const date = String(timestamp).length < 13 ? new Date(timestamp * 1000) : new Date(timestamp);
    return Intl.DateTimeFormat(undefined, {day: "numeric", hour: "numeric", minute: "numeric", month: "numeric", year: "2-digit"}).format(date);
};

export const cap =  (string: string = "") => string.split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");

import {
    BPF_LOADER_DEPRECATED_PROGRAM_ID,
    BPF_LOADER_PROGRAM_ID,
    Ed25519Program,
    SYSVAR_CLOCK_PUBKEY,
    SYSVAR_RENT_PUBKEY,
    SYSVAR_REWARDS_PUBKEY,
    SYSVAR_STAKE_HISTORY_PUBKEY,
    Secp256k1Program,
    StakeProgram,
    SystemProgram,
    VOTE_PROGRAM_ID,
} from "@solana/web3.js";

export enum PROGRAM_NAMES {
    // native built-ins
    ADDRESS_LOOKUP_TABLE = "Address Lookup Table Program",
    COMPUTE_BUDGET = "Compute Budget Program",
    CONFIG = "Config Program",
    STAKE = "Stake Program",
    SYSTEM = "System Program",
    VOTE = "Vote Program",

    // native precompiles
    SECP256K1 = "Secp256k1 SigVerify Precompile",
    ED25519 = "Ed25519 SigVerify Precompile",

    // spl
    ASSOCIATED_TOKEN = "Associated Token Program",
    ACCOUNT_COMPRESSION = "Account Compression Program",
    FEATURE_PROPOSAL = "Feature Proposal Program",
    LENDING = "Lending Program",
    MEMO = "Memo Program",
    MEMO_2 = "Memo Program v2",
    NAME = "Name Service Program",
    STAKE_POOL = "Stake Pool Program",
    SWAP = "Swap Program",
    TOKEN = "Token Program",
    TOKEN_METADATA = "Token Metadata Program",
    TOKEN_VAULT = "Token Vault Program",

    // other
    ACUMEN = "Acumen Program",
    BREAK_SOLANA = "Break Solana Program",
    CHAINLINK_ORACLE = "Chainlink OCR2 Oracle Program",
    CHAINLINK_STORE = "Chainlink Store Program",
    CLOCKWORK_1 = "Clockwork Thread Program v1",
    CLOCKWORK_2 = "Clockwork Thread Program v2",
    MANGO_GOVERNANCE = "Mango Governance Program",
    MANGO_ICO = "Mango ICO Program",
    MANGO_1 = "Mango Program v1",
    MANGO_2 = "Mango Program v2",
    MANGO_3 = "Mango Program v3",
    MARINADE = "Marinade Staking Program",
    MERCURIAL = "Mercurial Stable Swap Program",
    METAPLEX = "Metaplex Program",
    NFT_AUCTION = "NFT Auction Program",
    NFT_CANDY_MACHINE = "NFT Candy Machine Program",
    NFT_CANDY_MACHINE_V2 = "NFT Candy Machine Program V2",
    ORCA_SWAP_1 = "Orca Swap Program v1",
    ORCA_SWAP_2 = "Orca Swap Program v2",
    ORCA_AQUAFARM = "Orca Aquafarm Program",
    PORT = "Port Finance Program",
    PYTH_DEVNET = "Pyth Oracle Program",
    PYTH_TESTNET = "Pyth Oracle Program",
    PYTH_MAINNET = "Pyth Oracle Program",
    QUARRY_MERGE_MINE = "Quarry Merge Mine",
    QUARRY_MINE = "Quarry Mine",
    QUARRY_MINT_WRAPPER = "Quarry Mint Wrapper",
    QUARRY_REDEEMER = "Quarry Redeemer",
    QUARRY_REGISTRY = "Quarry Registry",
    RAYDIUM_AMM = "Raydium AMM Program",
    RAYDIUM_IDO = "Raydium IDO Program",
    RAYDIUM_LP_1 = "Raydium Liquidity Pool Program v1",
    RAYDIUM_LP_2 = "Raydium Liquidity Pool Program v2",
    RAYDIUM_STAKING = "Raydium Staking Program",
    SABER_ROUTER = "Saber Router Program",
    SABER_SWAP = "Saber Stable Swap Program",
    SERUM_1 = "Serum Dex Program v1",
    SERUM_2 = "Serum Dex Program v2",
    SERUM_3 = "Serum Dex Program v3",
    SERUM_SWAP = "Serum Swap Program",
    SERUM_POOL = "Serum Pool",
    SOLEND = "Solend Program",
    SOLIDO = "Lido for Solana Program",
    STEP_SWAP = "Step Finance Swap Program",
    SWIM_SWAP = "Swim Swap Program",
    SWITCHBOARD = "Switchboard Oracle Program",
    WORMHOLE = "Wormhole",
    WORMHOLE_CORE = "Wormhole Core Bridge",
    WORMHOLE_TOKEN = "Wormhole Token Bridge",
    WORMHOLE_NFT = "Wormhole NFT Bridge",
    SOLANART = "Solanart",
    SOLANART_GO = "Solanart - Global offers",
    STEPN_DEX = "STEPN Dex",
    OPENBOOK_DEX = "OpenBook Dex",
}

export type ProgramInfo = {
    name: string;
};

export const PROGRAM_INFO_BY_ID: { [address: string]: ProgramInfo } = {
    "22Y43yTVxuUkoRKdm9thyRhQ3SdgQS7c7kB6UNCiaczD": {
        name: PROGRAM_NAMES.SERUM_SWAP,
    },

    "27haf8L6oxUeXrHrgEgsexjSY5hbVUWEmvv9Nyxg8vQv": {
        name: PROGRAM_NAMES.RAYDIUM_LP_2,
    },
    [StakeProgram.programId.toBase58()]: {
        name: PROGRAM_NAMES.STAKE,
    },
    [SystemProgram.programId.toBase58()]: {
        name: PROGRAM_NAMES.SYSTEM,
    },
    [VOTE_PROGRAM_ID.toBase58()]: {
        name: PROGRAM_NAMES.VOTE,
    },

    // native precompiles
    [Secp256k1Program.programId.toBase58()]: {
        name: PROGRAM_NAMES.SECP256K1,
    },
    [Ed25519Program.programId.toBase58()]: {
        name: PROGRAM_NAMES.ED25519,
    },

    "3XXuUFfweXBwFgFfYaejLvZE4cGZiHgKiGfMtdxNzYmv": {
        name: PROGRAM_NAMES.CLOCKWORK_1,
    },

    "5ZfZAwP2m93waazg8DkrrVmsupeiPEvaEHowiUP7UAbJ": {
        name: PROGRAM_NAMES.SOLANART_GO,
    },

    "5fNfvyp5czQVX77yoACa3JJVEhdRaWjPuazuWgjhTqEH": {
        name: PROGRAM_NAMES.MANGO_2,
    },

    "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8": {
        name: PROGRAM_NAMES.RAYDIUM_AMM,
    },

    "7sPptkymzvayoSbLXzBsXEF8TSf3typNnAWkrKrDizNb": {
        name: PROGRAM_NAMES.MANGO_ICO,
    },

    "82yxjeMsvaURa4MbZZ7WZZHfobirZYkH1zF8fmeGtyaQ": {
        name: PROGRAM_NAMES.ORCA_AQUAFARM,
    },

    "9HzJyW1qZsEiSfMUf6L2jo3CcTKAyBmSyKdwQeYisHrC": {
        name: PROGRAM_NAMES.RAYDIUM_IDO,
    },

    "9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP": {
        name: PROGRAM_NAMES.ORCA_SWAP_2,
    },

    "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin": {
        name: PROGRAM_NAMES.SERUM_3,
    },

    // spl
    ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL: {
        name: PROGRAM_NAMES.ASSOCIATED_TOKEN,
    },

    // native built-ins
    AddressLookupTab1e1111111111111111111111111: {
        name: PROGRAM_NAMES.ADDRESS_LOOKUP_TABLE,
    },

    BJ3jrUzddfuSrZHXSCxMUUQsjKEyLmuuyZebkcaFp2fg: {
        name: PROGRAM_NAMES.SERUM_1,
    },

    BrEAK7zGZ6dM71zUDACDqJnekihmwF15noTddWTsknjC: {
        name: PROGRAM_NAMES.BREAK_SOLANA,
    },
    // other
    C64kTdg1Hzv5KoQmZrQRcm2Qz7PkxtFBgw7EpFhvYn8W: {
        name: PROGRAM_NAMES.ACUMEN,
    },
    CJsLwbP1iu5DuUikHEJnLfANgKy6stB2uFgvBBHoyxwz: {
        name: PROGRAM_NAMES.SOLANART,
    },
    CLoCKyJ6DXBJqqu2VWx9RLbgnwwR6BMHHuyasVmfMzBh: {
        name: PROGRAM_NAMES.CLOCKWORK_2,
    },
    ComputeBudget111111111111111111111111111111: {
        name: PROGRAM_NAMES.COMPUTE_BUDGET,
    },
    Config1111111111111111111111111111111111111: {
        name: PROGRAM_NAMES.CONFIG,
    },
    CrX7kMhLC3cSsXJdT7JDgqrRVWGnUpX3gfEfxxU2NVLi: {
        name: PROGRAM_NAMES.SOLIDO,
    },
    Crt7UoUR6QgrFrN7j8rmSQpUTNWNSitSwWvsWGf1qZ5t: {
        name: PROGRAM_NAMES.SABER_ROUTER,
    },

    DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1: {
        name: PROGRAM_NAMES.ORCA_SWAP_1,
    },
    Dooar9JkhdZ7J3LHN3A7YCuoGRUggXhQaG4kijfLGU2j: {
        name: PROGRAM_NAMES.STEPN_DEX,
    },
    DtmE9D2CSB4L5D6A15mraeEjrGMm6auWVzgaD8hK2tZM: {
        name: PROGRAM_NAMES.SWITCHBOARD,
    },
    EUqojwWA2rd19FZrzeBncJsm38Jm1hEhE3zsmX3bRc2o: {
        name: PROGRAM_NAMES.SERUM_2,
    },
    EhhTKczWMGQt46ynNeRX1WfeagwwJd7ufHvCDjRxjo5Q: {
        name: PROGRAM_NAMES.RAYDIUM_STAKING,
    },
    Feat1YXHhH6t1juaWF74WLcfv4XoNocjXA6sPWHNgAse: {
        name: PROGRAM_NAMES.FEATURE_PROPOSAL,
    },
    FsJ3A3u2vn5cTVofAjvy6y5kwABJAqYWpe4975bi2epH: {
        name: PROGRAM_NAMES.PYTH_MAINNET,
    },
    GqTPL6qRf5aUuqscLh8Rg2HTxPUXfhhAXDptTLhp1t2J: {
        name: PROGRAM_NAMES.MANGO_GOVERNANCE,
    },
    HEvSKofvBgfaexv23kMabbYqxasxU3mQ4ibBMEmJWHny: {
        name: PROGRAM_NAMES.CHAINLINK_STORE,
    },
    JD3bq9hGdy38PuWQ4h2YJpELmHVGPPfFSuFkpzAd9zfu: {
        name: PROGRAM_NAMES.MANGO_1,
    },
    LendZqTs7gn5CTSJU1jWKhKuVpjJGom45nnwPb2AMTi: {
        name: PROGRAM_NAMES.LENDING,
    },
    MERLuDFBMmsHnsBPZw2sDQZHvXFMwp8EdjudcU2HKky: {
        name: PROGRAM_NAMES.MERCURIAL,
    },
    MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD: {
        name: PROGRAM_NAMES.MARINADE,
    },
    Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo: {
        name: PROGRAM_NAMES.MEMO,
    },
    MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr: {
        name: PROGRAM_NAMES.MEMO_2,
    },
    Port7uDYB3wk6GJAw4KT1WpTeMtSu9bTcChBHkX2LfR: {
        name: PROGRAM_NAMES.PORT,
    },
    QMMD16kjauP5knBwxNUJRZ1Z5o3deBuFrqVjBVmmqto: {
        name: PROGRAM_NAMES.QUARRY_MERGE_MINE,
    },
    QMNeHCGYnLVDn1icRAfQZpjPLBNkfGbSKRB83G5d8KB: {
        name: PROGRAM_NAMES.QUARRY_MINE,
    },
    QMWoBmAyJLAsA1Lh9ugMTw2gciTihncciphzdNzdZYV: {
        name: PROGRAM_NAMES.QUARRY_MINT_WRAPPER,
    },
    QRDxhMw1P2NEfiw5mYXG79bwfgHTdasY2xNP76XSea9: {
        name: PROGRAM_NAMES.QUARRY_REDEEMER,
    },
    QREGBnEj9Sa5uR91AV8u3FxThgP5ZCvdZUW2bHAkfNc: {
        name: PROGRAM_NAMES.QUARRY_REGISTRY,
    },
    RVKd61ztZW9GUwhRbbLoYVRE5Xf1B2tVscKqwZqXgEr: {
        name: PROGRAM_NAMES.RAYDIUM_LP_1,
    },
    SPoo1Ku8WFXoNDMHPsrGSTSG1Y47rzgn41SLUNakuHy: {
        name: PROGRAM_NAMES.STAKE_POOL,
    },
    SSwpMgqNDsyV7mAgN9ady4bDVu5ySjmmXejXvy2vLt1: {
        name: PROGRAM_NAMES.STEP_SWAP,
    },
    SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ: {
        name: PROGRAM_NAMES.SABER_SWAP,
    },
    SWiMDJYFUGj6cPrQ6QYYYWZtvXQdRChSVAygDZDsCHC: {
        name: PROGRAM_NAMES.SWIM_SWAP,
    },
    So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo: {
        name: PROGRAM_NAMES.SOLEND,
    },
    SwaPpA9LAaLfeLi3a68M4DjnLqgtticKg6CnyNwgAC8: {
        name: PROGRAM_NAMES.SWAP,
    },
    TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA: {
        name: PROGRAM_NAMES.TOKEN,
    },
    WnFt12ZrnzZrFZkt2xsNsaNWoQribnuQ5B5FrDbwDhD: {
        name: PROGRAM_NAMES.WORMHOLE_NFT,
    },
    WormT3McKhFJ2RkiGpdw9GKvNCrB2aB54gb2uV9MfQC: {
        name: PROGRAM_NAMES.WORMHOLE,
    },
    WvmTNLpGMVbwJVYztYL4Hnsy82cJhQorxjnnXcRm3b6: {
        name: PROGRAM_NAMES.SERUM_POOL,
    },
    auctxRXPeJoc4817jDhf4HbjnhEcr1cCXenosMhK5R8: {
        name: PROGRAM_NAMES.NFT_AUCTION,
    },
    cjg3oHmg9uuPsP8D6g29NWvhySJkdYdAo9D25PRbKXJ: {
        name: PROGRAM_NAMES.CHAINLINK_ORACLE,
    },
    cmtDvXumGCrqC1Age74AVPhSRVXJMd8PJS91L8KbNCK: {
        name: PROGRAM_NAMES.ACCOUNT_COMPRESSION,
    },
    cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ: {
        name: PROGRAM_NAMES.NFT_CANDY_MACHINE_V2,
    },
    cndyAnrLdpjq1Ssp1z8xxDsB8dxe7u4HL5Nxi2K5WXZ: {
        name: PROGRAM_NAMES.NFT_CANDY_MACHINE,
    },
    gSbePebfvPy7tRqimPoVecS2UsBvYv46ynrzWocc92s: {
        name: PROGRAM_NAMES.PYTH_DEVNET,
    },
    metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s: {
        name: PROGRAM_NAMES.TOKEN_METADATA,
    },
    mv3ekLzLbnVPNxjSKvqBpU3ZeZXPQdEC3bp5MDEBG68: {
        name: PROGRAM_NAMES.MANGO_3,
    },
    namesLPneVptA9Z5rqUDD9tMTWEJwofgaYwp8cawRkX: {
        name: PROGRAM_NAMES.NAME,
    },
    p1exdMJcjVao65QdewkaZRUnU6VPSXhus9n2GzWfh98: {
        name: PROGRAM_NAMES.METAPLEX,
    },
    vau1zxA2LbssAUEF7Gpw91zMM1LvXrvpzJtmZ58rPsn: {
        name: PROGRAM_NAMES.TOKEN_VAULT,
    },
    worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth: {
        name: PROGRAM_NAMES.WORMHOLE_CORE,
    },
    wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb: {
        name: PROGRAM_NAMES.WORMHOLE_TOKEN,
    },
};

export type LoaderName = (typeof LOADER_IDS)[keyof typeof LOADER_IDS];
export const LOADER_IDS = {
    BPFLoaderUpgradeab1e11111111111111111111111: "BPF Upgradeable Loader",
    MoveLdr111111111111111111111111111111111111: "Move Loader",
    [BPF_LOADER_DEPRECATED_PROGRAM_ID.toBase58()]: "BPF Loader",
    [BPF_LOADER_PROGRAM_ID.toBase58()]: "BPF Loader 2",
    NativeLoader1111111111111111111111111111111: "Native Loader",
} as const;

export const SPECIAL_IDS: { [key: string]: string } = {
    "1nc1nerator11111111111111111111111111111111": "Incinerator",
    Sysvar1111111111111111111111111111111111111: "SYSVAR",
};

export const SYSVAR_IDS = {
    [SYSVAR_CLOCK_PUBKEY.toBase58()]: "Sysvar: Clock",
    Sysvar1nstructions1111111111111111111111111: "Sysvar: Instructions",
    SysvarEpochSchedu1e111111111111111111111111: "Sysvar: Epoch Schedule",
    SysvarFees111111111111111111111111111111111: "Sysvar: Fees",
    [SYSVAR_RENT_PUBKEY.toBase58()]: "Sysvar: Rent",
    [SYSVAR_REWARDS_PUBKEY.toBase58()]: "Sysvar: Rewards",
    SysvarRecentB1ockHashes11111111111111111111: "Sysvar: Recent Blockhashes",
    SysvarS1otHashes111111111111111111111111111: "Sysvar: Slot Hashes",
    [SYSVAR_STAKE_HISTORY_PUBKEY.toBase58()]: "Sysvar: Stake History",
    SysvarS1otHistory11111111111111111111111111: "Sysvar: Slot History",
};

export function getDefaultProgramName(address: string): string {
    const label = programLabel(address);
    if (label) return label;
    return `Unknown Program (${address})`;
}

export function programLabel(address: string): string | undefined {
    const programInfo = PROGRAM_INFO_BY_ID[address];
    if (programInfo) {
        return programInfo.name;
    }

    return LOADER_IDS[address];
}

export function getProgramName(address: string) {
    const defaultProgramName = getDefaultProgramName(address);

    return defaultProgramName;
}
