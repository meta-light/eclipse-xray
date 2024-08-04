import { isValidPublicKey } from "../index";

import type { Connection } from "@solana/web3.js";

import { PublicKey } from "@solana/web3.js";

import { TldParser } from "@onsol/tldparser";
import { browser } from "$app/environment";

import getJupiterTokens from "$lib/util/get-tokens";
import { ASSET_PROGRAM_ID } from "@nifty-oss/asset";

export interface SearchResult {
    url: string;
    address: string;
    type: SearchResultType;
    valid: boolean;
    search: string;
}

type SearchResultType =
    | "token"
    | "account"
    | "transaction"
    | "bonfida-domain"
    | "ans-domain"
    | "nifty-asset"
    | null;

const searchDefaults: SearchResult = {
    address: "",
    search: "",
    type: null,
    url: `/`,
    valid: false,
};

export const search = async (
    query: string,
    connection: Connection
): Promise<SearchResult> => {
    if (isValidPublicKey(query)) {
        const pubkey = new PublicKey(query);
        const account = await connection.getAccountInfo(pubkey);
        const program = account?.owner.toString();
        let addressType: "token" | "account" | "nifty-asset";

        if (account) {
            if (
                program === "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" ||
                program === "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
            ) {
                addressType = "token";
            } else if (program === ASSET_PROGRAM_ID) {
                addressType = "nifty-asset";
            } else {
                addressType = "account";
            }
        } else {
            addressType = "account";
        }

        return {
            address: query,
            search: query,
            type: addressType,
            url: `/${addressType}/${query}`,
            valid: true,
        };
    }

    if (query.length > 50) {
        try {
            const signature = await connection.getSignatureStatus(query);
            if (signature && signature.value !== null) {
                return {
                    address: query,
                    search: query,
                    type: "transaction",
                    url: `/tx/${query}`,
                    valid: true,
                };
            }
        } catch (error) {
        }
    }

    // For simplicity, we'll remove domain name lookups as they might require APIs
    // You may need to add a custom solution for domain lookups on Eclipse

    return searchDefaults;
};