import { t } from "$lib/trpc/t";
import { z } from "zod";
import { Connection } from "@solana/web3.js";
import { getRPCUrl } from "$lib/utils";
export const currentSlot = t.procedure.input(z.tuple([z.boolean()])).query(async ({ input }) => {const [isMainnet] = input; const connection = new Connection(getRPCUrl(isMainnet ? "mainnet" : "devnet"), "confirmed"); const slot = await connection.getSlot(); return slot;});