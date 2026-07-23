import type { ReactNode, FunctionComponent } from 'react';
import React from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, Typography } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useToolsGridItemStyles from './ToolsGridItem.styles';

interface ToolsGridItemProps {
  icon: ReactNode;
  headingTranslationKey: string;
  bodyTranslationKey: string;
}
const ToolsGridItem: FunctionComponent<React.PropsWithChildren<ToolsGridItemProps>> = ({
  icon,
  headingTranslationKey,
  bodyTranslationKey,
}) => {
  const { translate } = useTranslation();
  const {
    classes: { content, heading, root },
  } = useToolsGridItemStyles();

  return (
    <Grid className={root} item XSmall={12} Medium={6} Large={6} XLarge={3} XXLarge={3}>
      <Grid container direction='row' wrap='nowrap' justifyContent='space-between'>
        {icon}
        <Grid className={content} container direction='column'>
          <Typography className={heading} variant='h6' component='h6'>
            {translate(headingTranslationKey)}
          </Typography>
          <Typography variant='body2'>{translate(bodyTranslationKey)}</Typography>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default withTranslation(ToolsGridItem, [TranslationNamespace.Landing]);
