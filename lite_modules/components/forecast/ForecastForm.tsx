import { Divider, Dropdown, IconButton, Menu, MenuItem, TextInput } from '@rbx/foundation-ui';
import { NumericFormat } from 'react-number-format';

import {
  CONTINUOUS_DURATION_VALUE,
  FORECAST_DURATION_DAYS_OPTIONS,
  ForecastDurationValue,
} from '@components/forecast/ForecastEstimator.utils';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

type ForecastFormProps = {
  budgetFieldError?: string;
  budgetFieldLabel: string;
  budgetHasInput: boolean;
  budgetUsd: string;
  calculatedBudgetUsd: string;
  calculatedPlays: string;
  durationInDays: ForecastDurationValue;
  onBudgetUsdChange: (value: string) => void;
  onDurationChange: (value: string) => void;
  onPlaysChange: (value: string) => void;
  onResetInputs: () => void;
  plays: string;
  playsFieldError?: string;
  playsFieldLabel: string;
  playsHasInput: boolean;
};

const ForecastForm = ({
  budgetFieldError,
  budgetFieldLabel,
  budgetHasInput,
  budgetUsd,
  calculatedBudgetUsd,
  calculatedPlays,
  durationInDays,
  onBudgetUsdChange,
  onDurationChange,
  onPlaysChange,
  onResetInputs,
  plays,
  playsFieldError,
  playsFieldLabel,
  playsHasInput,
}: ForecastFormProps) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Forecast);

  const budgetHelperText =
    budgetHasInput && !budgetFieldError ? translate('Description.BudgetHelper') : undefined;

  const playsHelperText =
    playsHasInput && !playsFieldError ? translate('Description.PlaysHelper') : undefined;

  return (
    <section className='flex flex-col gap-large padding-top-xlarge'>
      <Dropdown
        label={translate('Label.CampaignDuration')}
        onValueChange={onDurationChange}
        placeholder={translate('Label.CampaignDuration')}
        size='Medium'
        value={durationInDays}>
        <Menu>
          <MenuItem
            title={translate('Label.DurationContinuous')}
            value={CONTINUOUS_DURATION_VALUE}
          />
          {FORECAST_DURATION_DAYS_OPTIONS.map((days) => (
            <MenuItem
              key={days}
              title={translate('Label.DurationDaysCount', { count: String(days) })}
              value={String(days)}
            />
          ))}
        </Menu>
      </Dropdown>

      <Divider />

      <NumericFormat
        allowNegative={false}
        className='width-full'
        customInput={TextInput}
        decimalScale={2}
        error={budgetFieldError}
        fixedDecimalScale
        helperText={budgetHelperText}
        id='forecast-estimator-budget-usd'
        inputMode='decimal'
        isDisabled={playsHasInput}
        label={budgetFieldLabel}
        onValueChange={({ value }) => {
          if (!playsHasInput) {
            onBudgetUsdChange(value);
          }
        }}
        placeholder='0'
        size='Medium'
        thousandSeparator=','
        thousandsGroupStyle='thousand'
        trailingIconNode={
          budgetHasInput ? (
            <IconButton
              ariaLabel={translate('Action.Clear')}
              icon='icon-filled-x'
              onClick={onResetInputs}
              size='Small'
              type='button'
              variant='Utility'
            />
          ) : (
            <span className='text-body-medium content-muted'>{translate('Label.UsdSuffix')}</span>
          )
        }
        value={playsHasInput ? calculatedBudgetUsd : budgetUsd}
        valueIsNumericString
      />
      <NumericFormat
        allowNegative={false}
        className='width-full'
        customInput={TextInput}
        decimalScale={0}
        error={playsFieldError}
        helperText={playsHelperText}
        id='forecast-estimator-plays'
        inputMode='numeric'
        isDisabled={budgetHasInput}
        label={playsFieldLabel}
        onValueChange={({ value }) => {
          if (!budgetHasInput) {
            onPlaysChange(value);
          }
        }}
        placeholder='0'
        size='Medium'
        thousandSeparator=','
        thousandsGroupStyle='thousand'
        trailingIconNode={
          playsHasInput ? (
            <IconButton
              ariaLabel={translate('Action.Clear')}
              icon='icon-filled-x'
              onClick={onResetInputs}
              size='Small'
              type='button'
              variant='Utility'
            />
          ) : undefined
        }
        value={budgetHasInput ? calculatedPlays : plays}
        valueIsNumericString
      />
    </section>
  );
};

export default ForecastForm;
