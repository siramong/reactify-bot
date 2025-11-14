import { Attachment } from 'discord.js';

// Simple in-memory store for attachments provided via command options
// Keyed by userId. Not persistent across restarts — acceptable for passing
// data from the command invocation to the modal submit handler.

const map = new Map<string, Attachment>();

export function set(userId: string, attachment: Attachment): void {
  map.set(String(userId), attachment);
}

export function getAndDelete(userId: string): Attachment | null {
  const key = String(userId);
  const val = map.get(key) || null;
  map.delete(key);
  return val;
}

// Exposed for tests/debugging
export function _peek(userId: string): Attachment | undefined {
  return map.get(String(userId));
}
