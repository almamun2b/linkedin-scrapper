import type { BrowserContext } from "playwright";
import { sealSecret, unsealSecret } from "@/server/crypto/secretBox";

type StorageState = Awaited<ReturnType<BrowserContext["storageState"]>>;

export interface SealedState {
  sealed: Uint8Array<ArrayBuffer>;
  keyVer: number;
}

export async function sealStorageState(context: BrowserContext): Promise<SealedState> {
  const state = await context.storageState();
  return sealSecret(JSON.stringify(state));
}

export function unsealStorageState(sealed: Uint8Array, keyVer: number): StorageState {
  return JSON.parse(unsealSecret(sealed, keyVer)) as StorageState;
}
