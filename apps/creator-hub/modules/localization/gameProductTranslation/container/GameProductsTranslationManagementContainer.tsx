import { Divider, Grid, Typography, WarningIcon } from '@rbx/ui';
import React, { FunctionComponent, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import useEntryManagementMetadata from '../../translation/hooks/useEntryManagementMetadata';
import ProductList from '../components/ProductList';
import useGameProductsTranslationManagementContainerStyles from './GameProductsTranslationManagementContainer.styles';
import SelectedItemDetailProvider from '../components/SelectedItemDetailProvider';
import SaveGameProductTranslation from '../components/SaveGameProductTranslation';
import SaveGameProductIcon from '../components/SaveGameProductIcon';

const GameProductsTranslationManagementContainer: FunctionComponent<
  React.PropsWithChildren<unknown>
> = () => {
  const {
    classes: { verticalDivider, entrySide, translationSide, errorText, errorTextGrid },
  } = useGameProductsTranslationManagementContainerStyles();
  const { gameId } = useEntryManagementMetadata();
  const { translate } = useTranslation();
  const [fetchDataError, setFetchDataError] = useState<Error | null>(null);

  if (fetchDataError) {
    return (
      <Grid className={errorTextGrid} container justifyContent='center' alignItems='center'>
        <WarningIcon />
        <Typography className={errorText} variant='alertTitle'>
          {translate('Message.FailedToFetchEntryData')}
        </Typography>
      </Grid>
    );
  }

  return (
    <Grid container wrap='nowrap'>
      <SelectedItemDetailProvider>
        <Grid className={entrySide}>
          <ProductList universeId={gameId} onFetchProductListError={setFetchDataError} />
        </Grid>
        <Divider orientation='vertical' className={verticalDivider} />
        <Grid className={translationSide}>
          <SaveGameProductTranslation />
          <SaveGameProductIcon />
        </Grid>
      </SelectedItemDetailProvider>
    </Grid>
  );
};

export default GameProductsTranslationManagementContainer;
