// oxlint-disable react/react-compiler - incorrectly flags ref usage from react-hook-form
import { memo, useState } from 'react';
import { useIsFetching } from '@tanstack/react-query';
import type { Control, UseFormRegister } from 'react-hook-form';
import { useController, useFormState, useWatch } from 'react-hook-form';
import type { Category } from '@rbx/client-shops-api/v1';
import { Icon, ProgressCircle, TextArea, TextInput } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { useLanguageDirection } from '@modules/monetization-shared/useLanguageDirection';
import { getRegionalPricingPreviewKey } from '@modules/regional-pricing/queries/useGetRegionalPricingPreview';
import { ShopCategoryCombobox } from '@modules/shops/components/ShopCategoryCombobox';
import { useShopCategorySelection } from '@modules/shops/hooks/useShopCategorySelection';
import { isNewCategoryOverLimit } from '@modules/shops/utils/categorySelection';
import type { ConfigureDeveloperProductFormV2Values } from '../../types';
import {
  configureDeveloperProductSchema,
  configureDeveloperProductV3Schema,
  MAX_DESCRIPTION_LENGTH,
  MAX_NAME_LENGTH,
} from './schemas';

type MetadataTextInputProps = {
  register: UseFormRegister<ConfigureDeveloperProductFormV2Values>;
  control: Control<ConfigureDeveloperProductFormV2Values>;
  label: string;
  disabled?: boolean;
  className?: string;
};

export const NameTextInput = memo(
  ({ register, control, label, disabled, className }: MetadataTextInputProps) => {
    const { translate } = useTranslation();
    const dir = useLanguageDirection();

    const { errors } = useFormState<ConfigureDeveloperProductFormV2Values>({
      control,
      name: 'name',
    });

    const field = register('name', configureDeveloperProductSchema.name);
    const errorText = errors.name?.message ? translate(errors.name.message) : undefined;

    return (
      <TextInput
        id='name'
        {...field}
        dir={dir}
        className={className}
        isRequired
        isDisabled={disabled ?? field.disabled}
        label={label}
        hasError={!!errors.name}
        error={errorText}
        helperText={translate('Message.CharacterLimit', {
          limit: MAX_NAME_LENGTH.toString(),
        })}
      />
    );
  },
);
NameTextInput.displayName = 'NameTextInput';

export const DescriptionTextArea = memo(
  ({ register, control, label, disabled, className }: MetadataTextInputProps) => {
    const { translate } = useTranslation();
    const dir = useLanguageDirection();

    const { errors } = useFormState<ConfigureDeveloperProductFormV2Values>({
      control,
      name: 'description',
    });

    const field = register('description', configureDeveloperProductSchema.description);
    const errorText = errors.description?.message
      ? translate(errors.description.message)
      : undefined;

    return (
      <TextArea
        id='description'
        {...field}
        dir={dir}
        className={className}
        rows={6}
        isDisabled={disabled ?? field.disabled}
        label={label}
        hasError={!!errors.description}
        helperText={
          errorText ??
          translate('Message.CharacterLimit', {
            limit: MAX_DESCRIPTION_LENGTH.toString(),
          })
        }
        aria-invalid={!!errors.description}
      />
    );
  },
);
DescriptionTextArea.displayName = 'DescriptionTextArea';

type PriceTextInputProps = {
  /** ID of the input element. Note the built-in label text is not used for this input. */
  id: string;
  universeId: number;
  register: UseFormRegister<ConfigureDeveloperProductFormV2Values>;
  control: Control<ConfigureDeveloperProductFormV2Values>;
  disabled?: boolean;
  className?: string;
  error?: string;
};

const ROBUX_ICON = <Icon name='icon-regular-robux' size='Small' />;

export const PriceTextInput = memo(
  ({ id, error, control, universeId, disabled, className, register }: PriceTextInputProps) => {
    const { translate } = useTranslation();

    const { errors } = useFormState({ control, name: 'price' });

    const isFetchingRegionalPrices = useIsFetching({
      queryKey: getRegionalPricingPreviewKey(universeId, 'DeveloperProduct'),
    });

    const isForSale = useWatch({ control, name: 'isForSale' });

    const errorText =
      error ?? (errors.price?.message ? translate(errors.price.message) : undefined);

    const field = register('price', configureDeveloperProductV3Schema.price);

    return (
      <TextInput
        id={id}
        {...field}
        className={className}
        // Note: we set required for a11y but not isRequired as we handle labels separately
        required={isForSale ?? undefined}
        isDisabled={disabled}
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
PriceTextInput.displayName = 'PriceTextInput';

type ShopCategoryComboboxFieldProps = {
  control: Control<ConfigureDeveloperProductFormV2Values>;
  availableCategories: readonly Category[];
};

/**
 * Category combobox for the create flow: lets the creator assign an existing
 * shop category or stage a new one via the `categoryName` form field
 */
export const ShopCategoryComboboxField = memo(
  ({ control, availableCategories }: ShopCategoryComboboxFieldProps) => {
    const { translate } = useTranslation();
    const { isAtCategoryLimit, getCategoryHint } = useShopCategorySelection(availableCategories);
    const [isFocused, setIsFocused] = useState(false);

    const { field } = useController({
      control,
      name: 'categoryName',
      rules: {
        validate: (value) => !isNewCategoryOverLimit(value ?? '', availableCategories),
      },
    });

    const value = field.value ?? '';
    // Show the over-limit hint only while the field is blurred; it clears whenever
    // the creator refocuses to keep editing, so it doesn't flash on every keystroke.
    const hint = isFocused ? undefined : getCategoryHint(value);

    return (
      <ShopCategoryCombobox
        availableCategories={availableCategories}
        value={value}
        onValueChange={field.onChange}
        // adds error on blur and removes error when the user is typing
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          field.onBlur();
        }}
        name={field.name}
        ref={field.ref}
        label={translate('Label.Category')}
        labelTooltip={translate('Message.CategoryDropdown')}
        placeholder={translate('Label.Category')}
        size='Large'
        hint={hint}
        hasError={!!hint}
        isAddCategoryHidden={isAtCategoryLimit}
        onAddCategorySelect={field.onChange}
      />
    );
  },
);
ShopCategoryComboboxField.displayName = 'ShopCategoryComboboxField';
