import { useMemo, useEffect } from 'react';
import type { Control } from 'react-hook-form';
import { Controller, useController, useWatch } from 'react-hook-form';
import { useTranslation } from '@rbx/intl';
import {
  TextField,
  InputAdornment,
  RobuxIcon,
  Tooltip,
  InfoOutlinedIcon,
  ErrorOutlineOutlinedIcon,
} from '@rbx/ui';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import type { CreateSubscriptionFormType } from '../../../constants/CreateSubscriptionRegisterConstants';
import {
  CreateSubscriptionRegisterOptions,
  MinimumRobuxPriceForSubscription,
} from '../../../constants/CreateSubscriptionRegisterConstants';
import SubscriptionRegionalPricesDisplay from './SubscriptionRegionalPricesDisplay';

type TCreateSubscriptionRobuxPriceSectionProps = {
  control: Control<CreateSubscriptionFormType>;
  onRobuxPriceChange?: (priceInRobux: number) => void;
  existingRobuxPrice?: number | null;
};

function CreateSubscriptionRobuxPriceSection({
  control,
  onRobuxPriceChange,
  existingRobuxPrice,
}: TCreateSubscriptionRobuxPriceSectionProps) {
  const { translate, translateHTML } = useTranslation();
  const { gameDetails } = useCurrentGame();
  const currencyType = useWatch({ control, name: 'currencyType' });

  const { field: regionalPricingField } = useController({
    name: 'isRegionalPricingEnabled',
    control,
    defaultValue: true,
  });

  useEffect(() => {
    if (!regionalPricingField.value) {
      regionalPricingField.onChange(true);
    }
  }, [regionalPricingField]);

  const priceInRobuxRules = useMemo(
    () => ({
      ...CreateSubscriptionRegisterOptions.priceInRobux,
      required:
        currencyType === 'robux' ? CreateSubscriptionRegisterOptions.priceInRobux.required : false,
      validate:
        currencyType === 'robux'
          ? CreateSubscriptionRegisterOptions.priceInRobux.validate
          : undefined,
      min:
        currencyType === 'robux' ? CreateSubscriptionRegisterOptions.priceInRobux.min : undefined,
    }),
    [currencyType],
  );

  return (
    <div
      className='flex flex-col gap-large bg-shift-200 padding-xlarge radius-medium'
      style={{ marginLeft: 36 }}>
      <Controller
        name='priceInRobux'
        control={control}
        defaultValue={existingRobuxPrice ?? MinimumRobuxPriceForSubscription}
        rules={priceInRobuxRules}
        render={({ field, fieldState: { error } }) => (
          <TextField
            {...field}
            id='robux-price'
            fullWidth
            required
            label={translate('Label.RobuxPrice')}
            helperText={
              error?.message
                ? translate(error.message, {
                    minimum: MinimumRobuxPriceForSubscription.toString(),
                  })
                : translate('Label.RobuxMinimumHelperText', {
                    minimum: MinimumRobuxPriceForSubscription.toString(),
                  })
            }
            error={!!error}
            type='number'
            onChange={(e) => {
              const { value } = e.target;
              const parsedValue = value === '' ? 0 : parseInt(value, 10) || 0;
              field.onChange(parsedValue);
              if (onRobuxPriceChange && parsedValue >= MinimumRobuxPriceForSubscription) {
                onRobuxPriceChange(parsedValue);
              }
            }}
            value={field.value ? String(field.value) : ''}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <RobuxIcon fontSize='small' />
                </InputAdornment>
              ),
            }}
          />
        )}
      />

      <div className='flex flex-col gap-small'>
        <div className='flex items-center gap-xsmall'>
          <span className='text-body-small font-bold'>
            {translate(
              'Label.RegionalPricingIsEnabled' /* in TranslationNamespace.RegionalPricing */,
            )}
          </span>
          <Tooltip
            title={translate('Tooltip.EnableRegionalPricingDetailed')}
            placement='right'
            arrow>
            <InfoOutlinedIcon fontSize='small' />
          </Tooltip>
          <SubscriptionRegionalPricesDisplay control={control} />
        </div>

        <div className='flex items-center gap-medium'>
          <Tooltip
            title={translate(
              'Tooltip.RequiresDynamicPricesDetailed' /* in TranslationNamespace.RegionalPricing */,
            )}
            placement='right'
            arrow>
            <ErrorOutlineOutlinedIcon color='warning' />
          </Tooltip>
          <span className='text-body-small content-default'>
            {translateHTML('Description.RequiresDynamicPrices', [
              {
                opening: 'linkStart',
                closing: 'linkEnd',
                content: (chunks) => (
                  <a
                    href={dashboard.getMonetizationDynamicPriceCheckUrl(gameDetails?.id ?? 0)}
                    target='_blank'
                    rel='noreferrer'
                    className='underline content-inherit'>
                    {chunks}
                  </a>
                ),
              },
            ])}
          </span>
        </div>
      </div>
    </div>
  );
}

export default CreateSubscriptionRobuxPriceSection;
