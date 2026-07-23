import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AssetConsumerAction } from '@rbx/client-asset-permissions-api/v1';
import { StatusCodes } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Alert, CloseIcon, Grid, IconButton, Link, Typography, useSnackbar } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import assetPermissionsApiClient from '@modules/clients/assetPermissions';
import { ASSET_ACCESS_PRIVACY } from '@modules/miscellaneous/common/constants/linkConstants';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import UseAssetPermissionsStyles from './AssetPermissionsContainer.styles';
import BulkAssetInputContainer from './BulkAssetInputContainer';
import getAssetDetails, { MAX_PAGE_SIZE } from './common';
import ExportButton from './ExportButton';
import SaveAssetPermissionsContainer from './SaveAssetPermissionsContainer';
import type { TAssetDetails } from './types';
import UniverseAssetDetailsTable from './UniverseAssetDetailsTable';

const createToastMessage = (title: string, description?: string) => {
  return (
    <>
      <Grid>
        <Typography component='alert-title'>{title}</Typography>
      </Grid>
      {description && (
        <Grid>
          <Typography component='alert-description'>{description}</Typography>
        </Grid>
      )}
    </>
  );
};

// orchestrator:
// BulkAssetInputContainer => gets input from user, fetches details and updates list of pending assetIds in this parent component
// universeAssetDetailsTable => Renders the table with asset details
// SaveAssetPermissionsContainer => grants permission to pending assetIds and clears pending list
// This component fetches the list of assets this universe has permissions on + orchestrates the rendering of child components above
const AssetPermissionsContainer: FunctionComponent<
  React.PropsWithChildren<{ asSubtab?: boolean }>
