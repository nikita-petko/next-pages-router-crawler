import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import { Typography, makeStyles, ChevronLeftIcon, Button, Divider } from '@rbx/ui';
import Flex from '../../components/Flex';
import NavigationTranslate from '../../hooks/NavigationTranslate';
import type { TProductKey } from '../../types';
import getProductTitle from '../../utils/getProductTitle';
import TopNavigationDrawer from './TopNavigationDrawer';
import TopNavigationDrawerProductHeader from './TopNavigationDrawerProductHeader';

type TopNavigationSidebarDrawerWithBackButtonProps = {
  productKey?: TProductKey;
  open: boolean;
  onClickBack: () => void;
  onClickClose: () => void;
  children?: React.ReactNode;
  backButtonKey: string;
};

const useStyles = makeStyles()((theme) => ({
  drawerContent: {
    padding: theme.spacing(0, 3),
  },
  backButtonContainer: {
    padding: theme.spacing(1, 3),
  },
  dividerContainer: {
    padding: theme.spacing(0, 3),
  },
}));

const TopNavigationSidebarDrawerWithBackButton: FunctionComponent<
  TopNavigationSidebarDrawerWithBackButtonProps
> = ({ open, onClickClose, onClickBack, children, backButtonKey, productKey = 'CreatorHub' }) => {
  const {
    classes: { drawerContent, backButtonContainer, dividerContainer },
  } = useStyles();
  const { translate } = useTranslation();
  const productTitle = getProductTitle(productKey);

  return (
    <TopNavigationDrawer open={open} onClose={onClickClose}>
      <TopNavigationDrawerProductHeader
        header={<NavigationTranslate content={productTitle} />}
        onClickClose={onClickClose}
      />
      <Flex flexDirection='row' alignItems='center' classes={{ root: backButtonContainer }}>
        <Button
          startIcon={<ChevronLeftIcon />}
          onClick={onClickBack}
          color='secondary'
          aria-label={translate('Action.Back')}>
          <Typography variant='captionHeader' color='primary'>
            {translate(backButtonKey)}
          </Typography>
        </Button>
      </Flex>
      <div className={dividerContainer}>
        <Divider />
      </div>
      <div className={drawerContent}>{children}</div>
    </TopNavigationDrawer>
  );
};

export default TopNavigationSidebarDrawerWithBackButton;
