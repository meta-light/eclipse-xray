<style>
    .intro {
        min-height: 65vh;
    }
</style>

<script lang="ts">
    import { onMount } from "svelte";
    import { fly } from "svelte/transition";
    import Icon from "$lib/components/icon.svelte";
    import Search from "$lib/components/search.svelte";
    import IntersectionObserver from "svelte-intersection-observer";
    let searchError = "";
    let exploreELement: HTMLElement;
    let isFocused = false;
    let clearSearch = () => null;
    let focusInput = () => null;
    onMount(() => {setTimeout(() => {focusInput();}, 100);});
</script>

<div class="intro relative flex h-screen w-full items-center">
    <div style="background-image: url(/media/gradient.png);" class="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 bg-cover bg-center" />
    <div class="mx-auto w-full max-w-2xl md:-translate-y-1/4">
        <div class="mb-10">
            <h1 class="text-center text-9xl font-bold text-transparent bg-clip-text bg-black">ECLIPSE XRAY</h1>
        </div>
        <div class="relative w-full px-3">
            <Search size="lg" {searchError} bind:focusInput bind:clearSearch on:focusin={() => (isFocused = true)} on:focusout={() => (isFocused = false)} />
        </div>
    </div>
</div>

<IntersectionObserver once={true} rootMargin="100px" element={exploreELement}>
    <section class="mx-auto mb-20 max-w-6xl py-10">
        <div class="flex justify-center px-5">
            <div class="flex items-center space-x-4 rounded-lg">
                <div class="flex h-12 w-12 items-center justify-center rounded-full border">
                    <Icon id="lightning" size="lg"/>
                </div>
                <div>
                    <h1 class="text-xl font-bold">Eclipse Blockchain Explorer</h1>
                    <p class="text-black max-w-lg">Search transactions, accounts, and more across the Eclipse Blockchain. Both Mainnet and Devnet are enabled. Run it back Turbo.</p>
                </div>
                <img src="/media/explorer.png" alt="Eclipse Blockchain Explorer" class="h-12 w-12 rounded-full border" />
            </div>
        </div>
    </section>
</IntersectionObserver>