<script lang="ts">
    import { onMount } from "svelte";
    import { type Icon } from "$lib/types";
    import { IconPaths } from "$lib/ui";
    export let id: Icon;
    export let path: string = "";
    export let fill: string = "current" as "current" | "success" | "base-100";
    export let stroke: string = "current" as "current" | "success" | "base-100";
    export let size = "sm" as "xs" | "sm" | "md" | "lg";
    let el: SVGElement;
    // @ts-ignore
    onMount(() => {if (path) {el.innerHTML = path; return;} const icon = IconPaths[id]; if (icon) {el.innerHTML = icon;}});
</script>
<svg bind:this={el} class="icon icon-{size} icon-fill-{fill} icon-stroke-{stroke}" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" />

