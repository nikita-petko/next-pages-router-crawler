import React, { FunctionComponent, useRef } from 'react';
import {
  FormControl,
  FormHelperText,
  InputAdornment,
  TextField,
  Typography,
  DialogTemplate,
} from '@rbx/ui';
import CreatorDashboardLink from '@modules/miscellaneous/common/components/CreatorDashboardLink';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { useTranslation } from '@rbx/intl';
import { useTranslationWrapper, translationKey } from '@modules/analytics-translations';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';

const PRICING_DOCS_PATH = '/docs/cloud-services/extended-services#service-pricing';

/**
 * Returns the tags array for translateHTML that renders a pricing docs link.
 * Usage: translateHTML(translationKey('...'), pricingLinkTags(), params)
 */
export function pricingLinkTags() {
  return [
    {
      opening: 'linkStart',
      closing: 'linkEnd',
      // eslint-disable-next-line react/no-unstable-nested-components -- translateHTML requires inline component
      content(chunks: React.ReactNode) {
        return (
          <CreatorDashboardLink
            href={`${getProductionCreatorHubUrl(process.env.buildTarget)}${PRICING_DOCS_PATH}`}
            target='_blank'
            underline='hover'>
            {chunks}
          </CreatorDashboardLink>
        );
      },
    },
  ];
}

type BudgetFieldProps = {
  id: string;
  disabled: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  error: boolean;
  errorMessage: string;
  currency?: string;
  currencySymbolClassName: string;
  budgetTextFieldClassName: string;
  errorContainerClassName: string;
  descriptionClassName: string;
  budgetFieldRef?: React.MutableRefObject<HTMLInputElement | null>;
};

export const BudgetField: FunctionComponent<BudgetFieldProps> = ({
  id,
  disabled,
  value,
  onChange,
  onFocus,
  error,
  errorMessage,
  currency = 'USD',
  currencySymbolClassName,
  budgetTextFieldClassName,
  errorContainerClassName,
  descriptionClassName,
  budgetFieldRef: externalRef,
}) => {
  const internalRef = useRef<HTMLInputElement | null>(null);
  const ref = externalRef ?? internalRef;
  const { translate } = useTranslationWrapper(useTranslation());

  return (
    <React.Fragment>
      <FormControl>
        <TextField
          id={id}
          disabled={disabled}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          InputProps={{
            inputProps: {
              inputMode: 'numeric' as const,
              ref,
            },
            startAdornment: (
              <InputAdornment position='start'>
                <Typography className={currencySymbolClassName} variant='subtitle1'>
                  $
                </Typography>
              </InputAdornment>
            ),
          }}
          size='small'
          error={error}
          className={budgetTextFieldClassName}
          label={translate(
            translationKey('Label.MonthlyBudget', TranslationNamespace.CloudServices),
            { currency },
          )}
        />
        <FormHelperText error className={errorContainerClassName}>
          {errorMessage}
        </FormHelperText>
      </FormControl>
      <FormHelperText className={descriptionClassName}>
        {translate(translationKey('Description.MonthlyBudget', TranslationNamespace.CloudServices))}
      </FormHelperText>
    </React.Fragment>
  );
};

type ConfirmResetDialogProps = {
  translate: (key: ReturnType<typeof translationKey>) => string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function buildConfirmResetDialog({
  translate,
  onConfirm,
  onCancel,
}: ConfirmResetDialogProps) {
  return (
    <DialogTemplate
      title={translate(
        translationKey('Title.ResetLimitDialog', TranslationNamespace.CloudServices),
      )}
      content={translate(
        translationKey('Description.ResetLimitDialog', TranslationNamespace.CloudServices),
      )}
      confirmText={translate(translationKey('Action.Confirm', TranslationNamespace.CloudServices))}
      cancelText={translate(translationKey('Action.Cancel', TranslationNamespace.CloudServices))}
      color='destructive'
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
