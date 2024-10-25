import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import type { EnrichedTransaction, TokenTransfer, CompressedNftEvent, NFTEvent } from "helius-sdk";
import { TransactionType } from "helius-sdk";
import type { ProtonActionType, ProtonTransaction, ProtonAccount, ProtonParser, ProtonTransactionAction } from "./types";
import { traverseAccountData, traverseNativeTransfers, traverseTokenTransfers } from "./utils";
import { unknownProtonTransaction, SOL } from "./types";

interface TempTokenTransfer extends TokenTransfer {tokenAmount: number;}

import type { ProtonType } from "./types";
import { protonParsers } from "./types";

export * from "./types";

export const parseTransaction: ProtonParser = (transaction, address) => {
    let parser: ProtonParser = protonParsers.UNKNOWN;
    const transactionType = transaction.type as ProtonType;
    if (typeof protonParsers[transactionType] === "undefined") {
        return protonParsers.UNKNOWN(transaction, address);
    }

    parser = protonParsers[transactionType];

    try {
        return parser(transaction, address);
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);

        return protonParsers.UNKNOWN(transaction, address);
    }
};

export const parseTokenMint: ProtonParser = (transaction: EnrichedTransaction, address: string | undefined) => {
    const {signature, timestamp, accountData, tokenTransfers, nativeTransfers, type, source} = transaction;
    const fee = transaction.fee / LAMPORTS_PER_SOL;
    if (tokenTransfers === null || nativeTransfers === null) {return {accounts: [], actions: [], fee, primaryUser: "", signature, source, timestamp, type, customType: type};}
    const primaryUser = nativeTransfers[0]?.fromUserAccount || "";
    const actions: ProtonTransactionAction[] = [];
    const accounts: ProtonAccount[] = [];
    traverseTokenTransfers(tokenTransfers, actions, address);
    traverseNativeTransfers(nativeTransfers, actions, address);
    traverseAccountData(accountData, accounts);
    return {accounts, actions, fee, primaryUser, signature, source, timestamp, type, customType: type};
};

export const parseBurn = (transaction: EnrichedTransaction, address: string | undefined): ProtonTransaction => {
    const {tokenTransfers = [], nativeTransfers = [], accountData = [], signature, timestamp, type, source} = transaction;
    const fee = transaction.fee / LAMPORTS_PER_SOL;
    if (tokenTransfers === null || nativeTransfers === null) {
        return {
            accounts: [],
            actions: [],
            fee,
            primaryUser: "",
            signature,
            source,
            timestamp,
            type: "BURN",
        };
    }
    const primaryUser = tokenTransfers[0]?.fromUserAccount || "";
    const actions: ProtonTransactionAction[] = [];
    const accounts: ProtonAccount[] = [];
    for (let i = 0; i < tokenTransfers.length; i++) {
        const tx = tokenTransfers[i] as TempTokenTransfer;
        const from = tx.fromUserAccount || "";
        const to = tx.toUserAccount || "";
        const amount = tx.tokenAmount;
        let actionType = "";
        if (!address) {
            if (to === "") {const sent = tx.mint; actions.push({actionType: type as ProtonActionType, amount, from, sent, to});} 
            else {actions.push({actionType: "TRANSFER", amount, from, sent: tx.mint, to});}
        } 
        else {
            if (to === "") {const sent = tx.mint; actions.push({actionType: type as ProtonActionType, amount, from, sent, to});} 
            else {
                if (tx.fromUserAccount === address) {actionType = "SENT";} 
                else if (tx.toUserAccount === address) {actionType = "RECEIVED";}
                if (actionType === "SENT") {const sent = tx.mint; actions.push({actionType, amount, from, sent, to});} 
                else if (actionType === "RECEIVED") {const received = tx.mint; actions.push({actionType, amount, from, received, to});}
            }
        }
    }
    traverseNativeTransfers(nativeTransfers, actions, address);
    traverseAccountData(accountData, accounts);
    return {
        accounts,
        actions,
        fee,
        primaryUser,
        signature,
        source,
        timestamp,
        type,
    };
};



