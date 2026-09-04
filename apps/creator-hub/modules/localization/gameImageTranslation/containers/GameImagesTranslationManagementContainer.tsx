import type { FunctionComponent } from 'react';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Divider, Grid, ReportProblemOutlinedIcon, Typography } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useEntryManagementMetadata from '../../translation/hooks/useEntryManagementMetadata';
import ImageEntryUpdater from '../components/ImageEntryUpdater';
import ImageTranslationEmptyState from '../components/ImageTranslationEmptyState';
import useImageEntryInformation from '../hooks/useImageEntryInformation';
import useImageEntryManagement from '../hooks/useImageEntryManagement';
import useImageTranslationAvailability from '../hooks/useImageTranslationAvailability';
import GameImagesEntryListContainer from './GameImagesEntryListContainer';
import useGameImagesTranslationManagementContainerStyles from './GameImagesTranslationManagementContainer.styles';

const GameImagesTranslationManagementContainer: FunctionComponent<React.PropsWithChildren> = () => {
  const {
    classes: { verticalDivider, operationSide, errorText, errorTextGrid },
  } = useGameImagesTranslationManagementContainerStyles();
  const { translateWithNamespace } = useTranslation();
  const { fullEntryInfoMap, fullEntryList } = useImageEntryManagement();
  const { isFetchingFullEntryTable, isFullTableLoadingNotStarted } = useImageEntryInformation();
  const { fetchEntryTableIdError, tableIdLoading, activeTranslationTarget } =
    useEntryManagementMetadata();
  const {
    isSupported,
    isEnabled,
    isLoading: isAvailabilityLoading,
    isError: isAvailabilityError,
  } = useImageTranslationAvailability();

  const [activeEntryKey, setActiveEntryKey] = useState<string | null>(null);

  const entryInfo = useMemo(() => {
    if (!activeEntryKey) {
      return null;
    }
    return fullEntryInfoMap.get(activeEntryKey) ?? null;
  }, [activeEntryKey, fullEntryInfoMap]);

  const handleClickEntry = useCallback((identifier: string | null) => {
    setActiveEntryKey(identifier);
  }, []);

  const isLoadingEntryList = tableIdLoading || isFullTableLoadingNotStarted;

  if (fetchEntryTableIdError) {
    return (
      <Grid className={errorTextGrid} container justifyContent='center' alignItems='center'>
        <ReportProblemOutlinedIcon />
        <Typography className={errorText} variant='alertTitle'>
          {translateWithNamespace(
            TranslationNamespace.GameStringTranslation,
            'Message.FailedToFetchEntryData',
          )}
        </Typography>
      </Grid>
    );
  }

  // Image translation is offered only at the language (Global) level. For a multi-locale language, a
  // specific child locale never has its own content, so blank the tab. This is deterministic from the
  // active target, so it renders without waiting on the availability queries.
  if (activeTranslationTarget != null && !activeTranslationTarget.isDefaultTarget) {
    return (
      <Grid className={errorTextGrid}>
        <ImageTranslationEmptyState variant='localeNotAvailable' />
      </Grid>
    );
  }

  // Once availability resolves, blank the whole tab for languages that can't use image translation
  // (unsupported) or that haven't turned it on yet. While loading — or if the availability queries
  // errored (the global QueryClient disables retries) — fall through to the normal render rather than
  // wrongly telling the creator their language is unavailable.
  if (!isAvailabilityLoading && !isAvailabilityError && !isSupported) {
    return (
      <Grid className={errorTextGrid}>
        <ImageTranslationEmptyState variant='unsupported' />
      </Grid>
    );
  }
  if (!isAvailabilityLoading && !isAvailabilityError && !isEnabled) {
    return (
      <Grid className={errorTextGrid}>
        <ImageTranslationEmptyState variant='notEnabled' />
      </Grid>
    );
  }

  return (
    <Grid container wrap='nowrap'>
      <GameImagesEntryListContainer
        activeEntryKey={activeEntryKey}
        fullList={fullEntryList}
        isLoadingEntryList={isLoadingEntryList}
        onSelectEntry={handleClickEntry}
      />
      <Divider className={verticalDivider} orientation='vertical' />
      <Grid className={operationSide}>
        {activeEntryKey !== null && entryInfo ? (
          <ImageEntryUpdater
            key={entryInfo.identifier}
            entryInfo={entryInfo}
            isFullTableLoading={isFetchingFullEntryTable}
          />
        ) : null}
      </Grid>
    </Grid>
  );
};

export default GameImagesTranslationManagementContainer;
