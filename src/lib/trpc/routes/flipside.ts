import { t } from "$lib/trpc/t";
// @ts-ignore
import { FLIPSIDE_API_KEY } from "$env/static/private";
import { Flipside } from '@flipsidecrypto/sdk';

export const flipsideQuery = t.procedure
    .query(async () => {
        const flipside = new Flipside(FLIPSIDE_API_KEY, "https://api-v2.flipsidecrypto.xyz");
        try {// credit hkey
            const sql = `
                WITH query1 AS (
                SELECT 'WIF' AS name, 
                    (
                        (
                            (
                                SELECT COALESCE(SUM(MINT_AMOUNT), 0)
                                FROM eclipse.defi.fact_token_mint_actions
                                WHERE MINT = '841P4tebEgNux2jaWSjCoi9LhrVr9eHGjLc758Va3RPH'
                            ) - (
                                SELECT COALESCE(SUM(BURN_AMOUNT), 0)
                                FROM eclipse.defi.fact_token_burn_actions
                                WHERE MINT = '841P4tebEgNux2jaWSjCoi9LhrVr9eHGjLc758Va3RPH'
                            )
                        ) / 1e6
                    ) * (
                        SELECT PRICE
                        FROM solana.price.ez_prices_hourly
                        WHERE TOKEN_ADDRESS = 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm'
                        ORDER BY HOUR DESC
                        LIMIT 1
                    ) AS amount
            ),
            query2 AS (
                SELECT 'USDC' AS name,
                    (
                        (
                            (
                                SELECT COALESCE(SUM(MINT_AMOUNT), 0)
                                FROM eclipse.defi.fact_token_mint_actions
                                WHERE MINT = 'AKEWE7Bgh87GPp171b4cJPSSZfmZwQ3KaqYqXoKLNAEE'
                            ) - (
                                SELECT COALESCE(SUM(BURN_AMOUNT), 0)
                                FROM eclipse.defi.fact_token_burn_actions
                                WHERE MINT = 'AKEWE7Bgh87GPp171b4cJPSSZfmZwQ3KaqYqXoKLNAEE'
                            )
                        ) / 1e6
                    ) * 1 AS amount
            ),
            query3 AS (
                SELECT 'SOL' AS name,
                    (
                        (
                            (
                                SELECT COALESCE(SUM(MINT_AMOUNT), 0)
                                FROM eclipse.defi.fact_token_mint_actions
                                WHERE MINT = 'BeRUj3h7BqkbdfFU7FBNYbodgf8GCHodzKvF9aVjNNfL'
                            ) - (
                                SELECT COALESCE(SUM(BURN_AMOUNT), 0)
                                FROM eclipse.defi.fact_token_burn_actions
                                WHERE MINT = 'BeRUj3h7BqkbdfFU7FBNYbodgf8GCHodzKvF9aVjNNfL'
                            )
                        ) / 1e9
                    ) * (
                        SELECT PRICE
                        FROM solana.price.ez_prices_hourly
                        WHERE TOKEN_ADDRESS = 'So11111111111111111111111111111111111111112'
                        ORDER BY HOUR DESC
                        LIMIT 1
                    ) AS amount
            ),
            query_orca AS (
                SELECT 'ORCA' AS name,
                    (
                        (
                            (
                                SELECT COALESCE(SUM(MINT_AMOUNT), 0)
                                FROM eclipse.defi.fact_token_mint_actions
                                WHERE MINT = '2tGbYEm4nuPFyS6zjDTELzEhvVKizgKewi6xT7AaSKzn'
                            ) - (
                                SELECT COALESCE(SUM(BURN_AMOUNT), 0)
                                FROM eclipse.defi.fact_token_burn_actions
                                WHERE MINT = '2tGbYEm4nuPFyS6zjDTELzEhvVKizgKewi6xT7AaSKzn'
                            )
                        ) / 1e6
                    ) * (
                        SELECT PRICE
                        FROM solana.price.ez_prices_hourly
                        WHERE TOKEN_ADDRESS = 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE'
                        ORDER BY HOUR DESC
                        LIMIT 1
                    ) AS amount
            ),
            query_usdt AS (
                SELECT 'USDT' AS name,
                    (
                        (
                            (
                                SELECT COALESCE(SUM(MINT_AMOUNT), 0)
                                FROM eclipse.defi.fact_token_mint_actions
                                WHERE MINT = 'CEBP3CqAbW4zdZA57H2wfaSG1QNdzQ72GiQEbQXyW9Tm'
                            ) - (
                                SELECT COALESCE(SUM(BURN_AMOUNT), 0)
                                FROM eclipse.defi.fact_token_burn_actions
                                WHERE MINT = 'CEBP3CqAbW4zdZA57H2wfaSG1QNdzQ72GiQEbQXyW9Tm'
                            )
                        ) / 1e6
                    ) * 1 AS amount
            ),
            query_wbtc AS (
                SELECT 'WBTC' AS name,
                    (
                        (
                            (
                                SELECT COALESCE(SUM(MINT_AMOUNT), 0)
                                FROM eclipse.defi.fact_token_mint_actions
                                WHERE MINT = '7UTjr1VC6Z9DPsWD6mh5wPzNtufN17VnzpKS3ASpfAji'
                            ) - (
                                SELECT COALESCE(SUM(BURN_AMOUNT), 0)
                                FROM eclipse.defi.fact_token_burn_actions
                                WHERE MINT = '7UTjr1VC6Z9DPsWD6mh5wPzNtufN17VnzpKS3ASpfAji'
                            )
                        ) / 1e8
                    ) * (
                    SELECT
                        PRICE
                    from
                        bitcoin.price.ez_prices_hourly
                    ORDER BY
                        HOUR DESC
                    LIMIT
                        1
                ) AS amount
            ),
            query_sttia AS (
                SELECT 'stTIA' AS name,
                    (
                        (
                            (
                                SELECT COALESCE(SUM(MINT_AMOUNT), 0)
                                FROM eclipse.defi.fact_token_mint_actions
                                WHERE MINT = 'V5m1Cc9VK61mKL8xVYrjR7bjD2BC5VpADLa6ws3G8KM'
                            ) - (
                                SELECT COALESCE(SUM(BURN_AMOUNT), 0)
                                FROM eclipse.defi.fact_token_burn_actions
                                WHERE MINT = 'V5m1Cc9VK61mKL8xVYrjR7bjD2BC5VpADLa6ws3G8KM'
                            )
                        ) / 1e6
                    ) * (
                    SELECT
                        PRICE
                    from
                        osmosis.price.dim_prices
                    WHERE
                        CURRENCY = 'ibc/698350B8A61D575025F3ED13E9AC9C0F45C89DEFE92F76D5838F1D3C1A7FF7C9' -- sttia ibc address
                    ORDER BY
                        RECORDED_AT DESC
                    LIMIT
                        1;
                ) AS amount
            ),
            query_tia AS (
                SELECT 'TIA' AS name,
                    (
                        (
                            (
                                SELECT COALESCE(SUM(MINT_AMOUNT), 0)
                                FROM eclipse.defi.fact_token_mint_actions
                                WHERE MINT = '9RryNMhAVJpAwAGjCAMKbbTFwgjapqPkzpGMfTQhEjf8'
                            ) - (
                                SELECT COALESCE(SUM(BURN_AMOUNT), 0)
                                FROM eclipse.defi.fact_token_burn_actions
                                WHERE MINT = '9RryNMhAVJpAwAGjCAMKbbTFwgjapqPkzpGMfTQhEjf8'
                            )
                        ) / 1e6
                    ) * (
                    SELECT
                        PRICE
                    from
                        osmosis.price.dim_prices
                    WHERE
                        CURRENCY = 'ibc/D79E7D83AB399BFFF93433E54FAA480C191248FC556924A2A8351AE2638B3877' -- tia ibc address
                    ORDER BY
                        RECORDED_AT DESC
                    LIMIT
                        1
                ) AS amount
            ),
            query_teef AS (
                SELECT 'TETH' AS name,
                    (
                        (
                            (
                                SELECT COALESCE(SUM(MINT_AMOUNT), 0)
                                FROM eclipse.defi.fact_token_mint_actions
                                WHERE MINT = 'GU7NS9xCwgNPiAdJ69iusFrRfawjDDPjeMBovhV1d4kn'
                            ) - (
                                SELECT COALESCE(SUM(BURN_AMOUNT), 0)
                                FROM eclipse.defi.fact_token_burn_actions
                                WHERE MINT = 'GU7NS9xCwgNPiAdJ69iusFrRfawjDDPjeMBovhV1d4kn'
                            )
                        ) / 1e9
                    ) * (
                            SELECT PRICE
                            FROM ethereum.price.ez_prices_hourly
                            WHERE TOKEN_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' -- weth address
                            ORDER BY HOUR DESC
                            LIMIT 1
                    ) AS amount
            ),
            query4 AS (
                SELECT 'ETH' AS name,
                    (
                        BALANCE / 1e18 * (
                            SELECT PRICE
                            FROM ethereum.price.ez_prices_hourly
                            WHERE TOKEN_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' -- weth address
                            ORDER BY HOUR DESC
                            LIMIT 1
                        )
                    ) AS amount
                FROM ethereum.core.fact_eth_balances
                WHERE USER_ADDRESS = '0xd7e4b67e735733ac98a88f13d087d8aac670e644'
                ORDER BY BLOCK_NUMBER DESC
                LIMIT 1
            )
            SELECT name, amount
            FROM query1
            UNION ALL
            SELECT name, amount
            FROM query_teef
            UNION ALL
            SELECT name, amount
            FROM query_sttia
            UNION ALL
            SELECT name, amount
            FROM query_orca
            UNION ALL
            SELECT name, amount
            FROM query_tia
            UNION ALL
            SELECT name, amount
            FROM query_usdt
            UNION ALL
            SELECT name, amount
            FROM query_wbtc
            UNION ALL
            SELECT name, amount
            FROM query2
            UNION ALL
            SELECT name, amount
            FROM query3
            UNION ALL
            SELECT name, amount
            FROM query4
            UNION ALL
            SELECT 'TVL' AS name, SUM(amount) AS amount
            FROM (
                SELECT amount FROM query1
                UNION ALL
            SELECT amount FROM query_wbtc
                UNION ALL
                SELECT amount FROM query2
                UNION ALL
                SELECT amount FROM query3
                UNION ALL
                SELECT amount FROM query4
                UNION ALL
                SELECT amount FROM query_teef
            UNION ALL
                SELECT amount FROM query_tia
            UNION ALL
                SELECT amount FROM query_sttia
            UNION ALL
                SELECT amount FROM query_usdt
            UNION ALL
                SELECT amount FROM query_orca
            ) AS total_amounts;
            `;
            const result = await flipside.query.run({sql: sql, ttlMinutes: 10});
            return result;
        } 
        catch (err: any) {console.error("Error executing Flipside query:", {name: err.name, message: err.message, stack: err.stack}); throw err;}
    });
