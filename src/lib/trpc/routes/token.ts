import { t } from "$lib/trpc/t";
import { Connection, PublicKey } from "@solana/web3.js";
import { z } from "zod";
import { getRPCUrl } from "$lib/utils";
import { MintLayout } from "@solana/spl-token";
import { TRPCError } from '@trpc/server';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { Umi } from '@metaplex-foundation/umi';
import { Buffer } from 'buffer';
import axios from 'axios';
import { ACCOUNT_SIZE } from "@solana/spl-token";
import { findMetadataPda } from '@metaplex-foundation/mpl-token-metadata';
import { fetchMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { publicKey } from '@metaplex-foundation/umi';
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "$lib/config";
import type { TokenData } from "$lib/types";

async function fetchMetadataFromUri(uri: string): Promise<any> {
    try {
        let cleanUri = uri.replace(/Eclipse$/i, '').replace(/\x07/g, '').trim();
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
        const uriLower = cleanUri.toLowerCase();
        if (imageExtensions.some(ext => uriLower.endsWith(ext))) {return {image: cleanUri, uri: cleanUri, type: 'image'};}
        if (cleanUri.startsWith('ipfs://')) {const ipfsHash = cleanUri.slice(7); cleanUri = `https://dweb.link/ipfs/${ipfsHash}`;} 
        else if (cleanUri.includes('pinata.cloud')) {const match = cleanUri.match(/ipfs\/([a-zA-Z0-9]+)/); if (match) {cleanUri = `https://dweb.link/ipfs/${match[1]}`;}}
        const response = await axios.get(cleanUri, {
            timeout: 10000, 
            headers: {'Accept': 'application/json, text/plain, */*', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'},
            maxRedirects: 5,
            validateStatus: (status) => status < 400,
            proxy: false
        });
        if (response.data) {
            if (typeof response.data === 'object') {const cleanedData = cleanMetadataImageUrls(response.data); return cleanedData;}
            if (imageExtensions.some(ext => cleanUri.toLowerCase().endsWith(ext))) {return {image: cleanUri, uri: cleanUri, type: 'image'};}
            return response.data;
        }
        return null;
    } 
    catch (error) {
        console.error(`Failed to fetch metadata from ${uri}:`, error instanceof Error ? error.message : 'Unknown error');
        if (!uri.includes('dweb.link') && uri.includes('ipfs')) {
            try {
                const ipfsHash = uri.match(/ipfs\/([a-zA-Z0-9]+)/)?.[1] || uri.match(/ipfs:\/\/([a-zA-Z0-9]+)/)?.[1];              
                if (ipfsHash) {
                    const backupUri = `https://dweb.link/ipfs/${ipfsHash}`;
                    console.log('Attempting backup IPFS gateway:', backupUri);
                    const backupResponse = await axios.get(backupUri, {
                        timeout: 5000,
                        headers: {'Accept': 'application/json, text/plain, */*', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',},
                        proxy: false
                    });
                    if (backupResponse.data) {return cleanMetadataImageUrls(backupResponse.data);}
                }
            } 
            catch (backupError) {console.error('Backup gateway failed:', backupError instanceof Error ? backupError.message : String(backupError));}
        }
        return null;
    }
}

function cleanMetadataImageUrls(metadata: any): any {
    if (!metadata || typeof metadata !== 'object') return metadata;
    const cleanData = { ...metadata };
    const cleanIpfsUrl = (url: string): string => {
        if (!url) return url;
        let cleanUrl = url.replace(/Eclipse$/i, '').replace(/\x01|\x07/g, '').trim();
        if (cleanUrl.startsWith('ipfs://')) {const ipfsHash = cleanUrl.slice(7); cleanUrl = `https://dweb.link/ipfs/${ipfsHash}`;} 
        else if (cleanUrl.includes('pinata.cloud')) {const match = cleanUrl.match(/ipfs\/([a-zA-Z0-9]+)/); if (match) {cleanUrl = `https://dweb.link/ipfs/${match[1]}`;}} 
        else if (cleanUrl.includes('ipfs.raribleuserdata.com')) {return cleanUrl;} 
        else if (cleanUrl.includes('shdw-drive.genesysgo.net')) {return cleanUrl;}
        return cleanUrl;
    };
    const possibleImageLocations = ['image', 'image_url', 'imageUrl', 'imageUri', 'image_uri', 'thumbnail', 'thumbnailUrl', 'media', 'mediaUrl'];
    for (const location of possibleImageLocations) {if (cleanData[location]) {cleanData.image = cleanIpfsUrl(cleanData[location]); break;}}
    if (!cleanData.image && cleanData.properties) {
        if (cleanData.properties.files && Array.isArray(cleanData.properties.files)) {
            const imageFile = cleanData.properties.files.find((file: any) => 
                file.type?.includes('image') || (file.uri && (file.uri.endsWith('.png') || file.uri.endsWith('.jpg') || file.uri.endsWith('.jpeg') || file.uri.endsWith('.gif') || file.uri.endsWith('.webp')))
            );
            if (imageFile?.uri) {cleanData.image = cleanIpfsUrl(imageFile.uri);}
        }
        if (!cleanData.image && cleanData.properties.image) {cleanData.image = cleanIpfsUrl(cleanData.properties.image);}
    }
    if (cleanData.animation_url) {cleanData.animation_url = cleanIpfsUrl(cleanData.animation_url);}
    if (cleanData.properties?.files) {cleanData.properties.files = cleanData.properties.files.map((file: any) => {if (file.uri) {file.uri = cleanIpfsUrl(file.uri);} return file;});}
    return cleanData;
}

function parseToken2022Metadata(extensionData: Buffer): string | undefined {
    let stringData = extensionData.toString('utf8').replace(/\0/g, '');
    const ipfsUriRegex = /ipfs:\/\/(\w+)/;
    const ipfsUriMatch = stringData.match(ipfsUriRegex);
    if (ipfsUriMatch) {const [, ipfsHash] = ipfsUriMatch; const uri = `ipfs://${ipfsHash}`; return uri;}
    const httpUriRegex = /(https?:\/\/\S+)/;
    const httpUriMatch = stringData.match(httpUriRegex);
    if (httpUriMatch) {const [, uri] = httpUriMatch; return uri;}
    return undefined;
}

export const token = t.procedure
    .input(z.tuple([z.string(), z.boolean()]))
    .query(async ({ input }): Promise<TokenData> => {
        const [token, isMainnet] = input;
        try {
            let tokenPublicKey: PublicKey;
            try {tokenPublicKey = new PublicKey(token);} 
            catch (error) {
                console.error(`Invalid token address: ${token}`, error);
                throw new TRPCError({code: 'BAD_REQUEST', message: `Invalid token address: "${token}". Must be a valid base58-encoded string.`});
            }
            const [url, connection, umi] = await getRPCUrlAndConnection(isMainnet);
            const accountInfo = await connection.getAccountInfo(tokenPublicKey);
            if (!accountInfo) {throw new TRPCError({code: 'NOT_FOUND', message: `Token account not found for address: ${token}`});}
            const isToken2022 = accountInfo.owner.toBase58() === TOKEN_2022_PROGRAM_ID;
            const isTokenProgram = accountInfo.owner.toBase58() === TOKEN_PROGRAM_ID;
            if (!isToken2022 && !isTokenProgram) {
                console.error(`Invalid token program: ${accountInfo.owner.toBase58()}`);
                throw new TRPCError({code: 'BAD_REQUEST', message: `Invalid token account: ${token}. Not owned by Token or Token-2022 program.`});
            }
            let decodedMintInfo;
            try {decodedMintInfo = MintLayout.decode(accountInfo.data.slice(0, ACCOUNT_SIZE));} 
            catch (error) {
                console.error("Error decoding mint info:", error);
                throw new TRPCError({code: 'INTERNAL_SERVER_ERROR', message: `Error decoding mint info: ${error instanceof Error ? error.message : 'Unknown error'}`});
            }
            const mintInfo = {
                mintAuthority: decodedMintInfo.mintAuthority,
                supply: decodedMintInfo.supply,
                decimals: decodedMintInfo.decimals,
                isInitialized: decodedMintInfo.isInitialized,
                freezeAuthority: decodedMintInfo.freezeAuthority,
            };
            let metadata: { name: string; symbol: string; uri: string } | undefined;
            let externalMetadata: any = null;
            if (isToken2022 && accountInfo.data.length > ACCOUNT_SIZE) {
                const extensionData = accountInfo.data.slice(ACCOUNT_SIZE);
                const uri = parseToken2022Metadata(extensionData);
                if (uri) {
                    try {
                        externalMetadata = await fetchMetadataFromUri(uri);
                        if (externalMetadata) {metadata = {name: externalMetadata.name || '', symbol: externalMetadata.symbol || '', uri: uri};} 
                        else {console.warn('Failed to fetch external metadata');}
                    } 
                    catch (error) {console.error('Error fetching external metadata:', error);}
                }
            } 
            else {
                try {
                    const umiPublicKey = publicKey(tokenPublicKey.toBase58());
                    const [metadataPda] = findMetadataPda(umi, { mint: umiPublicKey });
                    const metadataAccount = await fetchMetadata(umi, metadataPda);
                    if (metadataAccount) {
                        metadata = {name: metadataAccount.name, symbol: metadataAccount.symbol, uri: metadataAccount.uri};
                        externalMetadata = await fetchMetadataFromUri(metadataAccount.uri);
                        if (externalMetadata) {externalMetadata = cleanMetadataImageUrls(externalMetadata);}
                    } 
                    else {
                        const parsedMetadata = parseTokenAccountMetadata(accountInfo.data);
                        if (parsedMetadata) {
                            metadata = parsedMetadata;
                            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
                            const uriLower = parsedMetadata.uri.toLowerCase();
                            if (imageExtensions.some(ext => uriLower.endsWith(ext))) {externalMetadata = {image: parsedMetadata.uri, name: parsedMetadata.name, symbol: parsedMetadata.symbol};} 
                            else {externalMetadata = await fetchMetadataFromUri(parsedMetadata.uri);}
                        }
                    }
                } 
                catch (error) {console.error('Error fetching or parsing metadata:', error);}
            }
            const tokenData: TokenData = {
                address: token,
                decimals: mintInfo.decimals,
                supply: mintInfo.supply.toString(),
                isToken2022,
                freezeAuthority: mintInfo.freezeAuthority?.toBase58(),
                mintAuthority: mintInfo.mintAuthority?.toBase58(),
                metadata: metadata || undefined,
                externalMetadata: externalMetadata,
            };
            return tokenData;
        } 
        catch (error) {
            console.error("Error in token procedure:", error);
            if (error instanceof TRPCError) {throw error;}
            throw new TRPCError({code: 'INTERNAL_SERVER_ERROR', message: `Error fetching token data: ${error instanceof Error ? error.message : 'Unknown error'}`, cause: error,});
        }
    });

async function getRPCUrlAndConnection(isMainnet: boolean): Promise<[string, Connection, Umi]> {
    const url = getRPCUrl(isMainnet ? "mainnet" : "devnet");
    const connection = new Connection(url, "confirmed");
    const umi = createUmi(url);
    return [url, connection, umi];
}

function parseTokenAccountMetadata(data: Buffer): { name: string; symbol: string; uri: string } | null {
    try {
        const nameLength = data[0];
        const name = data.slice(1, 1 + nameLength).toString('utf8').replace(/\0/g, '');
        const symbolLength = data[1 + nameLength];
        const symbol = data.slice(1 + nameLength + 1, 1 + nameLength + 1 + symbolLength).toString('utf8').replace(/\0/g, '');
        const uriLength = data.readUInt16LE(1 + nameLength + 1 + symbolLength);
        const uri = data.slice(1 + nameLength + 1 + symbolLength + 2, 1 + nameLength + 1 + symbolLength + 2 + uriLength).toString('utf8').replace(/\0/g, '');
        return { name, symbol, uri };
    } 
    catch (error) {console.error('Error parsing token account metadata:', error); return null;}
}