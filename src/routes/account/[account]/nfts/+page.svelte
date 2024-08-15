<script lang="ts">
    import { page } from "$app/stores";
    import { onMount } from 'svelte';
    import { getRPCUrl } from "$lib/util/get-rpc-url";
    const { account } = $page.params;
    const params = new URLSearchParams(window.location.search);
    const network = params.get("network");
    const isMainnetValue = network !== "devnet";
    let nfts: any[] = [];
    let fetchError: string | null = null;
    interface Token { isNFT: boolean; mint: string; tokenAccount: string; amount: number; decimals: number;}

    async function fetchAccountData() {
        const rpcUrl = getRPCUrl(isMainnetValue ? "mainnet" : "devnet");
        const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'getProgramAccounts',
                params: [
                    account,
                    {
                        encoding: "jsonParsed",
                        filters: [
                            {
                                dataSize: 165
                            }
                        ]
                    }
                ]
            })
        });

        if (!response.ok) {throw new Error(`HTTP error! status: ${response.status}`);}
        const result = await response.json();
        console.log("Account data fetched:", result);
        return result.result || [];
    }

    onMount(async () => {
        try {
            const accountData = await fetchAccountData();
            const allTokens = accountData.map((item: any) => {
                const parsedData = item.account.data.parsed.info;
                return {
                    mint: parsedData.mint,
                    tokenAccount: item.pubkey,
                    amount: parsedData.tokenAmount.uiAmount,
                    decimals: parsedData.tokenAmount.decimals,
                    isNFT: parsedData.tokenAmount.decimals === 0 && parsedData.tokenAmount.uiAmount === 1
                };
            });
            nfts = allTokens.filter((token: Token) => token.isNFT);
        } catch (error) {
            console.error("Error fetching account data:", error);
            fetchError = error instanceof Error ? error.message : String(error);
        }
    });
</script>

<div class="content grid grid-cols-4 gap-3">
    {#if fetchError}
        <p class="col-span-4 text-red-500">Error loading NFTs: {fetchError}</p>
    {:else if nfts.length === 0}
        <p class="col-span-4">Loading NFTs...</p>
    {:else}
        {#each nfts as nft}
            <div class="aspect-square w-full">
                <a href="/token/{nft.mint}?network={isMainnetValue ? 'mainnet' : 'devnet'}" class="block">
                    <div class="aspect-square w-full rounded-lg bg-gray-200 flex items-center justify-center">
                        <span class="text-sm text-gray-500">NFT: {nft.mint.slice(0, 4)}...{nft.mint.slice(-4)}</span>
                    </div>
                </a>
            </div>
        {/each}
    {/if}
</div>