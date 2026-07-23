import React, { FunctionComponent, useMemo, useState } from 'react';
import {
  AnalyticsPageTitle,
  analyticsAvatarCreationTokensNavigationItem,
} from '@modules/charts-generic';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { withTranslation, useTranslation } from '@rbx/intl';
import { ExperienceAnalyticsTabbedPageLayout } from '@modules/experience-analytics-shared';
import { Asset, EmptyGrid } from '@modules/miscellaneous/common';
import {
  AvatarCreationTokensPageAvatarCreationsContent,
  AvatarCreationTokensPageTokenContent,
  CreationData,
  useCreationsCustomSettings,
  BundleType,
} from '@modules/creations';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { CircularProgress, Grid, MenuItem, Typography } from '@rbx/ui';
import { PageResponse } from '@rbx/core';
import {
  OCAvatarCreationTokenError,
  useListAvatarCreationTokens,
} from '@modules/react-query/openCloudAvatarCreationTokens';
// eslint-disable-next-line no-restricted-imports -- Needed to get tab
import ItemMonetizationTabs from '@modules/experience-monetization/constants/ItemMonetizationTabs';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import { AccessDeniedError } from '@rbx/creator-hub-error';

const AvatarCreationTokensPageContent: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const { translate } = useTranslation();
  const { translate: translateFn } = useTranslationWrapper(useTranslation());
  const { isFetched } = useCreationsCustomSettings();
  const { canConfigure, isLoadingGame, gameDetails } = useCurrentGame();
  const [currToken, setCurrToken] = useState<string | undefined>(undefined);
  const [itemType, setItemType] = useState<Asset | BundleType>(BundleType.Body);
  const [isAssetType, setIsAssetType] = useState<boolean>(false);
  const queryListTokens = useListAvatarCreationTokens(gameDetails?.id, isAssetType, itemType);

  const creationsTabContent = useMemo(() => {
    if (queryListTokens.isPending) {
      return (
        <EmptyGrid>
          <CircularProgress color='secondary' />
        </EmptyGrid>
      );
    }

    if (queryListTokens?.data === OCAvatarCreationTokenError.FailedToListAvatarCreationTokens) {
      return (
        <FailureView
          title={translate('Heading.FailedToLoadPage')}
          message={translate('Message.FailedToLoadPage')}
          buttonText={translate('Action.FailedToLoadPage')}
          onReload={queryListTokens.refetch}
        />
      );
    }

    if (
      queryListTokens?.data ===
      OCAvatarCreationTokenError.UserMissingGroupPermissionsToListAvatarCreationTokens
    ) {
      return (
        <EmptyGrid>
          <Typography color='secondary' align='center'>
            {translate('Message.UserMissingGroupPermissions')}
          </Typography>
        </EmptyGrid>
      );
    }

    if (
      !canConfigure ||
      queryListTokens?.data === OCAvatarCreationTokenError.AccessDeniedToListAvatarCreationTokens
    ) {
      return <AccessDeniedError />;
    }

    const tokens = queryListTokens.data as PageResponse<CreationData>;

    const tokenMenuItems = tokens.items.map((item) => (
      <MenuItem key={item.assetId} value={item.assetId}>
        {item.name}
      </MenuItem>
    ));

    return (
      <Grid container>
        <AvatarCreationTokensPageTokenContent
          tokens={tokens}
          setItemType={setItemType}
          itemType={itemType}
          setIsAssetType={setIsAssetType}
        />
        <AvatarCreationTokensPageAvatarCreationsContent
          currToken={currToken}
          tokenMenuItems={tokenMenuItems}
          setCurrToken={setCurrToken}
          universeId={gameDetails?.id}
        />
      </Grid>
    );
  }, [
    canConfigure,
    currToken,
    gameDetails?.id,
    itemType,
    queryListTokens.data,
    queryListTokens.isPending,
    queryListTokens.refetch,
    translate,
  ]);

  const creationsTab = useMemo(
    () => ({
      key: ItemMonetizationTabs.Creations,
      label: translateFn(translationKey('Heading.Creations', TranslationNamespace.Navigation)),
      content: creationsTabContent,
    }),
    [translateFn, creationsTabContent],
  );

  const title = useMemo(
    () => (
      <AnalyticsPageTitle
        text={translateFn(
          translationKey('Heading.AvatarCreationTokens', TranslationNamespace.AvatarAnalytics),
        )}
      />
    ),
    [translateFn],
  );

  const orderedTabs = useMemo(() => {
    const tabs = [];
    tabs.push(creationsTab);
    return tabs;
  }, [creationsTab]);

  if (!isFetched || isLoadingGame) {
    return (
      <EmptyGrid>
        <CircularProgress color='secondary' />
      </EmptyGrid>
    );
  }

  return (
    // eslint-disable-next-line deprecation/deprecation -- todo: there's nothing analytical about these tabs, consider use something different
    <ExperienceAnalyticsTabbedPageLayout
      title={title}
      description={undefined}
      controls={[]}
      tabs={orderedTabs}
      navigationItem={analyticsAvatarCreationTokensNavigationItem}
    />
  );
};

export default withTranslation(AvatarCreationTokensPageContent, [
  TranslationNamespace.Navigation,
  TranslationNamespace.Creations,
  TranslationNamespace.Error,
]);
