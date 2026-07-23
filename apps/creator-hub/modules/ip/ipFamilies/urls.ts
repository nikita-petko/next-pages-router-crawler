import { resolveUrl } from '@rbx/env-utils';

export const IP_FAMILIES_HREF = '/dashboard/ip/ip-library';
export const IP_FAMILY_CREATE_HREF = '/dashboard/ip/ip-library/create';
export const IP_FAMILY_DETAILS_HREF = (id: string) => `/dashboard/ip/ip-library/${id}`;
export const IP_CONTENTS_CREATE_HREF = (id: string) => `/dashboard/ip/ip-library/${id}/add-ip`;
export const IP_FAMILY_EDIT_HREF = (id: string) => `/dashboard/ip/ip-library/${id}/edit`;

export const ROBLOX_CUBE_ANNOUNCEMENT_HREF = resolveUrl(
  'robloxCubeAnnouncementUrl',
  process.env.targetEnvironment,
  process.env.buildTarget,
);
