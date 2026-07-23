type ParseGroupUrlResult =
  | { ok: true; groupId: number }
  | { ok: false; groupId: 0; reason: 'empty' | 'invalid' };

const ROBLOX_GROUP_URL = /^https?:\/\/(www\.)?roblox\.com\/(communities|groups)\/(\d+)(\/|$)/i;

export function parseGroupUrl(input: string): ParseGroupUrlResult {
  const trimmed = input.trim();
  if (trimmed === '') {
    return { ok: false, groupId: 0, reason: 'empty' };
  }

  if (/^\d+$/.test(trimmed)) {
    return { ok: true, groupId: Number(trimmed) };
  }

  const match = ROBLOX_GROUP_URL.exec(trimmed);
  if (match) {
    return { ok: true, groupId: Number(match[3]) };
  }

  return { ok: false, groupId: 0, reason: 'invalid' };
}
