import type { UITokenMetadata, UINiftyAsset, Modal, Modals } from "$lib/types";
import { writable } from "svelte/store";
import { modals } from "$lib/config";
import type { Idl } from "@coral-xyz/anchor";

export const metadataStore = writable<UITokenMetadata | null>(null);
export const modalsStore = writable<Modal | undefined>();
export const showModal = (id: Modals) => modalsStore.set(modals[id]);
export const hideModal = () => modalsStore.set(undefined);
export const isMainnet = writable(true);
export const niftyAssetStore = writable<UINiftyAsset | null>(null);
export const idlStore = writable<Idl | null>(null);
export const filterStore = writable<string>("");