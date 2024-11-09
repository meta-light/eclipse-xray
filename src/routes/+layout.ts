import type { LayoutLoad } from "./$types";
import { browser } from "$app/environment";
import { QueryClient } from "@tanstack/svelte-query";
import '../lib/client-init.js';

export const ssr = false;
export const csr = true;

export const load: LayoutLoad = async () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                enabled: browser,
            },
        },
    });
    return { queryClient };
};
