import { t } from "$lib/trpc/t";
import { Connection, PublicKey } from "@solana/web3.js";
import { z } from "zod";
import { getRPCUrl } from "$lib/util/get-rpc-url";

const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

export const token = t.procedure
    .input(z.tuple([z.string(), z.boolean()]))
    .query(async ({ input }) => {
        const [token, isMainnet] = input;
        const connection = new Connection(getRPCUrl(isMainnet ? "mainnet" : "devnet"), "confirmed");
        const tokenPublicKey = new PublicKey(token);

        try {
            const [metadataPDA] = PublicKey.findProgramAddressSync(
                [Buffer.from("metadata"), TOKEN_METADATA_PROGRAM_ID.toBuffer(), tokenPublicKey.toBuffer()],
                TOKEN_METADATA_PROGRAM_ID
            );

            const accountInfo = await connection.getAccountInfo(metadataPDA);
            if (!accountInfo) {
                throw new Error("Metadata account not found");
            }

            const metadata = decodeMetadata(accountInfo.data);
            return {
                name: metadata.data.name,
                symbol: metadata.data.symbol,
                uri: metadata.data.uri,
            };
        } catch (error) {
            return null;
        }
    });

function decodeMetadata(buffer: Buffer): any {
    const name = buffer.slice(1, 33).toString().replace(/\0/g, '');
    const symbol = buffer.slice(33, 65).toString().replace(/\0/g, '');
    const uri = buffer.slice(65, 197).toString().replace(/\0/g, '');

    return {
        data: {
            name,
            symbol,
            uri,
        }
    };
}