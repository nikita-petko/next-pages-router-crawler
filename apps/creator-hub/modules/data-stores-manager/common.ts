import { UniversesApi } from '@rbx/client-organizations-service-api/v1';
import { Locale } from '@rbx/intl';
import type { V2CloudProtos } from '@rbx/open-cloud';
import { google } from '@rbx/open-cloud/dist/v2/protos/protos';
import { createClientConfiguration } from '@modules/clients/utils/createClientConfiguration';

export const PERMISSION_DENIED_ERROR_CODE = 16;

export const MAX_PAGE_SIZE = 10;

const orgApiConfiguration = createClientConfiguration('orgs', 'bedev2');

const universesApi = new UniversesApi(orgApiConfiguration);

export function createTimestamp(seconds: number, nanos: number): google.protobuf.ITimestamp {
  const timestamp = new google.protobuf.Timestamp();
  timestamp.seconds = seconds;
  timestamp.nanos = nanos;
  return timestamp;
}

export function createTimestampFromDate(date: Date | undefined): google.protobuf.ITimestamp {
  if (date === undefined) {
    return new google.protobuf.Timestamp();
  }

  return new google.protobuf.Timestamp({
    seconds: Math.floor(date.getTime() / 1000),
    nanos: (date.getTime() % 1000) * 1e6,
  });
}

export function parseEntryIdAndScopeFromObjectKey(id: string): { scope: string; entryId: string } {
  const index = id.indexOf('/');
  if (index === -1) {
    return { scope: '', entryId: id };
  }

  const scope = id.slice(0, index);
  const entryId = id.slice(index + 1);
  return { scope, entryId };
}

export function formatBytes(bytes: string) {
  if (bytes === '--') {
    return '--';
  }

  const byteValue = parseInt(bytes, 10);
  if (byteValue === 0) {
    return '0 Bytes';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const sizes = [1, k, k ** 2, k ** 3, k ** 4];

  let i = sizes.length - 1;
  while (i > 0 && byteValue < sizes[i]) {
    i -= 1;
  }

  const value = byteValue / sizes[i];
  const formattedValue = parseFloat(value.toPrecision(3));

  return `${formattedValue} ${units[i]}`;
}

export const extractValues = (data: google.protobuf.IValue | null | undefined): unknown => {
  if (!data || data === null) {
    return '';
  }
  if (data.structValue) {
    const result: { [key: string]: unknown } = {};
    Object.entries(data.structValue.fields ?? {}).forEach(([key, value]) => {
      result[key] = extractValues(value);
    });
    return result;
  }
  if (data.stringValue !== undefined) {
    return data.stringValue;
  }
  if (data.numberValue !== undefined) {
    return data.numberValue;
  }
  if (data.boolValue !== undefined) {
    return data.boolValue;
  }
  if (
    data.listValue !== undefined &&
    data.listValue !== null &&
    data.listValue.values !== undefined
  ) {
    return data.listValue.values?.map((item: google.protobuf.IValue) => extractValues(item)) ?? [];
  }
  return data;
};

export function formatNumberToKMB(numberStr: string): string {
  if (numberStr === '--') {
    return '--';
  }

  const number = parseInt(numberStr, 10);

  if (number < 1000) {
    return number.toString(); // Return the number as is if it's less than 1000
  }

  const units = ['K', 'M', 'B']; // Thousand, Million, Billion
  const divisors = [1_000, 1_000_000, 1_000_000_000]; // Corresponding divisors

  let i = 0;
  while (i < divisors.length - 1 && number >= divisors[i + 1]) {
    i += 1;
  }

  const value = number / divisors[i];
  const roundedValue = Math.round(value);

  return `${roundedValue}${units[i]}`;
}

export const extractStructValues = (data: google.protobuf.IStruct | null | undefined): unknown => {
  const result: { [key: string]: unknown } = {};
  if (!data || data === null) {
    return result;
  }
  Object.entries(data.fields ?? {}).forEach(([key, value]) => {
    result[key] = extractValues(value); // Recursively extract the values of fields
  });
  return result;
};

export const formatDate = (
  date: Date,
  locale: Locale,
  offsetDays: number | undefined = 0,
): string => {
  if (offsetDays) {
    date.setDate(date.getDate() + offsetDays);
  }

  return date.toLocaleString(locale ?? Locale.English, {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatTimestamp = (
  timestamp: google.protobuf.ITimestamp,
  locale: Locale,
  offsetDays: number | undefined = 0,
): string => {
  const date = new Date(Number(timestamp.seconds) * 1000);
  return formatDate(date, locale, offsetDays);
};

export const parseEntryPathForRevision = (path: string) => {
  const regex = /universes\/(\d+)\/data-stores\/([^/]+)\/scopes\/[^/]+\/entries\/([^/]+)/;
  const match = path.match(regex);
  if (match) {
    const universeId = parseInt(match[1], 10);
    const dataStoreName = match[2];
    return { universeId, dataStoreName };
  }
  return null;
};

export function parseValueAndMetadataForDiff(data: V2CloudProtos.IDataStoreEntry): {
  value: string;
  metadata: string;
} {
  const restOfEntry = extractValues(data.value);

  const entryValue = (() => {
    try {
      return typeof restOfEntry === 'string'
        ? JSON.stringify(JSON.parse(restOfEntry), null, 2) // Parse and re-stringify if it's a string
        : JSON.stringify(restOfEntry, null, 2); // Indent if it's an object
    } catch {
      return typeof restOfEntry === 'string' ? restOfEntry : String(restOfEntry); // Fallback to raw value
    }
  })();

  const metadataValue = JSON.stringify(
    {
      attributes: extractStructValues(data.attributes),
      users: data.users,
    },
    null,
    2,
  );

  return { value: entryValue, metadata: metadataValue };
}

export async function doesUserHaveDeleteDataStoreEntryPermission(
  universeId: number,
): Promise<boolean> {
  try {
    const result = await universesApi.v2UniversesUniverseIdPermissionsResolvedGet({
      universeId: universeId.toString(),
    });
    return result.deleteDataStoreEntry;
  } catch {
    return false;
  }
}

export async function doesUserHaveDeleteDataStoresPermission(universeId: number): Promise<boolean> {
  try {
    const result = await universesApi.v2UniversesUniverseIdPermissionsResolvedGet({
      universeId: universeId.toString(),
    });
    return result.deleteDataStore;
  } catch {
    return false;
  }
}

export function storageCost(bytes: number): string {
  if (bytes <= 0) {
    return '$0.00';
  }

  const gigabytes = bytes / (1024 * 1024 * 1024);

  // Calculate monthly cost at $0.12/GB-month
  const monthlyCost = gigabytes * 0.12;
  return `$${monthlyCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
