import type { TokenTransfer, NativeTransfer, AccountData, EnrichedTransaction } from "helius-sdk";
import { ATA_PROGRAM_ID, TOKEN_PROGRAM_ID, PROGRAM_INFO_BY_ID } from "./config";
import { PublicKey, Keypair, Connection, Transaction, VersionedTransaction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { idlStore } from "$lib/stores";
import type { InstructionLogs, ProtonTransactionAction, ProtonAccount, TempTokenTransfer, ParsedDateTime, ProtonActionType, ProgramDetails } from "$lib/types";
import { CustomTransactionType, SOL } from "$lib/types";

export const getMimeType = async (url: string) => {try {const response = await fetch(url, { method: "HEAD" }); if (!response.ok) {console.error(`Failed to fetch MIME type: ${response.status} ${response.statusText}`); return null;} return response.headers.get("Content-Type");}  catch (error: any) {return null;}};
export const downloadMedia = (url: string) => {let a = document.createElement("a"); a.href = url; a.download = url.replace(/^.*[\\\/]/, ""); document.body.appendChild(a); a.click(); document.body.removeChild(a);};
export const cap =  (string: string = "") => string.split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
export const shortenString = (address: string = "", size = 5): string => `${address.slice(0, size)}...${address.slice(-size)}`;
export const randomNumber = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);
export const percentage = (sellerFeeBasisPoints: number): string => `${sellerFeeBasisPoints / 100}%`;
export const formatMoney = (price: number = 0) => price.toLocaleString("en-US", {currency: "USD", style: "currency"});
const PRIVATE_RPC_URL = process.env.PRIVATE_RPC_URL;
const MAINNET_URLS = [...(PRIVATE_RPC_URL ? [PRIVATE_RPC_URL] : []), "https://eclipse.helius-rpc.com/", "https://mainnetbeta-rpc.eclipse.xyz/", "https://eclipse.lgns.net/"].filter(Boolean);
const DEVNET_URLS = [...(PRIVATE_RPC_URL ? [PRIVATE_RPC_URL] : []), "https://staging-rpc.dev2.eclipsenetwork.xyz/", "https://staging-rpc-eu.dev2.eclipsenetwork.xyz/"].filter(Boolean);
const TESTNET_URLS = [...(PRIVATE_RPC_URL ? [PRIVATE_RPC_URL] : []), "https://testnet.dev2.eclipsenetwork.xyz/",].filter(Boolean);
export const formatKey = (key: string) => key.replace(/_/g, " ").split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
export const pasteFromClipboard = async () => {try {const text = await navigator.clipboard.readText(); return text;} catch (error) {console.log(`ERROR`, error);} return "";};
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const rentTransferCheck = (amount: number) => {if (amount <= 4120320) {return true;} return false;};
export function getProgramName(address: string): string {const programInfo = PROGRAM_INFO_BY_ID[address]; return programInfo?.name || address;}
export function getAPIUrl(path: string, isMainnet: boolean) {const baseUrl = isMainnet ? "https://api.helius.xyz" : "https://api-devnet.helius.xyz"; return `${baseUrl}${path}`;}
export function getRPCUrl(network: "mainnet" | "devnet" | "testnet", index: number = 0): string {const urls = network === "mainnet" ? MAINNET_URLS : DEVNET_URLS; return urls[index % urls.length];}
export function getFallbackRPCUrl(network: "mainnet" | "devnet" | "testnet", currentIndex: number): string {const urls = network === "mainnet" ? MAINNET_URLS : DEVNET_URLS; return urls[(currentIndex + 1) % urls.length];}
export function getAllRPCUrls(network: "mainnet" | "devnet" | "testnet"): string[] {return network === "mainnet" ? MAINNET_URLS : DEVNET_URLS;}
export function getNetworkString(isMainnet: boolean): "mainnet" | "devnet" | "testnet" {return isMainnet ? "mainnet" : "devnet";}

