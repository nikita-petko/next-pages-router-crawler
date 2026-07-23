import { useState, useMemo, useCallback, useEffect } from 'react';
import type { PurchaseRevSharePayout } from '@rbx/client-developer-subscriptions-api/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  Alert,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  Typography,
  RobuxIcon,
  Tooltip,
  InfoOutlinedIcon,
  Link,
  CelebrationIcon,
} from '@rbx/ui';
import { SUBSCRIPTION_LEARN_MORE_PRICING_URL } from '@modules/miscellaneous/common/constants/linkConstants';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  MinimumRobuxPriceForSubscription,
  DeveloperSharePercentageForRobuxSubscriptions,
} from '../../constants/CreateSubscriptionRegisterConstants';
import RevShareDemoTabs from '../../enums/RevShareDemoTabs';
import usNumberFormatter from '../../utils/usNumberFormatter';
import useSubscriptionFormStyles from '../ExperienceSubscription.styles';

type TRevshareCalculationDemoProps = {
  webRevSharePayout?: PurchaseRevSharePayout;
  appStoreRevSharePayout?: PurchaseRevSharePayout;
  isRobuxMode?: boolean;
};

function RevshareCalculationDemo({
  webRevSharePayout,
  appStoreRevSharePayout,
  isRobuxMode = false,
}: TRevshareCalculationDemoProps) {
  const { translate, translateHTML } = useTranslation();
  const {
    classes: {
      platformFeeBanner,
      tabsContainer,
      revshareCardTab,
      revshareCardContent,
      revshareCardHeading,
      revshareTextBox,
      mutedText,
      boxGrid,
      robuxIconStyle,
      toolTipInfoIcon,
      alertText,
      celebrationIconColor,
      revsharePriceText,
    },
  } = useSubscriptionFormStyles();

  const [selectedTabValue, setSelectedTabValue] = useState(RevShareDemoTabs.WebDesktop);
  const [selectedRevShareTabContent, setSelectedRevShareTabContent] = useState<
    PurchaseRevSharePayout | undefined
  >(webRevSharePayout);

  useEffect(() => {
    setSelectedTabValue(RevShareDemoTabs.WebDesktop);
    setSelectedRevShareTabContent(webRevSharePayout);
  }, [webRevSharePayout, appStoreRevSharePayout]);

  const isDefaultTabState = webRevSharePayout === undefined && appStoreRevSharePayout === undefined;

  const isRobuxSubscription = useMemo(() => {
    if (!selectedRevShareTabContent) {
      return false;
    }
    const { priceTier, firstPurchasePayoutInRobux } = selectedRevShareTabContent;
    if (!priceTier?.units || priceTier.units < MinimumRobuxPriceForSubscription) {
      return false;
    }
    return (
      priceTier.cents === 0 &&
      firstPurchasePayoutInRobux !== undefined &&
      Math.abs(
        firstPurchasePayoutInRobux -
          Math.floor(priceTier.units * DeveloperSharePercentageForRobuxSubscriptions),
      ) <= 1
    );
  }, [selectedRevShareTabContent]);

  const learnMoreAboutSubscribersPay = useMemo(() => {
    return (
      <Typography align='center' variant='body2'>
        {translate('Description.SubscribersPayLearnMore')}
      </Typography>
    );
  }, [translate]);

  const learnMoreAboutEarning = useMemo(() => {
    return (
      <Typography align='center' variant='body2'>
        {translateHTML('Description.YouEarnLearnMore', [
          {
            opening: 'LearnMoreLinkStart',
            closing: 'LearnMoreLinkEnd',
            content(chunks) {
              return (
                <Link href={SUBSCRIPTION_LEARN_MORE_PRICING_URL} target='_blank'>
                  {chunks}
                </Link>
              );
            },
          },
        ])}
      </Typography>
    );
  }, [translateHTML]);

  const handleTabSelection = useCallback(
    (selectedTab: RevShareDemoTabs) => {
      setSelectedTabValue(selectedTab);
      switch (selectedTab) {
        case RevShareDemoTabs.AppStore:
          setSelectedRevShareTabContent(appStoreRevSharePayout);
          break;
        default:
          setSelectedRevShareTabContent(webRevSharePayout);
      }
    },
    [appStoreRevSharePayout, webRevSharePayout],
  );

  const revshareStatTab = useMemo(() => {
    if (isRobuxMode) {
      return (
        <Grid classes={{ root: revshareTextBox }}>
          <Grid item XSmall={12} classes={{ root: boxGrid }}>
            <Typography display='block' className={mutedText}>
              {translate('Heading.SubscribersPay')}
            </Typography>
            <Typography component='p' variant='h3' className={revsharePriceText}>
              <RobuxIcon color='inherit' fontSize='inherit' className={robuxIconStyle} />{' '}
              {isDefaultTabState ? (
                <span>--</span>
              ) : (
                usNumberFormatter(selectedRevShareTabContent?.priceTier?.units)
              )}
            </Typography>
          </Grid>
          <Grid item XSmall={12} classes={{ root: boxGrid }}>
            <Typography display='block' className={mutedText} paddingBottom={1}>
              {translate('Label.FirstPurchaseAndRenewalEarnings')}
            </Typography>
            <Typography component='p' variant='h4'>
              <RobuxIcon color='inherit' fontSize='inherit' className={robuxIconStyle} />{' '}
              {usNumberFormatter(selectedRevShareTabContent?.firstPurchasePayoutInRobux)}
            </Typography>
          </Grid>
        </Grid>
      );
    }

    return (
      <Grid classes={{ root: revshareTextBox }}>
        <Grid item XSmall={6} classes={{ root: boxGrid }}>
          <Typography variant='subtitle1' className={mutedText}>
            {translate('Heading.SubscribersPay')}
            <Tooltip arrow title={learnMoreAboutSubscribersPay} placement='right'>
              <InfoOutlinedIcon fontSize='inherit' className={toolTipInfoIcon} />
            </Tooltip>
          </Typography>
          {(() => {
            if (isDefaultTabState) {
              return (
                <Typography component='p' variant='h3' className={revsharePriceText}>
                  $ --
                </Typography>
              );
            }
            if (isRobuxSubscription) {
              return (
                <Typography component='p' variant='h3' className={revsharePriceText}>
                  <RobuxIcon color='inherit' fontSize='inherit' className={robuxIconStyle} />{' '}
                  {usNumberFormatter(selectedRevShareTabContent?.priceTier?.units)}
                </Typography>
              );
            }
            return (
              <Typography component='p' variant='h3' className={revsharePriceText}>
                ${selectedRevShareTabContent?.priceTier?.units}.
                {String(selectedRevShareTabContent?.priceTier?.cents || 0).padStart(2, '0')}
              </Typography>
            );
          })()}
        </Grid>
        <Grid item XSmall={6} classes={{ root: boxGrid }}>
          <Typography variant='subtitle1' className={mutedText}>
            {translate('Heading.YouEarn')}
            <Tooltip arrow title={learnMoreAboutEarning} placement='right'>
              <InfoOutlinedIcon fontSize='inherit' className={toolTipInfoIcon} />
            </Tooltip>
          </Typography>
        </Grid>
        <Grid container direction='row' alignItems='center'>
          <Grid item XSmall={6} classes={{ root: boxGrid }}>
            <Typography
              noWrap
              display='block'
              variant='body1'
              boxSizing='border-box'
              paddingBottom={1}
              className={mutedText}>
              {translate('Label.FirstPurchase')}
            </Typography>
            <span>
              <Typography align='center' variant='h4'>
                <RobuxIcon color='inherit' fontSize='inherit' className={robuxIconStyle} />{' '}
                {usNumberFormatter(selectedRevShareTabContent?.firstPurchasePayoutInRobux)}
              </Typography>
            </span>
          </Grid>
          <Grid item XSmall={6}>
            <Typography
              noWrap
              display='block'
              variant='body1'
              paddingBottom={1}
              className={mutedText}>
              {translate('Label.Renewals')}
            </Typography>
            <span>
              <Typography align='center' variant='h4'>
                <RobuxIcon color='inherit' fontSize='inherit' className={robuxIconStyle} />{' '}
                {usNumberFormatter(selectedRevShareTabContent?.renewalPayoutAmountInRobux)}
              </Typography>
            </span>
          </Grid>
        </Grid>
      </Grid>
    );
  }, [
    selectedRevShareTabContent,
    boxGrid,
    isDefaultTabState,
    isRobuxMode,
    isRobuxSubscription,
    learnMoreAboutEarning,
    learnMoreAboutSubscribersPay,
    mutedText,
    robuxIconStyle,
    toolTipInfoIcon,
    revshareTextBox,
    revsharePriceText,
    translate,
  ]);

  return (
    <Card variant='filled'>
      <CardContent classes={{ root: revshareCardContent }}>
        <div className={revshareCardHeading}>
          {translate('Heading.YourEarnings')}
          <Tooltip arrow title={learnMoreAboutEarning} placement='right'>
            <InfoOutlinedIcon fontSize='inherit' className={toolTipInfoIcon} />
          </Tooltip>
        </div>
        {!isRobuxMode && (
          <Tabs
            orientation='horizontal'
            value={selectedTabValue}
            classes={{ root: tabsContainer }}
            variant='standard'>
            <Tab
              classes={{ root: revshareCardTab }}
              label={translate('Action.DesktopRevShare')}
              value={RevShareDemoTabs.WebDesktop}
              onClick={() => handleTabSelection(RevShareDemoTabs.WebDesktop)}
            />
            <Tab
              classes={{ root: revshareCardTab }}
              label={translate('Action.AppStores')}
              value={RevShareDemoTabs.AppStore}
              onClick={() => handleTabSelection(RevShareDemoTabs.AppStore)}
            />
          </Tabs>
        )}
        {revshareStatTab}
      </CardContent>
      {!isRobuxMode && !isRobuxSubscription && (
        <Alert
          icon={<CelebrationIcon className={celebrationIconColor} />}
          color='info'
          classes={{
            root: platformFeeBanner,
          }}
          severity='success'
          variant='standard'>
          <Typography className={alertText}>{translate('Description.NoPlatformFee')}</Typography>
        </Alert>
      )}
    </Card>
  );
}

export default withTranslation(RevshareCalculationDemo, [
  TranslationNamespace.ExperienceSubscriptions,
]);
