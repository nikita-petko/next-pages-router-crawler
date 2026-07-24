// Orchestrates revenue share recipient editing, allocation validation, proposal review, and asynchronous submission.
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FunctionComponent,
} from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { VisuallyHidden, type TStepperStep } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import CreatorType from '@modules/miscellaneous/common/enums/Creator';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  RevShareRecipientType,
  type RevShareRecipientAllocation,
  type RevShareRecipientSearchResult,
  type RevShareSplit,
} from '../interface/RevShareViewModel';
import {
  areRevShareSplitsEqual,
  asNumberTypedId,
  asSafeBasisPoints,
  formatBasisPoints,
  getRevShareRecipientKey,
  materializeManagerProposal,
  materializeProposedSplit,
} from '../utils/revShareUtils';
import { validateRevShareSplitEditorAllocations } from '../utils/revShareValidation';
import RevShareWizardStep from './nav/RevShareWizardStep';
import RevShareProposalTermsView from './RevShareProposalTermsView';
import RevShareReviewView from './RevShareReviewView';
import RevShareSplitEditorView from './RevShareSplitEditorView';
import type { RevShareThumbnailWithNamesProps } from './RevShareThumbnailWithNames';
import { buildRevShareDiffRowsFromSplitEditor } from './tables/RevShareDiffTable';
import {
  decorateSplitEditorFieldErrors,
  orderSplitEditorDisplayRows,
  rebalanceSplitEditorManagingGroupBasisPoints,
  splitEditorRowsToRecipientAllocations,
  type SplitEditorRow,
} from './tables/RevShareSplitEditorTable';

type EditorFormValues = {
  rows: SplitEditorRow[];
  recipientQuery: string;
};

export type RevShareSplitEditorFlowStep = 'editor' | 'review' | 'terms';
export type RevShareSplitEditorFlowPresentation = 'page' | 'dialog';

type RevShareSplitEditorFlowProps = {
  activeSplit: RevShareSplit;
  initialRows: readonly SplitEditorRow[];
  searchResults: readonly RevShareRecipientSearchResult[];
  isSearchLoading?: boolean;
  searchError?: boolean;
  onSearchQueryChange?: (query: string) => void;
  onExit?: () => void;
  onSubmitProposal?: (allocations: readonly RevShareRecipientAllocation[]) => void | Promise<void>;
  isSubmitting?: boolean;
  presentation?: RevShareSplitEditorFlowPresentation;
  onStepChange?: (step: RevShareSplitEditorFlowStep) => void;
};

