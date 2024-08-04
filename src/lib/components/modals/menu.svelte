<script>
    import Network from "../network.svelte";
</script>

{#each [{ name: "Home", url: "/" }, { name: "About Eclipse", url: "https://www.eclipse.xyz/" }, { name: "Eclipse Github", url: "https://github.com/Eclipse-Laboratories-Inc" }, { name: "Join Discord", url: "https://discord.gg/QzNrgtR2" }] as { name, url }}
    <a href={url} data-sveltekit-reload class="btn-ghost btn w-full">{name}</a>
{/each}
<Network />
