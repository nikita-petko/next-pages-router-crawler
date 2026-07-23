import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import { LaunchIcon, makeStyles } from '@rbx/ui';

const useAttributionTextStyles = makeStyles()(() => ({
  attributionName: {
    fontWeight: 500,
    paddingLeft: 6,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 160,
    whiteSpace: 'nowrap',
  },
}));

const DeveloperItemAttributionText: FunctionComponent<
  React.PropsWithChildren<{ name: string }>
> = ({ name }) => {
  const { classes: styles } = useAttributionTextStyles();
  const { translateHTML } = useTranslation();
  return (
    <>
      {translateHTML('Action.OpenInExperience', null, {
        experienceName: <span className={styles.attributionName}>{name}</span>,
      })}
      <LaunchIcon />
    </>
  );
};

export default DeveloperItemAttributionText;