> = ({ asSubtab }) => {
  const {
    classes: {
      actionContainerParent,
      alert,
      sectionHeader,
      descriptionText,
      tooltipIconPadding,
      iconButton,
    },
  } = UseAssetPermissionsStyles();
  const { translate } = useTranslation();
  const { user } = useAuthentication();
  const router = useRouter();
  const { canConfigure } = useCurrentGame();
  const { enqueue, close } = useSnackbar();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
  const universeId = router.query.id as string;
  const universeIdNumber = parseInt(universeId, 10);

  // State for storing the data
  const [pendingAssetIdsList, setPendingAssetIdsList] = useState<Map<number, TAssetDetails>>(
    new Map(),
  );
  const [existingAssetIdsList, setExistingAssetIdsList] = useState<Map<number, TAssetDetails>>(
    new Map(),
  );
  const [resultMap, setResultMap] = useState<Map<number, TAssetDetails>>(new Map());

  const [pageToken, setPageToken] = useState<string | undefined>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const handleOnItemsAdd = useCallback(
    (newPendingAssetIdsList: Map<number, TAssetDetails>) => {
      const existingEntriesToRefresh = new Map();
      const newEntriesToAdd = new Map();
      newPendingAssetIdsList.forEach((v, k) => {
        if (existingAssetIdsList.has(k)) {
          const newValue = { ...v, alreadyAdded: true };
          existingEntriesToRefresh.set(k, newValue);
        } else {
          newEntriesToAdd.set(k, v);
        }
      });

      // Add assets that should be granted permissions to pending list.
      if (newEntriesToAdd.size > 0) {
        setPendingAssetIdsList((prev) => {
          const newMap = new Map(prev);
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
          newEntriesToAdd.forEach((v, k) => newMap.set(k, v));
          return newMap;
        });
      }

      // Move assetIds that already have permission to the top.
      if (existingAssetIdsList.size > 0) {
        setExistingAssetIdsList((prev) => {
          prev.forEach((v, k) => {
            if (!existingEntriesToRefresh.has(k)) {
              existingEntriesToRefresh.set(k, v);
            }
          });
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
          return existingEntriesToRefresh;
        });
      }
    },
    [existingAssetIdsList],
  );

  const handleOnItemsRemove = useCallback((id: number) => {
    setPendingAssetIdsList((prev) => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  }, []);

  const handleShowToast = useCallback(
    (messages: { isSuccess: boolean; title: string; description?: string }[]) => {
      enqueue({
        children: (
          <div>
            {messages.map((value) => {
              if (value.isSuccess) {
                return (
                  <Alert
                    key={value.title}
                    classes={{ root: alert }}
                    severity='success'
                    variant='filled'>
                    {createToastMessage(value.title, value.description)}
                  </Alert>
                );
              }
              return (
                <Alert
                  key={value.title}
                  action={
                    <IconButton
                      aria-label='Close'
                      classes={{ root: iconButton }}
                      color='inherit'
                      onClick={() => close()}
                      size='small'>
                      <CloseIcon />
                    </IconButton>
                  }
                  classes={{ root: alert }}
                  severity='error'
                  variant='filled'>
                  {createToastMessage(value.title, value.description)}
                </Alert>
              );
            })}
          </div>
        ),
        autoHide: true,
        anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
      });
    },
    [alert, close, enqueue, iconButton],
  );

  const getUniverseAssetDetails = useCallback(async () => {
    try {
      if (pageToken !== undefined) {
        setIsLoading(true);
        const response = await assetPermissionsApiClient.listUniverseAssetPermissions(
          universeIdNumber,
          MAX_PAGE_SIZE,
          pageToken,
        );
        setPageToken(response.nextPageToken ?? undefined);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
        const existingAssetIds = response.results
          ?.filter((e) => e?.action === AssetConsumerAction.Use)
          .map((a) => a.assetId) as number[];

        if (existingAssetIds.length > 0) {
          const [existingAssetDetailsMap, , missingAssetDetailsMap] =
            await getAssetDetails(existingAssetIds);
          setResultMap((prev) => {
            const newMap = new Map(prev);
            existingAssetDetailsMap.forEach((value, key) => {
              newMap.set(key, value);
            });
            missingAssetDetailsMap.forEach((value, key) => {
              newMap.set(key, value);
            });
            return newMap;
          });
        }
      }
    } catch {
      // Don't throw an error in case of failed fetch.
    }
  }, [universeIdNumber, pageToken]);

  const handleSubmit = useCallback(() => {
    setPendingAssetIdsList(new Map());
    setPageToken('');
    void getUniverseAssetDetails();
  }, [getUniverseAssetDetails]);

  useEffect(() => {
    void getUniverseAssetDetails();
  }, [getUniverseAssetDetails]);

  useEffect(() => {
    if (pageToken === undefined) {
      setExistingAssetIdsList((prev) => {
        const newMap = new Map(prev);
        resultMap.forEach((value, key) => {
          newMap.set(key, value);
        });
        return newMap;
      });
      setIsLoading(false);
    }
  }, [resultMap, pageToken]);

  if (canConfigure === false) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  if (!user?.id) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  return (
    <Grid container item XSmall={12}>
      {!asSubtab && (
        <Grid item XSmall={12}>
          <Typography classes={{ root: sectionHeader }} component='h1' variant='h1'>
            {translate('Assets')}
          </Typography>
        </Grid>
      )}
      <Grid item XSmall={9} classes={{ root: descriptionText }}>
        <Typography variant='body2'>{translate('Message.GrantingInput')}</Typography>
      </Grid>
      <Grid item XSmall={9} classes={{ root: descriptionText }}>
        <Typography variant='body2'>{translate('Message.CannotRevoke')} &nbsp;</Typography>
        <Link aria-label={translate('Link.LearnMore')} href={ASSET_ACCESS_PRIVACY} target='_blank'>
          {translate('Link.LearnMore')}
        </Link>
      </Grid>
      <Grid container spacing={2}>
        <BulkAssetInputContainer userId={user.id} onItemsAdd={handleOnItemsAdd} />
      </Grid>
      <Grid container item direction='column' alignItems='flex-end' className={tooltipIconPadding}>
        <ExportButton
          onShowToast={handleShowToast}
          existingAssetIdsList={existingAssetIdsList}
          universeId={universeIdNumber}
        />
      </Grid>
      <Grid container>
        <UniverseAssetDetailsTable
          isLoading={isLoading}
          existingAssetIdsList={existingAssetIdsList}
          pendingAssetIdsList={pendingAssetIdsList}
          onItemRemove={handleOnItemsRemove}
        />
      </Grid>
      <Grid classes={{ root: actionContainerParent }} container direction='column'>
        <SaveAssetPermissionsContainer
          onShowToast={handleShowToast}
          universeId={universeIdNumber}
          pendingAssetIdsList={pendingAssetIdsList}
          onItemsSave={handleSubmit}
        />
      </Grid>
    </Grid>
  );
};

export default withTranslation(AssetPermissionsContainer, [
  TranslationNamespace.Creations,
  TranslationNamespace.AssetTypes,
  TranslationNamespace.Navigation,
  TranslationNamespace.AssetPermissions,
  TranslationNamespace.DeveloperItem,
  TranslationNamespace.DeveloperProducts,
  TranslationNamespace.Analytics,
  TranslationNamespace.Table,
]);
