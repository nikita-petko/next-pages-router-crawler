import type { CSSProperties, FC, ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Modifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useFlag } from '@rbx/flags';
import {
  Badge,
  Button,
  Icon,
  IconButton,
  Menu,
  MenuItem,
  MenuSection,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@rbx/foundation-ui';
import { useLocalization, useTranslation } from '@rbx/intl';
import { CircularProgress } from '@rbx/ui';
import { isErrorReportSuggestedRulesEnabled } from '@generated/flags/creatorAnalytics';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import ChartFooter from '@modules/charts-generic/charts/ChartFooter';
import { ColumnType } from '@modules/charts-generic/tables/types/GenericColumnType';
import type { CellDataType } from '@modules/charts-generic/tables/types/GenericTableType';
import {
  RegexOperation,
  RegexStatus,
  type UniverseRegex,
} from '@modules/clients/analytics/logAttribute';
import GenericDataTable, {
  type PaginatedColumnRequest,
  type RowDataResponse,
  type TableDataColumnConfig,
} from '@modules/experience-analytics-shared/components/RAQIV2/table/GenericDataTable';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import type { PaginationResponse } from '@modules/experience-analytics-shared/hooks/usePaginatedRequest';
import { Link } from '@modules/miscellaneous/components';
import ConfirmDialog from '@modules/miscellaneous/components/ConfirmDialog/ConfirmDialog';
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';
import {
  useDeleteUniverseRegexMutation,
  useIgnoreUniverseRegexMutation,
  useReorderUniverseRegexMutation,
  useUniverseRegexesQuery,
} from '../../hooks/useUniverseRegexes';
import ErrorReportRuleFormDialog from './ErrorReportRuleFormDialog';

const verticalLockModifier: Modifier = ({ transform }) => ({
  ...transform,
  x: 0,
});
const VERTICAL_LOCK_MODIFIERS = [verticalLockModifier];
const DRAG_ACTIVATION_DISTANCE_PX = 5;
const EMPTY_TABLE_VALUE = '-';

const SUGGESTED_RULE_TABLE_COLUMN_KEYS = {
  regex: 'suggestedRule.regex',
  matches: 'suggestedRule.matches',
  sampleMessage: 'suggestedRule.sampleMessage',
  actions: 'suggestedRule.actions',
} as const;

type SuggestedRuleColumnKey =
  (typeof SUGGESTED_RULE_TABLE_COLUMN_KEYS)[keyof typeof SUGGESTED_RULE_TABLE_COLUMN_KEYS];
type SuggestedRuleActionType = 'useExpression' | 'deleteSuggestion';
type SuggestedRuleColumnRequest = PaginatedColumnRequest<
  UniverseRegex,
  number,
  SuggestedRuleColumnKey
>;
type SuggestedRuleColumnResponse = PaginationResponse<RowDataResponse<UniverseRegex, number>>;

const DeleteSuggestionIcon = () => (
  <Icon name='icon-regular-trash-can' className='content-system-alert' />
);

const ErrorReportRulesView = {
  Active: 'active',
  Suggested: 'suggested',
} as const;
type ErrorReportRulesView = (typeof ErrorReportRulesView)[keyof typeof ErrorReportRulesView];

const makeLearnMoreLink = (chunks: ReactNode) => (
  <Link
    href={creatorHub.docs.getAnalyticsErrorReportUrl()}
    target='_blank'
    underline='always'
    color='inherit'>
    {chunks}
  </Link>
);

const CreateErrorReportRuleButton: FC<{ onClick: () => void; label?: string }> = ({
  onClick,
  label,
}) => {
  const { translate } = useTranslationWrapper(useTranslation());

  const resolvedLabel =
    label ?? translate(translationKey('Action.Button.CreateRule', TranslationNamespace.Analytics));

  return (
    <Button color='primaryBrand' onClick={onClick}>
      {resolvedLabel}
    </Button>
  );
};

const ErrorReportRulesEmptyState: FC<{ onCreate: () => void }> = ({ onCreate }) => {
  const { translate, translateHTML } = useTranslationWrapper(useTranslation());
  const createLabel = translate(translationKey('Action.Create', TranslationNamespace.Controls));
  const description = translateHTML(
    translationKey('EmptyState.ErrorReportRules.Description', TranslationNamespace.Analytics),
    [
      {
        opening: 'linkStart',
        closing: 'linkEnd',
        content: makeLearnMoreLink,
      },
    ],
  );

  return (
    <EmptyState
      title={translate(
        translationKey('EmptyState.ErrorReportRules.Title', TranslationNamespace.Analytics),
      )}
      description={description}
      size='large'
      illustration='localization'>
      <CreateErrorReportRuleButton onClick={onCreate} label={createLabel} />
    </EmptyState>
  );
};

const RULE_REGEX_COLUMN_CLASS = 'grow-4 shrink-1 basis-0 min-width-0';
const RULE_OUTPUT_COLUMN_CLASS = 'grow-0 shrink-0 basis-[220px] max-width-[340px]';
const RULE_ACTION_COLUMN_CLASS = 'grow-0 shrink-0 basis-[104px]';
const RULE_LAST_MODIFIED_COLUMN_CLASS = 'grow-1 shrink-1 basis-0 min-width-0';
const RULE_CELL_BORDER_CLASS =
  '[border-bottom:var(--stroke-standard)_solid_var(--color-stroke-default)]';
const MATCH_COUNT_BUCKETS = [
  100_000_000, 10_000_000, 1_000_000, 100_000, 10_000, 1_000, 100,
] as const;

const formatLastModifiedTime = (updatedTime: string, locale: string): string => {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(updatedTime));
};

