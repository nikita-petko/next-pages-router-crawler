import React, { FunctionComponent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  FormControlLabel,
  Grid,
  Switch,
  Typography,
  useDialog,
} from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { useTranslationWrapper, translationKey } from '@modules/analytics-translations';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import { isValidMoneyString } from '../../../utils/formatters';
import useUnlockServiceFormStyles from '../UnlockServiceForm/UnlockServiceForm.styles';
import useServiceConfigurationFormStyles from '../ServiceConfigurationForm/ServiceConfigurationForm.styles';
import { pricingLinkTags, BudgetField, buildConfirmResetDialog } from '../shared/FormHelpers';

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
      currencySymbol,
      resourceTitle,
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
      if (!enabled) return '';
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
      if (parsed < 1 || parsed > 99999.99) {
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

  const handleSwitchClick = useCallback(
    (e: React.MouseEvent) => {
      if (isAccessEnabled) {
        e.preventDefault();
        e.stopPropagation();
        configure(confirmResetDialog);
        open();
      }
    },
    [isAccessEnabled, configure, confirmResetDialog, open],
  );

  const handleSwitchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { checked } = e.target;
      setIsAccessEnabled(checked);
      checkDirty(checked, accessBudget);
      if (checked) {
        setBudgetError(validateBudget(true, accessBudget));
        setTimeout(() => budgetFieldRef.current?.focus(), 0);
      } else {
        setBudgetError('');
      }
    },
    [accessBudget, checkDirty, validateBudget],
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
          <React.Fragment>
            {/* Storage section - always enabled */}
            <Grid container item direction='row' XSmall={12}>
              <Grid container item justifyContent='space-between' alignItems='center' wrap='nowrap'>
                <Grid item>
                  <Typography variant='subtitle2' component='div' className={resourceTitle}>
                    {translate(
                      translationKey('Title.StorageInUnlock', TranslationNamespace.CloudServices),
                    )}
                  </Typography>
                  <Typography variant='body2' className={resourceDescription}>
                    {translateHTML(
                      translationKey(
                        'Description.StorageInUnlock',
                        TranslationNamespace.CloudServices,
                      ),
                      pricingLinkTags(),
                    )}
                  </Typography>
                </Grid>
                <Grid item>
                  <FormControlLabel
                    control={
                      <Switch
                        disabled
                        checked
                        aria-label={translate(
                          translationKey('Action.Unlock', TranslationNamespace.CloudServices),
                        )}
                      />
                    }
                    label=''
                  />
                </Grid>
              </Grid>
            </Grid>

            <Divider className={divider} />

            {/* Access section - toggle + budget */}
            <Grid container item direction='row' XSmall={12}>
              <Grid container item justifyContent='space-between' alignItems='center' wrap='nowrap'>
                <Grid item>
                  <Typography variant='subtitle2' component='div' className={resourceTitle}>
                    {translate(
                      translationKey('Title.AccessInUnlock', TranslationNamespace.CloudServices),
                    )}
                  </Typography>
                  <Typography variant='body2' className={resourceDescription}>
                    {translateHTML(
                      translationKey(
                        'Description.RequestResourceInUnlock',
                        TranslationNamespace.CloudServices,
                      ),
                      pricingLinkTags(),
                    )}
                  </Typography>
                </Grid>
                <Grid item>
                  <FormControlLabel
                    control={
                      <Switch
                        disabled={disableSwitch}
                        checked={isAccessEnabled}
                        aria-label={translate(
                          translationKey('Action.Unlock', TranslationNamespace.CloudServices),
                        )}
                        onMouseDown={handleSwitchClick}
                        onChange={handleSwitchChange}
                      />
                    }
                    label=''
                  />
                </Grid>
              </Grid>
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
                      currencySymbolClassName={currencySymbol}
                      budgetTextFieldClassName={budgetTextField}
                      errorContainerClassName={errorMessageContainer}
                      descriptionClassName={descriptionText}
                    />
                  </Grid>
                </Grid>
              )}
            </Grid>
          </React.Fragment>
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
