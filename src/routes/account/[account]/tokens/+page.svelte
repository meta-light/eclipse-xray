<script lang="ts">
    import { page } from "$app/stores";
    import { onMount } from "svelte";
    import { getRPCUrl } from "$lib/util/get-rpc-url";
    import { Connection, PublicKey } from "@solana/web3.js";
    import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, AccountLayout } from "@solana/spl-token";
    import TokenProvider from "$lib/components/providers/token-provider.svelte";
    const ETH = 'So11111111111111111111111111111111111111112';
    const account = $page.params.account;
    let tokens: any[] = [];
    let nativeBalance: number | null = null;
    let fetchError: string | null = null;
    let isLoading = true;
    const isMainnetValue = $page.url.searchParams.get("network") !== "devnet";

    async function fetchAccountData() {
        isLoading = true;
        const rpcUrl = getRPCUrl(isMainnetValue ? "mainnet" : "devnet");
        const connection = new Connection(rpcUrl, "confirmed");
        const pubkey = new PublicKey(account);
        try {
            const [balance, splTokenAccounts, token2022Accounts] = await Promise.all([
                connection.getBalance(pubkey),
                connection.getTokenAccountsByOwner(pubkey, { programId: TOKEN_PROGRAM_ID }),
                connection.getTokenAccountsByOwner(pubkey, { programId: TOKEN_2022_PROGRAM_ID }),
            ]);
            nativeBalance = balance / 1e9;
            const allTokenAccounts = [...splTokenAccounts.value, ...token2022Accounts.value];
            tokens = await Promise.all(allTokenAccounts.map(async (ta) => {
                const data = new Uint8Array(ta.account.data);
                const accountInfo = AccountLayout.decode(data);
                const mintPubkey = new PublicKey(accountInfo.mint);                
                return {
                    mint: mintPubkey.toString(),
                    tokenAccount: ta.pubkey.toString(),
                    balance: Number(accountInfo.amount),
                    isToken2022: ta.account.owner.equals(TOKEN_2022_PROGRAM_ID),
                };
            }));
            tokens.unshift({
                mint: ETH,
                tokenAccount: account,
                balance: nativeBalance * 1e9,
                isToken2022: false,
            });

        } catch (error) {
            console.error("Error fetching account data:", error);
            fetchError = error instanceof Error ? error.message : String(error);
        } finally {
            isLoading = false;
        }
    }

    onMount(fetchAccountData);
</script>

<div class="container mx-auto px-4">
    <h2 class="text-2xl font-bold mb-4">Account Tokens</h2>
    {#if isLoading}
        <p>Loading...</p>
    {:else if fetchError}
        <p class="text-red-500">Error loading tokens: {fetchError}</p>
    {:else if tokens.length === 0}
        <p>No tokens found for this account.</p>
    {:else}
        <div class="space-y-4">
            {#each tokens as token}
                <TokenProvider address={token.mint}>
                    <div slot="default" let:metadata let:tokenIsLoading let:tokenFailed let:isNFT let:token={tokenData}>
                        {#if token.mint === ETH}
                            <div class="bg-white shadow rounded-lg p-4 flex items-center justify-between">
                                <div class="flex items-center space-x-4">
                                    {#if metadata.image}
                                        <img src={metadata.image} alt={metadata.name} class="w-10 h-10 rounded-full">
                                    {:else}
                                        <div class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                            <span class="text-gray-500 text-xs">{metadata.name.substring(0, 2).toUpperCase()}</span>
                                        </div>
                                    {/if}
                                    <div>
                                        <h3 class="font-semibold">{metadata.name || "Unknown Token"}</h3>
                                        <p class="text-sm text-gray-500">{token.mint}</p>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <p class="font-bold">{(token.balance / Math.pow(10, tokenData?.decimals || 9)).toFixed(tokenData?.decimals || 9)}</p>
                                    <p class="text-sm text-gray-500">Decimals: {tokenData?.decimals || 'Unknown'}</p>
                                    {#if token.isToken2022}
                                        <span class="text-xs text-blue-500">Token-2022</span>
                                    {/if}
                                </div>
                            </div>
                        {:else if !isNFT}
                            <a href="/token/{token.mint}?network={isMainnetValue ? 'mainnet' : 'devnet'}">
                                <div class="bg-white shadow rounded-lg p-4 flex items-center justify-between">
                                    <div class="flex items-center space-x-4">
                                        {#if metadata.image}
                                            <img src={metadata.image} alt={metadata.name} class="w-10 h-10 rounded-full">
                                        {:else}
                                            <div class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                                <span class="text-gray-500 text-xs">{metadata.name.substring(0, 2).toUpperCase()}</span>
                                            </div>
                                        {/if}
                                        <div>
                                            <h3 class="font-semibold">{metadata.name || "Unknown Token"}</h3>
                                            <p class="text-sm text-gray-500">{token.mint}</p>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <p class="font-bold">{(token.balance / Math.pow(10, tokenData?.decimals || 9)).toFixed(tokenData?.decimals || 9)}</p>
                                        <p class="text-sm text-gray-500">Decimals: {tokenData?.decimals || 'Unknown'}</p>
                                        {#if token.isToken2022}
                                            <span class="text-xs text-blue-500">Token-2022</span>
                                        {/if}
                                    </div>
                                </div>
                            </a>
                        {/if}
                    </div>
                </TokenProvider>
            {/each}
        </div>
    {/if}
</div>