const formatMatchedCount = (
  matchedCount: number | null,
  compactIntegerFormatter: Intl.NumberFormat,
  formatGreaterThanLabel: (count: string) => string,
): string => {
  if (matchedCount === null) {
    return EMPTY_TABLE_VALUE;
  }
  const bucket = MATCH_COUNT_BUCKETS.find((minimum) => matchedCount >= minimum);
  if (bucket !== undefined) {
    return formatGreaterThanLabel(compactIntegerFormatter.format(bucket));
  }
  return EMPTY_TABLE_VALUE;
};

const RuleHeaderCell: FC<{ label?: string; className?: string }> = ({ label, className }) => (
  <div
    className={`flex items-center min-height-1200 padding-y-medium padding-x-xlarge ${RULE_CELL_BORDER_CLASS}${
      className ? ` ${className}` : ''
    }`}>
    {label ? <span className='text-label-medium content-emphasis'>{label}</span> : null}
  </div>
);

const RuleRegexCell: FC<{ children: ReactNode }> = ({ children }) => (
  <div
    className={`${RULE_REGEX_COLUMN_CLASS} padding-xlarge text-body-medium content-emphasis text-wrap [overflow-wrap:anywhere]`}>
    {children}
  </div>
);

const RuleOutputCell: FC<{ children: ReactNode }> = ({ children }) => (
  <div
    className={`${RULE_OUTPUT_COLUMN_CLASS} padding-xlarge text-body-medium content-emphasis text-wrap [overflow-wrap:anywhere]`}>
    {children}
  </div>
);

const LastModifiedCell: FC<{ locale: string; updatedTime: string }> = ({ locale, updatedTime }) => (
  <div
    className={`${RULE_LAST_MODIFIED_COLUMN_CLASS} padding-xlarge text-body-medium content-emphasis`}>
    {formatLastModifiedTime(updatedTime, locale)}
  </div>
);