export const parseUnknown = (
    transaction: EnrichedTransaction,
    address: string | undefined
): ProtonTransaction => {
    const {
        signature,
        timestamp,
        type,
        source,
        accountData,
        tokenTransfers,
        nativeTransfers,
        instructions,
    } = transaction;

    const fee = transaction.fee / LAMPORTS_PER_SOL;

    if (tokenTransfers === null || nativeTransfers === null) {
        return {
            accounts: [],
            actions: [],
            fee,
            primaryUser: "",
            signature,
            source,
            timestamp,
            type,
        };
    }

    const primaryUser =
        tokenTransfers[0]?.fromUserAccount ||
        nativeTransfers[0]?.fromUserAccount ||
        "";

    const actions: ProtonTransactionAction[] = [];
    const accounts: ProtonAccount[] = [];

    traverseAccountData(accountData, accounts);

    if (
        instructions &&
        instructions[0].programId ===
            "xnft5aaToUM4UFETUQfj7NUDUBdvYHTVhNFThEYTm55"
    ) {
        let type = "XNFT_INSTALL" as TransactionType;
        if (instructions[0].accounts.length === 6) {
            type = "XNFT_INSTALL" as TransactionType;
        } else if (instructions[0].accounts.length === 3) {
            type = "XNFT_UNINSTALL" as TransactionType;
        }
        return {
            accounts,
            actions,
            fee,
            primaryUser,
            signature,
            source,
            timestamp,
            type,
        };
    }

    traverseTokenTransfers(tokenTransfers, actions, address);
    traverseNativeTransfers(nativeTransfers, actions, address);

    return {
        accounts,
        actions,
        fee,
        primaryUser,
        signature,
        source,
        timestamp,
        type,
    };
};




export const parseTransfer = (
    transaction: EnrichedTransaction,
    address: string | undefined
): ProtonTransaction => {
    const {
        signature,
        timestamp,
        accountData,
        tokenTransfers,
        nativeTransfers,
        type,
        source,
    } = transaction;

    const fee = transaction.fee / LAMPORTS_PER_SOL;

    if (tokenTransfers === null || nativeTransfers === null) {
        return {
            accounts: [],
            actions: [],
            fee,
            primaryUser: "",
            signature,
            source,
            timestamp,
            type,
        };
    }

    const primaryUser = tokenTransfers[0]?.fromUserAccount || "";
    const actions: ProtonTransactionAction[] = [];
    const accounts: ProtonAccount[] = [];

    traverseTokenTransfers(tokenTransfers, actions, address);
    traverseNativeTransfers(nativeTransfers, actions, address);
    traverseAccountData(accountData, accounts);

    return {
        accounts,
        actions,
        fee,
        primaryUser,
        signature,
        source,
        timestamp,
        type,
    };
};



interface TempTokenTransfer extends TokenTransfer {
    tokenAmount: number;
}

export const parseSwap = (
    transaction: EnrichedTransaction,
    address: string | undefined
): ProtonTransaction => {
    const {
        type,
        source,
        signature,
        timestamp,
        tokenTransfers,
        nativeTransfers,
        accountData,
    } = transaction;
    const fee = transaction.fee / LAMPORTS_PER_SOL;

    if (tokenTransfers === null || nativeTransfers === null) {
        return {
            accounts: [],
            actions: [],
            fee,
            primaryUser: "",
            signature,
            source,
            timestamp,
            type,
        };
    }

    const primaryUser = tokenTransfers[0].fromUserAccount || "";
    const actions: ProtonTransactionAction[] = [];
    const accounts: ProtonAccount[] = [];

    if (source === "HADESWAP") {
        traverseTokenTransfers(tokenTransfers, actions, address);
        traverseNativeTransfers(nativeTransfers, actions, address);
    } else {
        traverseTokenTransfers(tokenTransfers, actions, address);
    }
    traverseAccountData(accountData, accounts);

    return {
        accounts,
        actions,
        fee,
        primaryUser,
        signature,
        source,
        timestamp,
        type,
    };
};




const generateDefaultTransaction = (type: TransactionType) => ({
    ...unknownProtonTransaction,
    type,
});

const generateNftTransaction = ({
    transaction,
    event,
    primaryUser,
    accounts,
    actions,
}: {
    transaction: EnrichedTransaction;
    event: NFTEvent;
    primaryUser: string;
    accounts: ProtonAccount[];
    actions: ProtonTransactionAction[];
}) => ({
    ...generateDefaultTransaction(transaction.type),
    accounts,
    actions,
    fee: transaction.fee / LAMPORTS_PER_SOL,
    primaryUser,
    signature: event.signature,
    source: event.source,
    timestamp: event.timestamp * 1000,
});

