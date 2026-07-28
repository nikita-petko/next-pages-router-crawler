import type { FunctionComponent } from 'react';
import React, { useRef } from 'react';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { TextInput } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { DialogTemplate, FormControl, FormHelperText } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import CreatorDashboardLink from '@modules/miscellaneous/components/CreatorDashboardLink';
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
  budgetTextFieldClassName: string;
  errorContainerClassName: string;
  descriptionClassName: string;
  budgetFieldRef?: React.RefObject<HTMLInputElement | null>;
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
  budgetTextFieldClassName,
  errorContainerClassName,
  descriptionClassName,
  budgetFieldRef: externalRef,
}) => {
  const internalRef = useRef<HTMLInputElement | null>(null);
  const ref = externalRef ?? internalRef;
  const { translate } = useTranslationWrapper(useTranslation());

  return (
    <>
      <FormControl>
        <TextInput
          id={id}
          isDisabled={disabled}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          ref={ref as React.Ref<HTMLInputElement>}
          inputMode='numeric'
          size='Medium'
          variant='Standard'
          hasError={error}
          inputContainerClassName={budgetTextFieldClassName}
          label={
            translate(translationKey('Label.MonthlyBudget', TranslationNamespace.CloudServices), {
              currency,
            }) as string
          }
          leadingIconNode={
            <span className='content-emphasis' style={{ marginLeft: 4 }} aria-hidden='true'>
              $
            </span>
          }
        />
        <FormHelperText error className={errorContainerClassName}>
          {errorMessage}
        </FormHelperText>
      </FormControl>
      <FormHelperText className={descriptionClassName}>
        {translate(translationKey('Description.MonthlyBudget', TranslationNamespace.CloudServices))}
      </FormHelperText>
    </>
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
