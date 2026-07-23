import React, { FunctionComponent, useCallback, useMemo, useState, useEffect } from 'react';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { TableRow, TableCell, Button, RestoreIcon, Typography, Grid, Divider } from '@rbx/ui';
import { RobloxApiDevelopAssetVersion } from '@rbx/clients/develop';
import { usersClient, groupsClient } from '@modules/clients';
import { useMetricsMonitoring } from '@modules/miscellaneous/metricsMonitoring';
import { Asset, CreatorType } from '@modules/miscellaneous/common';
import { getResponseFromError } from '@modules/clients/utils';
import useVersionHistoryStyles from './VersionHistory.styles';
import useVersionHistory from '../hooks/useVersionHistory';

export interface VersionHistoryRowProps {
  version: RobloxApiDevelopAssetVersion;
  currentVersion?: number; // TODO: remove question mark to make currentVersion required when removing enablePackageVersionDescriptions
  versionDescription?: string | null; // TODO: remove question mark to make versionDescription required when removing enablePackageVersionDescriptions
  isSmallScreen?: boolean; // TODO: remove question mark to make isSmallScreen required when removing enablePackageVersionDescriptions
  assetType?: Asset | null | undefined;
}

const VersionHistoryRow: FunctionComponent<React.PropsWithChildren<VersionHistoryRowProps>> = ({
  version,
  currentVersion,
  versionDescription,
  isSmallScreen,
  assetType,
}) => {
  const {
    classes: { icon },
  } = useVersionHistoryStyles();
  const { restoreCurrentVersionHistory, restoreCurrentVersionHistoryAndSetNote, isRestoring } =
    useVersionHistory();
  const { locale } = useLocalization();

  const dateFormatter = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale ?? Locale.English, {
      dateStyle: 'long',
      timeStyle: 'short',
    });
    return formatter.format;
  }, [locale]);

  const { translate } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const { error } = useMetricsMonitoring();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [isDisplayNameLoading, setIsDisplayNameLoading] = useState<boolean>(false);

  const onClick = useCallback(async () => {
    if (version.assetVersionNumber) {
      setIsLoading(true);
      // TODO(@nicholasng, COLLAB-4720) also remove check for restoreCurrentVersionHistoryAndSetNote when removing enablePackageVersionDescriptions
      if (restoreCurrentVersionHistoryAndSetNote) {
        await restoreCurrentVersionHistoryAndSetNote(
          version.assetVersionNumber,
          assetType,
          currentVersion,
        );
      } else if (restoreCurrentVersionHistory) {
        await restoreCurrentVersionHistory(version.assetVersionNumber);
      }
      setIsLoading(false);
    }
  }, [
    restoreCurrentVersionHistoryAndSetNote,
    restoreCurrentVersionHistory,
    version.assetVersionNumber,
    currentVersion,
    assetType,
  ]);

  const getAndSetUserDisplayName = useCallback(async () => {
    try {
      const detailedUserInfo =
        version.creatorTargetId && (await usersClient.getUserById(version.creatorTargetId));
      if (detailedUserInfo && detailedUserInfo.displayName) {
        setDisplayName(detailedUserInfo.displayName);
      }
    } catch (e) {
      const err = getResponseFromError(e);
      error(`Version history - getUserById failed with ${err?.status}`);
    }
  }, [error, version]);

  const getAndSetGroupDisplayName = useCallback(async () => {
    try {
      const detailedGroupInfo =
        version.creatorTargetId && (await groupsClient.getGroupInfo(version.creatorTargetId));
      if (detailedGroupInfo && detailedGroupInfo.name) {
        setDisplayName(detailedGroupInfo.name);
      }
    } catch (e) {
      const err = getResponseFromError(e);
      error(`Version history - getGroupInfo failed with ${err?.status}`);
    }
  }, [error, version]);

  useEffect(() => {
    (async () => {
      setIsDisplayNameLoading(true);
      switch (version.creatorType) {
        case CreatorType.Group:
          await getAndSetGroupDisplayName();
          break;
        default:
          await getAndSetUserDisplayName();
      }
      setIsDisplayNameLoading(false);
    })();
  }, [version, getAndSetUserDisplayName, getAndSetGroupDisplayName]);

  const lastUpdated =
    !displayName || isDisplayNameLoading ? (
      <TableCell>{dateFormatter(version.created)}</TableCell>
    ) : (
      <TableCell>
        {dateFormatter(version.created)} {translate('Description.By')} {displayName}
      </TableCell>
    );

  const lastUpdatedSmall =
    !displayName || isDisplayNameLoading ? (
      <Typography color='secondary'>{dateFormatter(version.created)}</Typography>
    ) : (
      <Typography color='secondary'>
        {dateFormatter(version.created)} {translate('Description.By')} {displayName}
      </Typography>
    );

  let restoreComponent;
  if (!version.isEqualToCurrentPublishedVersion) {
    restoreComponent = (
      <Button
        size='small'
        variant='outlined'
        color='primary'
        onClick={onClick}
        disabled={isRestoring}
        loading={isLoading}>
        <RestoreIcon className={icon} /> {translate('Label.Restore')}
      </Button>
    );
  } else if (
    version.isEqualToCurrentPublishedVersion &&
    version.assetVersionNumber === currentVersion
  ) {
    restoreComponent = (
      <Typography color='success'>{translate('Label.Current').toUpperCase()}</Typography>
    );
  } else {
    restoreComponent = currentVersion ? (
      <Typography color='secondary'>
        {translate('Description.RestoredVersionNumber', {
          versionNumber: currentVersion.toString(),
        }).toUpperCase()}
      </Typography>
    ) : (
      // NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
      // responsible for triaging issue.
      // eslint-disable-next-line react/jsx-no-useless-fragment
      <React.Fragment />
    );
  }

  const smallScreen = (
    <TableRow data-testid={`version-history-${version.assetVersionNumber}`}>
      <Grid
        container
        item
        direction='column'
        alignItems='flex-start'
        justifyContent='flex-end'
        wrap='nowrap'
        style={{ paddingLeft: '12px', paddingRight: '12px' }}>
        <Grid
          container
          direction='row'
          justifyContent='space-between'
          style={{ marginBottom: '20px' }}>
          <Typography style={{ fontWeight: 'bold' }}>
            {translate('Heading.Version')} {version.assetVersionNumber}
          </Typography>
          {restoreComponent}
        </Grid>
        {versionDescription && (
          <Grid item style={{ marginBottom: '20px' }}>
            <Typography>{versionDescription}</Typography>
          </Grid>
        )}
        <Grid item style={{ marginBottom: '12px' }}>
          {lastUpdatedSmall}
        </Grid>
      </Grid>
      <Divider style={{ marginBottom: '12px' }} />
    </TableRow>
  );

  const fullScreen = (
    <TableRow data-testid={`version-history-${version.assetVersionNumber}`}>
      <TableCell>{version.assetVersionNumber}</TableCell>
      {lastUpdated}
      <TableCell>{versionDescription}</TableCell>
      <TableCell align='right'>{restoreComponent}</TableCell>
    </TableRow>
  );
  const versionHistoryRow = isSmallScreen ? smallScreen : fullScreen;

  return versionHistoryRow;
};

export default VersionHistoryRow;
