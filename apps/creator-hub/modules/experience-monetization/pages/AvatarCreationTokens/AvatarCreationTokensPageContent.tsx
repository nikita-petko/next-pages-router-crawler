import type { FunctionComponent } from 'react';
import React, { useMemo, useState } from 'react';
import type { PageResponse } from '@rbx/core';
import { AccessDeniedError } from '@rbx/creator-hub-error';
import { withTranslation, useTranslation } from '@rbx/intl';
import { CircularProgress, Grid, MenuItem, Typography } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { analyticsAvatarCreationTokensNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import { AnalyticsPageTitle } from '@modules/charts-generic/layout/AnalyticsPageTitle';
import AvatarCreationTokensPageAvatarCreationsContent from '@modules/creations/avatarCreationTokens/components/AvatarCreationsGridComponent';
import AvatarCreationTokensPageTokenContent from '@modules/creations/avatarCreationTokens/components/AvatarCreationTokensGridComponent';
import { BundleType } from '@modules/creations/avatarItem/constants/avatarItemConstants';
import { useCreationsCustomSettings } from '@modules/creations/common/implementations/creationsCustomSettings';
import type CreationData from '@modules/creations/common/interfaces/CreationData';
import { ExperienceAnalyticsTabbedPageLayout } from '@modules/experience-analytics-shared/layout/NonConfigurationBasedExperienceAnalyticsTabbedPageLayout';
import type { Asset } from '@modules/miscellaneous/common';
import { EmptyGrid } from '@modules/miscellaneous/components';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import {
  OCAvatarCreationTokenError,
  useListAvatarCreationTokens,
} from '@modules/react-query/openCloudAvatarCreationTokens';
import ItemMonetizationTabs from '../../constants/ItemMonetizationTabs';

const AvatarCreationTokensPageContent: FunctionComponent<React.PropsWithChildren> = () => {
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
