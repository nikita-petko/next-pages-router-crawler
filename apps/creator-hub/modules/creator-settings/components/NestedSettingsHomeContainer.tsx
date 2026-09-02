import { useRouter } from 'next/router';
import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import { CircularProgress, Grid, Typography } from '@rbx/ui';
import { EmptyGrid } from '@modules/miscellaneous/components';
import NestedSettingsCategoryLink from './NestedSettingsCategoryLink';
import useNestedSettingsHomeContainerStyles from './NestedSettingsHomeContainer.styles';

export type NestedSettingsItem = {
  key: string;
  title: string;
  content: string;
};

type NestedSettingsHomeContainerProps = {
  description: string;
  directory: string;
  items: NestedSettingsItem[];
};

const NestedSettingsHomeContainer: FunctionComponent<
  React.PropsWithChildren<NestedSettingsHomeContainerProps>
> = ({ description, directory, items }) => {
  const { translate, ready: translateReady } = useTranslation();
  const { classes: styles } = useNestedSettingsHomeContainerStyles();
  const router = useRouter();

  if (!translateReady) {
    return (
      <EmptyGrid>
        <CircularProgress />
      </EmptyGrid>
    );
  }

  const settingsTable = items.map((category, index: number) => {
    return (
      <NestedSettingsCategoryLink
        key={category.key}
        categoryKey={category.key || ''}
        categoryFriendlyKey={translate(`${category.title}`)}
        categoryDescription={translate(`${category.content}`)}
        onClick={() => router.push(`${directory}/${category.key}`)}
        divider={index !== Object.keys(items).length - 1}
      />
    );
  });

  return (
    <Grid className={styles.grid} container direction='column'>
      <Grid className={styles.titleRowGap} item container direction='column'>
        <Grid item>
          <Typography variant='body1'>{description}</Typography>
        </Grid>
      </Grid>
      <Grid container direction='column'>
        {settingsTable}
      </Grid>
    </Grid>
  );
};

export default NestedSettingsHomeContainer;
