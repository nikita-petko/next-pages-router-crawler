import { useMemo, useState, useCallback, Fragment, useEffect } from 'react';
import { SearchCreatorType } from '@rbx/client-universes-api/v1';
import type { PagingParameters, PageResponse } from '@rbx/core';
import { CursorPager, PagerError, SortOrder } from '@rbx/core';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { useTranslation } from '@rbx/intl';
import {
  Typography,
  Table,
  TableCell,
  TableHead,
  TableRow,
  TableBody,
  TableContainer,
  CircularProgress,
  Button,
  Divider,
  Grid,
  Link,
  AddIcon,
  ReplayIcon,
} from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import type { CloudAuthInfo } from '@modules/clients/cloudAuthentication';
import cloudAuthClient from '@modules/clients/cloudAuthentication';
import { EmptyGrid, EmptyState, Pagination } from '@modules/miscellaneous/components';
import { useGroups } from '@modules/providers/groups/GroupsProvider';
import useSnackbar from '../../../common/hooks/useSnackbar';
import useOAuthMetadata from '../../../oauth2/OAuthMetadataContext';
import { getApiKeysPageSize, getApiKeysLoadPageSize } from '../../constants/openCloudConstants';
import FormMode from '../../enums/FormMode';
import useConfirmationDialog from '../../hooks/v1/useConfirmationDialog';
import type FormModeState from '../../interfaces/FormModeState';
import { buildDeleteKeyControls } from '../../utils/dialogControlBuilders';
import useCredentialsTableStyles from './CredentialsTable.styles';
import CredentialsTableRow from './CredentialsTableRow';

interface CredentialsTableProps {
  groupId?: number;
  onShowForm?: (formModeState: FormModeState) => void;
  className?: string;
}

interface CredentialsTablePagingParameters extends PagingParameters {
  sortOrder?: SortOrder;
  groupId?: number;
}

