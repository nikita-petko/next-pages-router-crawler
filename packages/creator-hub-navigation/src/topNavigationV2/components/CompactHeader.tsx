import React, { FunctionComponent, PropsWithChildren } from 'react';
import { IconButton, Link, MenuIcon, Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { clickMenuIconEventModel } from '../../event/eventConstants';
import { TSendEvent } from '../../providers/EventProvider';
import { TNavigationTab } from '../constants';
import useHeaderStyles from './Header.styles';

type TCompactHeaderProps = {
  productTab?: TNavigationTab;
  creatorHubUrl: string;
  sendEvent: TSendEvent;
  openDrawer: VoidFunction;
};

const CompactHeader: FunctionComponent<PropsWithChildren<TCompactHeaderProps>> = ({
  productTab,
  creatorHubUrl,
  sendEvent,
  openDrawer,
}) => {
  const {
    classes: { heading, link },
  } = useHeaderStyles();
  const { translate } = useTranslation();

  return (
    <React.Fragment>
      <IconButton
        color='secondary'
        onClick={() => {
          sendEvent(clickMenuIconEventModel);
          openDrawer();
        }}
        aria-label='button'>
        <MenuIcon />
      </IconButton>
      <Link classes={{ root: link }} href={productTab?.href || creatorHubUrl}>
        <Typography variant='h5' classes={{ root: heading }}>
          {translate(productTab?.title || 'Heading.Creator')}
        </Typography>
      </Link>
    </React.Fragment>
  );
};

export default CompactHeader;
