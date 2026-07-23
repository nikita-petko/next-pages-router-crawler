import { Fragment, memo, useMemo, useState } from 'react';
import NextLink from 'next/link';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  makeStyles,
  type TBannerProps,
} from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { dashboard } from '@modules/miscellaneous/common/urls/creatorHub';
import { useOverviewRegionalPricingPromotionBanner } from '../../hooks/useRegionalPricingPromotionBanner';
import BaseRegionalPricingPromotionBanner from './BaseRegionalPricingPromotionBanner';

type RegionalPricingPromotionBannerProps = {
  universeId: number;
  className?: string;
};

const useSelectProductTypeDialogStyles = makeStyles()((theme) => ({
  actions: {
    display: 'flex',
    justifyContent: 'center',
    gap: theme.spacing(1.5),
    [theme.breakpoints.down('Medium')]: {
      flexDirection: 'column',
    },
    // Override default margin-left on MUI DialogActions
    '& :not(:first-child)': {
      marginLeft: 0,
    },
  },
  button: {
    minWidth: '200px',
    width: '50%',
    [theme.breakpoints.down('Medium')]: {
      width: '100%',
    },
  },
}));

const SelectProductTypeDialog = ({
  universeId,
  isOpen,
  onClose,
}: {
  universeId: number;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const { translate } = useTranslation();
  const { classes } = useSelectProductTypeDialogStyles();

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogTitle>{translate('Heading.PromotionChooseProductType')}</DialogTitle>
      <DialogContent>
        <DialogContentText>{translate('Description.PromotionChooseProductType')}</DialogContentText>
      </DialogContent>
      <DialogActions className={classes.actions}>
        <Button
          className={classes.button}
          size='large'
          variant='outlined'
          color='inherit'
          component={NextLink}
          href={dashboard.getMonetizationDeveloperProductsUrl(universeId)}>
          {translate('Label.DeveloperProducts')}
        </Button>
        <Button
          className={classes.button}
          size='large'
          variant='contained'
          color='secondary'
          component={NextLink}
          href={dashboard.getMonetizationPassesUrl(universeId)}>
          {translate('Label.GamePasses')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Promotion banner for regional pricing on the monetization overview page.
 */
const OverviewRegionalPricingPromotionBanner = ({
  universeId,
  className,
}: RegionalPricingPromotionBannerProps) => {
  const { translate } = useTranslation();

  const { isOpen, close } = useOverviewRegionalPricingPromotionBanner(universeId);

  const [isSelectProductTypeDialogOpen, setIsSelectProductTypeDialogOpen] = useState(false);

  const primary: TBannerProps['primary'] = useMemo(
    () => ({
      label: translate('Action.GetStarted'),
      onClick: () => setIsSelectProductTypeDialogOpen(true),
    }),
    [translate],
  );

  return (
    <Fragment>
      <BaseRegionalPricingPromotionBanner
        universeId={universeId}
        page='monetization/overview'
        primary={primary}
        isOpen={isOpen}
        onClose={close}
        className={className}
      />

      <SelectProductTypeDialog
        universeId={universeId}
        isOpen={isSelectProductTypeDialogOpen}
        onClose={() => setIsSelectProductTypeDialogOpen(false)}
      />
    </Fragment>
  );
};

export default withTranslation(memo(OverviewRegionalPricingPromotionBanner), [
  TranslationNamespace.RegionalPricing,
]);
