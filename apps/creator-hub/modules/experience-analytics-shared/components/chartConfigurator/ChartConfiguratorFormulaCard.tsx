import type { CSSProperties, FC } from 'react';
import React, { useCallback, useMemo } from 'react';
import { Badge, Button, IconButton, TextArea, TextInput } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { makeStyles } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { parseComputedMetricFormula } from '../../utils/computedMetrics/parseComputedMetricFormula';

// Module-scope constant so the prop reference is stable across every render —
// passing a fresh object each render to TextArea's `textareaStyle` would
// invalidate any downstream identity comparisons.
//
// The Foundation `TextArea` applies `text-body-medium` (a `font:` shorthand)
// directly to the underlying <textarea>, which sets the font family to
// BuilderSans. Class-based overrides lose to it depending on stylesheet
// injection order, so we apply the monospace stack as an inline style to
// guarantee it wins (inline styles have higher specificity than any class).
const MONO_TEXTAREA_STYLE: CSSProperties = {
  fontFamily:
    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  fontFeatureSettings: '"calt" 0',
  letterSpacing: 0,
};

// Module-scope to avoid a new array identity on every render, which would
// re-trigger memoization downstream and violates the React lint rule against
// object/array literal default props.
const EMPTY_SEMANTIC_ERRORS: readonly string[] = [];

type ChartConfiguratorFormulaCardProps = {
  formula: string;
  /**
   * Controlled value for the editable name input shown only in the expanded
   * branch. Reflects raw user typing, including text that may still be
   * pending or blocked by moderation — never use it for the collapsed
   * header (use `displayName` instead).
   */
  formulaName: string;
  /**
   * Name shown in the collapsed header. Must be a moderation-confirmed
   * value (or empty); rendered as "(Untitled formula)" when empty so an
   * unmoderated typed name never reaches the sidebar header, including on
   * first render of a URL-restored card.
   */
  displayName: string;
  variableKeys: string[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onFormulaChange: (formula: string) => void;
  onNameChange: (name: string) => void;
  semanticErrors?: readonly string[];
  /**
   * When true, the formula card renders in an error state (red outline)
   * regardless of local validation results. Used to surface errors that
   * originate outside the card (e.g. unresolved source-metric constraints).
   */
  hasExternalError?: boolean;
  /**
   * Translated error message for the formula name input. When provided the
   * name field renders in an error state (red outline) and the message is
   * shown below it. Used to surface async validation results such as text
   * moderation against the typed name.
   */
  nameError?: string;
};

const useStyles = makeStyles()(() => ({
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '12px',
  },
  headerRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '8px',
    minHeight: '32px',
  },
  headerLabel: {
    flex: 1,
    fontSize: '14px',
    fontWeight: 600,
    lineHeight: '20px',
    color: 'var(--content-emphasis)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  formulaNameInput: {
    flex: 1,
    minWidth: 0,
  },
  doneButton: {
    flexShrink: 0,
  },
  expandedBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  fieldLabel: {
    fontSize: '14px',
    fontWeight: 700,
    lineHeight: '20px',
    color: 'var(--content-default)',
  },
  helperText: {
    fontSize: '12px',
    lineHeight: '16px',
    color: 'var(--content-muted)',
  },
  errorText: {
    fontSize: '12px',
    lineHeight: '16px',
    color: 'var(--content-alert)',
  },
}));

