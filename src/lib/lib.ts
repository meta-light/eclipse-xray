import { Connection, PublicKey } from "@solana/web3.js";
import type { PublicKey as PublicKeyType, ParsedAccountData } from "@solana/web3.js";
import { ASSET_PROGRAM_ID } from "@nifty-oss/asset";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, networks, PROGRAM_INFO_BY_ID } from "./config";
import type { Network, SearchResult } from "./types";
export const connect = (network: Network = "mainnet") => {let url = networks[network]; return new Connection(url, "confirmed");};
export const getSolanaName = (publicKey: string): string => {const programInfo = PROGRAM_INFO_BY_ID[publicKey]; return programInfo?.name || publicKey;};
export const isValidPublicKey = (address: string = ""): PublicKeyType | null => {try {return new PublicKey(address.trim());} catch (error) {return null;}};
const searchDefaults: SearchResult = {address: "", search: "", type: null, url: `/`, valid: false};
function isParsedAccountData(data: any): data is ParsedAccountData {return data && typeof data === 'object' && 'parsed' in data;}
export const search = async (query: string, connection: Connection): Promise<SearchResult> => {
    if (isValidPublicKey(query)) {
        const pubkey = new PublicKey(query);
        const account = await connection.getAccountInfo(pubkey);
        const program = account?.owner.toString();
        let addressType: "token" | "account" | "nifty-asset" | "nft";
        if (account) {
            if (program === TOKEN_PROGRAM_ID || program === TOKEN_2022_PROGRAM_ID || program === ASSET_PROGRAM_ID) {
                const isNft = await checkIfNft(pubkey, connection); 
                addressType = isNft ? "nft" : "token";
            } 
            else {addressType = "account";}
        } 
        else {addressType = "account";}
        return {address: query, search: query, type: addressType, url: `/${addressType}/${query}`, valid: true};
    }
    if (query.length > 50) {
        try {
            const signature = await connection.getSignatureStatus(query);
            if (signature && signature.value !== null) {return {address: query, search: query, type: "transaction", url: `/tx/${query}`, valid: true};}
        } catch (error) {}
    }
    return searchDefaults;
};

async function checkIfNft(pubkey: PublicKey, connection: Connection): Promise<boolean> {
    try {
        const tokenAccountInfo = await connection.getParsedAccountInfo(pubkey);
        const data = tokenAccountInfo.value?.data;
        if (isParsedAccountData(data)) {const decimals = data.parsed.info.decimals; return decimals === 0;}
        return false;
    } 
    catch (error) {console.error(`Error checking if asset is NFT: ${error}`); return false;}
}