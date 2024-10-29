import { t } from "$lib/trpc/t";
import { PriceServiceConnection } from "@pythnetwork/price-service-client";
import { priceFeedIds } from "$lib/config";

export const pythPrices = t.procedure
    .query(async () => {
        const connection = new PriceServiceConnection("https://hermes.pyth.network");
        const priceIds = Object.values(priceFeedIds);
        try {
            const priceFeeds = await connection.getLatestPriceFeeds(priceIds) ?? [];
            const prices: Record<string, number | null> = {};
            priceFeeds.forEach((feed, index) => {
                const token = Object.keys(priceFeedIds)[index];
                const price = feed?.getPriceUnchecked();
                prices[token] = price && typeof price.price === 'string' && typeof price.expo === 'number' ? parseFloat(price.price) * Math.pow(10, price.expo) : null;
            });
            return prices;
        } 
        catch (error) {console.error("Error fetching prices:", error); return {};}
    });