const RevShareSplitEditorFlow: FunctionComponent<RevShareSplitEditorFlowProps> = ({
  activeSplit,
  initialRows,
  searchResults,
  isSearchLoading = false,
  searchError = false,
  onSearchQueryChange,
  onExit,
  onSubmitProposal,
  isSubmitting = false,
  presentation = 'page',
  onStepChange,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const [step, setStep] = useState<RevShareSplitEditorFlowStep>('editor');
  const [hasAttemptedContinue, setHasAttemptedContinue] = useState(false);
  const [hasNoChangesError, setHasNoChangesError] = useState(false);
  const [invalidDraftKeys, setInvalidDraftKeys] = useState<ReadonlySet<string>>(() => new Set());
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [isSubmitPending, setIsSubmitPending] = useState(false);
  const [validationFocusGeneration, setValidationFocusGeneration] = useState(0);
  const isSubmitPendingRef = useRef(false);
  const validationMessageId = useId();
  const validationBannerRef = useRef<HTMLDivElement>(null);
  const stepFocusRef = useRef<HTMLElement>(null);
  const setStepFocusElement = useCallback((element: HTMLElement | null) => {
    stepFocusRef.current = element;
  }, []);
  const { control, getValues, setValue } = useForm<EditorFormValues>({
    defaultValues: {
      rows: [...initialRows],
      recipientQuery: '',
    },
  });
  const rows = useWatch({ control, name: 'rows' });
  const recipientQuery = useWatch({ control, name: 'recipientQuery' });
  const activeRows = useMemo(() => rows.filter((row) => !row.isRemoved), [rows]);
  const validation = useMemo(
    () =>
      validateRevShareSplitEditorAllocations(
        activeRows.map((row) => ({
          splitBasisPoints: row.basisPoints,
          isManagingGroup: row.isManagingGroup,
        })),
      ),
    [activeRows],
  );
  const existingRecipientKeys = useMemo(
    () => new Set(activeRows.map((row) => row.key)),
    [activeRows],
  );
  const proposedSplit = useMemo(
    () =>
      materializeProposedSplit({
        allocations: splitEditorRowsToRecipientAllocations(rows),
        activeUnallocatedBasisPoints: activeSplit.unallocatedBasisPoints,
      }),
    [activeSplit.unallocatedBasisPoints, rows],
  );
  const proposal = useMemo(
    () => materializeManagerProposal(activeSplit, proposedSplit),
    [activeSplit, proposedSplit],
  );
  const reviewRows = useMemo(
    () => buildRevShareDiffRowsFromSplitEditor(rows, proposal),
    [proposal, rows],
  );
  const wizardSteps = useMemo(
    (): TStepperStep[] => [
      {
        label: tPendingTranslation(
          'Edit recipients',
          'Step name for editing revenue share recipients.',
          translationKey('Label.EditRecipientsStep', TranslationNamespace.RevenueShareAgreements),
        ),
      },
      {
        label: tPendingTranslation(
          'Review changes',
          'Step name for reviewing revenue share changes.',
          translationKey('Label.ReviewChangesStep', TranslationNamespace.RevenueShareAgreements),
        ),
      },
      {
        label: tPendingTranslation(
          'Terms & implications',
          'Step name for revenue share proposal terms.',
          translationKey('Label.TermsStep', TranslationNamespace.RevenueShareAgreements),
        ),
      },
    ],
    [tPendingTranslation],
  );
  const wizardAriaLabel = tPendingTranslation(
    'Revenue share',
    'Accessible name for the revenue share wizard stepper.',
    translationKey('Label.RevenueShareWizard', TranslationNamespace.RevenueShareAgreements),
  );
  const currentStepIndex = step === 'editor' ? 0 : step === 'review' ? 1 : 2;
  const invalidRecipientShareMessage = tPendingTranslation(
    'Each recipient must have a valid share greater than 0%.',
    'Validation error when a revenue share recipient has an invalid or zero share.',
    translationKey('Error.InvalidRecipientShare', TranslationNamespace.RevenueShareAgreements),
  );
  const effectiveInvalidDraftKeys = useMemo(() => {
    const activeKeys = new Set(activeRows.map((row) => row.key));
    return new Set([...invalidDraftKeys].filter((key) => activeKeys.has(key)));
  }, [activeRows, invalidDraftKeys]);
  const validationMessage = useMemo(() => {
    if (effectiveInvalidDraftKeys.size > 0) {
      return invalidRecipientShareMessage;
    }
    if (validation.reason !== null) {
      if (validation.reason === 'empty') {
        return tPendingTranslation(
          'Add at least one recipient before continuing.',
          'Validation error when a revenue share split has no rows.',
          translationKey('Error.NoRecipients', TranslationNamespace.RevenueShareAgreements),
        );
      }
      if (validation.reason === 'recipient-zero' || validation.reason === 'invalid-basis-points') {
        return invalidRecipientShareMessage;
      }
      if (validation.reason === 'recipient-limit') {
        return tPendingTranslation(
          'Revenue shares can include up to 100 recipients.',
          'Validation message shown when a revenue share proposal includes more than 100 recipients.',
          translationKey('Label.TooManyRecipients', TranslationNamespace.RevenueShareAgreements),
        );
      }
      return tPendingTranslation(
        'Revenue shares must total 100.00%. The current total is {total}%.',
        'Validation error when revenue shares do not total 100%; {total} is the current percentage.',
        translationKey('Error.SplitTotal', TranslationNamespace.RevenueShareAgreements),
        { total: formatBasisPoints(asSafeBasisPoints(validation.totalBasisPoints)) },
      );
    }
    if (hasAttemptedContinue && hasNoChangesError) {
      return tPendingTranslation(
        'Make at least one change before continuing.',
        'Validation error when the proposed revenue share split is identical to the active split.',
        translationKey('Error.NoChanges', TranslationNamespace.RevenueShareAgreements),
      );
    }
    return undefined;
  }, [
    effectiveInvalidDraftKeys,
    hasAttemptedContinue,
    hasNoChangesError,
    invalidRecipientShareMessage,
    tPendingTranslation,
    validation,
  ]);

  const validationBannerTone = hasNoChangesError ? 'emphasis' : 'alert';
  const editorRows = useMemo(
    () =>
      hasAttemptedContinue
        ? decorateSplitEditorFieldErrors(
            orderSplitEditorDisplayRows(rows),
            invalidRecipientShareMessage,
          )
        : orderSplitEditorDisplayRows(rows),
    [hasAttemptedContinue, invalidRecipientShareMessage, rows],
  );

  useEffect(() => {
    if (validationFocusGeneration === 0) {
      return;
    }
    validationBannerRef.current?.focus();
  }, [validationFocusGeneration]);
  useLayoutEffect(() => {
    stepFocusRef.current?.focus();
  }, [step]);

  const requestValidationBannerFocus = useCallback(() => {
    setValidationFocusGeneration((generation) => generation + 1);
  }, []);

  const transitionToStep = useCallback(
    (nextStep: RevShareSplitEditorFlowStep) => {
      setStep(nextStep);
      onStepChange?.(nextStep);
    },
    [onStepChange],
  );
  const handleSplitValidityChange = useCallback((key: string, isValid: boolean) => {
    setInvalidDraftKeys((current) => {
      if (isValid && !current.has(key)) {
        return current;
      }
      if (!isValid && current.has(key)) {
        return current;
      }
      const next = new Set(current);
      if (isValid) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);
  const handleSplitChange = useCallback(
    (key: string, basisPoints: number) => {
      const nextBasisPoints = asSafeBasisPoints(basisPoints);
      setHasNoChangesError(false);
      setValue(
        'rows',
        rebalanceSplitEditorManagingGroupBasisPoints(
          rows.map((row) => (row.key === key ? { ...row, basisPoints: nextBasisPoints } : row)),
        ),
        { shouldDirty: true },
      );
    },
    [rows, setValue],
  );
  const handleRemove = useCallback(
    (key: string) => {
      setHasNoChangesError(false);
      setInvalidDraftKeys((current) => {
        if (!current.has(key)) {
          return current;
        }
        const next = new Set(current);
        next.delete(key);
        return next;
      });
      setValue(
        'rows',
        rebalanceSplitEditorManagingGroupBasisPoints(
          rows.flatMap((row) => {
            if (row.key !== key) {
              return [row];
            }
            if (row.isNew || row.previousBasisPoints === null) {
              return [];
            }
            return [{ ...row, isRemoved: true, basisPoints: 0 }];
          }),
        ),
        { shouldDirty: true },
      );
    },
    [rows, setValue],
  );
  const handleQueryChange = useCallback(
    (query: string) => {
      setValue('recipientQuery', query, { shouldDirty: true });
      onSearchQueryChange?.(query);
    },
    [onSearchQueryChange, setValue],
  );
  const handleAddRecipient = useCallback(
    (recipient: RevShareRecipientSearchResult) => {
      const key = getRevShareRecipientKey(recipient);
      const existingRow = rows.find((row) => row.key === key);
      if (existingRow !== undefined) {
        if (!existingRow.isRemoved || existingRow.previousBasisPoints === null) {
          return;
        }
        const restoredBasisPoints = existingRow.previousBasisPoints;
        setHasNoChangesError(false);
        setValue(
          'rows',
          rebalanceSplitEditorManagingGroupBasisPoints(
            rows.map((row) =>
              row.key === key
                ? {
                    ...row,
                    basisPoints: restoredBasisPoints,
                    isRemoved: false,
                  }
                : row,
            ),
          ),
          { shouldDirty: true },
        );
        setValue('recipientQuery', '', { shouldDirty: true });
        onSearchQueryChange?.('');
        return;
      }
      const identity: {
        target: RevShareThumbnailWithNamesProps['target'];
        targetType: CreatorType;
      } =
        recipient.type === RevShareRecipientType.User
          ? {
              target: {
                id: asNumberTypedId(recipient.id),
                displayName: recipient.name,
                ...(recipient.username ? { name: recipient.username } : {}),
              },
              targetType: CreatorType.User,
            }
          : {
              target: { id: asNumberTypedId(recipient.id), name: recipient.name },
              targetType: CreatorType.Group,
            };
      setHasNoChangesError(false);
      setValue(
        'rows',
        rebalanceSplitEditorManagingGroupBasisPoints([
          ...rows,
          {
            key,
            id: recipient.id,
            name: recipient.name,
            type: recipient.type,
            identity,
            previousBasisPoints: null,
            basisPoints: 0,
            isNew: true,
          },
        ]),
        { shouldDirty: true },
      );
      setValue('recipientQuery', '', { shouldDirty: true });
      onSearchQueryChange?.('');
    },
    [onSearchQueryChange, rows, setValue],
  );
  const handleEditorContinue = useCallback(() => {
    setHasAttemptedContinue(true);
    setHasNoChangesError(false);
    if (!validation.isValid || effectiveInvalidDraftKeys.size > 0) {
      requestValidationBannerFocus();
      return;
    }
    if (areRevShareSplitsEqual(proposedSplit, activeSplit)) {
      setHasNoChangesError(true);
      requestValidationBannerFocus();
      return;
    }
    transitionToStep('review');
  }, [
    activeSplit,
    effectiveInvalidDraftKeys,
    proposedSplit,
    requestValidationBannerFocus,
    transitionToStep,
    validation.isValid,
  ]);
  const handleReviewBack = useCallback(() => {
    transitionToStep('editor');
  }, [transitionToStep]);
  const handleReviewContinue = useCallback(() => {
    transitionToStep('terms');
  }, [transitionToStep]);
  const handleTermsBack = useCallback(() => {
    transitionToStep('review');
  }, [transitionToStep]);
  const handleTermsSubmit = useCallback(() => {
    void (async () => {
      if (!isTermsAccepted || !onSubmitProposal || isSubmitting || isSubmitPendingRef.current) {
        return;
      }
      isSubmitPendingRef.current = true;
      setIsSubmitPending(true);
      try {
        await onSubmitProposal(splitEditorRowsToRecipientAllocations(getValues('rows')));
      } finally {
        isSubmitPendingRef.current = false;
        setIsSubmitPending(false);
      }
    })();
  }, [isSubmitting, isTermsAccepted, onSubmitProposal]); // eslint-disable-line react-hooks/exhaustive-deps -- getValues from useForm is stable; React Compiler marks it extra
  const termsSubmitting = isSubmitting || isSubmitPending;
  const termsHeading = tPendingTranslation(
    'Terms & implications',
    'Heading for the revenue-share proposal consent step.',
    translationKey('Heading.TermsAndImplications', TranslationNamespace.RevenueShareAgreements),
  );

  if (step === 'terms') {
    return (
      <RevShareProposalTermsView
        stepIndicator={
          <>
            <RevShareWizardStep
              steps={wizardSteps}
              currentStepIndex={currentStepIndex}
              aria-label={wizardAriaLabel}
            />
            {presentation === 'page' ? (
              <h2
                ref={setStepFocusElement}
                tabIndex={-1}
                className='text-heading-medium content-emphasis margin-none'>
                {termsHeading}
              </h2>
            ) : (
              <VisuallyHidden>
                <span ref={setStepFocusElement} tabIndex={-1}>
                  {termsHeading}
                </span>
              </VisuallyHidden>
            )}
          </>
        }
        isAccepted={isTermsAccepted}
        onAcceptedChange={setIsTermsAccepted}
        onBack={handleTermsBack}
        onSubmit={handleTermsSubmit}
        isSubmitting={termsSubmitting}
      />
    );
  }

  if (step === 'review') {
    return (
      <RevShareReviewView
        rows={reviewRows}
        wizardSteps={wizardSteps}
        currentStepIndex={currentStepIndex}
        wizardAriaLabel={wizardAriaLabel}
        onBack={handleReviewBack}
        onContinue={onSubmitProposal ? handleReviewContinue : undefined}
        stepFocusRef={setStepFocusElement}
      />
    );
  }

  return (
    <RevShareSplitEditorView
      rows={editorRows}
      wizardSteps={wizardSteps}
      currentStepIndex={currentStepIndex}
      wizardAriaLabel={wizardAriaLabel}
      recipientQuery={recipientQuery}
      searchResults={searchResults}
      excludedRecipientKeys={existingRecipientKeys}
      isRecipientSearchLoading={isSearchLoading}
      recipientSearchHasError={searchError}
      onRecipientQueryChange={handleQueryChange}
      onAddRecipient={handleAddRecipient}
      onSplitChange={handleSplitChange}
      onSplitValidityChange={handleSplitValidityChange}
      onRemove={handleRemove}
      onBack={onExit}
      onContinue={handleEditorContinue}
      validationMessage={validationMessage}
      validationBannerTone={validationBannerTone}
      validationMessageId={validationMessageId}
      validationBannerRef={validationBannerRef}
      stepFocusRef={setStepFocusElement}
    />
  );
};

export default RevShareSplitEditorFlow;
