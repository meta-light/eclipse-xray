const PRIVATE_RPC_URL = process.env.PRIVATE_RPC_URL;

const MAINNET_URLS = [
    ...(PRIVATE_RPC_URL ? [PRIVATE_RPC_URL] : []),
    "https://eclipse.helius-rpc.com/",
    "https://mainnetbeta-rpc.eclipse.xyz/",
    "https://eclipse.lgns.net/"
].filter(Boolean);

const DEVNET_URLS = [
    ...(PRIVATE_RPC_URL ? [PRIVATE_RPC_URL] : []),
    "https://staging-rpc.dev2.eclipsenetwork.xyz/",
    "https://staging-rpc-eu.dev2.eclipsenetwork.xyz/"
].filter(Boolean);

const TESTNET_URLS = [
    ...(PRIVATE_RPC_URL ? [PRIVATE_RPC_URL] : []),
    "https://testnet.dev2.eclipsenetwork.xyz/",
].filter(Boolean);

export function getRPCUrl(network: "mainnet" | "devnet" | "testnet", index: number = 0): string {
    const urls = network === "mainnet" ? MAINNET_URLS : DEVNET_URLS;
    return urls[index % urls.length];
}

export function getFallbackRPCUrl(network: "mainnet" | "devnet" | "testnet", currentIndex: number): string {
    const urls = network === "mainnet" ? MAINNET_URLS : DEVNET_URLS;
    return urls[(currentIndex + 1) % urls.length];
}

export function getAllRPCUrls(network: "mainnet" | "devnet" | "testnet"): string[] {
    return network === "mainnet" ? MAINNET_URLS : DEVNET_URLS;
}

export function getNetworkString(isMainnet: boolean): "mainnet" | "devnet" | "testnet" {
  return isMainnet ? "mainnet" : "devnet";
}
