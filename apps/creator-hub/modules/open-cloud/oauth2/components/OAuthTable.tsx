import { Fragment, useState, useEffect, useCallback, useMemo } from 'react';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { useTranslation } from '@rbx/intl';
import { ThumbnailTypes, ReturnPolicy, ThumbnailClient } from '@rbx/thumbnails';
import type { TTableSortLabelProps } from '@rbx/ui';
import {
  EditOutlinedIcon,
  DeleteOutlinedIcon,
  Tooltip,
  ExtensionIcon,
  Grid,
  Link,
  CircularProgress,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableFooter,
  TablePagination,
  Divider,
  Button,
  TableSortLabel,
  Avatar,
  Skeleton,
  useDialog,
  DialogTemplate,
  Chip,
  PublicIcon,
  LockIcon,
  ErrorOutlineOutlinedIcon,
  AddIcon,
} from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import type { ApplicationResponse } from '@modules/clients/applicationAuthorization';
import applicationAuthorizationClient from '@modules/clients/applicationAuthorization';
import { getResponseFromError } from '@modules/clients/utils';
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import useSnackbar from '../../common/hooks/useSnackbar';
import {
  MAX_OAUTH_APPS,
  OAUTH_TABLE_ROWS_PER_PAGE_OPTIONS,
  DEFAULT_OAUTH_TABLE_ROWS_PER_PAGE,
} from '../constants/oAuthConstants';
import OAuthFormMode from '../enums/OAuthFormMode';
import type OAuthFormModeState from '../interfaces/OAuthFormModeState';
import useOAuthMetadata from '../OAuthMetadataContext';
import { getErrorTranslationKey } from '../utils/getTranslationKeysUtil';
import AgeVerifiedOAuthDialogCard from './AgeVerifiedOAuthDialogCard';
import CreateOAuthAppDialogCard from './CreateOAuthAppDialogCard';
import useOAuthTableStyles from './OAuthTable.styles';

export interface OAuthTableProps {
  onShowForm?: (oAuthFormModeState: OAuthFormModeState) => void;
}

type Order = TTableSortLabelProps['direction'];

