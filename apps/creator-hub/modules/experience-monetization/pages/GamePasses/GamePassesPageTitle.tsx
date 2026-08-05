import { memo } from 'react';
import NextLink from 'next/link';
import { Button } from '@rbx/foundation-ui';
import { useTranslationWithNamespace } from '@rbx/intl';
import { analyticsItemMonetizationPassesNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import { dashboard, docs } from '@modules/miscellaneous/urls/creatorHub';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';
import PageTitle from '@modules/monetization-shared/title';
import PassesOptionsMenu from '@modules/passes/components/PassesOptionsMenu';
import { useUniversePermissions } from '@modules/react-query/organizations';

const gamePassesDocLink = docs.getPassesMonetizationUrl();
const getCreatePassLink = dashboard.getCreatePassUrl;

function GamePassesPageTitle() {
  const { translate } = useTranslationWithNamespace(TranslationNamespace.Passes);
  const { universeId } = useUniverseId();
  const { data: permissions, isLoading: isLoadingPermissions } = useUniversePermissions(universeId);

  if (!universeId) {
    return null;
  }

  return (
    <PageTitle
      titleKey={analyticsItemMonetizationPassesNavigationItem.title.key}
      subtitleKey='Description.TakeActionPasses'
      subtitleLink={gamePassesDocLink}
      actions={
        <div className='flex items-center gap-small'>
          <Button
            asChild
            data-testid='createAssociatedItemsButton'
            variant='Emphasis'
            size='Medium'
            isLoading={isLoadingPermissions}
            isDisabled={!permissions?.monetizeExperience}>
            <NextLink href={getCreatePassLink(universeId)}>
              {translate('Action.CreatePass')}
            </NextLink>
          </Button>

          <PassesOptionsMenu universeId={universeId} />
        </div>
      }
      className='wrap'
    />
  );
}

export default memo(GamePassesPageTitle);
