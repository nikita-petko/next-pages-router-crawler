import { memo } from 'react';
import { useIsFetching } from '@tanstack/react-query';
import type { Control, UseFormRegister } from 'react-hook-form';
import { useFormState, useWatch } from 'react-hook-form';
import { Icon, ProgressCircle, TextInput } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { getRegionalPricingPreviewKey } from '@modules/regional-pricing/queries/useGetRegionalPricingPreview';
import { configurePassSalesFormV2Schema } from '../form-shared/schemas';
import type { ConfigureSalesFormValues } from '../form-shared/types';

type PriceTextInputProps = {
  /** ID of the input element. Note the built-in label text is not used for this input. */
  id: string;
  universeId: number;
  register: UseFormRegister<ConfigureSalesFormValues>;
  disabled?: boolean;
  className?: string;
  error?: string;
  control: Control<ConfigureSalesFormValues>;
};

const ROBUX_ICON = <Icon name='icon-regular-robux' size='Small' />;

export const PriceTextInput = memo(
  ({ id, error, control, universeId, disabled, className, register }: PriceTextInputProps) => {
    const { translate } = useTranslation();

    const { errors } = useFormState({ control, name: 'price' });

    const isFetchingRegionalPrices = useIsFetching({
      queryKey: getRegionalPricingPreviewKey(universeId, 'GamePass'),
    });

    const isForSale = useWatch({ control, name: 'isForSale' });

    const errorText =
      error ?? (errors.price?.message ? translate(errors.price.message) : undefined);

    const field = register('price', configurePassSalesFormV2Schema.price);

    return (
      <TextInput
        id={id}
        {...field}
        className={className}
        // Note: we set required for a11y but not isRequired as we handle labels separately
        required={isForSale ?? undefined}
        isDisabled={disabled ?? field?.disabled}
        leadingIconNode={ROBUX_ICON}
        trailingIconNode={
          isFetchingRegionalPrices ? (
            <ProgressCircle
              ariaLabel={translate('Label.Loading')}
              size='Small'
              variant='Indeterminate'
            />
          ) : null
        }
        error={errorText}
      />
    );
  },
);
