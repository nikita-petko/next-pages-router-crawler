/* istanbul ignore file */
import { memo, useCallback } from 'react';
import { Button } from '@rbx/foundation-ui';
import { Translate } from '@rbx/intl';
import { useStudioEditPlaceLauncher } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { docs } from '@modules/miscellaneous/urls/creatorHub';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';
import PageTitle from '@modules/monetization-shared/title';
import { useCurrentGame } from '@modules/providers/game/GameProvider';

const LEARN_MORE_HREF = docs.getPersonalizedShopsMonetizationUrl();

function PersonalizedShopsPageTitle() {
  const { universeId } = useUniverseId();
  const { gameDetails } = useCurrentGame();
  const { launch, dialog, isCompatible } = useStudioEditPlaceLauncher();

  const placeId = gameDetails?.rootPlaceId;

  const handleOpenStudio = useCallback(() => {
    if (universeId === undefined) {
      return;
    }
    if (isCompatible && placeId !== undefined) {
      launch(universeId, placeId);
    }
  }, [isCompatible, launch, universeId, placeId]);

  return (
    <PageTitle
      titleKey='Heading.PersonalizedShop'
      subtitleKey='Description.PersonalizedShopSubtitle'
      subtitleLink={LEARN_MORE_HREF}
      className='wrap medium:no-wrap'
      actions={
        <div className='flex flex-col medium:flex-row medium:padding-left-small items-center gap-small shrink-0'>
          <Button variant='Emphasis' size='Medium' onClick={handleOpenStudio}>
            <Translate
              namespace={TranslationNamespace.PersonalizedShop}
              translationKey='Action.PreviewInStudio'
            />
          </Button>
          {isCompatible && dialog}
        </div>
      }
    />
  );
}

export default memo(PersonalizedShopsPageTitle);
