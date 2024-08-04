import { json, type RequestEvent } from "@sveltejs/kit";
import { search } from "$lib/xray";
import { Connection } from "@solana/web3.js";
import { getRPCUrl } from "$lib/util/get-rpc-url";

// Consume a search, return what to do with it
export async function GET({ params }: RequestEvent) {
    const connection = new Connection(getRPCUrl("mainnet"), "confirmed");

    const result = await search(params?.query || "", connection);

    return json(result);
}