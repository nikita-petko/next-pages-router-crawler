import { memo } from 'react';
import { docs } from '@modules/miscellaneous/common/urls/creatorHub';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';
import PageTitle from '@modules/monetization-shared/title';
import PassesOptionsMenu from '@modules/passes/components/PassesOptionsMenu';
// eslint-disable-next-line no-restricted-imports -- moving out of barrel imports
import { analyticsItemMonetizationPassesNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';

const gamePassesDocLink = docs.getPassesMonetizationUrl();

function GamePassesPageTitle() {
  const { universeId } = useUniverseId();
  if (!universeId) return null;

  return (
    <PageTitle
      titleKey={analyticsItemMonetizationPassesNavigationItem.title.key}
      subtitleKey='Description.TakeActionPasses'
      subtitleLink={gamePassesDocLink}
      actions={<PassesOptionsMenu universeId={universeId} />}
    />
  );
}

export default memo(GamePassesPageTitle);