const SortableErrorReportRuleRow: FC<{
  locale: string;
  rule: UniverseRegex;
  onEdit: (rule: UniverseRegex) => void;
  onDelete: (rule: UniverseRegex) => void;
}> = ({ locale, rule, onEdit, onDelete }) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(rule.id),
  });

  const reorderLabel = translate(
    translationKey('Action.ErrorReportRules.Reorder', TranslationNamespace.Analytics),
  );
  const moreLabel = translate(translationKey('Action.MoreOptions', TranslationNamespace.Controls));
  const editLabel = translate(translationKey('Action.Edit', TranslationNamespace.Controls));
  const deleteLabel = translate(translationKey('Action.Delete', TranslationNamespace.Controls));
  const emptyOutputLabel = translate(
    translationKey('Label.ErrorReportRules.OutputNotApplicable', TranslationNamespace.Analytics),
  );

  const handleEditClick = useCallback(() => onEdit(rule), [onEdit, rule]);
  const handleDeleteClick = useCallback(() => onDelete(rule), [onDelete, rule]);

  const rowStyle: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const showsOutput = rule.regexOperation === RegexOperation.Group && rule.output.length > 0;

  return (
    <div
      ref={setNodeRef}
      style={rowStyle}
      className='flex items-center width-full stroke-standard stroke-default radius-[12px] padding-y-xsmall'>
      <div className='flex grow-1 shrink-0 basis-0 items-center min-height-1300 min-width-0'>
        <RuleRegexCell>{rule.pattern}</RuleRegexCell>
        <div className={`${RULE_ACTION_COLUMN_CLASS} flex items-center padding-xlarge`}>
          <Badge variant='Neutral' label={rule.regexOperation} />
        </div>
        <RuleOutputCell>{showsOutput ? rule.output : emptyOutputLabel}</RuleOutputCell>
        <LastModifiedCell locale={locale} updatedTime={rule.updatedTime} />
        <div className='flex gap-xsmall items-center padding-x-xlarge shrink-0'>
          <div
            className={`[touch-action:none] ${isDragging ? '[cursor:grabbing]' : '[cursor:grab]'}`}
            {...attributes}
            {...listeners}>
            <IconButton
              as='button'
              variant='Utility'
              size='Medium'
              icon='icon-regular-three-bars-horizontal-triangles-vertical'
              ariaLabel={reorderLabel}
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <IconButton
                as='button'
                variant='Utility'
                size='Medium'
                icon='icon-regular-three-dots-vertical'
                ariaLabel={moreLabel}
              />
            </PopoverTrigger>
            <PopoverContent side='bottom' align='end' ariaLabel={moreLabel}>
              <Menu size='Medium'>
                <MenuSection>
                  <MenuItem value='edit' title={editLabel} onSelect={handleEditClick} />
                  <MenuItem value='delete' title={deleteLabel} onSelect={handleDeleteClick} />
                </MenuSection>
              </Menu>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};

type RuleDialogState =
  | null
  | { type: 'create' }
  | { type: 'edit'; rule: UniverseRegex }
  | { type: 'delete'; rule: UniverseRegex }
  | { type: 'useSuggestion'; rule: UniverseRegex }
  | { type: 'deleteSuggestion'; rule: UniverseRegex };

