import { useCallback, useEffect, useMemo, useRef, useState, type FunctionComponent } from 'react';
import { ProgressBar, TextInput } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Accordion, AccordionSummary, AccordionDetails, useDialog } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import {
  MAX_MONEY_BUDGET_USD,
  MONEY_INPUT_PATTERN,
  isValidMoneyString,
} from '../../../utils/formatters';
import { useCoresFreeTierUsage } from '../../hooks/useCoresFreeTierUsage';
import type { CorePlace } from '../../hooks/useUniversePlacesForCores';
import { buildPlaceIdToNameMap, isValidPlaceId } from '../../utils/coresValidation';
import { buildConfirmResetDialog, pricingLinkTags } from '../shared/FormHelpers';
import UnlockToggleRow from '../shared/UnlockToggleRow';
import useUnlockServiceFormStyles from '../UnlockServiceForm/UnlockServiceForm.styles';
import useCoresQuotaSectionStyles, { MONTHLY_CAP_MAX_WIDTH_PX } from './CoresQuotaSection.styles';
import ExtendCoreQuotaDialog from './ExtendCoreQuotaDialog';

export type CoresQuotaState = {
  isEnabled: boolean;
  placeIds: number[];
  isWholeExperience: boolean;
  monthlyCap: string;
  hasError: boolean;
};

const NUMBER_FORMATTER = new Intl.NumberFormat();

export type CoresQuotaSectionProps = {
  universeId: number;
  initialPlaceIds: number[];
  initialIsWholeExperience?: boolean;
  initialMonthlyCap?: string;
  availablePlaces: CorePlace[];
  isLoadingPlaces?: boolean;
  disableSwitch: boolean;
  resetSignal?: number;
  onStateChange: (state: CoresQuotaState) => void;
  onDirtyChange: (isDirty: boolean) => void;
  onErrorChange: (hasError: boolean) => void;
};