export const groupActions = (actions: ProtonTransactionAction[]) => {
    const match = (a: ProtonTransactionAction, b: ProtonTransactionAction) => a.actionType === b.actionType && a.from === b.from && a.to === b.to && (a.sent === b.sent || a.received === b.received);
    const grouped = actions.reduce((acc: ProtonTransactionAction[], action) => {let idx = 0; const existing = acc.find((a, i) => {idx = i; return match(a, action);}); if (existing) {acc[idx].amount += action.amount;} else {acc.push(action);} return acc;}, []);
    return grouped;
};

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
                    else {amount = parseInt(tokenBalanceData.rawTokenAmount.tokenAmount) / 10 ** tokenBalanceData.rawTokenAmount.decimals;}
                    if (!(nativeIndex !== -1 && accounts[nativeIndex].changes[0].amount === amount)) {indexChecker(accounts, index, account, amount, mint);}
                }
            }
        }
        const programInfo = PROGRAM_INFO_BY_ID[data.account];
        if (programInfo?.name) {
            const accountIndex = accounts.findIndex(a => a.account === data.account);
            if (accountIndex !== -1) {accounts[accountIndex].label = programInfo.name;}
        }
    });
};

const indexChecker = (accounts: ProtonAccount[], index: number, account: string, amount: number, mint: string) => {
    if (index !== -1) {const i = accounts[index].changes.findIndex((a) => a.mint === mint); if (i !== -1) {accounts[index].changes[i].amount += amount;} else {accounts[index].changes.push({ amount, mint });}} 
    else {accounts.push({account, changes: [{ amount, mint }]});}
};


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

export const formatObject = (obj: any, indentLevel = 0): string => {
    const entries = Object.entries(obj).map(([key, value]) => {
        const formattedKey = formatKey(key);
        const boldClass = indentLevel === 0 ? "font-bold" : "";
        const valueClass = indentLevel > 0 ? "text-green-600" : "";
        const formattedValue = typeof value === "object" && value !== null && !Array.isArray(value) ? formatObject(value, indentLevel + 1) : `<span class="${valueClass}">${value}</span>`;
        return `<div>${" ".repeat(indentLevel * 4)}<span class="${boldClass}">${formattedKey}${typeof value === "object" ? "" : ":"}</span> ${formattedValue}</div>`;
    });
    return entries.join(indentLevel === 0 ? '<div class="my-2"></div>' : "");
};

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
                    signAllTransactions: <T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> => Promise.resolve(txs),
                    signTransaction: <T extends Transaction | VersionedTransaction>(tx: T): Promise<T> => Promise.resolve(tx),
                };
                const provider = new AnchorProvider(connection, dummyWallet, AnchorProvider.defaultOptions());
                const accountPubkey = new PublicKey(accountAddress);
                const idl = await Program.fetchIdl(accountPubkey, provider);
                if (idl) {idlStore.set(idl); return idl;} else {return { accountExists: true, hasIdl: false };}
            } 
            catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
                console.error(`Error fetching IDL from ${url}:`, errorMessage);
                if (url === urls[urls.length - 1]) {index++; break;}
            }
        }
        if (index >= 3) break;
    }
    return null;
}

export const prettyDate = (timestamp: number): ParsedDateTime => {
    const date = new Date(timestamp * 1000);
    const hours = date.getHours();
    const clockHours = ((hours + 11) % 12) + 1;
    const result: ParsedDateTime = {clockHours, day: date.getDate(), formatted: "", hours: date.getHours(), minutes: date.getMinutes(), month: months[date.getMonth()], seconds: date.getSeconds(), suffix: hours >= 12 ? "pm" : "am", year: date.getFullYear(),};
    result.formatted = `${clockHours}:${result.minutes < 10 ? "0" : ""}${result.minutes} ${result.suffix} ${result.month} ${result.day} '${String(result.year).slice(-2)}`;
    return result;
};

