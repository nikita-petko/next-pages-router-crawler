import type { FC, ReactNode } from 'react';
import { useMemo } from 'react';
import { Card } from '@rbx/foundation-ui';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import withNamespaceSwitchedTranslation from '@modules/analytics-translations/withNamespaceSwitchedTranslation';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useClientSessionMetadata from '../hooks/useClientSessionMetadata';
import { ClientSessionDataAvailability } from '../types/ClientSession';
import ClientSessionMetadataStat, {
  CLIENT_SESSION_METADATA_STAT_CONTAINER_CLASS_NAME,
} from './ClientSessionMetadataStat';

const SKELETON_STAT_COUNT = 8;
const STATS_ROW_CLASS_NAME = 'flex wrap gap-xxlarge';
const SKELETON_STAT_CONTAINER_CLASS_NAME = `${CLIENT_SESSION_METADATA_STAT_CONTAINER_CLASS_NAME} min-width-[180px]`;
// Session timestamps are stored in UTC; render them in UTC with a "UTC" suffix
// (via timeZoneName) so the value is unambiguous regardless of the viewer's zone.
const START_TIME_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  timeZone: 'UTC',
  year: '2-digit',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  timeZoneName: 'short',
};

type MetadataEntry = {
  readonly label: string;
  readonly value: ReactNode;
};

type ClientSessionMetadataProps = {
  readonly sessionId: string | undefined;
};