export const parseNftSale: ProtonParser = (transaction, address) => {
    // @ts-ignore
    const nftEvent = transaction.events.nft;

    if (!nftEvent) {
        return generateDefaultTransaction(transaction.type);
    }

    const actions: ProtonTransactionAction[] = [];
    const accounts: ProtonAccount[] = [];

    traverseAccountData(transaction.accountData, accounts);

    if (address) {
        let actionType = "NFT_SALE";
        if (nftEvent.buyer === address) {
            actionType = "NFT_BUY";
        } else if (nftEvent.seller === address) {
            actionType = "NFT_SELL";
        }

        transaction.type = actionType as TransactionType;

        if (actionType === "NFT_BUY") {
            actions.push(
                {
                    actionType: "SENT",
                    amount: nftEvent.amount / LAMPORTS_PER_SOL,
                    from: nftEvent.buyer,
                    sent: SOL,
                    to: nftEvent.seller,
                },
                {
                    actionType: "RECEIVED",
                    amount: 1,
                    from: nftEvent.seller,
                    received: (nftEvent.nfts || [{}])[0]?.mint,
                    to: nftEvent.buyer,
                }
            );
            return generateNftTransaction({
                accounts,
                actions,
                event: nftEvent,
                primaryUser: nftEvent.buyer,
                transaction,
            });
        } else if (actionType === "NFT_SELL") {
            actions.push(
                {
                    actionType: "SENT",
                    amount: 1,
                    from: nftEvent.seller,

                    sent: (nftEvent.nfts || [{}])[0]?.mint,
                    to: nftEvent.buyer,
                },
                {
                    actionType: "RECEIVED",
                    amount: nftEvent.amount / LAMPORTS_PER_SOL,
                    from: nftEvent.buyer,

                    received: SOL,
                    to: nftEvent.seller,
                }
            );
            return generateNftTransaction({
                accounts,
                actions,
                event: nftEvent,
                primaryUser: nftEvent.seller,
                transaction,
            });
        }
    }

    actions.push(
        {
            actionType: "TRANSFER",
            amount: nftEvent.amount / LAMPORTS_PER_SOL,
            from: nftEvent.buyer,

            sent: SOL,
            to: nftEvent.seller,
        },
        {
            actionType: "TRANSFER",
            amount: 1,
            from: nftEvent.seller,

            received: (nftEvent.nfts || [{}])[0]?.mint,
            to: nftEvent.buyer,
        }
    );

    return generateNftTransaction({
        accounts,
        actions,
        event: nftEvent,
        primaryUser: nftEvent.seller,
        transaction,
    });
};

export const parseNftList: ProtonParser = (transaction) => {
    // @ts-ignore
    const nftEvent = transaction.events.nft;

    if (!nftEvent) {
        return generateDefaultTransaction(transaction.type);
    }

    const accounts: ProtonAccount[] = [];
    traverseAccountData(transaction.accountData, accounts);

    return generateNftTransaction({
        accounts,
        actions: [
            {
                // @ts-ignore
                actionType: "NFT_LISTING",
                amount: nftEvent.amount / LAMPORTS_PER_SOL,
                from: nftEvent.seller,
                sent: (nftEvent.nfts || [{}])[0]?.mint,
                to: "",
            },
        ],
        event: nftEvent,
        primaryUser: nftEvent.seller,
        transaction,
    });
};

export const parseNftCancelList: ProtonParser = (transaction) => {
    // @ts-ignore
    const nftEvent = transaction.events.nft;

    if (!nftEvent) {
        return generateDefaultTransaction(transaction.type);
    }

    const accounts: ProtonAccount[] = [];
    traverseAccountData(transaction.accountData, accounts);

    return generateNftTransaction({
        accounts,
        actions: [
            {
                // @ts-ignore
                actionType: "NFT_CANCEL_LISTING",
                amount: nftEvent.amount / LAMPORTS_PER_SOL,
                from: nftEvent.seller,

                sent: (nftEvent.nfts || [{}])[0]?.mint,
                to: "",
            },
        ],
        event: nftEvent,
        primaryUser: nftEvent.seller,
        transaction,
    });
};

