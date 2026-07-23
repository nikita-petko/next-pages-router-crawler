import type { FunctionComponent } from 'react';
import React from 'react';
import { makeStyles } from '@rbx/ui';
import NavigationTranslate from '../../hooks/NavigationTranslate';
import type { TProductKey } from '../../types';
import getProductTitle from '../../utils/getProductTitle';
import TopNavigationDrawer from './TopNavigationDrawer';
import TopNavigationDrawerProductHeader from './TopNavigationDrawerProductHeader';

type TopNavigationSidebarDrawerWithHeaderProps = {
  productKey?: TProductKey;
  open: boolean;
  onClickClose: () => void;
  children?: React.ReactNode;
};
const useStyles = makeStyles()((theme) => ({
  drawerContent: {
    padding: theme.spacing(2, 3),
  },
}));

const TopNavigationSidebarDrawerWithHeader: FunctionComponent<
  TopNavigationSidebarDrawerWithHeaderProps
> = ({ open, onClickClose, children, productKey = 'CreatorHub' }) => {
  const {
    classes: { drawerContent },
  } = useStyles();
  const productTitle = getProductTitle(productKey);

  return (
    <TopNavigationDrawer open={open} onClose={onClickClose}>
      <TopNavigationDrawerProductHeader
        header={<NavigationTranslate content={productTitle} />}
        onClickClose={onClickClose}
      />
      <div className={drawerContent}>{children}</div>
    </TopNavigationDrawer>
  );
};

export default TopNavigationSidebarDrawerWithHeader;
