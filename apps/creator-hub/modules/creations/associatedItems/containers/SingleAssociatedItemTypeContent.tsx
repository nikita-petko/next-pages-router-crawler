import { EmptyGrid, Item } from '@modules/miscellaneous/common';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { StatusCodes } from '@rbx/core';
import { ErrorPage } from '@modules/miscellaneous/error';
import { CircularProgress, Typography } from '@rbx/ui';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import AssociatedItemsGridContainer from './AssociatedItemsGridContainer';

export type SingleAssociatedItemTypeContentSpec = {
  itemType: Item.CatalogAsset | Item.ExperienceSubscription;
};

// NOTE(shumingxu, 11/07/2023): Adapted from AssociatedItemsContainer by removing tab logic for itemType
const SingleAssociatedItemTypeContent = ({ itemType }: SingleAssociatedItemTypeContentSpec) => {
  const { translate } = useTranslation();
  const { gameDetails, canConfigure, isLoadingGame } = useCurrentGame();

  if (canConfigure === false) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  if (canConfigure === null || isLoadingGame) {
    return (
      <EmptyGrid>
        <Typography color='secondary' align='center'>
          <CircularProgress />
        </Typography>
      </EmptyGrid>
    );
  }

  if (gameDetails === null || typeof gameDetails.id === 'undefined') {
    return (
      <EmptyGrid>
        <Typography color='secondary' align='center'>
          {translate('Message.UnableToLoadGame')}
        </Typography>
      </EmptyGrid>
    );
  }

  return <AssociatedItemsGridContainer universeId={gameDetails.id} itemType={itemType} />;
};

export default withTranslation(SingleAssociatedItemTypeContent, [
  TranslationNamespace.Creations,
  TranslationNamespace.AssetTypes,
  TranslationNamespace.Navigation,
]);
