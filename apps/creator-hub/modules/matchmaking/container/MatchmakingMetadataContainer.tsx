import React, { FunctionComponent, useEffect } from 'react';
import { withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { PageLoading } from '@modules/miscellaneous/common';
import { useCreationsCustomSettings } from '@modules/creations';
import { analyticsMatchmakingNavigationItem } from '@modules/charts-generic';
import { useHasUserSeenAnalyticsPage } from '@modules/creations/common';
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
