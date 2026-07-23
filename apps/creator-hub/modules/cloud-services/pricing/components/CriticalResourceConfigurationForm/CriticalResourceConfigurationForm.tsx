import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Grid,
  Typography,
  useDialog,
} from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import { isValidMoneyString, MAX_MONEY_BUDGET_USD } from '../../../utils/formatters';
import useServiceConfigurationFormStyles from '../ServiceConfigurationForm/ServiceConfigurationForm.styles';
import { pricingLinkTags, BudgetField, buildConfirmResetDialog } from '../shared/FormHelpers';
import UnlockToggleRow from '../shared/UnlockToggleRow';
import useUnlockServiceFormStyles from '../UnlockServiceForm/UnlockServiceForm.styles';

export type CriticalResourceState = {
  isAccessEnabled: boolean;
  accessBudget: string;
  hasError: boolean;
};

type CriticalResourceConfigurationFormProps = {
  initialAccessEnabled: boolean;
  initialAccessBudget: string;
  disableSwitch: boolean;
  isPremiumEligible: boolean;
  onStateChange: (state: CriticalResourceState) => void;
  onDirtyChange: (isDirty: boolean) => void;
  onErrorChange: (hasError: boolean) => void;
};

const CriticalResourceConfigurationForm: FunctionComponent<
  CriticalResourceConfigurationFormProps
