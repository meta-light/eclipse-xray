<style>
    .input {background: rgba(0, 0, 0, 0.95);}
</style>

<script lang="ts">
    import { onMount, createEventDispatcher } from "svelte";
    import { walletStore } from "@svelte-on-solana/wallet-adapter-core";
    import { showModal } from "$lib/modals";
    import Icon from "$lib/components/icon.svelte";
    import { recentSearchesKey } from "$lib/config";
    import { shortenString } from "$lib/utils";
    import type { SearchResult } from "$lib/types";
    export let inputEl: HTMLInputElement | null = null;
    export let searchError = "";
    export let size = "sm" as "sm" | "lg";
    export let focusInput = () => {};
    export let clearSearch = () => {};
    let inputValue: string = "";
    let isSearching = false;
    let connected = false;
    let isBackpack = false;
    let recent = [] as SearchResult[];
    const dispatch = createEventDispatcher();
    const searchFailed = () => {isSearching = false; showModal("HELP");};
    const getRecentSearches = () => JSON.parse(localStorage.getItem(recentSearchesKey) || "[]") as SearchResult[];
    const addRecent = (value: SearchResult) => {
        if (!value.search) {return;}
        const stored = getRecentSearches();
        const exists = stored.find(({ url }) => {return url === value.url;});
        if (exists) {return;}
        localStorage.setItem(recentSearchesKey, JSON.stringify([value, ...getRecentSearches()].slice(0, 3)));
    };

    const clearRecents = () => {window.localStorage.setItem(recentSearchesKey, JSON.stringify([])); recent = []; clearSearch();};
    const loadSearch = ({ url }: SearchResult) => (window.location.href = `${url}?network=${isMainnetValue ? "mainnet" : "devnet"}` || `/`);
    const selectSearch = (data: SearchResult) => {addRecent(data); loadSearch(data);};
    const newSearch = async () => {
        searchError = "";
        if (!inputValue.trim()) {showModal("HELP"); return;}
        isSearching = true;
        try {const response = await fetch(`/api/search/${inputValue}?network=${isMainnetValue ? "mainnet" : "devnet"}`); const data = await response.json(); if (!data.valid) {searchFailed(); return;} selectSearch(data);} 
        catch (error) {searchFailed();}
    };
    let isMainnetValue = true;
    let placeholder = "Search";
    onMount(() => {
        const params = new URLSearchParams(window.location.search);
        const network = params.get("network");
        if (network !== null) {isMainnetValue = network === "mainnet";}
        recent = getRecentSearches();
        isBackpack = window?.localStorage?.getItem("walletAdapter") === '"Backpack"';
        updatePlaceholder();
    });
    function updatePlaceholder() {placeholder = size === "lg" ? "Input an Eclipse address or transaction signature..." : "Search";}
    $: if (size) {updatePlaceholder();}
    $: if ($walletStore.connected && !connected) {
        focusInput();
        const params = new URLSearchParams(window.location.search);
        const network = params.get("network");
        isMainnetValue = network !== "devnet";
        inputValue = $walletStore.publicKey?.toBase58() || "";
        addRecent({address: inputValue, search: inputValue, type: "account", url: `/account/${inputValue}?network=${isMainnetValue ? "mainnet" : "devnet"}`, valid: true});
        window.location.href = `/account/${inputValue}`;
        connected = true;
    }
</script>
<div class="relative z-30 my-2 w-full">
    <div class="dropdown w-full">
        <input
            bind:this={inputEl}
            class="input-bordered input h-10 w-full rounded-lg focus:input-primary text-white"
            class:h-14={size === "lg"}
            {placeholder}
            tabindex="0"
            type="text"
            on:focusin={() => dispatch("focusin")}
            on:focusout={() => dispatch("focusout")}
            on:keydown={(e) => {if (e.key === "Enter") {newSearch();}}}
            bind:value={inputValue}
        />
        {#if recent.length > 0 && size !== "sm"}
            <ul class="dropdown-content relative my-3 w-full rounded-lg border bg-base-100 p-2 px-4 shadow">
                <div class="flex flex-wrap items-center justify-between">
                    <p class="text-md mb-1 mt-2">Recents</p>
                    <button class="btn-xs btn border-none bg-transparent" on:click={clearRecents}>
                        <span class="my-1">Clear all</span>
                    </button>
                </div>
                {#if recent.length}
                    {#each recent as recentSearch}
                        {#if recentSearch}
                            <li class="m1-ds2 relative z-30 w-full truncate px-0 hover:opacity-60">
                                <a class="block w-full max-w-full text-ellipsis rounded-lg px-1 py-2 text-left hover:bg-secondary" data-sveltekit-reload href={`${recentSearch.url}?network=${isMainnetValue ? "mainnet" : "devnet"}`}>
                                    <div class="flex">
                                        <div>
                                            <p class="text-micro text-xs opacity-50">{shortenString(recentSearch?.address)}</p>
                                            <p class="text-micro text-xs">{recentSearch?.search}</p>
                                        </div>
                                    </div>
                                </a>
                            </li>
                        {/if}
                    {/each}
                {:else}<i class="pt-2 text-xs opacity-50">Paste an address to get started.</i>{/if}
            </ul>
        {/if}
    </div>
    <button class="btn-ghost btn-sm btn absolute bottom-1/2 right-4 translate-y-1/2 px-2 text-white" class:loading={isSearching} on:click={newSearch}>{#if !isSearching}<Icon id="search"/>{/if}</button>
</div>
{#if size === "lg"}<div class="relative z-10 py-2"><button class="bg-faint btn-outline btn col-span-1 mb-4 w-full" on:click|preventDefault={newSearch}><span class="text-sm text-white">Explore</span></button></div>{/if}