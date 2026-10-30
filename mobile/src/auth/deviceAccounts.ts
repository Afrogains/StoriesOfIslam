import AsyncStorage from '@react-native-async-storage/async-storage';
import { pbkdf2Async } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha2';
import { bytesToHex } from '@noble/hashes/utils';
import { getRandomBytes, randomUUID } from 'expo-crypto';

const ACCOUNTS_KEY = 'stories.deviceAccounts.v1';
const ITERATIONS = 20_000;

export type DeviceAccount = {
  id: string;
  name: string;
  email: string;
  salt: string;
  hash: string;
  iterations: number;
  createdAt: string;
};

async function readAccounts(): Promise<DeviceAccount[]> {
  const raw = await AsyncStorage.getItem(ACCOUNTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as DeviceAccount[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAccounts(accounts: DeviceAccount[]): Promise<void> {
  await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

async function derive(password: string, salt: string, iterations: number): Promise<string> {
  const key = await pbkdf2Async(sha256, password.normalize('NFKC'), salt, { c: iterations, dkLen: 32, asyncTick: 20 });
  return bytesToHex(key);
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return diff === 0;
}

export async function findDeviceAccount(email: string): Promise<DeviceAccount | null> {
  return (await readAccounts()).find((account) => account.email === email) ?? null;
}

export async function createDeviceAccount(input: {
  name: string;
  email: string;
  password: string;
}): Promise<DeviceAccount> {
  const accounts = await readAccounts();
  if (accounts.some((account) => account.email === input.email)) {
    throw new Error('An account with this email already exists on this device. Sign in instead.');
  }
  const salt = bytesToHex(getRandomBytes(16));
  const account: DeviceAccount = {
    id: randomUUID(),
    name: input.name,
    email: input.email,
    salt,
    hash: await derive(input.password, salt, ITERATIONS),
    iterations: ITERATIONS,
    createdAt: new Date().toISOString(),
  };
  await writeAccounts([...accounts, account]);
  return account;
}

export async function verifyDeviceAccount(email: string, password: string): Promise<DeviceAccount | null> {
  const account = await findDeviceAccount(email);
  if (!account) return null;
  const hash = await derive(password, account.salt, account.iterations);
  return constantTimeEqual(hash, account.hash) ? account : null;
}

export async function removeDeviceAccount(email: string): Promise<void> {
  const accounts = await readAccounts();
  await writeAccounts(accounts.filter((account) => account.email !== email));
}