export const parseProgramLogs = (logs: string[]) => {
    let depth = 0;
    let parsedLogs: InstructionLogs[] = [];
    function prefixBuilder(indentLevel: number) {let prefix; if (indentLevel <= 0) {prefix = "";} else {prefix = new Array(indentLevel - 1).fill("\u00A0\u00A0\u00A0\u00A0").join("");} return prefix + "> ";}
    logs.forEach((log) => {
        if (log.startsWith("Program log:")) {log = log.replace(/Program log: (.*)/g, (match, p1) => {return `Logged "${p1}"`;}); parsedLogs[parsedLogs.length - 1].logs.push({prefix: prefixBuilder(depth), style: "tangerine", text: log});} 
        else if (log.startsWith("Log truncated")) {parsedLogs[parsedLogs.length - 1].truncated = true;} 
        else {
            const regex = /Program (\w*) invoke \[(\d)\]/g;
            const matches = [...log.matchAll(regex)];
            if (matches.length > 0) {
                const programAddress = matches[0][1];
                const programName = getProgramName(programAddress);
                if (depth === 0) {parsedLogs.push({computeUnits: 0, failed: false, invokedProgram: programName, logs: [], programAddress, truncated: false});} 
                else {parsedLogs[parsedLogs.length - 1].logs.push({prefix: prefixBuilder(depth), style: "sky", text: `Invoked ${programName}`});}
                depth++;
            } 
            else if (log.includes("success")) {parsedLogs[parsedLogs.length - 1].logs.push({prefix: prefixBuilder(depth), style: "success", text: `Returned success`}); depth--;} 
            else if (log.includes("failed")) {
                const instructionLog = parsedLogs[parsedLogs.length - 1];
                instructionLog.failed = true;
                let currText = `Returned error "${log.slice(log.indexOf(": ") + 2)}"`;
                if (log.startsWith("failed")) {depth++; currText = log.charAt(0).toUpperCase() + log.slice(1);}
                instructionLog.logs.push({prefix: prefixBuilder(depth), style: "error", text: currText});
                depth--;
            } 
            else {
                if (depth === 0) {parsedLogs.push({computeUnits: 0, failed: false, invokedProgram: null, logs: [], programAddress: "", truncated: false}); depth++;}
                log = log.replace(/Program \w* consumed (\d*) (.*)/g, (match, p1, p2) => {if (depth === 1) {parsedLogs[parsedLogs.length - 1].computeUnits += Number.parseInt(p1);} return `Consumed ${p1} ${p2}`;});
                parsedLogs[parsedLogs.length - 1].logs.push({prefix: prefixBuilder(depth), style: "neutral", text: log,});
            }
        }
    });
    return parsedLogs;
};

export const formatDate = (timestamp: number) => {
    if (!timestamp) {return "";}
    const date = String(timestamp).length < 13 ? new Date(timestamp * 1000) : new Date(timestamp);
    return Intl.DateTimeFormat(undefined, {day: "numeric", hour: "numeric", minute: "numeric", month: "numeric", year: "2-digit"}).format(date);
};

export function formatLargeNumber(num: number): string {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toString();
}

export function isTokenAirdrop(transaction: EnrichedTransaction): boolean {
    const { instructions } = transaction;
    const hasAtaInstruction = instructions.some(instr => 'programId' in instr && instr.programId === ATA_PROGRAM_ID);
    const hasTokenTransfer = instructions.some(instr => 
      'programId' in instr && instr.programId === TOKEN_PROGRAM_ID &&
      'parsed' in instr && 
      typeof instr.parsed === 'object' &&
      instr.parsed !== null &&
      'type' in instr.parsed &&
      instr.parsed.type === 'transfer'
    );
    const txMeta = (transaction as any).meta;
    const newAccountCreated = txMeta?.postTokenBalances?.some((balance: any) => !txMeta?.preTokenBalances?.some((preBalance: any) => preBalance.accountIndex === balance.accountIndex)) ?? false;
    return hasAtaInstruction && hasTokenTransfer && newAccountCreated;
}
  
export function isParsedInstruction(instruction: any): instruction is { parsed: { type: string } } {return 'parsed' in instruction && typeof instruction.parsed === 'object' && instruction.parsed !== null;}
export function mapCustomTypeToProtonActionType(customType: CustomTransactionType): ProtonActionType {
    switch (customType) {
        case CustomTransactionType.TRANSFER: return "TRANSFER";
        case CustomTransactionType.NFT_TRANSFER: return "COMPRESSED_NFT_TRANSFER";
        case CustomTransactionType.TOKEN_TRANSFER: return "TRANSFER";
        case CustomTransactionType.SWAP: return "SWAP";
        case CustomTransactionType.TOKEN_AIRDROP: return "AIRDROP";
        default: return "UNKNOWN";
    }
}

export function programLabel(address: string): string {return PROGRAM_INFO_BY_ID[address]?.name || address;}
export function getProgramCategory(address: string): 'SYSTEM' | 'NFT' | 'DEFI' | 'ORACLE' | 'BRIDGE' | 'UTILITY' | undefined {return PROGRAM_INFO_BY_ID[address]?.category;}
export function getProgramDetails(address: string): ProgramDetails {const info = PROGRAM_INFO_BY_ID[address] || { name: address }; return {name: info.name, category: info.category, deprecated: info.deprecated};}
export function isProgramDeprecated(address: string): boolean {return PROGRAM_INFO_BY_ID[address]?.deprecated || false;}