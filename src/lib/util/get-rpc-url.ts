export function getRPCUrl(network: "mainnet" | "devnet") {
    return network === "mainnet"
        ? "https://mainnetbeta-rpc.eclipse.xyz"
        : "https://staging-rpc.dev2.eclipsenetwork.xyz/";
}

export function getFallbackRPCUrl(network: "mainnet" | "devnet") {
    return network === "mainnet"
        ? "https://mainnet-rpc.eclipsenetwork.xyz"
        : "https://devnet-rpc.eclipsenetwork.xyz";
}

export function getNetworkString(isMainnet: boolean): "mainnet" | "devnet" {
  return isMainnet ? "mainnet" : "devnet";
}