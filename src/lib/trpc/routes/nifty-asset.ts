import { z } from "zod";

import { t } from "$lib/trpc/t";

import { connect } from "$lib/xray";
import { LAMPORTS_PER_SOL, PublicKey, Connection } from "@solana/web3.js";
import { getRPCUrl } from "$lib/util/get-rpc-url";

import { getAssetAccountDataSerializer } from "@nifty-oss/asset";

export const niftyAsset = t.procedure
    .input(z.tuple([z.string(), z.literal("mainnet").or(z.literal("devnet"))]))
    .query(async ({ input }) => {
        const [address, network] = input;
        const connection = new Connection(getRPCUrl(network), "confirmed");

        const pubKey = new PublicKey(address);

        const accountInfo = await connection.getAccountInfo(pubKey);

        if (accountInfo) {
            return getAssetAccountDataSerializer().deserialize(
                accountInfo.data
            );
        }

        return null;
    });
