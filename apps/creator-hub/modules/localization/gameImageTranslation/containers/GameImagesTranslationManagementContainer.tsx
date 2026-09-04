import type { FunctionComponent } from 'react';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Divider, Grid, ReportProblemOutlinedIcon, Typography } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useEntryManagementMetadata from '../../translation/hooks/useEntryManagementMetadata';
import ImageEntryUpdater from '../components/ImageEntryUpdater';
import useImageEntryInformation from '../hooks/useImageEntryInformation';
import useImageEntryManagement from '../hooks/useImageEntryManagement';
import GameImagesEntryListContainer from './GameImagesEntryListContainer';
import useGameImagesTranslationManagementContainerStyles from './GameImagesTranslationManagementContainer.styles';

const GameImagesTranslationManagementContainer: FunctionComponent<React.PropsWithChildren> = () => {
  const {
    classes: { verticalDivider, operationSide, errorText, errorTextGrid },
  } = useGameImagesTranslationManagementContainerStyles();
  const { translateWithNamespace } = useTranslation();
  const { fullEntryInfoMap, fullEntryList } = useImageEntryManagement();
  const { isFetchingFullEntryTable, isFullTableLoadingNotStarted } = useImageEntryInformation();
  const { fetchEntryTableIdError, tableIdLoading } = useEntryManagementMetadata();

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
