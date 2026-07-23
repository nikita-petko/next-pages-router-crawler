import { useRouter } from 'next/router';
import { StatusCodes } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import { CircularProgress, Typography, Grid } from '@rbx/ui';
import { ErrorPage } from '@modules/miscellaneous/error';
import { EmptyGrid, Item } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import useAssociatedItemsStyles from '../components/AssociatedItems.styles';
import AssociatedItems from '../components/AssociatedItems';
import {
  type AssociatedItem,
  associatedItemsRedirectUrls,
  RedirectedAssociatedItem,
} from '../constants';

/**
 * This container is responsible for rendering the associated-items page.
 * It is deprecated and will be removed in the future.
 */
const AssociatedItemsContainer = () => {
  const { translate } = useTranslation();
  const { gameDetails, canConfigure } = useCurrentGame();
  const router = useRouter();

  const {
    classes: { section },
  } = useAssociatedItemsStyles();

  if (canConfigure === false) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  const universeId = Number(router.query.id);
  const redirectUrl =
    typeof router.query.activeTab === 'string' &&
    associatedItemsRedirectUrls[router.query.activeTab as AssociatedItem]?.(universeId);

  // Note: this is currently not reachable due to the top-level UrlRedirectProvider, but keeping this here as a fallback.
  if (router.query.activeTab && redirectUrl) {
    router.push(redirectUrl);
    return null;
  }

  const activeItemType = router.query.activeTab as Exclude<Item, RedirectedAssociatedItem>;
  if (!activeItemType) {
    return (
      <EmptyGrid>
        <CircularProgress />
      </EmptyGrid>
    );
  }

  return (
    <section className={section}>
      <Grid container>
        {!canConfigure ||
        typeof gameDetails === 'undefined' ||
        gameDetails === null ||
        typeof gameDetails.id === 'undefined' ? (
          <EmptyGrid>
            {gameDetails === null ? (
              <Typography color='secondary' align='center'>
                {translate('Message.UnableToLoadGame')}
              </Typography>
            ) : (
              <CircularProgress />
            )}
          </EmptyGrid>
        ) : (
          <AssociatedItems universeId={gameDetails.id} activeItemType={activeItemType} />
        )}
      </Grid>
    </section>
  );
};

export default withTranslation(AssociatedItemsContainer, [
  TranslationNamespace.Creations,
  TranslationNamespace.AssetTypes,
  TranslationNamespace.Navigation,
]);