const ClientSessionMetadata: FC<ClientSessionMetadataProps> = ({ sessionId }) => {
  const { locale } = useLocalization();
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { data, isError, isLoading } = useClientSessionMetadata({ sessionId });

  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale ?? Locale.English), [locale]);
  const startTimeFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale ?? Locale.English, START_TIME_FORMAT_OPTIONS),
    [locale],
  );
  const listFormatter = useMemo(
    () => new Intl.ListFormat(locale ?? Locale.English, { style: 'short', type: 'unit' }),
    [locale],
  );

  const errorMessage = tPendingTranslation(
    'Session metadata could not be loaded.',
    'Error shown when client session metadata fails to load.',
    translationKey('Message.ClientSessionMetadataLoadError', TranslationNamespace.ServerManagement),
  );

  const labels = useMemo(
    () => ({
      placeName: tPendingTranslation(
        'Place Name',
        'Label for the name of the place a client session ran in.',
        translationKey(
          'Label.ClientSessionMetadataPlaceName',
          TranslationNamespace.ServerManagement,
        ),
      ),
      placeVersion: tPendingTranslation(
        'Place Version',
        'Label for the version of the place a client session ran in.',
        translationKey(
          'Label.ClientSessionMetadataPlaceVersion',
          TranslationNamespace.ServerManagement,
        ),
      ),
      startTime: tPendingTranslation(
        'Start Time',
        'Label for when a client session started.',
        translationKey(
          'Label.ClientSessionMetadataStartTime',
          TranslationNamespace.ServerManagement,
        ),
      ),
      duration: tPendingTranslation(
        'Session Duration',
        'Label for how long a client session lasted.',
        translationKey(
          'Label.ClientSessionMetadataDuration',
          TranslationNamespace.ServerManagement,
        ),
      ),
      averageFps: tPendingTranslation(
        'Average FPS',
        'Label for the average frames per second during a client session.',
        translationKey(
          'Label.ClientSessionMetadataAverageFps',
          TranslationNamespace.ServerManagement,
        ),
      ),
      memoryUsage: tPendingTranslation(
        'Memory Usage',
        'Label for the memory used during a client session.',
        translationKey(
          'Label.ClientSessionMetadataMemoryUsage',
          TranslationNamespace.ServerManagement,
        ),
      ),
      platform: tPendingTranslation(
        'Platform',
        'Label for the device platform of a client session.',
        translationKey(
          'Label.ClientSessionMetadataPlatform',
          TranslationNamespace.ServerManagement,
        ),
      ),
      operatingSystem: tPendingTranslation(
        'Operating System',
        'Label for the device operating system of a client session.',
        translationKey(
          'Label.ClientSessionMetadataOperatingSystem',
          TranslationNamespace.ServerManagement,
        ),
      ),
      deviceMemory: tPendingTranslation(
        'Device Memory',
        'Label for the total device memory of a client session.',
        translationKey(
          'Label.ClientSessionMetadataDeviceMemory',
          TranslationNamespace.ServerManagement,
        ),
      ),
      dataAvailability: tPendingTranslation(
        'Data Availability',
        'Label for the kinds of debug data captured for a client session.',
        translationKey(
          'Label.ClientSessionMetadataDataAvailability',
          TranslationNamespace.ServerManagement,
        ),
      ),
    }),
    [tPendingTranslation],
  );

  const dataAvailabilityLabels = useMemo(
    () => ({
      [ClientSessionDataAvailability.MicroProfiler]: tPendingTranslation(
        'MicroProfiler',
        'Debug data type: MicroProfiler capture for a client session.',
        translationKey(
          'Label.ClientSessionDataAvailability.MicroProfiler',
          TranslationNamespace.ServerManagement,
        ),
      ),
      [ClientSessionDataAvailability.DMR]: tPendingTranslation(
        'DMR',
        'Debug data type: DMR (data model replay) for a client session.',
        translationKey(
          'Label.ClientSessionDataAvailability.DMR',
          TranslationNamespace.ServerManagement,
        ),
      ),
      [ClientSessionDataAvailability.MemoryDump]: tPendingTranslation(
        'Memory Dump',
        'Debug data type: memory dump for a client session.',
        translationKey(
          'Label.ClientSessionDataAvailability.MemoryDump',
          TranslationNamespace.ServerManagement,
        ),
      ),
    }),
    [tPendingTranslation],
  );

  if (isLoading) {
    return (
      <div className={STATS_ROW_CLASS_NAME}>
        {Array.from({ length: SKELETON_STAT_COUNT }, (_unused, index) => (
          <div key={index} className={SKELETON_STAT_CONTAINER_CLASS_NAME}>
            <Card
              variant='Emphasis'
              className='height-full'
              eyebrow={
                <span className='block height-100 width-[40%] radius-small bg-surface-300' />
              }
              title={<span className='block height-200 width-[70%] radius-small bg-surface-300' />}
            />
          </div>
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return <p className='text-body-medium content-muted margin-none'>{errorMessage}</p>;
  }

  const { session } = data;
  const durationValue = tPendingTranslation(
    '{duration} min',
    'Client session duration in minutes; {duration} is the number of minutes.',
    translationKey('Value.ClientSessionMetadataDuration', TranslationNamespace.ServerManagement),
    { duration: numberFormatter.format(session.durationMinute) },
  );
  const memoryUsageValue = tPendingTranslation(
    '{memory} MB',
    'Memory amount in megabytes; {memory} is the number of megabytes.',
    translationKey('Value.ClientSessionMetadataMemoryMB', TranslationNamespace.ServerManagement),
    { memory: numberFormatter.format(session.memoryUsageMB) },
  );
  const deviceMemoryValue = tPendingTranslation(
    '{memory} MB',
    'Memory amount in megabytes; {memory} is the number of megabytes.',
    translationKey('Value.ClientSessionMetadataMemoryMB', TranslationNamespace.ServerManagement),
    { memory: numberFormatter.format(session.device.memoryMB) },
  );

  const entries: readonly MetadataEntry[] = [
    { label: labels.placeName, value: session.placeName },
    { label: labels.placeVersion, value: session.placeVersion },
    { label: labels.startTime, value: startTimeFormatter.format(session.startTime) },
    { label: labels.duration, value: durationValue },
    { label: labels.averageFps, value: numberFormatter.format(session.averageFps) },
    { label: labels.memoryUsage, value: memoryUsageValue },
    { label: labels.platform, value: session.device.platform },
    { label: labels.operatingSystem, value: session.device.operatingSystem },
    { label: labels.deviceMemory, value: deviceMemoryValue },
    {
      label: labels.dataAvailability,
      value: listFormatter.format(
        session.dataAvailability.map((availability) => dataAvailabilityLabels[availability]),
      ),
    },
  ];

  return (
    <div className={STATS_ROW_CLASS_NAME}>
      {entries.map(({ label, value }) => (
        <ClientSessionMetadataStat key={label} label={label}>
          {value}
        </ClientSessionMetadataStat>
      ))}
    </div>
  );
};

export default withNamespaceSwitchedTranslation(ClientSessionMetadata, [
  TranslationNamespace.ServerManagement,
]);
