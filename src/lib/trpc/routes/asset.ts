import { t } from "$lib/trpc/t";
import { z } from "zod";
import { getRPCUrl } from "$lib/utils";
import type { UITokenMetadata } from "$lib/types";

export const asset = t.procedure
    .input(z.tuple([z.string(), z.boolean()]))
    .query(async ({ input }) => {
        const [asset, isMainnet] = input;
        const url = getRPCUrl(isMainnet ? "mainnet" : "devnet");

        const response = await fetch(url, {
            body: JSON.stringify({
                id: "asset",
                jsonrpc: "2.0",
                method: "getAsset",
                params: [
                    asset,
                    { encoding: "jsonParsed" }
                ]
            }),
            headers: {
                "Content-Type": "application/json",
            },
            method: "POST",
        });

        const data = await response.json();
        let metadata: UITokenMetadata | undefined;

        if (data?.result) {
            const result = data.result;
            metadata = {
                address: result.mint || "",
                attributes: result.attributes || [],
                burnt: result.burnt || false,
                collectionKey: result.collection?.key || "",
                compressed: result.compression?.compressed || false,
                creators: result.creators || [],
                delegate: result.delegate || "",
                description: result.data?.description || "",
                frozen: result.frozen || false,
                image: result.data?.uri || "",
                mintExtensions: result.mintExtensions || "",
                mutable: result.mutable || false,
                name: result.data?.name || "",
                owner: result.owner || "",
                sellerFeeBasisPoints: result.data?.sellerFeeBasisPoints || 0,
            };

            if (metadata.compressed) {
                metadata.assetHash = result.compression?.assetHash;
                metadata.creatorHash = result.compression?.creatorHash;
                metadata.dataHash = result.compression?.dataHash;
                metadata.leafId = result.compression?.leafId;
                metadata.seq = result.compression?.seq;
                metadata.tree = result.compression?.tree;
            }
        }

        return metadata ?? data?.result;
    });