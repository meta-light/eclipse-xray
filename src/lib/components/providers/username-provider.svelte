<script lang="ts">
    import { page } from "$app/stores";
    import { trpcWithQuery } from "$lib/trpc/client";

    export let address: string;

    const client = trpcWithQuery($page);

    // Remove the accountUsernames query
    // Instead, you might want to use a placeholder or alternative way to display usernames
    let username = address; // Use the address as a fallback

    // You can add any alternative logic here to fetch or display usernames if needed
</script>

<slot {username} />