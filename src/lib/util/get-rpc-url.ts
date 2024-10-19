const MAINNET_URLS = [
    "https://mainnetbeta-rpc.eclipse.xyz/",
    "https://eclipse.lgns.net/",
    "https://eclipse.helius-rpc.com/"
];

const DEVNET_URLS = [
    "https://staging-rpc.dev2.eclipsenetwork.xyz/",
];

export function getRPCUrl(network: "mainnet" | "devnet", index: number = 0): string {
    const urls = network === "mainnet" ? MAINNET_URLS : DEVNET_URLS;
    return urls[index % urls.length];
}

export function getFallbackRPCUrl(network: "mainnet" | "devnet", currentIndex: number): string {
    const urls = network === "mainnet" ? MAINNET_URLS : DEVNET_URLS;
    return urls[(currentIndex + 1) % urls.length];
}

export function getAllRPCUrls(network: "mainnet" | "devnet"): string[] {
    return network === "mainnet" ? MAINNET_URLS : DEVNET_URLS;
}

export function getNetworkString(isMainnet: boolean): "mainnet" | "devnet" {
  return isMainnet ? "mainnet" : "devnet";
}
