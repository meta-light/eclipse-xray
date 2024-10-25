import { grabIdl } from "$lib/utils";

export async function GET({ url }) {
    const account = url.searchParams.get("account");
    const isMainnetValue = url.searchParams.get("isMainnetValue");
    if (!account) {return new Response(JSON.stringify({error: "Account parameter not set", success: false}), {headers: { "Content-Type": "application/json" }, status: 400});}
    try {
        const idl = await grabIdl(account, isMainnetValue === "true");
        if (idl) {return new Response(JSON.stringify({ idl }), {headers: { "Content-Type": "application/json" },});} 
        else {return new Response(JSON.stringify({error: "IDL not found", success: false}),{headers: { "Content-Type": "application/json" }, status: 404});}
    } 
    catch (err: unknown) {
        console.error("Error fetching IDL:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch IDL";
        return new Response(JSON.stringify({error: errorMessage, success: false}), {headers: { "Content-Type": "application/json" }, status: 500});
    }
}