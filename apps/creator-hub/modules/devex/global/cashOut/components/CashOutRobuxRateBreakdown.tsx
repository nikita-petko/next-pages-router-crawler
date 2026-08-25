import type { FunctionComponent } from 'react';
import { numberFormatter } from '@rbx/core';
import { useTranslation } from '@rbx/intl';
import { Divider, Grid, InfoOutlinedIcon, RobuxIcon, Typography } from '@rbx/ui';
import { formatUsdPerRobuxRate } from '../utils/devexWatermarkUtil';
import useCashOutRobuxRateBreakdownStyles from './CashOutRobuxRateBreakdown.styles';

function formatCurrencyUsd(amount: number): string {
  return String(numberFormatter(amount, 'currency'));
}

type AmountStackClasses = {
  amountStackRoot: string;
  amountStackRobuxRow: string;
  amountStackUsd: string;
  amountStackUsdTypography: string;
  robuxAmountText: string;
};

/** Right column: Robux line + USD line, grouped and right-aligned (matches design reference). */
function AmountStack({
  robux,
  usdFormatted,
  classes,
}: {
  robux: number;
  usdFormatted: string;
  classes: AmountStackClasses;
}) {
  return (
    <div className={classes.amountStackRoot}>
      <Typography component='div'>
        <span className={`${classes.amountStackRobuxRow} text-body-medium`}>
          <RobuxIcon fontSize='small' />
          <span className={classes.robuxAmountText}>{robux.toLocaleString()}</span>
        </span>
      </Typography>
      <Typography
        className={`text-caption-medium ${classes.amountStackUsdTypography}`}
        component='div'>
        <span className={classes.amountStackUsd}>{usdFormatted}</span>
      </Typography>
    </div>
  );
}

export type CashOutRateBreakdownTierLine = {
  robux: number;
  usd: number;
  rate: number;
};

export type CashOutRobuxRateBreakdownProps = {
  /** O18 slice for this cash-out; omit block when `null` (e.g. `shouldDisplayEffectiveO18Robux` is false). */
  o18Tier: CashOutRateBreakdownTierLine | null;
  /** R35 + R38 section; individual tiers and the section heading are hidden when Robux is zero. */
  r35Tier: CashOutRateBreakdownTierLine;
  r38Tier: CashOutRateBreakdownTierLine;
  totalRobux: number;
  totalUsd: number;
  /** Used for “cashed out before …” copy on the R35 row. */
  r38UsdPerRobuxRate: number;
};

