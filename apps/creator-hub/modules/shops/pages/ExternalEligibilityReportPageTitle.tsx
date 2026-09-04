import { useCallback } from 'react';
import { Button } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import useStudioEditPlaceLauncher from '@modules/miscellaneous/hooks/useStudioEditPlaceLauncher';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { docs } from '@modules/miscellaneous/urls/creatorHub';
import { Link } from '@modules/monetization-shared/link';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';
import PageTitle from '@modules/monetization-shared/title';
import useCurrentGame from '@modules/providers/game/hooks/useCurrentGame';

function ExternalEligibilityReportPageTitle() {
  const { universeId } = useUniverseId();
  const { gameDetails } = useCurrentGame();
  const { launch, dialog, isCompatible } = useStudioEditPlaceLauncher();
  const { translate } = useTranslation();

  const title = translate('Heading.ExternalEligibility');
  const subtitle = translate('Description.ExternalEligibility');

  const handleOpenStudio = useCallback(() => {
    const placeId = gameDetails?.rootPlaceId;
    if (universeId !== undefined && placeId !== undefined && isCompatible) {
      launch(universeId, placeId);
    }
  }, [gameDetails?.rootPlaceId, isCompatible, launch, universeId]);

  return (
    <PageTitle
      title={<h1 className='text-heading-large margin-none'>{title}</h1>}
      subtitle={
        <span className='text-body-medium content-default'>
          {subtitle}{' '}
          <Link
            href={docs.getExternalEligibilityReferenceUrl()}
            target='_blank'
            rel='noopener noreferrer'
            underline='always'
            color='Standard'>
            {translate('Action.LearnMore')}
          </Link>
        </span>
      }
      className='wrap medium:no-wrap'
      actions={
        <div className='shrink-0'>
          {isCompatible ? (
            <Button variant='Standard' size='Medium' onClick={handleOpenStudio}>
              {translate('Action.OpenStudio')}
            </Button>
          ) : (
            <Button as='a' href={docs.getSettingUpStudioUrl()} variant='Standard' size='Medium'>
              {translate('Action.OpenStudio')}
            </Button>
          )}
          {isCompatible && dialog}
        </div>
      }
    />
  );
}

export default withTranslation(ExternalEligibilityReportPageTitle, [
  TranslationNamespace.Creations,
  TranslationNamespace.PersonalizedShop,
]);
