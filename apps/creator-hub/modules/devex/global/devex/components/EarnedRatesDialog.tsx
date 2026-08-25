import type { FunctionComponent } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Dialog,
  Typography,
  RobuxIcon,
  IconButton,
  CloseIcon,
  InfoOutlinedIcon,
  Link,
} from '@rbx/ui';
import { DEVEX_HELP_URL } from '../../constants/externalLinkConstants';
import { useEarnedRatesDialogStyles } from './EarnedRatesDialog.styles';

interface DevexRateTier {
  labelKey: string;
  fallbackLabel: string;
}

const PREFERRED_RATE: DevexRateTier = {
  labelKey: 'Label.US18Rate',
  fallbackLabel: 'US 18+ rate',
};

const STANDARD_RATES: DevexRateTier[] = [
  {
    labelKey: 'Label.StandardRateBeforeSept52025',
    fallbackLabel: 'Before Sept 5, 2025',
  },
  {
    labelKey: 'Label.StandardRateAfterSept52025',
    fallbackLabel: 'After Sept 5, 2025',
  },
];

interface EarnedRatesDialogProps {
  open: boolean;
  onClose: () => void;
  /** USD per 1 Robux for the O18 tier. Falls back to hardcoded rate when undefined. */
  o18Rate?: number;
  /** USD per 1 Robux for the R35 tier. Falls back to hardcoded rate when undefined. */
  r35Rate?: number;
  /** USD per 1 Robux for the R38 tier. Falls back to hardcoded rate when undefined. */
  r38Rate?: number;
  /** Whether to show the O18 preferred rate section. Defaults to true when undefined. */
  showO18?: boolean;
}

const ROBUX_PER_DISPLAY_UNIT = 10_000;
const FALLBACK_PREFERRED_USD = 54;
const FALLBACK_R35_USD = 35;
const FALLBACK_R38_USD = 38;

/** Converts a USD-per-robux rate to the dollar amount for `ROBUX_PER_DISPLAY_UNIT` robux. */
const rateToUsdPerUnit = (ratePerRobux: number) =>
  Math.round(ratePerRobux * ROBUX_PER_DISPLAY_UNIT);

const formatRate = (usdAmount: number) =>
  `${ROBUX_PER_DISPLAY_UNIT.toLocaleString()} = $${usdAmount} USD`;

const EarnedRatesDialog: FunctionComponent<EarnedRatesDialogProps> = ({
  open,
  onClose,
  o18Rate,
  r35Rate,
  r38Rate,
  showO18 = false,
}) => {
  const { classes } = useEarnedRatesDialogStyles();
  const { translate } = useTranslation();

  const preferredUsd = o18Rate ? rateToUsdPerUnit(o18Rate) : FALLBACK_PREFERRED_USD;
  const r35Usd = r35Rate ? rateToUsdPerUnit(r35Rate) : FALLBACK_R35_USD;
  const r38Usd = r38Rate ? rateToUsdPerUnit(r38Rate) : FALLBACK_R38_USD;
  const r38RateText = `$${(r38Rate ?? FALLBACK_R38_USD / ROBUX_PER_DISPLAY_UNIT).toFixed(4)}`;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{ className: classes.paper }}>
      <IconButton
        onClick={onClose}
        aria-label='Close'
        size='small'
        color='inherit'
        className={classes.closeButton}>
        <CloseIcon color='inherit' />
      </IconButton>
      <div className='padding-large'>
        <Typography component='h2' className='text-heading-small'>
          {translate('Heading.EarnedRates') || 'DevEx rates'}
        </Typography>
        <Typography component='p' className='text-body-medium'>
          {translate('Description.EarnedRatesInfo') ||
            'Your cash-out rates depend on how and when you earned your Robux.'}
        </Typography>

        {showO18 && (
          <div className={classes.sectionContainer}>
            <Typography component='p' className='body-medium'>
              {translate(PREFERRED_RATE.labelKey) || PREFERRED_RATE.fallbackLabel}
            </Typography>
            <div className={classes.rateRow}>
              <RobuxIcon fontSize='large' />
              <Typography className='text-title-large'>{formatRate(preferredUsd)}</Typography>
            </div>
          </div>
        )}

        <div className={classes.sectionContainer}>
          <Typography className='text-label-large'>
            {translate('Label.StandardRates') || 'Standard rates'}
          </Typography>
          {[
            {
              labelKey: STANDARD_RATES[0].labelKey,
              fallbackLabel: STANDARD_RATES[0].fallbackLabel,
              usdAmount: r35Usd,
            },
            {
              labelKey: STANDARD_RATES[1].labelKey,
              fallbackLabel: STANDARD_RATES[1].fallbackLabel,
              usdAmount: r38Usd,
            },
          ].map((tier, index) => (
            <div
              key={tier.labelKey}
              className={classes.tierContainer}
              style={{ marginTop: index === 0 ? 7 : 12 }}>
              <Typography className='text-body-medium'>
                {translate(tier.labelKey) || tier.fallbackLabel}
              </Typography>
              <div className={classes.rateRow} style={{ marginTop: 4 }}>
                <RobuxIcon fontSize='large' />
                <Typography className='text-title-large'>{formatRate(tier.usdAmount)}</Typography>
              </div>
              {index === 0 && (
                <div className={classes.rateInfoRow}>
                  <InfoOutlinedIcon
                    color='secondary'
                    className={classes.infoIcon}
                    style={{ position: 'relative', top: -2 }}
                  />
                  <Typography className='text-body-small'>
                    {translate(
                      'Message.StandardRateCashoutOrder' /* TranslationNamespace.DevEx */,
                      {
                        rate: r38RateText,
                      },
                    ) || `This rate will be cashed out before the ${r38RateText} rate`}
                  </Typography>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className={classes.footer}>
          <InfoOutlinedIcon color='secondary' className={classes.infoIcon} />
          <Typography className='text-body-small'>
            {translate('Message.EligibleRatesMayDiffer') ||
              'Eligible rates may be different than your balance.'}{' '}
            <Link href={DEVEX_HELP_URL} target='_blank' className={classes.footerLink}>
              {translate('Action.LearnMore') || 'Learn more'}
            </Link>
          </Typography>
        </div>
      </div>
    </Dialog>
  );
};

export default EarnedRatesDialog;
