import type { FC, ReactNode } from 'react';
import { Fragment, useMemo } from 'react';
import {
  Button,
  Divider,
  SheetBody,
  SheetContent,
  SheetRoot,
  SheetTitle,
  SheetTrigger,
} from '@rbx/foundation-ui';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import withNamespaceSwitchedTranslation from '@modules/analytics-translations/withNamespaceSwitchedTranslation';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useClientSessionDataAvailabilityLabels from '../hooks/useClientSessionDataAvailabilityLabels';
import useClientSessionMetadata from '../hooks/useClientSessionMetadata';
import { durationMillisecondsToMinutes } from '../utils/durationMillisecondsToMinutes';
import {
  formatMissingValue,
  formatOperatingSystem,
  formatPlatform,
  MISSING_VALUE_PLACEHOLDER,
} from '../utils/formatMissingValue';

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

type ClientSessionMetadataData = NonNullable<ReturnType<typeof useClientSessionMetadata>['data']>;

type ClientSessionMetadataProps = {
  readonly universeId: number | undefined;
  readonly sessionId: string | undefined;
};

const ClientSessionMetadata: FC<ClientSessionMetadataProps> = ({ universeId, sessionId }) => {
  const { locale } = useLocalization();
  const { translate, tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { data, isError, isLoading } = useClientSessionMetadata({ universeId, sessionId });

  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale ?? Locale.English), [locale]);
  const startTimeFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale ?? Locale.English, START_TIME_FORMAT_OPTIONS),
    [locale],
  );
  const listFormatter = useMemo(
    () => new Intl.ListFormat(locale ?? Locale.English, { style: 'short', type: 'unit' }),
    [locale],
  );

  const viewDetailsLabel = tPendingTranslation(
    'View details',
    'Button label that opens a drawer with detailed metadata for a client session.',
    translationKey(
      'Action.ClientSessionMetadataViewDetails',
      TranslationNamespace.ServerManagement,
    ),
  );
  const drawerTitle = tPendingTranslation(
    'Session details',
    'Heading for the drawer showing detailed metadata for a client session.',
    translationKey(
      'Heading.ClientSessionMetadataDrawerTitle',
      TranslationNamespace.ServerManagement,
    ),
  );
  const closeDrawerLabel = translate(translationKey('Action.Close', TranslationNamespace.Controls));
  const dataAvailabilityLabels = useClientSessionDataAvailabilityLabels();

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
      minFps: tPendingTranslation(
        'Min FPS',
        'Label for the lowest frames per second during a client session.',
        translationKey('Label.ClientSessionMetadataMinFps', TranslationNamespace.ServerManagement),
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

  const buildEntries = (
    metadata: ClientSessionMetadataData | undefined,
  ): readonly MetadataEntry[] => {
    if (!metadata) {
      return [];
    }

    const durationMinutes = durationMillisecondsToMinutes(metadata.durationMilliseconds);
    const durationValue =
      durationMinutes == null
        ? MISSING_VALUE_PLACEHOLDER
        : tPendingTranslation(
            '{duration} min',
            'Client session duration in minutes; {duration} is the number of minutes.',
            translationKey(
              'Value.ClientSessionMetadataDuration',
              TranslationNamespace.ServerManagement,
            ),
            { duration: numberFormatter.format(durationMinutes) },
          );
    const memoryUsageValue = formatMissingValue(
      metadata.clientUsedMemoryMegabytes,
      MISSING_VALUE_PLACEHOLDER,
      (memory) =>
        tPendingTranslation(
          '{memory} MB',
          'Memory amount in megabytes; {memory} is the number of megabytes.',
          translationKey(
            'Value.ClientSessionMetadataMemoryMB',
            TranslationNamespace.ServerManagement,
          ),
          { memory: numberFormatter.format(memory) },
        ),
    );
    const deviceMemoryValue = formatMissingValue(
      metadata.clientDeviceRamMegabytes,
      MISSING_VALUE_PLACEHOLDER,
      (memory) =>
        tPendingTranslation(
          '{memory} MB',
          'Memory amount in megabytes; {memory} is the number of megabytes.',
          translationKey(
            'Value.ClientSessionMetadataMemoryMB',
            TranslationNamespace.ServerManagement,
          ),
          { memory: numberFormatter.format(memory) },
        ),
    );

    return [
      { label: labels.placeName, value: metadata.placeName },
      {
        label: labels.placeVersion,
        value: formatMissingValue(metadata.placeVersion, MISSING_VALUE_PLACEHOLDER),
      },
      {
        label: labels.startTime,
        value: formatMissingValue(metadata.startedTime, MISSING_VALUE_PLACEHOLDER, (startedTime) =>
          startTimeFormatter.format(startedTime),
        ),
      },
      { label: labels.duration, value: durationValue },
      {
        label: labels.minFps,
        value: formatMissingValue(metadata.minFps, MISSING_VALUE_PLACEHOLDER, (minFps) =>
          numberFormatter.format(minFps),
        ),
      },
      { label: labels.memoryUsage, value: memoryUsageValue },
      { label: labels.platform, value: formatPlatform(metadata.platform) },
      { label: labels.operatingSystem, value: formatOperatingSystem(metadata.os) },
      { label: labels.deviceMemory, value: deviceMemoryValue },
      {
        label: labels.dataAvailability,
        value: listFormatter.format(
          metadata.dataAvailability.map((availability) => dataAvailabilityLabels[availability]),
        ),
      },
    ];
  };

  if (!sessionId || isError) {
    return null;
  }

  const entries = buildEntries(data);

  return (
    <SheetRoot>
      <SheetTrigger>
        <Button variant='Standard' size='Medium' isDisabled={isLoading} isLoading={isLoading}>
          {viewDetailsLabel}
        </Button>
      </SheetTrigger>
      <SheetContent largeScreenVariant='side' closeLabel={closeDrawerLabel}>
        <SheetTitle>{drawerTitle}</SheetTitle>
        <SheetBody>
          <div className='flex flex-col gap-large padding-large'>
            {entries.map(({ label, value }, index) => (
              <Fragment key={label}>
                {index > 0 && <Divider orientation='horizontal' />}
                <div className='flex items-start justify-between gap-medium'>
                  <span className='text-body-medium content-muted'>{label}</span>
                  <span className='text-label-medium content-emphasis text-align-x-right'>
                    {value}
                  </span>
                </div>
              </Fragment>
            ))}
          </div>
        </SheetBody>
      </SheetContent>
    </SheetRoot>
  );
};

export default withNamespaceSwitchedTranslation(ClientSessionMetadata, [
  TranslationNamespace.ServerManagement,
  TranslationNamespace.Controls,
]);