const ChartConfiguratorFormulaCard: FC<ChartConfiguratorFormulaCardProps> = ({
  formula,
  formulaName,
  displayName,
  variableKeys,
  isExpanded,
  onToggleExpand,
  onFormulaChange,
  onNameChange,
  semanticErrors = EMPTY_SEMANTIC_ERRORS,
  hasExternalError = false,
  nameError,
}) => {
  const {
    classes: {
      card,
      headerRow,
      headerLabel,
      formulaNameInput,
      doneButton,
      expandedBody,
      fieldLabel,
      helperText,
      errorText,
    },
  } = useStyles();
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const untitledFormulaLabel = tPendingTranslation(
    '(Untitled formula)',
    'Default name shown for a formula that has not been named yet.',
    translationKey('Label.ExploreMode.UntitledFormula', TranslationNamespace.Analytics),
  );
  const formulaBadgeLabel = tPendingTranslation(
    'Formula',
    'Badge label identifying a card as a computed formula metric.',
    translationKey('Label.ExploreMode.Formula', TranslationNamespace.Analytics),
  );
  const editFormulaLabel = tPendingTranslation(
    'Edit formula',
    'Tooltip for the button to expand and edit a formula definition.',
    translationKey('Action.ExploreMode.EditFormula', TranslationNamespace.Analytics),
  );
  const doneLabel = tPendingTranslation(
    'Done',
    'Label on a Done button',
    translationKey('Action.Done', TranslationNamespace.Analytics),
  );
  const formulaPlaceholder = tPendingTranslation(
    'ex: (A / B) * 100',
    'Placeholder text in the formula input field showing an example mathematical expression.',
    translationKey('Placeholder.ExploreMode.Formula', TranslationNamespace.Analytics),
  );
  const supportsMathOpsLabel = tPendingTranslation(
    'Supports basic math (+, -, *, /), powers (^), and logarithms (log(A) or log(value, base))',
    'Helper text below the formula input explaining that math operations, exponentiation, and logarithms are supported.',
    translationKey(
      'Label.ExploreMode.FormulaHelperWithPowerAndLog',
      TranslationNamespace.Analytics,
    ),
  );

  const validationResult = useMemo(() => {
    if (!formula.trim()) {
      return null;
    }
    return parseComputedMetricFormula(formula, variableKeys);
  }, [formula, variableKeys]);

  const validationErrors = useMemo(() => {
    if (!validationResult || validationResult.ok) {
      return [];
    }
    return validationResult.errors;
  }, [validationResult]);

  const hasNameError = Boolean(nameError);
  // Card-level red outline triggers for any error, including a moderated name.
  // The formula TextArea, by contrast, only reflects formula-related errors so
  // a bad name doesn't visually blame the formula expression. The name error
  // contribution is gated on `isExpanded` to match the rendering rule below
  // (we don't surface a name error in the collapsed state, so we shouldn't
  // outline the card for it either — the user can't see what went wrong).
  const hasFormulaError =
    hasExternalError || validationErrors.length > 0 || semanticErrors.length > 0;
  const hasError = hasFormulaError || (isExpanded && hasNameError);

  const handleFormulaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onFormulaChange(e.target.value);
    },
    [onFormulaChange],
  );

  const headerLabelText = displayName || untitledFormulaLabel;

  const cardClassName = `${card} bg-surface-100 stroke-standard ${
    hasError ? 'stroke-system-alert' : 'stroke-default'
  } radius-medium`;

  if (!isExpanded) {
    // The collapsed header renders `displayName` (a moderation-confirmed
    // value supplied by the parent), never the raw `formulaName`. This
    // guarantees that pending or blocked typing — including a profanity-
    // laden name restored from a sharable URL on first render — never
    // surfaces in the sidebar header.
    //
    // `nameError` is intentionally not rendered here either: the input
    // isn't visible in this state, so there's no affordance for the user
    // to fix the rejected text. We surface it only when the input is
    // actually editable in the expanded branch.
    return (
      <div className={cardClassName}>
        <div className={headerRow}>
          <Badge variant='Contrast' label={formulaBadgeLabel} />
          <span className={headerLabel}>{headerLabelText}</span>
          <IconButton
            icon='icon-filled-pencil'
            variant='Utility'
            size='Small'
            ariaLabel={editFormulaLabel}
            onClick={onToggleExpand}
          />
        </div>
        {semanticErrors.length > 0 &&
          semanticErrors.map((err) => (
            <span key={err} className={errorText}>
              {err}
            </span>
          ))}
      </div>
    );
  }

  return (
    <div className={cardClassName}>
      <div className={headerRow}>
        <Badge variant='Contrast' label={formulaBadgeLabel} />
        <TextInput
          className={formulaNameInput}
          size='Small'
          value={formulaName}
          placeholder={untitledFormulaLabel}
          hasError={hasNameError}
          onChange={(e) => onNameChange(e.target.value)}
        />
        <Button className={doneButton} variant='Emphasis' size='Small' onClick={onToggleExpand}>
          {doneLabel}
        </Button>
      </div>
      {nameError && <span className={errorText}>{nameError}</span>}

      <div className={expandedBody}>
        <span className={fieldLabel}>{formulaBadgeLabel}</span>
        <TextArea
          size='Medium'
          value={formula}
          placeholder={formulaPlaceholder}
          onChange={handleFormulaChange}
          hasError={hasFormulaError}
          textareaStyle={MONO_TEXTAREA_STYLE}
        />
        {validationErrors.length > 0 &&
          validationErrors.map((err) => (
            <span key={err} className={errorText}>
              {err}
            </span>
          ))}
        {validationErrors.length === 0 &&
          semanticErrors.length > 0 &&
          semanticErrors.map((err) => (
            <span key={err} className={errorText}>
              {err}
            </span>
          ))}
        {validationErrors.length === 0 && semanticErrors.length === 0 && (
          <span className={helperText}>{supportsMathOpsLabel}</span>
        )}
      </div>
    </div>
  );
};

export default ChartConfiguratorFormulaCard;
