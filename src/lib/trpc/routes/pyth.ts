// import { PythSolanaReceiver } from "@pythnetwork/pyth-solana-receiver";
// import { Connection } from "@solana/web3.js";
// import { Wallet } from "@coral-xyz/anchor";

// const connection: Connection;
// const wallet: Wallet;
// const pythSolanaReceiver = new PythSolanaReceiver({ connection, wallet });

// const solUsdPriceFeedAccount = pythSolanaReceiver
//   .getPriceFeedAccountAddress(0, SOL_PRICE_FEED_ID)
//   .toBase58();

// import { t } from "$lib/trpc/t";
// import { PriceServiceConnection } from "@pythnetwork/price-service-client";

// export const pythPrice = t.procedure
//     .query(async () => {
//         const connection = new PriceServiceConnection("https://hermes.pyth.network");
//         const priceIds = ["0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace"];
//         try {
//             const [ethUsdFeed] = (await connection.getLatestPriceFeeds(priceIds)) ?? [];
//             const price = ethUsdFeed?.getPriceUnchecked();
//             return price && typeof price.price === 'string' && typeof price.expo === 'number' 
//                 ? parseFloat(price.price) * Math.pow(10, price.expo) 
//                 : null;
//         } catch (error) {
//             console.error("Error fetching ETH/USD price:", error);
//             return null;
//         }
//     });