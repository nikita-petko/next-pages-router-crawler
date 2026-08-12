import { memo } from 'react';
import NextLink from 'next/link';
import { Button } from '@rbx/foundation-ui';
import { useTranslationWithNamespace } from '@rbx/intl';
import DeveloperProductsOptionsMenu from '@modules/developer-products/components/DeveloperProductsOptionsMenu';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import { dashboard, docs } from '@modules/miscellaneous/urls/creatorHub';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';
import PageTitle from '@modules/monetization-shared/title';
import { useUniversePermissions } from '@modules/react-query/organizations';

const developerProductsDocLink = docs.getDeveloperProductsMonetizationUrl();
const getCreateDeveloperProductLink = dashboard.getCreateDeveloperProductUrl;

function DeveloperProductsPageTitle() {
  const { translate } = useTranslationWithNamespace(TranslationNamespace.DeveloperProducts);
  const { universeId } = useUniverseId();
  const { data: permissions, isLoading: isLoadingPermissions } = useUniversePermissions(universeId);

  if (!universeId) {
    return null;
  }

  return (
    <PageTitle
      titleKey='Label.DeveloperProducts'
      titleNamespace={TranslationNamespace.Navigation}
      subtitleKey='Description.TakeActionDeveloperProducts'
      subtitleNamespace={TranslationNamespace.Analytics}
      subtitleLink={developerProductsDocLink}
      actions={
        <div className='flex items-center gap-small'>
          <Button
            asChild
            data-testid='createAssociatedItemsButton'
            variant='Emphasis'
            size='Medium'
            isLoading={isLoadingPermissions}
            isDisabled={!permissions?.monetizeExperience}>
            <NextLink href={getCreateDeveloperProductLink(universeId)}>
              {translate('Action.CreateDeveloperProduct')}
            </NextLink>
          </Button>

          <DeveloperProductsOptionsMenu universeId={universeId} />
        </div>
      }
      className='wrap'
    />
  );
}

export default memo(DeveloperProductsPageTitle);
