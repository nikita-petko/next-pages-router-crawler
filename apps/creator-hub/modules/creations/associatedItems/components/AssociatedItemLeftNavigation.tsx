import { Fragment, useMemo } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import Features from '@modules/navigation/leftNavigation/components/Features';
import useLeftNavigationStyles from '@modules/navigation/leftNavigation/components/LeftNavigation.styles';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { dashboard } from '@modules/miscellaneous/common/urls/creatorHub';
import { ArrowBackIcon, Divider, Grid, Typography, Button } from '@rbx/ui';
import { useSettings } from '@modules/settings';
import {
  Item,
  itemFullNameKeys,
  itemTypeToPath,
  itemTypeToSingularNameKeys,
} from '@modules/miscellaneous/common';
import {
  badgeItemFeatureManager,
  developerProductItemFeatureManager,
  experienceSubscriptionFeatureManager,
} from '../associatedItemFeatureManagers';
import AssociatedItemStatus from './AssociatedItemStatus';

const AssociatedItemLeftNavigation = () => {
  const { translate } = useTranslation();
  const router = useRouter();
  const { settings } = useSettings();
  const { classes: styles } = useLeftNavigationStyles();

  const currentItemType = useMemo(() => {
    if (router.pathname.includes(itemTypeToPath[Item.ExperienceSubscription])) {
      return Item.ExperienceSubscription;
    }
    if (router.pathname.includes(itemTypeToPath[Item.Badge])) {
      return Item.Badge;
    }
    if (router.pathname.includes(itemTypeToPath[Item.GamePass])) {
      return Item.GamePass;
    }
    if (router.pathname.includes(itemTypeToPath[Item.DeveloperProduct])) {
      return Item.DeveloperProduct;
    }
    return undefined;
  }, [router.pathname]);

  const getCurrentFeatures = useMemo(() => {
    if (currentItemType === Item.DeveloperProduct) {
      return developerProductItemFeatureManager.getAllFeatures();
    }
    if (currentItemType === Item.ExperienceSubscription) {
      return experienceSubscriptionFeatureManager.getAllFeatures();
    }
    return badgeItemFeatureManager.getAllFeatures();
  }, [currentItemType]);

  const features = getCurrentFeatures.filter(
    (feature) => feature.isEnabledOnSettings?.(settings) ?? true,
  );

  const activeFeature = useMemo(
    () => features.find((feature) => feature.path && router.pathname.endsWith(feature.path)),
    [features, router],
  );

  const backLinkPath = useMemo(() => {
    const universeId = Number(router.query.id);

    if (currentItemType === Item.GamePass) {
      return dashboard.getMonetizationPassesUrl(universeId);
    }
    if (currentItemType === Item.DeveloperProduct) {
      return dashboard.getMonetizationDeveloperProductsUrl(universeId);
    }

    return `/dashboard/creations/experiences/${universeId}/associated-items?activeTab=${currentItemType}`;
  }, [currentItemType, router.query.id]);

  return (
    <Fragment>
      <Grid item container direction='column'>
        <Button
          component={NextLink}
          size='small'
          color='primary'
          className={styles.backButton}
          startIcon={<ArrowBackIcon />}
          href={backLinkPath}>
          {translate('Action.BackToItemType', {
            itemType: translate(itemFullNameKeys[currentItemType as Item]),
          })}
        </Button>
        <Typography className={styles.sidebarHeaderText} variant='overline'>
          {translate(itemTypeToSingularNameKeys[currentItemType as Item])}
        </Typography>
        <AssociatedItemStatus currentItemType={currentItemType} />
        <Divider className={styles.divider} />
      </Grid>
      <Grid item container direction='column'>
        <Features
          features={features}
          activeFeature={activeFeature}
          title=''
          name={currentItemType}
        />
      </Grid>
    </Fragment>
  );
};

export default withTranslation(AssociatedItemLeftNavigation, [
  TranslationNamespace.Creations,
  TranslationNamespace.AssetTypes,
  TranslationNamespace.Navigation,
]);
