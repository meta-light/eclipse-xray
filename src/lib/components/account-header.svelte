<style>
    .username-block {
        opacity: 90%;
    }

    .username-block:nth-child(3n + 2) {
        background-color: #dbeafe;
        color: #2563eb;
    }

    .username-block:nth-child(3n + 1) {
        background-color: #fef08a;
        color: #ca8a04;
    }

    .username-block:nth-child(3n + 3) {
        background-color: #bbf7d0;
        color: #16a34a;
    }
</style>

<script lang="ts">
    import { page } from "$app/stores";
    import { trpcWithQuery } from "$lib/trpc/client";
    import { onMount } from "svelte";
    import { tweened } from "svelte/motion";
    import { formatMoney } from "$lib/utils";
    import CopyButton from "$lib/components/copy-button.svelte";
    import Username from "$lib/components/providers/username-provider.svelte";
    import ShortenAddress from "./shorten-address.svelte";
    import { publicKeyMappings } from "$lib/config";

    const client = trpcWithQuery($page);
    export let account: string = "";
    export let link: string = "";
    const params = new URLSearchParams(window.location.search);
    const network = params.get("network");
    let isMainnetValue = network !== "devnet";
    const accountInfo = client.accountInfo.createQuery([account, isMainnetValue ? "mainnet" : "devnet", ]);
    const balance = tweened(0, {duration: 1000});
    let animate = false;
    let programName: string | null = null;
    let programRepo: string | null = null;

    const programsQuery = client.programs.createQuery();

    onMount(async () => {
        if (account in publicKeyMappings && typeof account === 'string') {
            programName = publicKeyMappings[account as keyof typeof publicKeyMappings];
        };
        animate = true;
    });

    $: if ($programsQuery.data && !programName) {
        const matchingProgram = $programsQuery.data.find(program => program.program_address === account);
        if (matchingProgram) {
            programName = matchingProgram.name;
            programRepo = matchingProgram.repo;
        }
    }

    $: if ($accountInfo?.data?.balance) {balance.set($accountInfo.data.balance);}

    function toggleNetwork() {
        isMainnetValue = !isMainnetValue;
        localStorage.setItem("isMainnet", JSON.stringify(isMainnetValue));
        const params = new URLSearchParams(window.location.search);
        params.set("network", isMainnetValue ? "mainnet" : "devnet");
        history.replaceState({}, "", "?" + params.toString());
        history.go(0);
    }

    let ethUsdPrice: number | null = null;
    const pythPriceQuery = client.pythPrice.createQuery();

    $: if ($pythPriceQuery.data !== undefined) {
        ethUsdPrice = $pythPriceQuery.data;
    }

    $: worth = $balance * (ethUsdPrice ?? 0);

    let localIsLoading = true;

    onMount(() => {
        setTimeout(() => {
            localIsLoading = false;
        }, 5000);
    });
</script>

<Username address={account} let:username let:isLoading>
    <div class="nav sticky top-16 z-30 gap-2 bg-base-100 px-3 pt-2">
        <div class="flex flex-col bg-base-100">
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <h3 class="relative m-0 text-lg font-bold md:text-2xl">
                        <ShortenAddress address={account} />
                    </h3>
                    <!-- Add program name with repo link if available -->
                    {#if programName}
                        <span class="ml-2 text-sm font-normal opacity-70">
                            {#if programRepo}
                                (<a href={programRepo} target="_blank" rel="noopener noreferrer" class="hover:underline">{programName}</a>)
                            {:else}
                                ({programName})
                            {/if}
                        </span>
                    {/if}
                    <div class="relative flex items-center">
                        <div class="my-2">
                            <CopyButton text={account} />
                            <CopyButton text={link} icon="link" />
                        </div>
                    </div>
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <div class="badge-outline badge relative mx-2 flex cursor-default px-4 py-2 opacity-90" on:click={toggleNetwork}>
                        {isMainnetValue ? "mainnet" : "devnet"}
                    </div>
                </div>
                <div class="relative text-right">
                    <h1 class="text-md md:block">
                        <span class="">{$balance.toFixed(6)}</span>
                        <span class="opacity-50">ETH</span>
                    </h1>

                    {#if ethUsdPrice !== null}
                        <span class="ml-1 text-xs opacity-50 md:block">{formatMoney(worth)} USD</span>
                    {:else}
                        <div class="pulse my-2 h-2 w-20 rounded-lg bg-secondary" />
                    {/if}
                </div>
            </div>
            {#if localIsLoading && isLoading}
                <div class="flex flex-wrap gap-2 pt-2">
                    {#each [1, 2, 3] as _}
                        <div class="username-block inline-block h-6 w-[72px] animate-pulse rounded-full px-3 py-1 text-xs font-extrabold" />
                    {/each}
                </div>
            {:else}
                <div class="flex flex-wrap gap-2 pt-2">
                    {#if username}
                        <div class="username-block inline-block rounded-full px-3 py-1 text-xs font-extrabold">
                            {username}
                        </div>
                    {/if}
                </div>
            {/if}
        </div>
    </div>
</Username>
