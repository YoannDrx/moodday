import type { CheckInDto, SaveCheckInInput } from "@moodday/contracts";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { api } from "./api";
import {
  createCheckInQueue,
  createChunkedStore,
  isRetryableDeliveryError,
  type KeyValueStore,
  type ReplayResult,
} from "./offline-queue-core";

const secureOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

const secureStore: KeyValueStore = {
  get: async (key) => SecureStore.getItemAsync(key, secureOptions),
  set: async (key, value) =>
    SecureStore.setItemAsync(key, value, secureOptions),
  remove: async (key) => SecureStore.deleteItemAsync(key, secureOptions),
};

const chunked = createChunkedStore(secureStore);

/** Owner-scoped key: accounts sharing a phone never see each other's queue. */
export const ownerStorageKey = async (prefix: string, ownerId: string) =>
  `${prefix}.${await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    ownerId,
  )}`;

const queueFor = async (ownerId: string) =>
  createCheckInQueue(
    chunked,
    await ownerStorageKey("moodday.offline-checkins", ownerId),
  );

export const newOperationId = () => Crypto.randomUUID();

export type CheckInDelivery =
  | { status: "saved"; checkIn: CheckInDto }
  | { status: "queued"; pending: number };

/**
 * Saves her point now, or keeps it on this device when the network is the
 * problem. Server refusals (validation, consent) are rethrown to the form.
 */
export const submitCheckIn = async (
  ownerId: string,
  input: SaveCheckInInput,
): Promise<CheckInDelivery> => {
  try {
    return { status: "saved", checkIn: await api.saveCheckIn(input) };
  } catch (error) {
    if (!isRetryableDeliveryError(error)) throw error;
    const queue = await queueFor(ownerId);
    return { status: "queued", pending: await queue.enqueue(input) };
  }
};

const replays = new Map<string, Promise<ReplayResult>>();

export const replayOfflineCheckIns = async (ownerId: string) => {
  const running = replays.get(ownerId);
  if (running) return running;
  const replay = queueFor(ownerId)
    .then(async (queue) =>
      queue.replay(async (input) => api.saveCheckIn(input)),
    )
    .finally(() => replays.delete(ownerId));
  replays.set(ownerId, replay);
  return replay;
};

export const countOfflineCheckIns = async (ownerId: string) =>
  (await queueFor(ownerId)).count();

export const clearOfflineCheckIns = async (ownerId: string) =>
  (await queueFor(ownerId)).clear();
