import type { ChangeEvent, FunctionComponent, MouseEvent, PropsWithChildren } from 'react';
import { useCallback, useState } from 'react';
import { StatusCodes } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  Grid,
  FormControlLabel,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableFooter,
  TablePagination,
  Switch,
} from '@rbx/ui';
import { PageLoading, EmptyGrid } from '@modules/miscellaneous/components';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import useCurrentPlace from '../../places/hooks/useCurrentPlace';
import usePlaceVersionHistory from '../hooks/usePlaceVersionHistory';
import usePlaceVersionHistoryStyles from './PlaceVersionHistory.styles';
import PlaceVersionHistoryRow from './PlaceVersionHistoryRow';
import RevertVersionDialog from './RevertVersionDialog';

const PlaceVersionHistoryContainer: FunctionComponent<PropsWithChildren> = () => {
  const {
    classes: { description, subdescription, container, tableContainer },
  } = usePlaceVersionHistoryStyles();
  const { settings, isFetched } = useSettings();
  const enableShowOnlyPublishedPlaceVersions =
    isFetched && settings.enableShowOnlyPublishedPlaceVersions;
  const [dialogVersion, setDialogVersion] = useState<number | null>(null);
  const { canConfigurePlace, containingUniverse } = useCurrentPlace();
  const { canConfigure, gameDetails } = useCurrentGame();
  const { translate } = useTranslation();
  const {
    page: currentPage,
    pageSize,
    currentVersionHistory,
    isLoadingCurrentVersionHistory,
    count,
    isPublishedVersionsOnly,
    nextPage,
    previousPage,
    setPageSize,
    refreshCurrentVersionHistory,
    setPublishedVersionsOnly,
  } = usePlaceVersionHistory();

  const onPageChange = useCallback(
    (_: MouseEvent<HTMLButtonElement> | null, page: number) => {
      if (page < currentPage) {
        previousPage();
      } else if (page > currentPage) {
        nextPage();
      }
    },
    [currentPage, nextPage, previousPage],
  );

  const onRowsPerPageChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      const newPageSize = parseInt(event.target.value, 10);
      if (!Number.isNaN(newPageSize)) {
        setPageSize(newPageSize);
      }
    },
    [setPageSize],
  );

  const closeDialog = useCallback(() => {
    setDialogVersion(null);
  }, []);

  if (canConfigure === false || !canConfigurePlace) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  if (containingUniverse !== gameDetails?.id) {
    return <ErrorPage errorCode={StatusCodes.BAD_REQUEST} />;
  }

  if (!currentVersionHistory && !isLoadingCurrentVersionHistory) {
    return (
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
        buttonText={translate('Action.FailedToLoadPage')}
        onReload={refreshCurrentVersionHistory}
      />
    );
  }

  const labelDisplayedRows = ({
    from,
    to,
    count: rowCount,
  }: {
    from: number;
    to: number;
    count: number;
  }) => {
    if (isPublishedVersionsOnly) {
      return `${from}-${to}`;
    }
    return translate('Label.PageRange', {
      pageRange: `${from}-${to}`,
      totalPageCount: `${rowCount}`,
    });
  };

  return (
    <Grid container classes={{ root: container }}>
      <RevertVersionDialog
        open={dialogVersion != null}
        assetVersionNumber={dialogVersion}
        close={closeDialog}
      />
      <Grid item Large={12} XLarge={8} classes={{ root: description }}>
        <Typography component='p' variant='body2'>
          {translate('Description.PlaceVersionHistory')}
        </Typography>
      </Grid>
      {enableShowOnlyPublishedPlaceVersions && (
        <Grid item Large={12} XLarge={8} classes={{ root: subdescription }}>
          <FormControlLabel
            control={
              <Switch
                checked={isPublishedVersionsOnly}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  const newIsPublishedVersionsOnly = event.target.checked;
                  setPublishedVersionsOnly(newIsPublishedVersionsOnly);
                }}
                aria-label={translate('Action.ShowPublished')}
              />
            }
            label={translate('Action.ShowPublished')}
          />
        </Grid>
      )}
      {isLoadingCurrentVersionHistory ? (
        <EmptyGrid>
          <PageLoading />
        </EmptyGrid>
      ) : (
        <Grid item Large={12} XLarge={8} classes={{ root: tableContainer }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <Typography variant='tableHead'>{translate('Heading.Version')}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant='tableHead'>
                    {translate('Heading.LastUpdatedLocal')}
                  </Typography>
                </TableCell>
                <TableCell align='center'>
                  <Typography variant='tableHead'>{translate('Heading.Published')}</Typography>
                </TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {currentVersionHistory?.map((version) => (
                <PlaceVersionHistoryRow
                  key={version.assetVersionNumber}
                  version={version}
                  openDialog={setDialogVersion}
                  showRestore={version.assetVersionNumber !== count}
                />
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TablePagination
                  page={currentPage}
                  rowsPerPageOptions={[10, 25, 50, 100, 250, 500]}
                  count={count}
                  rowsPerPage={pageSize}
                  onPageChange={onPageChange}
                  onRowsPerPageChange={onRowsPerPageChange}
                  labelRowsPerPage={translate('Label.RowsPerPage')}
                  labelDisplayedRows={
                    enableShowOnlyPublishedPlaceVersions
                      ? labelDisplayedRows
                      : ({ from, to, count: totalPageCount }) =>
                          translate('Label.PageRange', {
                            pageRange: `${from}-${to}`,
                            totalPageCount: `${totalPageCount}`,
                          })
                  }
                />
              </TableRow>
            </TableFooter>
          </Table>
        </Grid>
      )}
    </Grid>
  );
};

export default withTranslation(PlaceVersionHistoryContainer, [
  TranslationNamespace.VersionHistory,
  TranslationNamespace.Controls,
  TranslationNamespace.Table,
  TranslationNamespace.Error,
]);
