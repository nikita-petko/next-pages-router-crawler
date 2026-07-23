import React from 'react';
import { withTranslation } from '@rbx/intl';
import { Typography, makeStyles, Select, MenuItem } from '@rbx/ui';
import { CreatorThumbnailContainer } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { TCreator } from '../providers/CreatorProvider';
import { useCreator } from '../providers/CreatorProvider';
import { captureHomepageEvent, EHomepageSection } from '../utils/eventUtils';
import Section from './common/Section';

const useStyles = makeStyles()((theme) => ({
  menuItem: {
    display: 'flex',
  },
  thumbnail: {
    height: 24,
    width: 24,
    marginRight: 8,
  },
  root: {
    display: 'flex',
    marginBottom: 48,
    flexDirection: 'column',
    alignItems: 'flex-start',
    [theme.breakpoints.down('Large')]: {
      alignItems: 'center',
      marginBottom: 24,
    },
  },
}));

const ContextSwitcher = () => {
  const { context, contexts, updateContext } = useCreator();
  const {
    classes: { thumbnail, root, menuItem },
  } = useStyles();

  if (contexts.length === 1) {
    return null;
  }

  return (
    <Section classes={{ root }}>
      <Select
        size='small'
        onClick={() => {
          captureHomepageEvent('clickContextMenu', EHomepageSection.ContextSwitcher);
        }}
        disabled={contexts.length === 1}
        onChange={(event) => {
          const creator = JSON.parse(event.target.value) as TCreator;
          captureHomepageEvent('clickContextSwitch', EHomepageSection.ContextSwitcher, {
            userId: creator.type === 'User' ? creator.id : '',
            groupId: creator.type === 'Group' ? creator.id : '',
          });
          updateContext(creator);
        }}
        value={JSON.stringify(context)}>
        {contexts.map((item) => (
          <MenuItem key={item.id} value={JSON.stringify(item)}>
            <div className={menuItem}>
              <CreatorThumbnailContainer
                className={thumbnail}
                creator={{
                  creatorId: Number(item.id),
                  creatorName: item.name,
                  creatorType: item.type,
                }}
              />
              <Typography variant='body1'>{item.name}</Typography>
            </div>
          </MenuItem>
        ))}
      </Select>
    </Section>
  );
};

export default withTranslation(ContextSwitcher, [TranslationNamespace.Home]);