const CredentialsTable = ({ className, groupId, onShowForm }: CredentialsTableProps) => {
  const OAuthMetadata = useOAuthMetadata();
  const { user } = useAuthentication();
  const { setCurrentGroup } = useGroups();
  const {
    classes: { createButton, emptyGrid },
  } = useCredentialsTableStyles();
  const [data, setData] = useState<CloudAuthInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const { translate, translateHTML } = useTranslation();
  const [indexToRemove, setIndexToRemove] = useState<number>(-1);
  const { showSnackbar } = useSnackbar();

  const getKeyNameToRemove = useCallback(
    (index: number) => {
      if (index !== -1) {
        const cloudAuthObjectAtIndex = data[index];
        return cloudAuthObjectAtIndex.cloudAuthUserConfiguredProperties?.name ?? '';
      }
      return '';
    },
    [data],
  );

  /* Cursor Pager Configuration setup */
  const updateData = useCallback(
    async (loadDataPromise: Promise<CloudAuthInfo[]>) => {
      setIsLoading(true);
      try {
        const response = await loadDataPromise;
        setData(response);
        setHasError(false);
        setIsLoading(false);
      } catch (error) {
        // If paging parameters were changed, do nothing and wait for next request
        if (error !== PagerError.PagingParametersChanged) {
          setData([]);
          setHasError(true);
          setIsLoading(false);
        }
      }
    },
    [setIsLoading, setData],
  );

  const loadApiKeys = async (
    pagingParameters: CredentialsTablePagingParameters,
  ): Promise<PageResponse<CloudAuthInfo>> => {
    const apiKeylistResponse = await cloudAuthClient.getApiKeys(
      pagingParameters.cursor, // passed in by cursor pager class
      pagingParameters.count, // passed in by cursor pager class- limit = count
      pagingParameters.sortOrder, // ... forwarded by cursor pager class on each call
      pagingParameters.groupId, // ... forwarded by cursor pager class on each call
    );
    return {
      items: apiKeylistResponse.cloudAuthInfo ?? [],
      nextPageCursor: apiKeylistResponse.nextCursor,
    };
  };

  const cursorPager = useMemo(() => {
    const defaultPagingParameters: CredentialsTablePagingParameters = {
      sortOrder: SortOrder.Desc,
      groupId,
    };

    return new CursorPager<CloudAuthInfo, CredentialsTablePagingParameters>(
      getApiKeysPageSize, // for 'fetch' calls to the cursor pager, fetch 10 keys at a time from the internal cache
      getApiKeysLoadPageSize, // load in 10 API keys at a time from the actual API (internal to Cursor Pager)
      loadApiKeys,
      defaultPagingParameters,
    );
  }, [groupId]);

  useEffect(() => {
    const newPagingParameters: CredentialsTablePagingParameters = {
      sortOrder: SortOrder.Desc,
      groupId,
    };
    updateData(cursorPager.setPagingParametersAndLoadFirstPage(newPagingParameters));
  }, [groupId, cursorPager, updateData]);

  /* Binding util functions to pager object for Pagination component */
  const canLoadPreviousPage = () => {
    return cursorPager.canLoadPreviousPage();
  };

  const canLoadNextPage = () => {
    return cursorPager.canLoadNextPage();
  };

  const loadPreviousPage = () => {
    updateData(cursorPager.loadPreviousPage());
  };

  const loadNextPage = () => {
    updateData(cursorPager.loadNextPage());
  };

  const reloadCurrentPage = () => {
    updateData(cursorPager.getCurrentPage());
  };

  /* Dialog Control methods */
  const removeItemAtIndex = useCallback(
    async (index: number) => {
      const cloudAuthData = data[index];
      const apiKeyName = getKeyNameToRemove(indexToRemove);
      try {
        if (typeof cloudAuthData.id !== 'undefined') {
          await cloudAuthClient.deleteApiKeyById(cloudAuthData.id);
          updateData(cursorPager.removeItemAtIndex(index));
          showSnackbar('success', translate('Message.DeleteKeySuccess', { apiKeyName }), '');
        } else {
          throw new Error('Identifier for Api key was undefined');
        }
      } catch {
        showSnackbar(
          'error',
          translate('Heading.NetworkError'),
          translate('Message.NetworkErrorDeleteKey', { apiKeyName }),
        );
        console.warn(`There was an error removing api key '${apiKeyName}'`);
      }
    },
    [cursorPager, data, getKeyNameToRemove, indexToRemove, showSnackbar, translate, updateData],
  );

  const onDialogCancel = useCallback(() => {
    setIndexToRemove(-1);
  }, []);

  const onDialogConfirm = useCallback(async () => {
    if (indexToRemove !== -1) {
      await removeItemAtIndex(indexToRemove);
    }
    setIndexToRemove(-1);
  }, [removeItemAtIndex, indexToRemove]);

  const {
    openDialog,
    BuildDialogBody,
    buildDialogBodyProps,
    ConfirmDialog,
    partialConfirmDialogProps,
  } = useConfirmationDialog(onDialogConfirm, onDialogCancel);

  const openDeleteConfirmDialog = (index: number) => {
    setIndexToRemove(index);
    openDialog(buildDeleteKeyControls(getKeyNameToRemove(index), translate));
  };

  /* Action Panel Control Button onClick callbacks for create, edit, and duplicate */
  const onCreateKey = useCallback(() => {
    // Switch to user context when creating a user key from group page
    if (groupId) {
      setCurrentGroup(null);
    }
    onShowForm?.({
      mode: FormMode.Create,
      creatorType: SearchCreatorType.User,
      creatorTargetId: user?.id,
    });
  }, [onShowForm, user?.id, groupId, setCurrentGroup]);

  const onCreateGroupKey = useCallback(() => {
    onShowForm?.({
      mode: FormMode.Create,
      creatorType: SearchCreatorType.Group,
      creatorTargetId: groupId,
    });
  }, [onShowForm, groupId]);

  const onEditKey = useCallback(
    (id: string) => {
      onShowForm?.({ mode: FormMode.Edit, id });
    },
    [onShowForm],
  );
  const onDuplicateKey = useCallback(
    (id: string) => {
      onShowForm?.({ mode: FormMode.Duplicate, id });
    },
    [onShowForm],
  );

  /* Api key Table Header columns */
  const headCells = [
    {
      key: 'Heading.Name',
    },
    {
      key: 'Label.Key',
    },
    {
      key: 'Label.Status',
    },
    {
      key: 'Label.Created',
    },
    {
      key: 'Label.Updated',
    },
    {
      key: 'Label.Actions',
    },
  ];

  if (isLoading && data.length === 0) {
    return (
      <EmptyGrid>
        <CircularProgress />
      </EmptyGrid>
    );
  }

  return (
    <div className={className}>
      <Typography variant='h3'>{translate('Heading.APIKeys')}</Typography>
      {data.length !== 0 && (
        <>
          <div className='flex flex-row gap-medium'>
            <Button
              className={createButton}
              color='primaryBrand'
              variant='contained'
              onClick={onCreateKey}>
              {groupId ? translate('Button.CreateUserAPIKey') : translate('Button.CreateKey')}
            </Button>
            {groupId && (
              <Button
                className={createButton}
                color='primary'
                variant='outlined'
                onClick={onCreateGroupKey}>
                {translate('Button.CreateGroupAPIKey')}
              </Button>
            )}
          </div>
          {OAuthMetadata.metadataResponse.isCreateUserApplicationsAllowed && (
            <Divider orientation='horizontal' />
          )}
        </>
      )}
      {data.length === 0 && hasError && (
        <Grid
          container
          justifyContent='center'
          alignItems='center'
          direction='column'
          classes={{ root: emptyGrid }}>
          <Typography color='secondary' align='center'>
            <Typography component='p'>{translate('Message.ErrorLoadingKeys')}</Typography>
            <Button onClick={reloadCurrentPage} color='primary' startIcon={<ReplayIcon />}>
              {translate('Button.Reload')}
            </Button>
          </Typography>
        </Grid>
      )}
      {data.length === 0 && !hasError && (
        <EmptyState
          title={translate('Heading.NoAPIKeys')}
          description={
            <Typography>
              {translateHTML('Description.NoAPIKeys', [
                {
                  opening: 'linkStart',
                  closing: 'linkEnd',
                  // NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
                  // responsible for triaging issue.
                  content(chunks) {
                    return (
                      <Link
                        href={`${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/cloud/reference`}>
                        {chunks}
                      </Link>
                    );
                  },
                },
              ])}
            </Typography>
          }
          size='large'
          illustration='apiKeys'>
          <div className='flex flex-row gap-medium'>
            <Button
              color='primaryBrand'
              variant='contained'
              startIcon={<AddIcon />}
              onClick={onCreateKey}>
              {groupId ? translate('Button.CreateUserAPIKey') : translate('Button.CreateKey')}
            </Button>
            {groupId && (
              <Button
                color='primary'
                variant='outlined'
                startIcon={<AddIcon />}
                onClick={onCreateGroupKey}>
                {translate('Button.CreateGroupAPIKey')}
              </Button>
            )}
          </div>
        </EmptyState>
      )}
      {data.length !== 0 && (
        <>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {headCells.map((row) => (
                    <TableCell key={row.key} align='left'>
                      {translate(row.key)}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((cloudAuthInfoItem: CloudAuthInfo, index: number) => {
                  return (
                    <CredentialsTableRow
                      index={index}
                      key={cloudAuthInfoItem?.id}
                      cloudAuthInfo={cloudAuthInfoItem}
                      onEdit={onEditKey}
                      onDuplicate={onDuplicateKey}
                      removeItemAtIndex={openDeleteConfirmDialog}
                    />
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {!hasError && (
            <Pagination
              canLoadPreviousPage={canLoadPreviousPage}
              canLoadNextPage={canLoadNextPage}
              loadPreviousPage={loadPreviousPage}
              loadNextPage={loadNextPage}
              currentPage={cursorPager.getCurrentPageNumber()}
            />
          )}
        </>
      )}
      <ConfirmDialog
        {...partialConfirmDialogProps}
        content={<BuildDialogBody {...buildDialogBodyProps} />}
      />
    </div>
  );
};

export default CredentialsTable;
