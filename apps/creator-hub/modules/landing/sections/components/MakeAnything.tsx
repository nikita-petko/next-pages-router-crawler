import React, { FunctionComponent } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import useStudio, { EStudioTaskType } from '@modules/miscellaneous/hooks/useStudio';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Grid, Typography, Button, NoSSR } from '@rbx/ui';
import { makingPath } from '../constants/assetConstants';

import useMakeAnythingStyles from './MakeAnything.styles';

const Making: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const { translate } = useTranslation();
  const { open, isCompatible, dialog } = useStudio();
  const {
    classes: { root, imageContainer, contentContainer },
  } = useMakeAnythingStyles();

  return (
    <Grid className={root} container>
      <Grid className={contentContainer}>
        <Typography variant='h1' component='h1' align='center'>
          {translate('Heading.WorldIsOurs')}
        </Typography>
        <NoSSR>
          {isCompatible && (
            <Button
              variant='contained'
              color='primaryBrand'
              size='large'
              onClick={() => {
                open({
                  task: EStudioTaskType.Default,
                });
              }}>
              {translate('Action.StartCreatingWithStudio')}
            </Button>
          )}
        </NoSSR>
      </Grid>
      <Grid classes={{ root: imageContainer }} item>
        <img src={makingPath} alt={translate('Label.Experience')} />
      </Grid>
      {dialog}
    </Grid>
  );
};

export default withTranslation(Making, [
  TranslationNamespace.Landing,
  TranslationNamespace.Creations,
]);
