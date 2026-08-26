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
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import withNamespaceSwitchedTranslation from '@modules/analytics-translations/withNamespaceSwitchedTranslation';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useClientSessionMetadata from '../hooks/useClientSessionMetadata';
import {
  formatClientSessionDeviceMemory,
  formatClientSessionDuration,
  formatClientSessionMemoryUsage,
  formatClientSessionMinFps,
  formatClientSessionOperatingSystem,
  formatClientSessionPlaceName,
  formatClientSessionPlaceVersion,
  formatClientSessionPlatform,
  formatClientSessionStartTime,
} from '../utils/clientSessionFormatters';

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
  const { translate, tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { data, isError, isLoading } = useClientSessionMetadata({ universeId, sessionId });
  const raqiTranslationDependencies = useRAQIV2TranslationDependencies();

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
        'Max memory usage',
        'Column heading for the peak memory usage reached during a client session.',
        translationKey(
          'Label.ClientSessionBrowserMaxMemoryUsage',
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
    }),
    [tPendingTranslation],
  );

  const buildEntries = (
    metadata: ClientSessionMetadataData | undefined,
  ): readonly MetadataEntry[] => {
    if (!metadata) {
      return [];
    }

    return [
      {
        label: labels.placeName,
        value: formatClientSessionPlaceName(metadata.placeName, raqiTranslationDependencies),
      },
      {
        label: labels.placeVersion,
        value: formatClientSessionPlaceVersion(metadata.placeVersion, raqiTranslationDependencies),
      },
      {
        label: labels.startTime,
        value: formatClientSessionStartTime(metadata.startedTime, raqiTranslationDependencies),
      },
      {
        label: labels.duration,
        value: formatClientSessionDuration(
          metadata.durationMilliseconds,
          raqiTranslationDependencies,
        ),
      },
      {
        label: labels.minFps,
        value: formatClientSessionMinFps(metadata.minFps, raqiTranslationDependencies),
      },
      {
        label: labels.memoryUsage,
        value: formatClientSessionMemoryUsage(
          metadata.clientUsedMemoryMegabytes,
          raqiTranslationDependencies,
        ),
      },
      {
        label: labels.platform,
        value: formatClientSessionPlatform(metadata.platform, raqiTranslationDependencies),
      },
      {
        label: labels.operatingSystem,
        value: formatClientSessionOperatingSystem(metadata.os, raqiTranslationDependencies),
      },
      {
        label: labels.deviceMemory,
        value: formatClientSessionDeviceMemory(
          metadata.clientDeviceRamMegabytes,
          raqiTranslationDependencies,
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
  TranslationNamespace.Analytics,
  TranslationNamespace.ServerManagement,
  TranslationNamespace.Controls,
]);