export const parseNftBid: ProtonParser = (transaction) => {
    // @ts-ignore
    const nftEvent = transaction.events.nft;

    if (!nftEvent) {
        return generateDefaultTransaction(transaction.type);
    }

    const accounts: ProtonAccount[] = [];
    traverseAccountData(transaction.accountData, accounts);

    return generateNftTransaction({
        accounts,
        actions: [
            {
                // @ts-ignore
                actionType: "NFT_BID",
                amount: nftEvent.amount / LAMPORTS_PER_SOL,
                from: "",

                sent: (nftEvent.nfts || [{}])[0]?.mint,
                to: nftEvent.buyer,
            },
        ],
        event: nftEvent,
        primaryUser: nftEvent.seller,
        transaction,
    });
};

export const parseNftCancelBid: ProtonParser = (transaction) => {
    // @ts-ignore
    const nftEvent = transaction.events.nft;

    if (!nftEvent) {
        return generateDefaultTransaction(transaction.type);
    }

    const accounts: ProtonAccount[] = [];
    traverseAccountData(transaction.accountData, accounts);

    return generateNftTransaction({
        accounts,
        actions: [
            {
                // @ts-ignore
                actionType: "NFT_BID_CANCELLED",
                amount: nftEvent.amount / LAMPORTS_PER_SOL,
                from: "",

                sent: (nftEvent.nfts || [{}])[0]?.mint,
                to: nftEvent.buyer,
            },
        ],
        event: nftEvent,
        primaryUser: nftEvent.seller,
        transaction,
    });
};

export const parseNftGlobalBid: ProtonParser = (transaction, address) => {
    // @ts-ignore
    const nftEvent = transaction.events.nft;

    if (!nftEvent) {
        return generateDefaultTransaction(transaction.type);
    }

    const accounts: ProtonAccount[] = [];
    traverseAccountData(transaction.accountData, accounts);

    return generateNftTransaction({
        accounts,
        actions: [
            {
                // @ts-ignore
                actionType: "NFT_GLOBAL_BID",
                amount: nftEvent.amount / LAMPORTS_PER_SOL,
                from: nftEvent.buyer,
                sent: SOL,
                to: "",
            },
        ],
        event: nftEvent,
        primaryUser: nftEvent.buyer,
        transaction,
    });
};

export const parseNftMint: ProtonParser = (transaction, address) => {
    // @ts-ignore
    const nftEvent = transaction.events.nft;
    const { source, nativeTransfers, accountData } = transaction;

    if (!nftEvent || !nativeTransfers) {
        return generateDefaultTransaction(transaction.type);
    }

    const actions: ProtonTransactionAction[] = [];
    const accounts: ProtonAccount[] = [];

    traverseAccountData(accountData, accounts);

    let mintAmount = 0;
    if (source === "SOLANA_PROGRAM_LIBRARY") {
        for (let i = 0; i < nativeTransfers.length; i++) {
            mintAmount += nativeTransfers[i].amount / LAMPORTS_PER_SOL;
        }
    } else {
        mintAmount = nftEvent.amount / LAMPORTS_PER_SOL;
    }

    if (!address) {
        actions.push(
            {
                actionType: "TRANSFER",
                amount: mintAmount,
                from: nftEvent.buyer,

                sent: SOL,
                to: "",
            },
            {
                actionType: "TRANSFER",
                amount: 1,
                from: "",
                received: (nftEvent.nfts || [{}])[0]?.mint,
                to: nftEvent.buyer,
            }
        );
    } else {
        if (nftEvent.buyer !== address) {
            actions.push({
                actionType: "AIRDROP",
                amount: 1,
                from: "",
                received: (nftEvent.nfts || [{}])[0]?.mint,
                to: nftEvent.buyer,
            });
            return generateNftTransaction({
                accounts,
                actions,
                event: nftEvent,
                primaryUser: nftEvent.buyer,
                transaction,
            });
        } else {
            actions.push(
                {
                    actionType: "SENT",
                    amount: mintAmount,
                    from: nftEvent.buyer,
                    sent: SOL,
                    to: "",
                },
                {
                    actionType: "RECEIVED",
                    amount: 1,
                    from: "",
                    received: (nftEvent.nfts || [{}])[0]?.mint,
                    to: nftEvent.buyer,
                }
            );
        }
    }

    return generateNftTransaction({
        accounts,
        actions,
        event: nftEvent,
        primaryUser: nftEvent.buyer,
        transaction,
    });
};