> = ({
  initialAccessEnabled,
  initialAccessBudget,
  disableSwitch,
  isPremiumEligible,
  onStateChange,
  onDirtyChange,
  onErrorChange,
}) => {
  const {
    classes: { accordion, accordionTitle, serviceFormContainer, divider },
  } = useUnlockServiceFormStyles();
  const {
    classes: {
      resourceDescription,
      resourceFormContainer,
      radioLabel,
      descriptionText,
      errorMessageContainer,
      budgetTextField,
    },
  } = useServiceConfigurationFormStyles();
  const { open, close: closeDialog, configure } = useDialog();
  const { translate, translateHTML } = useTranslationWrapper(useTranslation());
  const budgetFieldRef = useRef<HTMLInputElement | null>(null);

  const [isAccessEnabled, setIsAccessEnabled] = useState(initialAccessEnabled);
  const [accessBudget, setAccessBudget] = useState(initialAccessBudget);
  const [budgetError, setBudgetError] = useState<string>('');

  useEffect(() => {
    const hasError = !!budgetError;
    onStateChange({ isAccessEnabled, accessBudget, hasError });
    onErrorChange(hasError);
  }, [isAccessEnabled, accessBudget, budgetError, onStateChange, onErrorChange]);

  const checkDirty = useCallback(
    (enabled: boolean, budget: string) => {
      const isDirty = enabled !== initialAccessEnabled || budget !== initialAccessBudget;
      onDirtyChange(isDirty);
    },
    [initialAccessEnabled, initialAccessBudget, onDirtyChange],
  );

  const validateBudget = useCallback(
    (enabled: boolean, value: string): string => {
      if (!enabled) {
        return '';
      }
      if (value === '') {
        return translate(
          translationKey('Error.BudgetLimitIsRequired', TranslationNamespace.CloudServices),
        ) as string;
      }
      if (!isValidMoneyString(value)) {
        return translate(
          translationKey('Error.InvalidNumber', TranslationNamespace.CloudServices),
        ) as string;
      }
      const parsed = Number(value);
      if (parsed < 1 || parsed > MAX_MONEY_BUDGET_USD) {
        return translate(
          translationKey('Error.InvalidNumberOutsideOfBounds', TranslationNamespace.CloudServices),
        ) as string;
      }
      return '';
    },
    [translate],
  );

  const confirmResetDialog = useMemo(
    () =>
      buildConfirmResetDialog({
        translate: translate as (key: ReturnType<typeof translationKey>) => string,
        onConfirm: () => {
          setIsAccessEnabled(false);
          setAccessBudget('');
          setBudgetError('');
          checkDirty(false, '');
          closeDialog();
        },
        onCancel: () => {
          closeDialog();
        },
      }),
    [closeDialog, checkDirty, translate],
  );

  const handleAccessToggleChange = useCallback(
    (checked: boolean) => {
      if (isAccessEnabled && !checked) {
        configure(confirmResetDialog);
        open();
        return;
      }
      setIsAccessEnabled(checked);
      checkDirty(checked, accessBudget);
      if (checked) {
        setBudgetError(validateBudget(true, accessBudget));
        setTimeout(() => budgetFieldRef.current?.focus(), 0);
      } else {
        setBudgetError('');
      }
    },
    [
      isAccessEnabled,
      configure,
      confirmResetDialog,
      open,
      accessBudget,
      checkDirty,
      validateBudget,
    ],
  );

  const handleBudgetChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;
      setAccessBudget(value);
      setBudgetError(validateBudget(isAccessEnabled, value));
      checkDirty(isAccessEnabled, value);
    },
    [isAccessEnabled, checkDirty, validateBudget],
  );

  return (
    <Accordion disableGutters variant='outlined' defaultExpanded className={accordion}>
      <AccordionSummary className={accordionTitle}>
        {translate(translationKey('Heading.DataStores', TranslationNamespace.CloudServices))}
      </AccordionSummary>
      <AccordionDetails className={serviceFormContainer}>
        {isPremiumEligible ? (
          <>
            {/* Storage section - always enabled */}
            <Grid container item direction='column' XSmall={12}>
              <UnlockToggleRow
                title={
                  translate(
                    translationKey('Title.StorageInUnlock', TranslationNamespace.CloudServices),
                  ) as string
                }
                description={translateHTML(
                  translationKey('Description.StorageInUnlock', TranslationNamespace.CloudServices),
                  pricingLinkTags(),
                )}
                isChecked
                isDisabled
                ariaLabel={
                  translate(
                    translationKey('Action.Unlock', TranslationNamespace.CloudServices),
                  ) as string
                }
              />
            </Grid>

            <Divider className={divider} />

            {/* Access section - toggle + budget */}
            <Grid container item direction='column' XSmall={12}>
              <UnlockToggleRow
                title={
                  translate(
                    translationKey('Title.AccessInUnlock', TranslationNamespace.CloudServices),
                  ) as string
                }
                description={translateHTML(
                  translationKey(
                    'Description.RequestResourceInUnlock',
                    TranslationNamespace.CloudServices,
                  ),
                  pricingLinkTags(),
                )}
                isChecked={isAccessEnabled}
                isDisabled={disableSwitch}
                ariaLabel={
                  translate(
                    translationKey('Action.Unlock', TranslationNamespace.CloudServices),
                  ) as string
                }
                onCheckedChange={(checked: boolean) => handleAccessToggleChange(checked)}
              />
              {isAccessEnabled && (
                <Grid item className={resourceFormContainer}>
                  <Grid item XSmall={12} className={radioLabel}>
                    <BudgetField
                      id='critical-resource-access-budget'
                      disabled={disableSwitch}
                      value={accessBudget}
                      onChange={handleBudgetChange}
                      error={!!budgetError}
                      errorMessage={budgetError || ''}
                      budgetFieldRef={budgetFieldRef}
                      budgetTextFieldClassName={budgetTextField}
                      errorContainerClassName={errorMessageContainer}
                      descriptionClassName={descriptionText}
                    />
                  </Grid>
                </Grid>
              )}
            </Grid>
          </>
        ) : (
          <Typography variant='body2' className={resourceDescription}>
            {translate(
              translationKey('Description.NotPremiumEligible', TranslationNamespace.CloudServices),
              {
                service: translate(
                  translationKey('Title.DataStoreInUnlock', TranslationNamespace.CloudServices),
                ),
              },
            )}
          </Typography>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

export default withTranslation(CriticalResourceConfigurationForm, [
  TranslationNamespace.CloudServices,
]);
