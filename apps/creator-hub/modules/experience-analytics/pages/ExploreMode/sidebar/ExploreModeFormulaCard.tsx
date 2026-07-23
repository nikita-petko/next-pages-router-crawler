import React, { FC, useCallback, useMemo } from 'react';
import { Badge, Button, IconButton, TextArea, TextInput } from '@rbx/foundation-ui';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { makeStyles } from '@rbx/ui';
import { parseComputedMetricFormula } from '@modules/experience-analytics-shared';
import { useTranslation } from '@rbx/intl';

type ExploreModeFormulaCardProps = {
  formula: string;
  formulaName: string;
  variableKeys: string[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onFormulaChange: (formula: string) => void;
  onNameChange: (name: string) => void;
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

const ExploreModeFormulaCard: FC<ExploreModeFormulaCardProps> = ({
  formula,
  formulaName,
  variableKeys,
  isExpanded,
  onToggleExpand,
  onFormulaChange,
  onNameChange,
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
    'Supports mathematical operations',
    'Helper text below the formula input explaining that math operations are supported.',
    translationKey('Label.ExploreMode.FormulaHelper', TranslationNamespace.Analytics),
  );

  const validationResult = useMemo(() => {
    if (!formula.trim()) return null;
    return parseComputedMetricFormula(formula, variableKeys);
  }, [formula, variableKeys]);

  const validationErrors = useMemo(() => {
    if (!validationResult || validationResult.ok) return [];
    return validationResult.errors;
  }, [validationResult]);

  const handleFormulaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onFormulaChange(e.target.value);
    },
    [onFormulaChange],
  );

  const displayName = formulaName || untitledFormulaLabel;

  if (!isExpanded) {
    return (
      <div className={`${card} bg-surface-100 stroke-standard stroke-default radius-small`}>
        <div className={headerRow}>
          <Badge variant='Neutral' label={formulaBadgeLabel} />
          <span className={headerLabel}>{displayName}</span>
          <IconButton
            icon='icon-filled-pencil'
            variant='Utility'
            size='Small'
            ariaLabel={editFormulaLabel}
            onClick={onToggleExpand}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`${card} bg-surface-100 stroke-standard stroke-default radius-small`}>
      <div className={headerRow}>
        <Badge variant='Neutral' label={formulaBadgeLabel} />
        <TextInput
          className={formulaNameInput}
          size='Small'
          value={formulaName}
          placeholder={untitledFormulaLabel}
          onChange={(e) => onNameChange(e.target.value)}
        />
        <Button className={doneButton} variant='Emphasis' size='Small' onClick={onToggleExpand}>
          {doneLabel}
        </Button>
      </div>

      <div className={expandedBody}>
        <span className={fieldLabel}>{formulaBadgeLabel}</span>
        <TextArea
          size='Medium'
          value={formula}
          placeholder={formulaPlaceholder}
          onChange={handleFormulaChange}
        />
        {validationErrors.length > 0 ? (
          validationErrors.map((err) => (
            <span key={err} className={errorText}>
              {err}
            </span>
          ))
        ) : (
          <span className={helperText}>{supportsMathOpsLabel}</span>
        )}
      </div>
    </div>
  );
};

export default ExploreModeFormulaCard;