function returnCompressedNftEventArray(value: CompressedNftEvent | null) {
    if (Array.isArray(value)) {
        return value;
    } else if (value) {
        return [value];
    } else {
        return [];
    }
}

export const parseCompressedNftMint: ProtonParser = (transaction, address) => {
    const nftEvent = returnCompressedNftEventArray(
        transaction.events.compressed
    );
    const { signature, timestamp, accountData, type, source } = transaction;

    const fee = transaction.fee / LAMPORTS_PER_SOL;
    const primaryUser = transaction.feePayer;

    if (!nftEvent) {
        return generateDefaultTransaction(transaction.type);
    }

    const actions: ProtonTransactionAction[] = [];
    const accounts: ProtonAccount[] = [];

    traverseAccountData(accountData, accounts);

    for (let i = 0; i < nftEvent.length; i++) {
        const nftEventAction = nftEvent[i];
        if (!address) {
            actions.push({
                actionType: "TRANSFER",
                amount: 1,
                from: "",
                sent: nftEventAction.assetId,
                to: nftEventAction.newLeafOwner,
            });
        } else if (address === nftEventAction.newLeafOwner) {
            actions.push({
                actionType: "AIRDROP",
                amount: 1,
                from: "",
                received: nftEventAction.assetId,
                to: nftEventAction.newLeafOwner,
            });
        } else {
            actions.push({
                actionType: "RECEIVED",
                amount: 1,
                from: "",
                received: nftEventAction.assetId,
                to: nftEventAction.newLeafOwner,
            });
        }
    }

    return {
        accounts,
        actions,
        fee,
        primaryUser,
        signature,
        source,
        timestamp,
        type,
    };
};

export const parseCompressedNftTransfer: ProtonParser = (
    transaction,
    address
) => {
    const nftEvent = returnCompressedNftEventArray(
        transaction.events.compressed
    );
    const { signature, timestamp, accountData, type, source } = transaction;

    const fee = transaction.fee / LAMPORTS_PER_SOL;
    const primaryUser = transaction.feePayer;

    if (!nftEvent) {
        return generateDefaultTransaction(transaction.type);
    }

    const actions: ProtonTransactionAction[] = [];
    const accounts: ProtonAccount[] = [];

    traverseAccountData(accountData, accounts);

    for (let i = 0; i < nftEvent.length; i++) {
        const nftEventAction = nftEvent[i];
        if (!address) {
            actions.push({
                actionType: "TRANSFER",
                amount: 1,
                from: nftEventAction.oldLeafOwner,
                sent: nftEventAction.assetId,
                to: nftEventAction.newLeafOwner,
            });
        } else {
            if (address === nftEventAction.oldLeafOwner) {
                actions.push({
                    actionType: "TRANSFER_SENT",
                    amount: 1,
                    from: nftEventAction.oldLeafOwner,
                    sent: nftEventAction.assetId,
                    to: nftEventAction.newLeafOwner,
                });
            } else if (address === nftEventAction.newLeafOwner) {
                actions.push({
                    actionType: "TRANSFER_RECEIVED",
                    amount: 1,
                    from: nftEventAction.oldLeafOwner,
                    received: nftEventAction.assetId,
                    to: nftEventAction.newLeafOwner,
                });
            }
        }
    }

    return {
        accounts,
        actions,
        fee,
        primaryUser,
        signature,
        source,
        timestamp,
        type,
    };
};