const OAuthTable = ({ onShowForm }: OAuthTableProps) => {
  const { translate, translateHTML } = useTranslation();
  const OAuthMetadata = useOAuthMetadata();
  const isViewAllowed = OAuthMetadata.metadataResponse.isViewUserApplicationsAllowed;
  const isCreateAllowed = OAuthMetadata.metadataResponse.isCreateUserApplicationsAllowed;
  const isUpdateAllowed = OAuthMetadata.metadataResponse.isUpdateUserApplicationsAllowed;
  const isDeleteAllowed = OAuthMetadata.metadataResponse.isDeleteUserApplicationsAllowed;
  const ageVerifyRequired = OAuthMetadata.metadataResponse.actions.includes('AgeVerification');
  const { user } = useAuthentication();
  const {
    classes: {
      pagination,
      paginationToolbar,
      createButton,
      lastTableColumnCell,
      actionsCell,
      section,
      emptyTextContainer,
      namesColumn,
      timesColumn,
      appIconClass,
      iconContainer,
      statusColumn,
    },
  } = useOAuthTableStyles();
  const currentGroup = useCurrentGroup();

  const { showSnackbar } = useSnackbar();

  const headCells = useMemo(() => {
    const tableHeaders = [
      {
        id: 'name' as keyof ApplicationResponse,
        label: translate('Label.AppName'),
        class: namesColumn,
        isSortable: true,
      },
      {
        id: 'versionInfo' as keyof ApplicationResponse,
        label: translate('Label.AppStatus'),
        class: statusColumn,
        isSortable: false,
      },
      {
        id: 'createdUtc' as keyof ApplicationResponse,
        label: translate('Label.DateOfCreation'),
        class: timesColumn,
        isSortable: true,
      },
      {
        id: 'updatedUtc' as keyof ApplicationResponse,
        label: translate('Label.LastUpdated'),
        class: timesColumn,
        isSortable: true,
      },
    ];
    return tableHeaders;
  }, [namesColumn, statusColumn, timesColumn, translate]);

  const { open, close, configure } = useDialog();

  const [data, setData] = useState<ApplicationResponse[]>([]);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorTranslationKey, setErrorTranslationKey] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(DEFAULT_OAUTH_TABLE_ROWS_PER_PAGE);
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<keyof ApplicationResponse>('updatedUtc');
  const [appIdToImageUrlMap, setAppIdToImageUrlMap] = useState<Record<string, string>>({});

  const handleRequestSort = (property: keyof ApplicationResponse) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedData = [...data].sort((a, b) => {
    const aValue = a[orderBy];
    const bValue = b[orderBy];
    if (aValue && bValue) {
      if (order === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue > bValue ? -1 : 1;
    }
    return -1;
  });

  const removeItemAtIndex = async (index: number) => {
    const appToDelete = sortedData[index];
    try {
      await applicationAuthorizationClient.deleteApplication({
        applicationId: appToDelete.applicationId,
      });
      setData(data.filter((app) => app !== appToDelete));
      showSnackbar(
        'success',
        translate('Title.OAuthSuccessTitle'),
        translate('Description.OAuthSuccessDeleting'),
      );
    } catch {
      console.warn('Something went wrong trying to delete the requested app');
      showSnackbar(
        'error',
        translate('Title.OAuthError'),
        translate('Description.OAuthErrorDeleting'),
      );
    }
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const loadOAuthApps = useCallback(async () => {
    if (user?.id) {
      setIsLoading(true);

      try {
        const oAuthAppsResponse = currentGroup?.id
          ? await applicationAuthorizationClient.listApplicationsForGroup({
              groupId: currentGroup.id.toString(),
              limit: MAX_OAUTH_APPS,
            })
          : await applicationAuthorizationClient.listApplicationsForUser({
              userId: user?.id.toString(),
              limit: MAX_OAUTH_APPS,
            });
        const { applications } = oAuthAppsResponse;

        const appIdToImageUrlDict: Record<string, string> = {};
        await applications.forEach(async (app) => {
          if (app.imageAssetId) {
            const imageAssetIdNumber = parseInt(app.imageAssetId, 10);
            const thumbnailResponse = await ThumbnailClient.getThumbnailImage(
              ThumbnailTypes.assetThumbnail,
              imageAssetIdNumber,
              ReturnPolicy.PlaceHolder,
            );
            if (thumbnailResponse.imageUrl) {
              appIdToImageUrlDict[app.applicationId] = thumbnailResponse.imageUrl;
            }
          }
        });

        setAppIdToImageUrlMap(appIdToImageUrlDict);
        setData(applications);
        setHasError(false); // generic error
      } catch (error) {
        const response = getResponseFromError(error);
        const translationKey = response ? await getErrorTranslationKey(response) : undefined;
        setErrorTranslationKey(translationKey);
        setHasError(true);
      }
      setIsLoading(false);
    }
  }, [user?.id, currentGroup?.id]);

  useEffect(() => {
    if (isViewAllowed) {
      loadOAuthApps();
    }
  }, [loadOAuthApps, isViewAllowed]);

  const onOpenAgeVerificationDialog = useCallback(() => {
    configure(
      <AgeVerifiedOAuthDialogCard
        translate={translate}
        translateHTML={translateHTML}
        onCancel={close}
      />,
      {
        maxWidth: 'Medium',
        fullWidth: true,
      },
    );
    open();
  }, [configure, translate, translateHTML, close, open]);

  const onOpenNotAllowedDialog = useCallback(() => {
    configure(
      <DialogTemplate
        onConfirm={close}
        onCancel={close}
        title={translate('Heading.OAuthNotAllowed')}
        content={<Typography>{translate('Message.OAuthNotAllowed')}</Typography>}
        confirmText={translate('Label.Okay')}
        cancelText={translate('Label.Cancel')}
      />,
      { maxWidth: 'Medium', fullWidth: true },
    );
    open();
  }, [configure, translate, close, open]);

  const onEditApp = useCallback(
    (id: string, mode: OAuthFormMode) => {
      // Check if user has permission to edit/update apps
      if (!isUpdateAllowed) {
        if (ageVerifyRequired) {
          onOpenAgeVerificationDialog();
        } else {
          onOpenNotAllowedDialog();
        }
        return;
      }
      onShowForm?.({ mode, id });
    },
    [
      isUpdateAllowed,
      ageVerifyRequired,
      onOpenAgeVerificationDialog,
      onOpenNotAllowedDialog,
      onShowForm,
    ],
  );

  const onCreateApp = () => {
    // Check if user has permission to create apps
    if (!isCreateAllowed) {
      if (ageVerifyRequired) {
        onOpenAgeVerificationDialog();
      } else {
        onOpenNotAllowedDialog();
      }
      return;
    }

    configure(
      <CreateOAuthAppDialogCard
        onCancel={close}
        onContinueEdits={(id: string) => onEditApp(id, OAuthFormMode.Edit)}
        translate={translate}
        translateHTML={translateHTML}
        configure={configure}
        maxNameLength={OAuthMetadata.metadataResponse.maxNameLength}
        groupId={currentGroup?.id}
        userId={user?.id}
        loadOAuthApps={loadOAuthApps}
      />,
      { maxWidth: 'Medium', fullWidth: true },
    );
    open();
  };

  const OnDeleteApp = (index: number) => {
    // Check if user has permission to delete apps
    if (!isDeleteAllowed) {
      onOpenNotAllowedDialog();
      return;
    }

    // open the deletion confirmation dialog
    configure(
      <DialogTemplate
        color='destructive'
        onConfirm={() => {
          if (index !== -1) {
            removeItemAtIndex(index);
          }
          close();
        }}
        onCancel={close}
        title={translate('Title.DeleteApp', {
          appName: sortedData[index]?.name,
        })}
        content={
          <>
            <Typography component='p'>{translate('Description.DeleteDialogContent1')}</Typography>
            <br />
            <Typography component='p'>{translate('Description.DeleteDialogContent2')}</Typography>
          </>
        }
        confirmText={translate('Label.ConfirmDelete')}
        cancelText={translate('Label.Cancel')}
        loading={isLoading}
      />,
      { maxWidth: 'Medium', fullWidth: true },
    );
    open();
  };

  const appIcon = (app: ApplicationResponse) => {
    if (!app.imageAssetId) {
      return <ExtensionIcon className={appIconClass} />;
    }
    if (appIdToImageUrlMap[app.applicationId] === undefined) {
      return <Skeleton animate variant='rectangular' width={40} height={40} />;
    }
    return <Avatar variant='rounded' alt='' src={appIdToImageUrlMap[app.applicationId]} />;
  };

  const getStatusIcon = (app: ApplicationResponse) => {
    if (app.isBanned) {
      return (
        <Chip
          color='primary'
          icon={<ErrorOutlineOutlinedIcon />}
          label={translate('Label.BannedApp')}
          size='small'
          variant='outlined'
        />
      );
    }
    /* we need the undefined check due to issues in how the FE interprets null values returned by the backend. */
    if (
      app.versionInfo.lastApprovedVersionNumber !== undefined &&
      app.versionInfo.lastApprovedVersionNumber !== null
    ) {
      return (
        <Chip
          color='primary'
          icon={<PublicIcon />}
          label={translate('Label.PublicApp')}
          size='small'
          variant='outlined'
        />
      );
    }
    return (
      <Chip
        color='primary'
        icon={<LockIcon />}
        label={translate('Label.PrivateApp')}
        size='small'
        variant='outlined'
      />
    );
  };

  if (isLoading) {
    return (
      <Grid container alignItems='center' justifyContent='center'>
        <CircularProgress />
      </Grid>
    );
  }

  if (hasError) {
    return (
      <Grid
        container
        direction='column'
        className={section}
        alignItems='center'
        justifyContent='center'>
        <Typography className={emptyTextContainer}>
          {translate(errorTranslationKey ?? 'Message.ErrorLoadingApps')}
        </Typography>
      </Grid>
    );
  }

  if (!isViewAllowed) {
    return (
      <Grid
        container
        direction='column'
        className={section}
        alignItems='center'
        justifyContent='center'>
        <Typography className={emptyTextContainer}>
          {translate('Message.OAuthNotAllowed')}
        </Typography>
      </Grid>
    );
  }

  return (
    <>
      {data.length === 0 ? (
        <EmptyState
          title={translate('Heading.NoOAuthApps')}
          description={
            <Typography>
              {translateHTML('Description.NoOAuthApps', [
                {
                  opening: 'linkStart',
                  closing: 'linkEnd',
                  // NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
                  // responsible for triaging issue.
                  content(chunks) {
                    return (
                      <Link
                        href={`${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/cloud/open-cloud/oauth2-overview`}>
                        {chunks}
                      </Link>
                    );
                  },
                },
              ])}
            </Typography>
          }
          size='large'
          illustration='oAuthApps'>
          <Button variant='contained' onClick={onCreateApp} color='primary' startIcon={<AddIcon />}>
            {translate('Label.CreateOAuthApp')}
          </Button>
        </EmptyState>
      ) : (
        <Fragment>
          <Tooltip
            title={
              sortedData.length >= OAuthMetadata.metadataResponse.maxActiveApplications
                ? translate('Response.OAuthMaxNumberApps')
                : ''
            }>
            <span>
              <Button
                onClick={onCreateApp}
                size='large'
                variant='contained'
                className={createButton}
                disabled={
                  sortedData.length >= OAuthMetadata.metadataResponse.maxActiveApplications
                }>
                {translate('Label.CreateOAuthAppShort')}
              </Button>
            </span>
          </Tooltip>
          <Divider orientation='horizontal' />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {headCells.map((row) => (
                    <TableCell className={row.class} align='left' key={row.id}>
                      {row.isSortable ? (
                        <TableSortLabel
                          active={orderBy === row.id}
                          direction={orderBy === row.id ? order : 'asc'}
                          onClick={() => handleRequestSort(row.id)}>
                          {row.label}
                        </TableSortLabel>
                      ) : (
                        <Fragment>{row.label}</Fragment>
                      )}
                    </TableCell>
                  ))}
                  <TableCell className={lastTableColumnCell} align='left'>
                    {translate('Label.Actions')}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedData
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((app: ApplicationResponse, index: number) => (
                    <TableRow key={app.name}>
                      <TableCell align='left'>
                        <Grid container alignItems='center'>
                          <Grid item className={iconContainer}>
                            {appIcon(app)}
                          </Grid>
                          <Grid item>{app.name}</Grid>
                        </Grid>
                      </TableCell>
                      <TableCell align='left'>{getStatusIcon(app)}</TableCell>
                      <TableCell align='left'>{app.createdUtc.toLocaleString()}</TableCell>
                      <TableCell align='left'>{app.updatedUtc.toLocaleString()}</TableCell>
                      <TableCell className={actionsCell} align='left'>
                        <Button
                          onClick={() => onEditApp(app.applicationId, OAuthFormMode.EditAndPublish)}
                          variant='text'
                          color='primary'
                          startIcon={<EditOutlinedIcon />}>
                          {translate('Label.EditAndPublish')}{' '}
                        </Button>
                        <Button
                          onClick={() => OnDeleteApp(page * rowsPerPage + index)}
                          variant='text'
                          color='primary'
                          disabled={!isDeleteAllowed}
                          startIcon={<DeleteOutlinedIcon />}>
                          {translate('Label.OAuthDelete')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
              <TableFooter>
                <TablePagination
                  className={pagination}
                  classes={{ toolbar: paginationToolbar }}
                  rowsPerPageOptions={OAUTH_TABLE_ROWS_PER_PAGE_OPTIONS}
                  count={sortedData.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </TableFooter>
            </Table>
          </TableContainer>
        </Fragment>
      )}
    </>
  );
};

export default OAuthTable;