const CoresQuotaSection: FunctionComponent<CoresQuotaSectionProps> = ({
  universeId,
  initialPlaceIds,
  initialIsWholeExperience = false,
  initialMonthlyCap = '',
  availablePlaces,
  isLoadingPlaces,
  disableSwitch,
  resetSignal = 0,
  onStateChange,
  onDirtyChange,
  onErrorChange,
}) => {
  const {
    classes: { accordion, accordionTitle, serviceFormContainer },
  } = useUnlockServiceFormStyles();
  const {
    classes: {
      sectionContent,
      placesSection,
      placesExtendedRow,
      manageButton,
      chipsContainer,
      chip,
      monthlyCapContainer,
    },
  } = useCoresQuotaSectionStyles();
  const { translate, translateHTML } = useTranslationWrapper(useTranslation());
  const { configure, open, close: closeDialog } = useDialog();

  const initialIsEnabled = initialIsWholeExperience || initialPlaceIds.length > 0;
  const [isEnabled, setIsEnabled] = useState<boolean>(initialIsEnabled);
  const [placeIds, setPlaceIds] = useState<number[]>(() => initialPlaceIds.filter(isValidPlaceId));
  const [isWholeExperience, setIsWholeExperience] = useState<boolean>(initialIsWholeExperience);
  const [extendDialogOpen, setExtendDialogOpen] = useState<boolean>(false);
  const [monthlyCap, setMonthlyCap] = useState<string>(initialMonthlyCap);

  const initialMountRef = useRef<boolean>(true);
  useEffect(() => {
    if (initialMountRef.current) {
      initialMountRef.current = false;
      return;
    }
    setIsEnabled(initialIsWholeExperience || initialPlaceIds.length > 0);
    setPlaceIds(initialPlaceIds.filter(isValidPlaceId));
    setIsWholeExperience(initialIsWholeExperience);
    setMonthlyCap(initialMonthlyCap);
    setExtendDialogOpen(false);
  }, [resetSignal, initialPlaceIds, initialIsWholeExperience, initialMonthlyCap]);

  const capNumber = monthlyCap === '' ? NaN : Number(monthlyCap);
  const isOverMax = !Number.isNaN(capNumber) && capNumber > MAX_MONEY_BUDGET_USD;
  const isMalformed = monthlyCap.length > 0 && !isValidMoneyString(monthlyCap);
  // The monthly cap is optional: leaving it empty while cores is enabled means
  // "no cap" (free-tier-only opt-in). Only malformed or over-max values block
  // the form. The save handler maps empty caps to a $0 budget on submit.
  const hasMonthlyCapError = isEnabled && (isMalformed || isOverMax);

  useEffect(() => {
    onStateChange({
      isEnabled,
      placeIds,
      isWholeExperience,
      monthlyCap,
      hasError: hasMonthlyCapError,
    });
    onErrorChange(hasMonthlyCapError);
  }, [
    isEnabled,
    placeIds,
    isWholeExperience,
    monthlyCap,
    hasMonthlyCapError,
    onStateChange,
    onErrorChange,
  ]);

  const initialPlaceIdSet = useMemo(() => new Set(initialPlaceIds), [initialPlaceIds]);
  useEffect(() => {
    const samePlaceIds =
      placeIds.length === initialPlaceIds.length &&
      placeIds.every((id) => initialPlaceIdSet.has(id));
    const sameEnabled = isEnabled === initialIsEnabled;
    const sameWhole = isWholeExperience === initialIsWholeExperience;
    const sameCap = monthlyCap === initialMonthlyCap;
    onDirtyChange(!(samePlaceIds && sameEnabled && sameWhole && sameCap));
  }, [
    placeIds,
    isEnabled,
    isWholeExperience,
    monthlyCap,
    initialPlaceIds,
    initialPlaceIdSet,
    initialIsEnabled,
    initialIsWholeExperience,
    initialMonthlyCap,
    onDirtyChange,
  ]);

  const confirmResetDialog = useMemo(
    () =>
      buildConfirmResetDialog({
        translate: translate as (key: ReturnType<typeof translationKey>) => string,
        onConfirm: () => {
          setIsEnabled(false);
          setPlaceIds([]);
          setIsWholeExperience(false);
          setMonthlyCap('');
          closeDialog();
        },
        onCancel: () => {
          closeDialog();
        },
      }),
    [closeDialog, translate],
  );

  const handleToggleChange = useCallback(
    (checked: boolean) => {
      if (checked) {
        setExtendDialogOpen(true);
      } else if (isEnabled || isWholeExperience || placeIds.length > 0) {
        configure(confirmResetDialog);
        open();
      } else {
        setIsEnabled(false);
      }
    },
    [confirmResetDialog, configure, isEnabled, isWholeExperience, open, placeIds.length],
  );

  const handleExtendDialogConfirm = useCallback(
    (nextPlaceIds: number[], nextIsWholeExperience: boolean) => {
      setPlaceIds(nextPlaceIds);
      setIsWholeExperience(nextIsWholeExperience);
      setIsEnabled(nextIsWholeExperience || nextPlaceIds.length > 0);
      setExtendDialogOpen(false);
    },
    [],
  );

  const handleExtendDialogCancel = useCallback(() => {
    setExtendDialogOpen(false);
  }, []);

  const handleManageClick = useCallback(() => {
    setExtendDialogOpen(true);
  }, []);

  const handleMonthlyCapChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    if (next !== '' && !MONEY_INPUT_PATTERN.test(next)) {
      return;
    }
    if (next !== '' && Number(next) > MAX_MONEY_BUDGET_USD) {
      return;
    }
    setMonthlyCap(next);
  }, []);

  const placeIdToName = useMemo(() => buildPlaceIdToNameMap(availablePlaces), [availablePlaces]);

  const freeTier = useCoresFreeTierUsage(universeId);
  const freeTierConsumedLabel = NUMBER_FORMATTER.format(freeTier.consumed);
  const freeTierQuotaLabel = NUMBER_FORMATTER.format(freeTier.quota);
  const freeTierPercent = freeTier.quota > 0 ? Math.min(1, freeTier.consumed / freeTier.quota) : 0;

  const heading = translate(
    translationKey('Heading.RccService', TranslationNamespace.CloudServices),
  );
  const title = translate(
    translationKey('Title.CoresQuota', TranslationNamespace.CloudServices),
  ) as string;
  const description = translateHTML(
    translationKey('Description.CoresQuota', TranslationNamespace.CloudServices),
    pricingLinkTags(),
  );
  const monthlyCapLabel = translate(
    translationKey('Label.SetMonthlyCapUsd', TranslationNamespace.CloudServices),
  ) as string;
  let monthlyCapErrorMessage: string | undefined;
  if (isEnabled && monthlyCap.length > 0) {
    if (isOverMax) {
      monthlyCapErrorMessage = translate(
        translationKey('Error.InvalidNumberOutsideOfBounds', TranslationNamespace.CloudServices),
      ) as string;
    } else if (isMalformed) {
      monthlyCapErrorMessage = translate(
        translationKey('Error.InvalidNumber', TranslationNamespace.CloudServices),
      ) as string;
    }
  }

  return (
    <Accordion disableGutters variant='outlined' defaultExpanded className={accordion}>
      <AccordionSummary className={accordionTitle}>{heading}</AccordionSummary>
      <AccordionDetails className={serviceFormContainer}>
        <div className={sectionContent}>
          <UnlockToggleRow
            title={title}
            description={description}
            isChecked={isEnabled}
            isDisabled={disableSwitch || isLoadingPlaces}
            onCheckedChange={handleToggleChange}
          />

          {isEnabled && (isWholeExperience || placeIds.length > 0) && (
            <div className={placesSection}>
              <div className={placesExtendedRow}>
                <span className='text-title-medium content-emphasis'>
                  {translate(
                    translationKey('Label.PlacesExtended', TranslationNamespace.CloudServices),
                  )}
                </span>
                <button
                  type='button'
                  onClick={handleManageClick}
                  disabled={disableSwitch}
                  data-testid='cores-quota-manage-button'
                  className={manageButton}>
                  {translate(translationKey('Label.Manage', TranslationNamespace.CloudServices))}
                </button>
              </div>
              <div className={chipsContainer} data-testid='cores-quota-chips'>
                {isWholeExperience ? (
                  <span className={chip}>
                    {translate(
                      translationKey('Label.ExperienceWhole', TranslationNamespace.CloudServices),
                    )}
                  </span>
                ) : (
                  placeIds.map((id) => {
                    const name = placeIdToName.get(id) ?? String(id);
                    return (
                      <span key={id} className={chip}>
                        {name}
                      </span>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {isEnabled && freeTier.isEnrolled && (
            <div
              className='flex flex-col width-full gap-small'
              style={{ maxWidth: MONTHLY_CAP_MAX_WIDTH_PX }}
              data-testid='cores-free-tier-bar'>
              <span className='text-title-medium content-emphasis margin-bottom-small'>
                {translate(
                  translationKey('Label.FreeTierUsageHours', TranslationNamespace.CloudServices),
                )}
              </span>
              <ProgressBar
                variant='Determinate'
                value={freeTierPercent * 100}
                ariaLabel={translate(
                  translationKey('Label.FreeTierUsageHours', TranslationNamespace.CloudServices),
                )}
              />
              <div className='flex flex-row items-baseline justify-between gap-small'>
                <span className='text-body-medium content-muted'>{freeTierConsumedLabel}</span>
                <span className='text-body-medium content-muted'>{freeTierQuotaLabel}</span>
              </div>
              {freeTierPercent >= 1 && (
                <span className='text-body-medium content-muted'>
                  {translateHTML(
                    translationKey('Label.FreeTierExhausted', TranslationNamespace.CloudServices),
                    pricingLinkTags(),
                  )}
                </span>
              )}
            </div>
          )}

          {isEnabled && (
            <div className={monthlyCapContainer}>
              <TextInput
                label={monthlyCapLabel}
                value={monthlyCap}
                onChange={handleMonthlyCapChange}
                isDisabled={disableSwitch}
                inputMode='decimal'
                size='Medium'
                variant='Standard'
                error={monthlyCapErrorMessage}
                data-testid='cores-quota-monthly-cap-input'
                leadingIconNode={
                  <span className='content-emphasis' style={{ marginLeft: 4 }} aria-hidden='true'>
                    $
                  </span>
                }
              />
            </div>
          )}
        </div>

        <ExtendCoreQuotaDialog
          open={extendDialogOpen}
          initialPlaceIds={placeIds}
          initialIsWholeExperience={isWholeExperience}
          availablePlaces={availablePlaces}
          isLoadingPlaces={isLoadingPlaces}
          onCancel={handleExtendDialogCancel}
          onConfirm={handleExtendDialogConfirm}
        />
      </AccordionDetails>
    </Accordion>
  );
};

export default withTranslation(CoresQuotaSection, [TranslationNamespace.CloudServices]);
