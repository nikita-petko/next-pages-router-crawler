import type { UniversePlaySession } from '@modules/clients/analytics/universeSessionMetadataApi';
import { formatOperatingSystem, formatPlatform } from './formatMissingValue';

const MEGABYTES_PER_GIGABYTE = 1024;

// TODO(@yukihe): map the OS and platform enums onto the RAQIV2 device/OS dimension and render
// them through its dimension renderer, so Client Sessions matches the wording used across the
// rest of analytics and the hardcoded "GB" unit is replaced by Label.GigabytesSuffix.
export const formatDeviceLabel = (
  session: UniversePlaySession,
  decimalFormatter: Intl.NumberFormat,
  missingPlaceholder: string,
): string => {
  if (session.clientDeviceRamMegabytes == null) {
    return missingPlaceholder;
  }

  const deviceMemoryGB = decimalFormatter.format(
    session.clientDeviceRamMegabytes / MEGABYTES_PER_GIGABYTE,
  );
  return `${formatOperatingSystem(session.os, missingPlaceholder)} · ${formatPlatform(session.platform, missingPlaceholder)} · ${deviceMemoryGB}GB`;
};
