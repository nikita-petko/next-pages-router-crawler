import { ThumbnailTypes } from '@rbx/thumbnails';
import { www } from '@modules/miscellaneous/urls';
import type { VirtualProductMedia } from '../../virtualTransactions/constants/virtualSaleDetails';

// The parsing done in this file is similar to the parsing done
// in the virtualTransactions/constants/virtualSaleDetails.ts file.
export type RobloxSelectDetails = {
  name?: string;
  type?: string;
  place?: {
    placeId?: number;
    universeId?: number;
    name?: string;
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const asNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number') {
    return Number.isNaN(value) ? undefined : value;
  }
  if (typeof value === 'string' && value !== '') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
};

export const parseRobloxSelectDetails = (details: unknown): RobloxSelectDetails => {
  if (!isRecord(details)) {
    return {};
  }
  const placeRaw = details.place;
  const place = isRecord(placeRaw)
    ? {
        placeId: asNumber(placeRaw.placeId),
        universeId: asNumber(placeRaw.universeId),
        name: typeof placeRaw.name === 'string' ? placeRaw.name : undefined,
      }
    : undefined;

  return {
    name: typeof details.name === 'string' ? details.name : undefined,
    type: typeof details.type === 'string' ? details.type : undefined,
    place,
  };
};

// Experience game icon + link for the Type column (mirrors Virtual private-server media).
export const getRobloxSelectProductMedia = (details: RobloxSelectDetails): VirtualProductMedia => {
  const placeId = details.place?.placeId;
  const universeId = details.place?.universeId;
  const href = placeId != null ? www.getGameDetailsUrl(placeId) : undefined;

  if (universeId != null) {
    return {
      thumbnailType: ThumbnailTypes.gameIcon,
      targetId: universeId,
      href,
    };
  }
  return href ? { href } : {};
};