export const parseCompressedNftBurn: ProtonParser = (transaction, address) => {
    const nftEvent = returnCompressedNftEventArray(
        transaction.events.compressed
    );
    const { signature, timestamp, accountData, type, source } = transaction;

    const fee = transaction.fee / LAMPORTS_PER_SOL;
    const primaryUser = transaction.feePayer;

    if (!nftEvent) {
        return generateDefaultTransaction(transaction.type);
    }

    const actions: ProtonTransactionAction[] = [];
    const accounts: ProtonAccount[] = [];

    traverseAccountData(accountData, accounts);

    for (let i = 0; i < nftEvent.length; i++) {
        const nftEventAction = nftEvent[i];
        if (nftEventAction.type === TransactionType.COMPRESSED_NFT_BURN) {
            actions.push({
                actionType: "BURN_NFT",
                amount: 1,
                from: nftEventAction.oldLeafOwner,
                sent: nftEventAction.assetId,
                to: "",
            });
        } else if (
            nftEventAction.type === TransactionType.COMPRESSED_NFT_MINT
        ) {
            actions.push({
                actionType: "COMPRESSED_NFT_MINT",
                amount: 1,
                from: "",
                sent: nftEventAction.assetId,
                to: nftEventAction.newLeafOwner,
            });
        } else {
            actions.push({
                actionType: "COMPRESSED_NFT_TRANSFER",
                amount: 1,
                from: nftEventAction.oldLeafOwner,
                sent: nftEventAction.assetId,
                to: nftEventAction.newLeafOwner,
            });
        }
    }

    return {
        accounts,
        actions,
        fee,
        primaryUser,
        signature,
        source,
        timestamp,
        type,
    };
};




interface TempTokenTransfer extends TokenTransfer {
    tokenAmount: number;
}

export const parseBorrowFox = (
    transaction: EnrichedTransaction,
    address: string | undefined
): ProtonTransaction => {
    const { type, source, signature, timestamp, tokenTransfers, accountData } =
        transaction;
    const fee = transaction.fee / LAMPORTS_PER_SOL;
    const actions: ProtonTransactionAction[] = [];
    const accounts: ProtonAccount[] = [];

    if (tokenTransfers === null) {
        return {
            accounts,
            actions,
            fee,
            primaryUser: "",
            signature,
            source,
            timestamp,
            type,
        };
    }

    const primaryUser = tokenTransfers[0]?.fromUserAccount || "";

    for (let i = 0; i < tokenTransfers.length; i++) {
        const tx = tokenTransfers[i] as TempTokenTransfer;

        const from = tx?.fromUserAccount || "";

        const to = tx?.toUserAccount || "";

        const amount = tx?.tokenAmount;

        // This is the first transfer, which is the foxy transfer
        if (i === 0) {
            if (!address) {
                const sent = tx?.mint;
                actions.push({
                    actionType: "TRANSFER",
                    amount,
                    from,
                    sent,
                    to,
                });
            } else {
                const actionType =
                    tx.fromUserAccount === address
                        ? "TRANSFER_SENT"
                        : "TRANSFER_RECEIVED";

                if (actionType === "TRANSFER_SENT") {
                    const sent = tx?.mint;
                    actions.push({
                        actionType,
                        amount,
                        from,
                        sent,
                        to,
                    });
                } else if (actionType === "TRANSFER_RECEIVED") {
                    const received = tx?.mint;
                    actions.push({
                        actionType,
                        amount,
                        from,
                        received,
                        to,
                    });
                }
            }
            // This is the second transfer, which is the foxy burn
        } else if (i === 1) {
            const sent = tx?.mint;
            actions.push({
                actionType: "BURN",
                amount,
                from,
                sent,
                to,
            });
        }
    }

    traverseAccountData(accountData, accounts);

    return {
        accounts,
        actions,
        fee,
        primaryUser,
        signature,
        source,
        timestamp,
        type,
    };
};

export const parseLoanFox = (
    transaction: EnrichedTransaction
): ProtonTransaction => {
    const { signature, timestamp, type, source, accountData } = transaction;
    const fee = transaction.fee / LAMPORTS_PER_SOL;
    const actions: ProtonTransactionAction[] = [];
    const accounts: ProtonAccount[] = [];

    if (!accountData) {
        return {
            accounts,
            actions,
            fee,
            primaryUser: "",
            signature,
            source,
            timestamp,
            type,
        };
    }

    const primaryUser = accountData[0]?.account || "";
    const sent = accountData[8]?.account;

    actions.push({
        actionType: "FREEZE",
        amount: 0,
        from: primaryUser,
        sent,
        to: "",
    });

    traverseAccountData(accountData, accounts);

    return {
        accounts,
        actions,
        fee,
        primaryUser,
        signature,
        source,
        timestamp,
        type,
    };
};