const ErrorReportRulesTabContent: FC = () => {
  const { locale } = useLocalization();
  const { translate } = useTranslationWrapper(useTranslation());
  const { id: universeId } = useUniverseResource();
  const { value: isSuggestedRulesTabEnabled } = useFlag(isErrorReportSuggestedRulesEnabled, {
    universeId,
  });
  const {
    data: fetchedRules,
    isLoading,
    isError,
  } = useUniverseRegexesQuery({ universeId, status: RegexStatus.CreatorCreated });
  const {
    data: fetchedSuggestedRules,
    isLoading: isSuggestedLoading,
    isError: isSuggestedError,
  } = useUniverseRegexesQuery({
    universeId,
    status: RegexStatus.AutoGenerated,
    enabled: Boolean(isSuggestedRulesTabEnabled),
  });
  const {
    mutateAsync: deleteRule,
    isPending: isDeletePending,
    isError: isDeleteError,
    reset: resetDelete,
  } = useDeleteUniverseRegexMutation(universeId);
  const {
    mutateAsync: ignoreSuggestion,
    isPending: isIgnoreSuggestionPending,
    isError: isIgnoreSuggestionError,
    reset: resetIgnoreSuggestion,
  } = useIgnoreUniverseRegexMutation(universeId);
  const { mutate: reorderRule } = useReorderUniverseRegexMutation(universeId);

  const [optimisticRuleIds, setOptimisticRuleIds] = useState<string[] | null>(null);
  const [dialogState, setDialogState] = useState<RuleDialogState>(null);
  const [selectedView, setSelectedView] = useState<ErrorReportRulesView>(
    ErrorReportRulesView.Active,
  );
  const resolvedLocale = locale ?? 'en-us';
  const compactIntegerFormatter = useMemo(
    () =>
      new Intl.NumberFormat(resolvedLocale, {
        compactDisplay: 'short',
        maximumFractionDigits: 0,
        notation: 'compact',
      }),
    [resolvedLocale],
  );
  const integerFormatter = useMemo(() => new Intl.NumberFormat(resolvedLocale), [resolvedLocale]);

  const displayRules = useMemo(() => {
    const rules = fetchedRules ?? [];
    if (!optimisticRuleIds) {
      return rules;
    }

    const rulesById = new Map(rules.map((rule) => [String(rule.id), rule]));
    const optimisticRules = optimisticRuleIds.flatMap((id) => {
      const rule = rulesById.get(id);
      return rule ? [rule] : [];
    });
    const optimisticIdSet = new Set(optimisticRuleIds);
    const newRules = rules.filter((rule) => !optimisticIdSet.has(String(rule.id)));
    return [...optimisticRules, ...newRules];
  }, [fetchedRules, optimisticRuleIds]);
  const suggestedRules = useMemo(() => fetchedSuggestedRules ?? [], [fetchedSuggestedRules]);
  const hasSuggestedRules = suggestedRules.length > 0;
  const selectedVisibleView = hasSuggestedRules ? selectedView : ErrorReportRulesView.Active;

  const openCreate = useCallback(() => setDialogState({ type: 'create' }), []);
  const openEdit = useCallback((rule: UniverseRegex) => setDialogState({ type: 'edit', rule }), []);
  const openDelete = useCallback(
    (rule: UniverseRegex) => setDialogState({ type: 'delete', rule }),
    [],
  );
  const openUseSuggestion = useCallback(
    (rule: UniverseRegex) => setDialogState({ type: 'useSuggestion', rule }),
    [],
  );
  const openDeleteSuggestion = useCallback(
    (rule: UniverseRegex) => setDialogState({ type: 'deleteSuggestion', rule }),
    [],
  );
  const closeDialog = useCallback(() => {
    setDialogState(null);
    resetDelete();
    resetIgnoreSuggestion();
  }, [resetDelete, resetIgnoreSuggestion]);

  const ruleToDelete = dialogState?.type === 'delete' ? dialogState.rule : null;
  const suggestionToUse = dialogState?.type === 'useSuggestion' ? dialogState.rule : null;
  const suggestionToDelete = dialogState?.type === 'deleteSuggestion' ? dialogState.rule : null;
  const handleConfirmDelete = useCallback(async () => {
    if (!ruleToDelete) {
      return;
    }
    try {
      await deleteRule({ id: ruleToDelete.id });
      closeDialog();
    } catch {
      // Keep the dialog open; the inline error message is surfaced via isDeleteError.
    }
  }, [ruleToDelete, deleteRule, closeDialog]);
  const handleConfirmDeleteClick = useCallback(() => {
    void handleConfirmDelete();
  }, [handleConfirmDelete]);
  const handleConfirmDeleteSuggestion = useCallback(async () => {
    if (!suggestionToDelete) {
      return;
    }
    try {
      await ignoreSuggestion({ id: suggestionToDelete.id });
      closeDialog();
    } catch {
      // Keep the dialog open; the inline error message is surfaced via isIgnoreSuggestionError.
    }
  }, [suggestionToDelete, ignoreSuggestion, closeDialog]);
  const handleConfirmDeleteSuggestionClick = useCallback(() => {
    void handleConfirmDeleteSuggestion();
  }, [handleConfirmDeleteSuggestion]);
  const handleSuggestionCreateSuccess = useCallback(() => {
    if (suggestionToUse) {
      void ignoreSuggestion({ id: suggestionToUse.id });
    }
  }, [suggestionToUse, ignoreSuggestion]);

  const handleViewChange = useCallback(
    (value: string) => {
      if (
        value === ErrorReportRulesView.Active ||
        (value === ErrorReportRulesView.Suggested && hasSuggestedRules)
      ) {
        setSelectedView(value);
      }
    },
    [hasSuggestedRules],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: DRAG_ACTIVATION_DISTANCE_PX } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const ruleIds = useMemo(() => displayRules.map((rule) => String(rule.id)), [displayRules]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) {
        return;
      }

      const oldIndex = ruleIds.indexOf(String(active.id));
      const newIndex = ruleIds.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      setOptimisticRuleIds(arrayMove(ruleIds, oldIndex, newIndex));
      reorderRule({ id: Number(active.id), order: newIndex + 1 });
    },
    [ruleIds, reorderRule],
  );

  const regexColumnLabel = translate(
    translationKey('Table.Column.ErrorReportRules.Regex', TranslationNamespace.Analytics),
  );
  const actionColumnLabel = translate(
    translationKey('Table.Column.ErrorReportRules.Action', TranslationNamespace.Analytics),
  );
  const outputColumnLabel = translate(
    translationKey('Table.Column.ErrorReportRules.Output', TranslationNamespace.Analytics),
  );
  const lastModifiedColumnLabel = translate(
    translationKey('Table.Column.ErrorReportRules.LastModified', TranslationNamespace.Analytics),
  );
  const activeTabLabel = translate(
    translationKey('Label.ErrorReportRules.Active', TranslationNamespace.Analytics),
  );
  const suggestedTabLabel = translate(
    translationKey('Label.ErrorReportRules.SuggestedWithCount', TranslationNamespace.Analytics),
    { count: integerFormatter.format(suggestedRules.length) },
  );
  const matchesColumnLabel = translate(
    translationKey('Table.Column.ErrorReportRules.NumberOfMatches', TranslationNamespace.Analytics),
  );
  const sampleMessageColumnLabel = translate(
    translationKey('Table.Column.ErrorReportRules.SampleMessage', TranslationNamespace.Analytics),
  );
  const useExpressionLabel = translate(
    translationKey('Action.ErrorReportRules.UseExpression', TranslationNamespace.Analytics),
  );
  const deleteSuggestionLabel = translate(
    translationKey('Action.ErrorReportRules.DeleteSuggestion', TranslationNamespace.Analytics),
  );
  const deleteSuggestionBodyLabel = translate(
    translationKey('Description.ErrorReportRules.DeleteSuggestion', TranslationNamespace.Analytics),
  );
  const deleteSuggestionErrorLabel = translate(
    translationKey('Error.ErrorReportRules.DeleteSuggestion', TranslationNamespace.Analytics),
  );
  const suggestedFootnoteLabel = translate(
    translationKey('Footnote.ErrorReportRules.Suggested', TranslationNamespace.Analytics),
  );
  const formatGreaterThanMatchCountLabel = useCallback(
    (count: string) =>
      translate(
        translationKey(
          'Label.ErrorReportRules.MatchCount.GreaterThan',
          TranslationNamespace.Analytics,
        ),
        { count },
      ),
    [translate],
  );

  const deleteTitleLabel = translate(
    translationKey('Heading.ErrorReportRule.Delete', TranslationNamespace.Analytics),
  );
  const deleteBodyLabel = translate(
    translationKey('Description.ErrorReportRule.Delete', TranslationNamespace.Analytics),
  );
  const deleteErrorLabel = translate(
    translationKey('Error.ErrorReportRule.Delete', TranslationNamespace.Analytics),
  );
  const deleteConfirmLabel = translate(
    translationKey('Action.Delete', TranslationNamespace.Controls),
  );
  const cancelLabel = translate(translationKey('Action.Cancel', TranslationNamespace.Controls));

  const suggestedRuleColumnConfigs = useMemo<TableDataColumnConfig<SuggestedRuleColumnKey>[]>(
    () => [
      {
        columnKey: SUGGESTED_RULE_TABLE_COLUMN_KEYS.regex,
        titleKey: translationKey(
          'Table.Column.ErrorReportRules.Regex',
          TranslationNamespace.Analytics,
        ),
        titleOverride: regexColumnLabel,
        columnType: ColumnType.Text,
        widthWeight: 36,
      },
      {
        columnKey: SUGGESTED_RULE_TABLE_COLUMN_KEYS.matches,
        titleKey: translationKey(
          'Table.Column.ErrorReportRules.NumberOfMatches',
          TranslationNamespace.Analytics,
        ),
        titleOverride: matchesColumnLabel,
        columnType: ColumnType.Text,
        columnAlignment: 'right',
        widthWeight: 14,
      },
      {
        columnKey: SUGGESTED_RULE_TABLE_COLUMN_KEYS.sampleMessage,
        titleKey: translationKey(
          'Table.Column.ErrorReportRules.SampleMessage',
          TranslationNamespace.Analytics,
        ),
        titleOverride: sampleMessageColumnLabel,
        columnType: ColumnType.Text,
        widthWeight: 36,
      },
      {
        columnKey: SUGGESTED_RULE_TABLE_COLUMN_KEYS.actions,
        titleKey: translationKey('Title.Table.Actions', TranslationNamespace.Analytics),
        titleOverride: '',
        columnAlignment: 'right',
        columnType: ColumnType.Actions,
        widthWeight: 14,
      },
    ],
    [regexColumnLabel, matchesColumnLabel, sampleMessageColumnLabel],
  );

  const getSuggestedRuleCellData = useCallback(
    (
      rule: UniverseRegex,
      columnKey: SuggestedRuleColumnKey,
    ): CellDataType<SuggestedRuleActionType> => {
      switch (columnKey) {
        case SUGGESTED_RULE_TABLE_COLUMN_KEYS.regex:
          return { type: ColumnType.Text, value: rule.pattern };
        case SUGGESTED_RULE_TABLE_COLUMN_KEYS.matches:
          return {
            type: ColumnType.Text,
            value: formatMatchedCount(
              rule.matchedCount,
              compactIntegerFormatter,
              formatGreaterThanMatchCountLabel,
            ),
          };
        case SUGGESTED_RULE_TABLE_COLUMN_KEYS.sampleMessage:
          return { type: ColumnType.Text, value: rule.sampleMessage ?? EMPTY_TABLE_VALUE };
        case SUGGESTED_RULE_TABLE_COLUMN_KEYS.actions:
          return {
            type: ColumnType.Actions,
            actions: [
              {
                actionType: 'useExpression',
                actionOn: String(rule.id),
                onActionInvoked: () => openUseSuggestion(rule),
                renderedAsInNonCompactTable: 'dedicated-button',
                displayLabel: useExpressionLabel,
                tooltipLabel: '',
                alwaysVisible: true,
              },
              {
                actionType: 'deleteSuggestion',
                actionOn: String(rule.id),
                onActionInvoked: () => openDeleteSuggestion(rule),
                renderedAsInNonCompactTable: 'dedicated-button',
                displayLabel: deleteSuggestionLabel,
                Icon: DeleteSuggestionIcon,
                alwaysVisible: true,
                disabled: isIgnoreSuggestionPending,
              },
            ],
          };
        default: {
          throw new Error('Unsupported suggested rule column');
        }
      }
    },
    [
      formatGreaterThanMatchCountLabel,
      compactIntegerFormatter,
      openUseSuggestion,
      openDeleteSuggestion,
      useExpressionLabel,
      deleteSuggestionLabel,
      isIgnoreSuggestionPending,
    ],
  );

  const getSuggestedRuleColumnsData = useCallback(
    async (request: SuggestedRuleColumnRequest): Promise<SuggestedRuleColumnResponse> => {
      const rows = request.rows.length > 0 ? request.rows.map((row) => row.data) : suggestedRules;
      const values = rows.map((rule) => ({
        rowId: rule.id,
        data: getSuggestedRuleCellData(rule, request.columnKey),
        rowData: rule,
      }));
      return { values, total: values.length, nextPaginationToken: '' };
    },
    [suggestedRules, getSuggestedRuleCellData],
  );

  let activeRulesBody: ReactNode;
  if (isLoading && displayRules.length === 0) {
    activeRulesBody = (
      <div className='flex justify-center padding-large width-full'>
        <CircularProgress />
      </div>
    );
  } else if (isError && displayRules.length === 0) {
    activeRulesBody = (
      <EmptyState
        title={translate(
          translationKey('ErrorState.ErrorReportRules.Title', TranslationNamespace.Analytics),
        )}
        description={translate(
          translationKey('ErrorState.ErrorReportRules.Description', TranslationNamespace.Analytics),
        )}
        size='large'
        illustration='localization'
      />
    );
  } else if (displayRules.length === 0) {
    activeRulesBody = <ErrorReportRulesEmptyState onCreate={openCreate} />;
  } else {
    activeRulesBody = (
      <div className='flex flex-col gap-medium width-full'>
        <div className='flex flex-col gap-xlarge width-full'>
          <div className='flex items-center width-full clip'>
            <RuleHeaderCell label={regexColumnLabel} className={RULE_REGEX_COLUMN_CLASS} />
            <RuleHeaderCell label={actionColumnLabel} className={RULE_ACTION_COLUMN_CLASS} />
            <RuleHeaderCell label={outputColumnLabel} className={RULE_OUTPUT_COLUMN_CLASS} />
            <RuleHeaderCell
              label={lastModifiedColumnLabel}
              className={RULE_LAST_MODIFIED_COLUMN_CLASS}
            />
            <RuleHeaderCell className='width-[124px] shrink-0' />
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={VERTICAL_LOCK_MODIFIERS}>
            <SortableContext items={ruleIds} strategy={verticalListSortingStrategy}>
              <div className='flex flex-col gap-xlarge width-full'>
                {displayRules.map((rule) => (
                  <SortableErrorReportRuleRow
                    key={rule.id}
                    locale={resolvedLocale}
                    rule={rule}
                    onEdit={openEdit}
                    onDelete={openDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>
    );
  }

  let suggestedRulesBody: ReactNode;
  if (isSuggestedLoading && suggestedRules.length === 0) {
    suggestedRulesBody = (
      <div className='flex justify-center padding-large width-full'>
        <CircularProgress />
      </div>
    );
  } else if (isSuggestedError && suggestedRules.length === 0) {
    suggestedRulesBody = (
      <EmptyState
        title={translate(
          translationKey('ErrorState.ErrorReportRules.Title', TranslationNamespace.Analytics),
        )}
        description={translate(
          translationKey('ErrorState.ErrorReportRules.Description', TranslationNamespace.Analytics),
        )}
        size='large'
        illustration='localization'
      />
    );
  } else {
    suggestedRulesBody = (
      <GenericDataTable<UniverseRegex, number, SuggestedRuleColumnKey>
        getColumnsData={getSuggestedRuleColumnsData}
        columnConfigs={suggestedRuleColumnConfigs}
        pagination={{ initialPageSize: 10, pageSizeOptions: [10, 25, 50, 100] }}
        tableConfig={{
          stickyHeader: true,
          hover: true,
        }}
        footer={<ChartFooter warnings={[suggestedFootnoteLabel]} />}
      />
    );
  }

  const rulesContent = isSuggestedRulesTabEnabled ? (
    <Tabs
      className='[margin-top:calc(var(--size-400)*-1)]'
      value={selectedVisibleView}
      onValueChange={handleViewChange}
      fitBehavior='Fit'
      size='Medium'
      variant='Contained'>
      <TabsList className='[width:max-content] radius-[999px] padding-xxsmall [&>div:first-child]:gap-medium [&>div:last-child]:hidden'>
        <TabsTrigger
          className='radius-[999px] padding-x-medium content-default ![border-bottom:none] data-[state=inactive]:bg-[var(--color-state-hover)] data-[state=active]:bg-inverse-surface-0 data-[state=active]:content-inverse-emphasis'
          value={ErrorReportRulesView.Active}>
          {activeTabLabel}
        </TabsTrigger>
        <TabsTrigger
          className='radius-[999px] padding-x-medium content-default ![border-bottom:none] data-[state=inactive]:bg-[var(--color-state-hover)] data-[state=active]:bg-inverse-surface-0 data-[state=active]:content-inverse-emphasis'
          isDisabled={!hasSuggestedRules}
          value={ErrorReportRulesView.Suggested}>
          {suggestedTabLabel}
        </TabsTrigger>
      </TabsList>
      <TabsContent value={ErrorReportRulesView.Active}>{activeRulesBody}</TabsContent>
      <TabsContent value={ErrorReportRulesView.Suggested}>{suggestedRulesBody}</TabsContent>
    </Tabs>
  ) : (
    activeRulesBody
  );

  return (
    <>
      {rulesContent}
      <ErrorReportRuleFormDialog
        open={
          dialogState?.type === 'create' ||
          dialogState?.type === 'edit' ||
          dialogState?.type === 'useSuggestion'
        }
        edit={dialogState?.type === 'edit' ? dialogState.rule : undefined}
        existingRules={displayRules}
        initialPattern={suggestionToUse?.pattern}
        onClose={closeDialog}
        onCreateSuccess={suggestionToUse ? handleSuggestionCreateSuccess : undefined}
      />
      <ConfirmDialog
        open={dialogState?.type === 'delete'}
        title={deleteTitleLabel}
        content={
          <div className='flex flex-col gap-small'>
            <span>{deleteBodyLabel}</span>
            {ruleToDelete ? (
              <span className='text-label-medium content-emphasis'>{ruleToDelete.pattern}</span>
            ) : null}
            {isDeleteError ? (
              <span className='text-caption-small content-system-alert'>{deleteErrorLabel}</span>
            ) : null}
          </div>
        }
        confirmText={deleteConfirmLabel}
        cancelText={cancelLabel}
        isLoading={isDeletePending}
        onConfirm={handleConfirmDeleteClick}
        onCancel={closeDialog}
      />
      <ConfirmDialog
        open={dialogState?.type === 'deleteSuggestion'}
        title={deleteSuggestionLabel}
        content={
          <div className='flex flex-col gap-small'>
            <span>{deleteSuggestionBodyLabel}</span>
            {suggestionToDelete ? (
              <span className='text-label-medium content-emphasis'>
                {suggestionToDelete.pattern}
              </span>
            ) : null}
            {isIgnoreSuggestionError ? (
              <span className='text-caption-small content-system-alert'>
                {deleteSuggestionErrorLabel}
              </span>
            ) : null}
          </div>
        }
        confirmText={deleteConfirmLabel}
        cancelText={cancelLabel}
        isLoading={isIgnoreSuggestionPending}
        onConfirm={handleConfirmDeleteSuggestionClick}
        onCancel={closeDialog}
      />
    </>
  );
};

export default ErrorReportRulesTabContent;
