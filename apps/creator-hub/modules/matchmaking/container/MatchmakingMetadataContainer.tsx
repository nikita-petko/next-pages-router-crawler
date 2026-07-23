import type { FunctionComponent } from 'react';
import React, { useEffect } from 'react';
import { withTranslation } from '@rbx/intl';
import { analyticsMatchmakingNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import { useHasUserSeenAnalyticsPage } from '@modules/creations/common/components/AnalyticsPageNewChip';
import { useCreationsCustomSettings } from '@modules/creations/common/implementations/creationsCustomSettings';
import { PageLoading } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import MatchmakingContainer from './MatchmakingContainer';

const MatchmakingMetadataContainer: FunctionComponent<React.PropsWithChildren> = () => {
  const { isFetched } = useCreationsCustomSettings();

  const { setHasUserSeen } = useHasUserSeenAnalyticsPage(analyticsMatchmakingNavigationItem.path);
  useEffect(() => {
    setHasUserSeen(true);
  }, [setHasUserSeen]);

  if (!isFetched) {
    return <PageLoading />;
  }

  return <MatchmakingContainer />;
};

export default withTranslation(MatchmakingMetadataContainer, [TranslationNamespace.Matchmaking]);