const CashOutRobuxRateBreakdown: FunctionComponent<CashOutRobuxRateBreakdownProps> = ({
  o18Tier,
  r35Tier,
  r38Tier,
  totalRobux,
  totalUsd,
  r38UsdPerRobuxRate,
}) => {
  const { translate } = useTranslation();
  const {
    classes: {
      root,
      tierRowSpaced,
      gridItemGrow,
      gridItemShrink,
      infoIconCell,
      tierNoteTextCell,
      amountStackRoot,
      amountStackRobuxRow,
      amountStackUsd,
      amountStackUsdTypography,
      robuxAmountText,
      ratesHeading,
      tierNoteGrid,
      infoIcon,
      dividerWrapper,
    },
  } = useCashOutRobuxRateBreakdownStyles();

  const amountStackClasses: AmountStackClasses = {
    amountStackRoot,
    amountStackRobuxRow,
    amountStackUsd,
    amountStackUsdTypography,
    robuxAmountText,
  };

  const laterRateFormatted = formatUsdPerRobuxRate(r38UsdPerRobuxRate);
  const tierOrderNote =
    translate('Message.CashOutRateBreakdownTierOrderNote' /* DevEx: CreatorDashboard.DevEx */, {
      DevExRate: laterRateFormatted,
    }) || `This rate will be cashed out before ${laterRateFormatted} rate`;

  const showO18Tier = o18Tier !== null && o18Tier.robux > 0;
  const showR35Tier = r35Tier.robux > 0;
  const showR38Tier = r38Tier.robux > 0;
  const showStandardRatesSection = showR35Tier || showR38Tier;
  const showTierOrderNoteOnR35 = showR35Tier && r38UsdPerRobuxRate > 0;
  const showTierSections = showO18Tier || showStandardRatesSection;

  const renderTierRow = (
    tier: CashOutRateBreakdownTierLine,
    options: { key: string; showTierOrderNote: boolean; spaced?: boolean },
  ) => (
    <Grid
      key={options.key}
      container
      justifyContent='space-between'
      alignItems='flex-start'
      wrap='nowrap'
      columnSpacing={1}
      className={options.spaced === true ? tierRowSpaced : undefined}>
      <Grid item className={gridItemGrow}>
        <Typography className='text-body-medium'>
          {translate('Label.CashOutRateBreakdownEarnedAt' /* DevEx: CreatorDashboard.DevEx */, {
            earnedRate: formatUsdPerRobuxRate(tier.rate),
          }) || `Earned at ${formatUsdPerRobuxRate(tier.rate)}`}
        </Typography>
        {options.showTierOrderNote ? (
          <Grid
            container
            wrap='nowrap'
            alignItems='flex-start'
            columnSpacing={0.5}
            className={tierNoteGrid}>
            <Grid item className={infoIconCell}>
              <InfoOutlinedIcon fontSize='small' color='secondary' className={infoIcon} />
            </Grid>
            <Grid item className={tierNoteTextCell}>
              <Typography className='text-body-small' component='div'>
                {tierOrderNote}
              </Typography>
            </Grid>
          </Grid>
        ) : null}
      </Grid>
      <Grid item className={gridItemShrink}>
        <AmountStack
          robux={tier.robux}
          usdFormatted={formatCurrencyUsd(tier.usd)}
          classes={amountStackClasses}
        />
      </Grid>
    </Grid>
  );

  return (
    <Grid
      container
      direction='column'
      data-testid='devex-form-robux-rate-breakdown'
      className={root}>
      {/* Part 1: O18 (US 18+) — hidden when API says not to show effective O18 balance detail or Robux is zero */}
      {showO18Tier ? (
        <Grid item>
          <Typography component='div' className={`text-title-medium ${ratesHeading}`}>
            {translate(
              'Heading.CashOutRateBreakdownUs18Plus' /* DevEx: CreatorDashboard.DevEx */,
            ) || 'US 18+ rate'}
          </Typography>
          <Grid container justifyContent='space-between' wrap='nowrap' columnSpacing={1}>
            <Grid item>
              <Typography className='text-body-medium' component='div'>
                {translate(
                  'Label.CashOutRateBreakdownEarnedAt' /* DevEx: CreatorDashboard.DevEx */,
                  { earnedRate: formatUsdPerRobuxRate(o18Tier.rate) },
                ) || `Earned at ${formatUsdPerRobuxRate(o18Tier.rate)}`}
              </Typography>
            </Grid>
            <Grid item className={gridItemShrink}>
              <AmountStack
                robux={o18Tier.robux}
                usdFormatted={formatCurrencyUsd(o18Tier.usd)}
                classes={amountStackClasses}
              />
            </Grid>
          </Grid>
        </Grid>
      ) : null}

      {/* Part 2: R35 + R38 — hidden when both tiers have zero Robux */}
      {showStandardRatesSection ? (
        <Grid item>
          <Typography component='div' className={`text-title-medium ${ratesHeading}`}>
            {translate(
              'Heading.CashOutRateBreakdownStandardRates' /* DevEx: CreatorDashboard.DevEx */,
            ) || 'Standard rates'}
          </Typography>
          {showR35Tier
            ? renderTierRow(r35Tier, { key: 'R35', showTierOrderNote: showTierOrderNoteOnR35 })
            : null}
          {showR38Tier
            ? renderTierRow(r38Tier, {
                key: 'R38',
                showTierOrderNote: false,
                spaced: showR35Tier,
              })
            : null}
        </Grid>
      ) : null}

      {showTierSections ? (
        <Grid item className={dividerWrapper}>
          <Divider />
        </Grid>
      ) : null}

      <Grid item>
        <Grid
          container
          justifyContent='space-between'
          alignItems='center'
          wrap='nowrap'
          columnSpacing={1}>
          <Grid item className={gridItemGrow}>
            <Typography className='text-title-medium'>
              {translate('Label.CashOutRateBreakdownTotal' /* DevEx: CreatorDashboard.DevEx */) ||
                'Total'}
            </Typography>
          </Grid>
          <Grid item className={gridItemShrink}>
            <AmountStack
              robux={totalRobux}
              usdFormatted={formatCurrencyUsd(totalUsd)}
              classes={amountStackClasses}
            />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default CashOutRobuxRateBreakdown;
