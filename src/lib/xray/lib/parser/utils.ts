import type { ProtonTransactionAction } from "./types";
import { type ProtonAccount, SOL } from "./types";
import type { TokenTransfer, NativeTransfer, AccountData } from "helius-sdk";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { publicKeyMappings } from "../../config";

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