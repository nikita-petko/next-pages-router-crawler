import React, { ChangeEvent, FunctionComponent, useCallback } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  TableCell,
  Typography,
  Grid,
  TableHead,
  Table,
  TableRow,
  TableBody,
  TablePagination,
  TableFooter,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from '@rbx/ui';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { StatusCodes } from '@rbx/core';
import { ErrorPage } from '@modules/miscellaneous/error';
import { Asset } from '@modules/miscellaneous/common';
import useVersionHistory from '../hooks/useVersionHistory';
import useVersionHistoryStyles from './VersionHistory.styles';
import VersionHistoryRow from './VersionHistoryRow';
import { useCurrentDeveloperItem } from '../common/DeveloperItemProvider';
import VERSION_HISTORY_ASSETS from '../constants';

const lastUpdatedWidth = '24%';
const DeveloperItemVersionHistoryContainer: FunctionComponent = () => {
  const {
    classes: { description, container, tableContainer },
  } = useVersionHistoryStyles();
  const {
    page: currentPage,
    pageSize,
    currentVersionHistory,
    isLoadingCurrentVersionHistory,
    count,
    versionDescriptions,
    nextPage,
    previousPage,
    setPageSize,
    refreshCurrentVersionHistory,
  } = useVersionHistory();
  const { developerItemDetails } = useCurrentDeveloperItem();

  const onPageChange = useCallback(
    (_: React.MouseEvent<HTMLButtonElement> | null, page: number) => {
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

  const { translate } = useTranslation();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('Medium'));

  if (developerItemDetails?.type && !VERSION_HISTORY_ASSETS.includes(developerItemDetails.type)) {
    return <ErrorPage errorCode={StatusCodes.NOT_FOUND} />;
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

  const showDescriptionsColumn = Object.keys(versionDescriptions || {}).length > 0;
  const lastUpdatedColumn = showDescriptionsColumn ? (
    <TableCell style={{ width: lastUpdatedWidth }}>
      <Typography variant='tableHead'>{translate('Heading.LastUpdated')}</Typography>
    </TableCell>
  ) : (
    <TableCell>
      <Typography variant='tableHead'>{translate('Heading.LastUpdated')}</Typography>
    </TableCell>
  );
  const tableOrCircularProgress = isLoadingCurrentVersionHistory ? (
    <Grid container justifyContent='center' alignItems='center'>
      <CircularProgress />
    </Grid>
  ) : (
    <Table>
      {!isSmallScreen && (
        <TableHead>
          <TableRow>
            <TableCell>
              <Typography variant='tableHead'>{translate('Heading.Version')}</Typography>
            </TableCell>
            {lastUpdatedColumn}
            {showDescriptionsColumn && (
              <TableCell>
                <Typography variant='tableHead'>{translate('Heading.Notes')}</Typography>
              </TableCell>
            )}
            {!showDescriptionsColumn && <TableCell />}
            <TableCell />
          </TableRow>
        </TableHead>
      )}

      <TableBody>
        {currentVersionHistory?.map((version) => (
          <VersionHistoryRow
            key={version.assetVersionNumber}
            version={version}
            currentVersion={count}
            versionDescription={
              versionDescriptions && version.assetVersionNumber
                ? versionDescriptions[version.assetVersionNumber]
                : ''
            }
            isSmallScreen={isSmallScreen}
            assetType={developerItemDetails?.type}
          />
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TablePagination
            page={currentPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            count={count}
            rowsPerPage={pageSize}
            onPageChange={onPageChange}
            onRowsPerPageChange={onRowsPerPageChange}
            labelRowsPerPage={translate('Label.RowsPerPage')}
            labelDisplayedRows={({ from, to, count: totalPageCount }) =>
              translate('Label.PageRange', {
                pageRange: `${from}-${to}`,
                totalPageCount: `${totalPageCount}`,
              })
            }
          />
        </TableRow>
      </TableFooter>
    </Table>
  );
  const conditionalDescription =
    developerItemDetails?.type === Asset.Model ? (
      <Typography variant='body2'>{translate('Description.PackageVersionHistory')}</Typography>
    ) : (
      <Typography variant='body2'>{translate('Description.VersionHistory')}</Typography>
    );

  return (
    <Grid container classes={{ root: container }}>
      <Grid item Large={12} XLarge={8} classes={{ root: description }}>
        {conditionalDescription}
      </Grid>
      <Grid item Large={12} XLarge={8} classes={{ root: tableContainer }}>
        {developerItemDetails?.type === Asset.Model ? (
          tableOrCircularProgress
        ) : (
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
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {currentVersionHistory?.map((version) => (
                <VersionHistoryRow key={version.assetVersionNumber} version={version} />
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TablePagination
                  page={currentPage}
                  rowsPerPageOptions={[10, 25, 50, 100]}
                  count={count}
                  rowsPerPage={pageSize}
                  onPageChange={onPageChange}
                  onRowsPerPageChange={onRowsPerPageChange}
                  labelRowsPerPage={translate('Label.RowsPerPage')}
                  labelDisplayedRows={({ from, to, count: totalPageCount }) =>
                    translate('Label.PageRange', {
                      pageRange: `${from}-${to}`,
                      totalPageCount: `${totalPageCount}`,
                    })
                  }
                />
              </TableRow>
            </TableFooter>
          </Table>
        )}
      </Grid>
    </Grid>
  );
};

export default withTranslation(DeveloperItemVersionHistoryContainer, [
  TranslationNamespace.VersionHistory,
  TranslationNamespace.Table,
]);
