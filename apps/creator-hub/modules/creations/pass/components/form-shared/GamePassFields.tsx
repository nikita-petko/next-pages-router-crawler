// oxlint-disable react/react-compiler - incorrectly flags ref usage from react-hook-form
import { memo, useState } from 'react';
import type { Control } from 'react-hook-form';
import { Controller, useController } from 'react-hook-form';
import type { Category } from '@rbx/client-shops-api/v1';
import { TextArea, TextInput } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { useLanguageDirection } from '@modules/monetization-shared/useLanguageDirection';
import { ShopCategoryCombobox } from '@modules/shops/components/ShopCategoryCombobox';
import { useShopCategorySelection } from '@modules/shops/hooks/useShopCategorySelection';
import { isNewCategoryOverLimit } from '@modules/shops/utils/categorySelection';
import { configurePassMetadataSchema, MAX_DESCRIPTION_LENGTH, MAX_NAME_LENGTH } from './schemas';
import type { ConfigurePassMetadataFormValues } from './types';

// Set up individual text field inputs to limit subscription to specific errors
export type FieldProps = {
  control: Control<ConfigurePassMetadataFormValues>;
  label: string;
  disabled?: boolean;
  className?: string;
};

const getTextLengthMessage = (
  max: number,
  current: number,
  translate: (key: string, args?: { [key: string]: string }) => string,
) => {
  if (current === 0) {
    return translate('Message.CharacterLimit', { limit: String(max) });
  }
  return translate('Message.ProgressiveCharacterLimit', { count: String(max - current) });
};

export const NameTextInput = memo(({ control, label, disabled, className }: FieldProps) => {
  const { translate } = useTranslation();
  const dir = useLanguageDirection();

  return (
    <Controller
      name='name'
      control={control}
      disabled={disabled}
      rules={configurePassMetadataSchema.name}
      render={({ field, fieldState: { error } }) => {
        const errorText = error?.message ? translate(error.message) : undefined;

        return (
          <TextInput
            {...field}
            id='name'
            dir={dir}
            className={className}
            isRequired
            isDisabled={disabled ?? field.disabled}
            label={label}
            hasError={!!error}
            error={errorText}
            helperText={getTextLengthMessage(MAX_NAME_LENGTH, field.value.length, translate)}
            aria-invalid={!!error}
          />
        );
      }}
    />
  );
});
NameTextInput.displayName = 'NameTextInput';

export const DescriptionTextArea = memo(({ control, label, disabled, className }: FieldProps) => {
  const { translate } = useTranslation();
  const dir = useLanguageDirection();

  return (
    <Controller
      name='description'
      control={control}
      disabled={disabled}
      rules={configurePassMetadataSchema.description}
      render={({ field, fieldState: { error } }) => {
        const errorText = error?.message ? translate(error.message) : undefined;

        return (
          <TextArea
            {...field}
            id='description'
            dir={dir}
            className={className}
            rows={6}
            isDisabled={disabled ?? field.disabled}
            label={label}
            hasError={!!error}
            helperText={
              errorText ??
              getTextLengthMessage(MAX_DESCRIPTION_LENGTH, field.value.length, translate)
            }
            aria-invalid={!!error}
          />
        );
      }}
    />
  );
});
DescriptionTextArea.displayName = 'DescriptionTextArea';

type ShopCategoryComboboxFieldProps = {
  control: Control<ConfigurePassMetadataFormValues>;
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
