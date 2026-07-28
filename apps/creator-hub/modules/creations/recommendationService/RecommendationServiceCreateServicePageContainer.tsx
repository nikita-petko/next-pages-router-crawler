import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FC } from 'react';
import { useRouter } from 'next/router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { TStepperStep } from '@rbx/foundation-ui';
import {
  Button,
  Checkbox,
  Divider,
  Dropdown,
  FeedbackBanner,
  Menu,
  MenuItem,
  Radio,
  RadioGroup,
  Stepper,
  TextInput,
  Toggle,
  Tooltip,
  TooltipTrigger,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Alert, CircularProgress, IconButton, InfoOutlinedIcon, Snackbar } from '@rbx/ui';
import type { TranslationKey } from '@modules/analytics-translations/types';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import withNamespaceSwitchedTranslation from '@modules/analytics-translations/withNamespaceSwitchedTranslation';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import {
  getConfigRepositoryValues,
  updateDraft,
  publishDraft,
} from '@modules/clients/creatorConfigsPublicApi';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import generateRecommendationServiceSnippet from './utils/generateRecommendationServiceSnippet';

type BaseTemplate =
  | 'maximize_engagement'
  | 'maximize_purchases'
  | 'recently_added'
  | 'player_specific';
type StoredBaseTemplate =
  | 'MaximizeEngagement'
  | 'MaximizePurchases'
  | 'RecentlyAdded'
  | 'PlayerSpecific';

const usesEngagementStyleConfig = (template: BaseTemplate): boolean =>
  template === 'maximize_engagement' || template === 'maximize_purchases';
type LookbackWindow = '7d' | '28d' | '90d';

type RankingFactorKey = 'QualityViews' | 'QualityPlays' | 'ActionRate';

type RankingWeights = Record<RankingFactorKey, string>;

type WizardStep = 0 | 1 | 2 | 3 | 4 | 5;

type ContentTypeFilterValue = 1 | 2 | 3;

const ALL_CONTENT_TYPE_FILTER_VALUES: ContentTypeFilterValue[] = [1, 2, 3];
const CONFIG_KEY_PATTERN = /^[A-Za-z0-9._-]+$/;
const WIZARD_MAX_WIDTH_PX = 900;
const WIZARD_NARROW_SECTION_CLASSNAME = 'flex flex-col gap-small';
const WIZARD_WIDE_SECTION_CLASSNAME = 'flex flex-col gap-xxlarge';
const WIZARD_MAX_WIDTH_STYLE: React.CSSProperties = { maxWidth: WIZARD_MAX_WIDTH_PX };

type RightCenterInfoTooltipProps = {
  tooltipText: string;
  ariaLabel: string;
};

const RightCenterInfoTooltip: FC<RightCenterInfoTooltipProps> = ({ tooltipText, ariaLabel }) => (
  <Tooltip title={tooltipText} position='right-center'>
    <TooltipTrigger asChild>
      <span className='inline-flex'>
        <IconButton size='small' aria-label={ariaLabel} className='content-muted'>
          <InfoOutlinedIcon fontSize='small' />
        </IconButton>
      </span>
    </TooltipTrigger>
  </Tooltip>
);

const RANKING_FACTOR_TRANSLATION_KEYS: Record<RankingFactorKey, TranslationKey> = {
  QualityViews: translationKey(
    'RankingFactor.QualityViews',
    TranslationNamespace.RecommendationService,
  ),
  QualityPlays: translationKey(
    'RankingFactor.QualityPlays',
    TranslationNamespace.RecommendationService,
  ),
  ActionRate: translationKey(
    'RankingFactor.ActionRate',
    TranslationNamespace.RecommendationService,
  ),
};

const coerceBaseTemplate = (value: unknown): BaseTemplate | null => {
  switch (value) {
    case 'MaximizeEngagement':
      return 'maximize_engagement';
    case 'MaximizePurchases':
      return 'maximize_purchases';
    case 'RecentlyAdded':
      return 'recently_added';
    case 'PlayerSpecific':
      return 'player_specific';
    default:
      return null;
  }
};

const toStoredBaseTemplate = (value: BaseTemplate): StoredBaseTemplate => {
  switch (value) {
    case 'maximize_engagement':
      return 'MaximizeEngagement';
    case 'maximize_purchases':
      return 'MaximizePurchases';
    case 'recently_added':
      return 'RecentlyAdded';
    case 'player_specific':
      return 'PlayerSpecific';
    default: {
      const exhaustiveCheck: never = value;
      return exhaustiveCheck;
    }
  }
};

const lookbackWindowToDays = (window: LookbackWindow): 7 | 28 | 90 => {
  switch (window) {
    case '7d':
      return 7;
    case '28d':
      return 28;
    case '90d':
      return 90;
    default: {
      const exhaustiveCheck: never = window;
      return exhaustiveCheck;
    }
  }
};

const daysToLookbackWindow = (days: unknown): LookbackWindow | null => {
  if (days === 7) {
    return '7d';
  }
  if (days === 28) {
    return '28d';
  }
  if (days === 90) {
    return '90d';
  }
  if (typeof days !== 'string') {
    return null;
  }
  const asNumber = Number(days);
  if (asNumber === 7) {
    return '7d';
  }
  if (asNumber === 28) {
    return '28d';
  }
  if (asNumber === 90) {
    return '90d';
  }
  return null;
};

const parseExplorationSlotsInput = (input: string): number[] => {
  return input
    .split(/[,\s]+/g)
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .map((t) => Number(t))
    .filter((n) => Number.isInteger(n) && n >= 1);
};

const coerceIntegerString = (value: unknown, fallback: string): string => {
  let asNumber: number;
  if (typeof value === 'number') {
    asNumber = value;
  } else if (typeof value === 'string') {
    asNumber = Number(value);
  } else {
    asNumber = Number.NaN;
  }
  if (!Number.isFinite(asNumber)) {
    return fallback;
  }
  return String(Math.trunc(asNumber));
};

const sanitizeIntegerInput = (raw: string): string => {
  const trimmed = raw.trim();
  if (trimmed === '' || trimmed === '-') {
    return trimmed;
  }
  const match = trimmed.match(/^-?\d+/);
  return match ? match[0] : '';
};

const parseIntOrZero = (value: string): number => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : 0;
};

const coerceContentTypeFilterValues = (value: unknown): ContentTypeFilterValue[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }

  const mapped = value
    .map((v): ContentTypeFilterValue | null => {
      if (v === 1 || v === 2 || v === 3) {
        return v;
      }
      if (typeof v === 'number') {
        return null;
      }
      if (typeof v !== 'string') {
        return null;
      }

      const normalized = v.trim().toLowerCase();
      if (normalized === 'static') {
        return 1;
      }
      if (normalized === 'dynamic') {
        return 2;
      }
      if (normalized === 'interactive') {
        return 3;
      }
      return null;
    })
    .filter((v): v is ContentTypeFilterValue => v != null);

  // Preserve empty arrays (older/bad configs) so the UI can force a valid selection.
  // De-dupe while keeping order stable.
  return Array.from(new Set(mapped));
};

type PersistServiceConfigErrorType = 'key-exists' | 'unknown';

class PersistServiceConfigError extends Error {
  public readonly type: PersistServiceConfigErrorType;

  public constructor(type: PersistServiceConfigErrorType, message?: string) {
    super(message);
    this.type = type;
  }
}

const buildWizardSteps = (
  tPendingTranslation: ReturnType<typeof useTranslationWrapper>['tPendingTranslation'],
  includeExploration: boolean,
  includeRanking: boolean,
): TStepperStep[] => {
  const baseSteps: TStepperStep[] = [
    {
      label: tPendingTranslation(
        'Config details',
        'Stepper step label for the config details step in the creation wizard',
        translationKey('CreateStepper.Step1.Label', TranslationNamespace.RecommendationService),
      ),
      description: tPendingTranslation(
        'Required',
        'Stepper step status indicating this step is required',
        translationKey('CreateStepper.Required', TranslationNamespace.RecommendationService),
      ),
    },
    {
      label: tPendingTranslation(
        'Filtering & retrieval',
        'Stepper step label for the filtering and retrieval step',
        translationKey('CreateStepper.Step2.Label', TranslationNamespace.RecommendationService),
      ),
      description: tPendingTranslation(
        'Required',
        'Stepper step status indicating this step is required',
        translationKey('CreateStepper.Required', TranslationNamespace.RecommendationService),
      ),
    },
    ...(includeExploration
      ? [
          {
            label: tPendingTranslation(
              'Exploration & discovery',
              'Stepper step label for the exploration and discovery step',
              translationKey(
                'CreateStepper.StepExploration.Label',
                TranslationNamespace.RecommendationService,
              ),
            ),
            description: tPendingTranslation(
              'Optional',
              'Stepper step status indicating this step is optional',
              translationKey('CreateStepper.Optional', TranslationNamespace.RecommendationService),
            ),
          },
        ]
      : []),
    ...(includeRanking
      ? [
          {
            label: tPendingTranslation(
              'Ranking & tags',
              'Stepper step label for the ranking and tags step',
              translationKey(
                'CreateStepper.Step3.Label',
                TranslationNamespace.RecommendationService,
              ),
            ),
            description: tPendingTranslation(
              'Optional',
              'Stepper step status indicating this step is optional',
              translationKey('CreateStepper.Optional', TranslationNamespace.RecommendationService),
            ),
          },
        ]
      : []),
    {
      label: tPendingTranslation(
        'Review',
        'Stepper step label for the review step',
        translationKey('CreateStepper.Step4.Label', TranslationNamespace.RecommendationService),
      ),
      description: tPendingTranslation(
        'Required',
        'Stepper step status indicating this step is required',
        translationKey('CreateStepper.Required', TranslationNamespace.RecommendationService),
      ),
    },
    {
      label: tPendingTranslation(
        'Add to your experience',
        'Stepper step label for the final integration step',
        translationKey('CreateStepper.Step5.Label', TranslationNamespace.RecommendationService),
      ),
      description: tPendingTranslation(
        'Required',
        'Stepper step status indicating this step is required',
        translationKey('CreateStepper.Required', TranslationNamespace.RecommendationService),
      ),
    },
  ];
  return baseSteps;
};

type WizardMode = 'create' | 'edit';

const parseRecommendationServiceFromStoredValue = (
  storedValue: unknown,
): Record<string, unknown> | null => {
  let parsed: unknown = storedValue;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed) as unknown;
    } catch {
      return null;
    }
  }
  if (typeof parsed !== 'object' || parsed == null) {
    return null;
  }
  const obj = parsed as Record<string, unknown>;

  // New shape: flattened config object (no wrapper key).
  // Heuristic: must at least include a recognizable base template key.
  const baseTemplate = obj.base_template;
  if (coerceBaseTemplate(baseTemplate) != null) {
    return obj;
  }

  return null;
};

export function RecommendationServiceServiceWizard({
  mode,
  editKey,
}: {
  mode: WizardMode;
  editKey?: string;
}) {
  const router = useRouter();
  const { id: universeId } = useUniverseResource();
  const { ready, translate, tPendingTranslation } = useTranslationWrapper(useTranslation());
  const queryClient = useQueryClient();

  const experienceId = useMemo(() => {
    const { id } = router.query;
    return typeof id === 'string' ? id : null;
  }, [router.query]);

  const [step, setStep] = useState<WizardStep>(0);

  const [serviceName, setServiceName] = useState(editKey ?? '');
  const [baseTemplate, setBaseTemplate] = useState<BaseTemplate>('maximize_engagement');
  const [isCopyToastOpen, setIsCopyToastOpen] = useState(false);
  const [copyToastKey, setCopyToastKey] = useState(0);
  const [hasBlurredConfigKey, setHasBlurredConfigKey] = useState(false);

  const [lookbackWindow, setLookbackWindow] = useState<LookbackWindow | null>(null);
  const [hideSeen, setHideSeen] = useState(false);
  const [treatUpdatedAsNew, setTreatUpdatedAsNew] = useState(false);
  const [contentTypeFilter, setContentTypeFilter] = useState<ContentTypeFilterValue[]>(
    ALL_CONTENT_TYPE_FILTER_VALUES,
  );
  const [isExplorationEnabled, setIsExplorationEnabled] = useState(false);
  const [explorationSlotsInput, setExplorationSlotsInput] = useState('');

  const includeExploration = usesEngagementStyleConfig(baseTemplate);
  const includeRanking = usesEngagementStyleConfig(baseTemplate);

  useEffect(() => {
    if (usesEngagementStyleConfig(baseTemplate)) {
      return;
    }
    setLookbackWindow(null);
  }, [baseTemplate]);

  useEffect(() => {
    if (usesEngagementStyleConfig(baseTemplate)) {
      return;
    }
    setHideSeen(false);
  }, [baseTemplate]);

  useEffect(() => {
    if (usesEngagementStyleConfig(baseTemplate)) {
      return;
    }
    setIsExplorationEnabled(false);
    setExplorationSlotsInput('');
  }, [baseTemplate]);

  useEffect(() => {
    if (usesEngagementStyleConfig(baseTemplate)) {
      return;
    }
    setTreatUpdatedAsNew(false);
  }, [baseTemplate]);

  const [rankingWeights, setRankingWeights] = useState<RankingWeights>({
    QualityViews: '0',
    QualityPlays: '0',
    ActionRate: '0',
  });
  const [hasHydratedFromExisting, setHasHydratedFromExisting] = useState(false);

  const wizardSteps = useMemo(
    () => buildWizardSteps(tPendingTranslation, includeExploration, includeRanking),
    [includeExploration, includeRanking, tPendingTranslation],
  );

  const stepperStepOrder = useMemo((): WizardStep[] => {
    const steps: WizardStep[] = [0, 1];
    if (includeExploration) {
      steps.push(2);
    }
    if (includeRanking) {
      steps.push(3);
    }
    steps.push(4, 5);
    return steps;
  }, [includeExploration, includeRanking]);

  const currentStepperIndex = useMemo(() => {
    const idx = stepperStepOrder.indexOf(step);
    return Math.max(idx, 0);
  }, [step, stepperStepOrder]);

  const explorationSlotsTokens = useMemo(() => {
    return explorationSlotsInput
      .split(/[,\s]+/g)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  }, [explorationSlotsInput]);

  const explorationSlotsParsed = useMemo(() => {
    return isExplorationEnabled ? parseExplorationSlotsInput(explorationSlotsInput) : [];
  }, [explorationSlotsInput, isExplorationEnabled]);

  const hasInvalidExplorationSlotsInput = useMemo(() => {
    if (!isExplorationEnabled) {
      return false;
    }
    if (explorationSlotsTokens.length === 0) {
      return false;
    }
    // parseExplorationSlotsInput filters non-integers and values < 1.
    // If anything was filtered out, the input contained invalid tokens.
    return explorationSlotsParsed.length !== explorationSlotsTokens.length;
  }, [explorationSlotsParsed.length, explorationSlotsTokens.length, isExplorationEnabled]);

  const onCancel = useCallback(() => {
    if (!experienceId) {
      return;
    }
    router
      .push(
        '/dashboard/creations/experiences/[id]/recommendation-service',
        `/dashboard/creations/experiences/${experienceId}/recommendation-service?tab=configuration`,
      )
      .catch(() => {});
  }, [experienceId, router]);

  const canAdvanceFromStep = useMemo(() => {
    const trimmedConfigKey = serviceName.trim();
    const isConfigKeyValid =
      trimmedConfigKey.length > 0 && CONFIG_KEY_PATTERN.test(trimmedConfigKey);
    const isLookbackWindowRequired = usesEngagementStyleConfig(baseTemplate);

    if (step === 0) {
      return isConfigKeyValid && baseTemplate != null;
    }
    if (step === 1) {
      return contentTypeFilter.length > 0 && (!isLookbackWindowRequired || lookbackWindow != null);
    }
    if (step === 2) {
      if (!isExplorationEnabled) {
        return true;
      }
      if (explorationSlotsTokens.length === 0) {
        return false;
      }
      return !hasInvalidExplorationSlotsInput && explorationSlotsParsed.length > 0;
    }
    if (step === 3) {
      return true;
    }
    if (step === 4) {
      return (
        serviceName.trim().length > 0 &&
        contentTypeFilter.length > 0 &&
        (!isLookbackWindowRequired || lookbackWindow != null) &&
        (!isExplorationEnabled ||
          (explorationSlotsTokens.length > 0 &&
            !hasInvalidExplorationSlotsInput &&
            explorationSlotsParsed.length > 0))
      );
    }
    return true;
  }, [
    baseTemplate,
    contentTypeFilter.length,
    hasInvalidExplorationSlotsInput,
    explorationSlotsParsed.length,
    explorationSlotsTokens.length,
    isExplorationEnabled,
    lookbackWindow,
    serviceName,
    step,
  ]);

  const configKey = useMemo(() => serviceName.trim(), [serviceName]);
  const universeIdString = useMemo(() => {
    if (universeId == null) {
      return null;
    }
    return String(universeId);
  }, [universeId]);

  const configsRepository = 'RecommendationServicesConfig' as const;

  const {
    data: existingValues,
    isLoading: isExistingLoading,
    refetch: refetchExistingValues,
  } = useQuery({
    queryKey: ['creator-configs-public', universeIdString, configsRepository, 'values'],
    enabled: mode === 'edit' && Boolean(universeIdString) && !hasHydratedFromExisting,
    queryFn: async () => {
      if (!universeIdString) {
        return null;
      }
      return getConfigRepositoryValues({
        universeId: universeIdString,
        repository: configsRepository,
      });
    },
    retry: 1,
  });

  useEffect(() => {
    if (mode !== 'edit') {
      return;
    }
    if (hasHydratedFromExisting) {
      return;
    }
    if (!editKey) {
      return;
    }
    const entries = existingValues?.entries ?? null;
    if (!entries) {
      return;
    }

    const storedValue = entries[editKey];
    const parsed = parseRecommendationServiceFromStoredValue(storedValue);
    if (!parsed) {
      return;
    }

    const rs = parsed;
    const rsRecord = rs;
    const { allowableContent, rankingAndBoosts, explorationAndDiscovery } = rsRecord;

    const baseTemplateValue = rsRecord.base_template;
    const coercedBaseTemplate = coerceBaseTemplate(baseTemplateValue);
    if (coercedBaseTemplate != null) {
      setBaseTemplate(coercedBaseTemplate);
    }

    const lookbackWindowValue = rsRecord.lookbackWindow ?? rsRecord.lookback_window;
    if (
      lookbackWindowValue === '7d' ||
      lookbackWindowValue === '28d' ||
      lookbackWindowValue === '90d'
    ) {
      setLookbackWindow(lookbackWindowValue);
    } else {
      const days =
        rsRecord.retrieval_window_in_days ??
        (typeof allowableContent === 'object' && allowableContent != null
          ? (allowableContent as Record<string, unknown>).retrieval_window_in_days
          : null);
      const asWindow = daysToLookbackWindow(days);
      if (asWindow) {
        setLookbackWindow(asWindow);
      }
    }

    const hideSeenValue =
      rsRecord.hideSeen ??
      rsRecord.enable_seen_items_filter ??
      (typeof allowableContent === 'object' && allowableContent != null
        ? (allowableContent as Record<string, unknown>).enable_seen_items_filter
        : null);
    if (typeof hideSeenValue === 'boolean') {
      setHideSeen(hideSeenValue);
    } else if (typeof allowableContent === 'object' && allowableContent != null) {
      setHideSeen(Boolean((allowableContent as Record<string, unknown>).hideSeen));
    }

    const treatUpdatedValue =
      rsRecord.treatUpdatedAsNew ??
      rsRecord.treat_updated_item_as_new ??
      (typeof allowableContent === 'object' && allowableContent != null
        ? (allowableContent as Record<string, unknown>).treat_updated_item_as_new
        : null);
    if (typeof treatUpdatedValue === 'boolean') {
      setTreatUpdatedAsNew(treatUpdatedValue);
    } else if (typeof allowableContent === 'object' && allowableContent != null) {
      setTreatUpdatedAsNew(
        Boolean((allowableContent as Record<string, unknown>).treatUpdatedAsNew),
      );
    }

    const contentTypeSource =
      rsRecord.content_type_filter ??
      (typeof allowableContent === 'object' && allowableContent != null
        ? (allowableContent as Record<string, unknown>).content_type_filter
        : null);
    const coercedContentTypes = coerceContentTypeFilterValues(contentTypeSource);
    if (coercedContentTypes) {
      setContentTypeFilter(coercedContentTypes);
    }

    const multiObjectiveWeightsSource =
      rsRecord.multi_objective_weights ??
      (typeof rankingAndBoosts === 'object' && rankingAndBoosts != null
        ? (rankingAndBoosts as Record<string, unknown>).multi_objective_weights
        : null);
    if (typeof multiObjectiveWeightsSource === 'object' && multiObjectiveWeightsSource != null) {
      const w = multiObjectiveWeightsSource as Record<string, unknown>;
      setRankingWeights({
        QualityViews: coerceIntegerString(w.QualityViews, '0'),
        QualityPlays: coerceIntegerString(w.QualityPlays, '0'),
        ActionRate: coerceIntegerString(w.ActionRate, '0'),
      });
    } else {
      const legacyWeightsSource =
        rsRecord.weights ??
        (typeof rankingAndBoosts === 'object' && rankingAndBoosts != null
          ? (rankingAndBoosts as Record<string, unknown>).weights
          : null);
      if (typeof legacyWeightsSource === 'object' && legacyWeightsSource != null) {
        const w = legacyWeightsSource as Record<string, unknown>;
        setRankingWeights({
          QualityViews: coerceIntegerString(w.qualityViews, '0'),
          QualityPlays: coerceIntegerString(w.joins, '0'),
          ActionRate: coerceIntegerString(w.likes, '0'),
        });
      }
    }

    const enabledValue =
      rsRecord.isExplorationEnabled ??
      rsRecord.IsExplorationEnabled ??
      rsRecord.is_exploration_enabled;
    if (enabledValue != null) {
      setIsExplorationEnabled(Boolean(enabledValue));
    } else if (typeof explorationAndDiscovery === 'object' && explorationAndDiscovery != null) {
      const ed = explorationAndDiscovery as Record<string, unknown>;
      const nestedEnabledValue =
        ed.isExplorationEnabled ?? ed.IsExplorationEnabled ?? ed.is_exploration_enabled;
      setIsExplorationEnabled(Boolean(nestedEnabledValue));
    }

    const slotsValue =
      rsRecord.explorationSlots ??
      rsRecord.ExplorationSlots ??
      rsRecord.exploration_slots ??
      (typeof explorationAndDiscovery === 'object' && explorationAndDiscovery != null
        ? (explorationAndDiscovery as Record<string, unknown>).exploration_slots
        : null);
    if (Array.isArray(slotsValue)) {
      setExplorationSlotsInput(slotsValue.map((s) => String(s)).join(', '));
    } else if (typeof explorationAndDiscovery === 'object' && explorationAndDiscovery != null) {
      const ed = explorationAndDiscovery as Record<string, unknown>;
      const nestedSlotsValue = ed.explorationSlots ?? ed.ExplorationSlots;
      if (Array.isArray(nestedSlotsValue)) {
        setExplorationSlotsInput(nestedSlotsValue.map((s) => String(s)).join(', '));
      }
    }

    // In edit mode, keep the config key stable.
    setServiceName(editKey);

    setHasHydratedFromExisting(true);
  }, [editKey, existingValues?.entries, hasHydratedFromExisting, mode]);

  const configValue = useMemo(() => {
    const retrievalWindowInDays =
      usesEngagementStyleConfig(baseTemplate) && lookbackWindow
        ? lookbackWindowToDays(lookbackWindow)
        : null;
    return {
      config_name: serviceName.trim(),
      base_template: toStoredBaseTemplate(baseTemplate),
      retrieval_window_in_days: retrievalWindowInDays,
      content_type_filter: contentTypeFilter,
      ...(includeExploration
        ? {
            is_exploration_enabled: isExplorationEnabled,
            exploration_slots: explorationSlotsParsed,
          }
        : {}),
      ...(includeRanking
        ? {
            multi_objective_weights: {
              QualityViews: parseIntOrZero(rankingWeights.QualityViews),
              QualityPlays: parseIntOrZero(rankingWeights.QualityPlays),
              ActionRate: parseIntOrZero(rankingWeights.ActionRate),
            },
          }
        : {}),
      ...(usesEngagementStyleConfig(baseTemplate)
        ? {
            enable_seen_items_filter: hideSeen,
            treat_updated_item_as_new: treatUpdatedAsNew,
          }
        : {}),
    };
  }, [
    baseTemplate,
    contentTypeFilter,
    explorationSlotsParsed,
    hideSeen,
    includeExploration,
    includeRanking,
    isExplorationEnabled,
    lookbackWindow,
    rankingWeights,
    serviceName,
    treatUpdatedAsNew,
  ]);

  const persistMutation = useMutation({
    mutationFn: async () => {
      const key = configKey;
      if (!key) {
        return;
      }
      if (!universeIdString) {
        throw new PersistServiceConfigError('unknown', 'Missing universeId');
      }

      const repository = configsRepository;
      const values = await getConfigRepositoryValues({ universeId: universeIdString, repository });
      const existingEntries = values.entries ?? null;
      if (mode === 'create') {
        if (existingEntries && Object.hasOwn(existingEntries, key)) {
          throw new PersistServiceConfigError('key-exists', `Key already exists: ${key}`);
        }
      }

      const updateResponse = await updateDraft(
        { universeId: universeIdString, repository },
        { entries: { [key]: configValue } },
      );
      const { draftHash } = updateResponse;
      if (!draftHash) {
        throw new PersistServiceConfigError('unknown', 'Missing draftHash');
      }

      await publishDraft(
        { universeId: universeIdString, repository },
        {
          draftHash,
          message: `Published config ${key} through creator-hub`,
          deploymentStrategy: 'Immediate',
        },
      );

      await queryClient.invalidateQueries({
        queryKey: ['creator-configs-public', universeIdString, configsRepository, 'full'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['creator-configs-public', universeIdString, configsRepository, 'values'],
      });
    },
  });

  const createOrPublishErrorMessage = useMemo(() => {
    const { error } = persistMutation;
    if (!error) {
      return null;
    }
    if (error instanceof PersistServiceConfigError) {
      if (error.type === 'key-exists') {
        return translate(
          translationKey(
            'Dialog.CreateOrEdit.Error.KeyExists',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        );
      }
    }
    return translate(
      translationKey('Error.Unknown', TranslationNamespace.UniverseConfigAndExperimentation),
    );
  }, [persistMutation, translate]);

  const persistServiceConfig = useCallback(async () => {
    persistMutation.reset();
    await persistMutation.mutateAsync();
  }, [persistMutation]);

  const onNext = useCallback(async () => {
    if (step === 4) {
      try {
        await persistServiceConfig();
      } catch {
        return;
      }
      if (mode === 'edit') {
        onCancel();
        return;
      }
    }
    setStep((prev) => {
      if (prev >= 5) {
        return prev;
      }
      if (prev === 1) {
        if (includeExploration) {
          return 2;
        }
        if (includeRanking) {
          return 3;
        }
        return 4;
      }
      if (prev === 2) {
        if (includeRanking) {
          return 3;
        }
        return 4;
      }
      return (prev + 1) as WizardStep;
    });
  }, [includeExploration, includeRanking, mode, onCancel, persistServiceConfig, step]);

  const onBack = useCallback(() => {
    setStep((prev) => {
      if (prev <= 0) {
        return prev;
      }
      if (prev === 4) {
        if (includeRanking) {
          return 3;
        }
        if (includeExploration) {
          return 2;
        }
        return 1;
      }
      if (prev === 3) {
        if (includeExploration) {
          return 2;
        }
        return 1;
      }
      return (prev - 1) as WizardStep;
    });
  }, [includeExploration, includeRanking]);

  const pageTitle =
    mode === 'edit'
      ? tPendingTranslation(
          'Edit service',
          'Page heading when editing an existing recommendation service config',
          translationKey('Heading.EditService', TranslationNamespace.RecommendationService),
        )
      : tPendingTranslation(
          'Create config',
          'Page heading when creating a new recommendation service config',
          translationKey('Heading.CreateConfig', TranslationNamespace.RecommendationService),
        );

  const nextLabel = tPendingTranslation(
    'Next',
    'Button to advance to the next wizard step',
    translationKey('Action.Next', TranslationNamespace.RecommendationService),
  );
  const confirmLabel =
    mode === 'edit'
      ? tPendingTranslation(
          'Save',
          'Button to save changes to an existing service config',
          translationKey('Action.Save', TranslationNamespace.RecommendationService),
        )
      : tPendingTranslation(
          'Create',
          'Button to create a new service config',
          translationKey('Action.Create', TranslationNamespace.RecommendationService),
        );
  const backLabel = tPendingTranslation(
    'Back',
    'Button to go back to the previous wizard step',
    translationKey('Action.Back', TranslationNamespace.RecommendationService),
  );
  const cancelLabel = tPendingTranslation(
    'Cancel',
    'Button to cancel the wizard and return to the landing page',
    translationKey('Action.Cancel', TranslationNamespace.RecommendationService),
  );
  const doneLabel = tPendingTranslation(
    'Done',
    'Button to close the wizard after completing config creation',
    translationKey('Action.Done', TranslationNamespace.RecommendationService),
  );

  const snippetText = useMemo(() => {
    if (!configKey) {
      return null;
    }
    return generateRecommendationServiceSnippet(configKey);
  }, [configKey]);

  const copySuccessToastMessage = tPendingTranslation(
    'Code snippet copied successfully',
    'Toast notification shown after the code snippet is copied to clipboard',
    translationKey('Toast.SnippetCopied', TranslationNamespace.RecommendationService),
  );

  const onCopy = useCallback(() => {
    if (!snippetText) {
      return;
    }
    navigator.clipboard
      .writeText(snippetText)
      .then(() => {
        setCopyToastKey((prev) => prev + 1);
        setIsCopyToastOpen(true);
      })
      .catch(() => {});
  }, [snippetText]);

  const content = useMemo(() => {
    if (step === 0) {
      const serviceNameLabel = tPendingTranslation(
        'Config name',
        'Label for the config name text input on the first wizard step',
        translationKey('Form.ServiceName.Label', TranslationNamespace.RecommendationService),
      );
      const serviceNamePlaceholder = tPendingTranslation(
        'Enter a config name',
        'Placeholder text for the config name input field',
        translationKey('Form.ServiceName.Placeholder', TranslationNamespace.RecommendationService),
      );
      const configKeyAllowedCharsError = tPendingTranslation(
        "Config key can only contain letters, numbers, and the characters '.', '-', '_'.",
        'Validation error shown when the config key contains disallowed characters',
        translationKey(
          'Form.ConfigKey.Validation.AllowedCharacters',
          TranslationNamespace.RecommendationService,
        ),
      );
      const configKeyRequiredError = tPendingTranslation(
        'Required',
        'Stepper step status indicating this step is required',
        translationKey('CreateStepper.Required', TranslationNamespace.RecommendationService),
      );
      const trimmedConfigKey = serviceName.trim();
      const isEmptyConfigKey = trimmedConfigKey.length === 0;
      const hasInvalidConfigKeyChars =
        trimmedConfigKey.length > 0 && !CONFIG_KEY_PATTERN.test(trimmedConfigKey);
      const shouldShowConfigKeyRequiredError = hasBlurredConfigKey && isEmptyConfigKey;
      const shouldShowConfigKeyError = shouldShowConfigKeyRequiredError || hasInvalidConfigKeyChars;
      const configKeyErrorMessage = (() => {
        if (shouldShowConfigKeyRequiredError) {
          return configKeyRequiredError;
        }
        if (hasInvalidConfigKeyChars) {
          return configKeyAllowedCharsError;
        }
        return;
      })();
      const baseTemplateLabel = tPendingTranslation(
        'Base template',
        'Label above the base template radio group on the config details step',
        translationKey('Form.BaseTemplate.Label', TranslationNamespace.RecommendationService),
      );
      const baseTemplateTooltip = tPendingTranslation(
        'Base templates determine how recommendation items are retrieved. They also determine the configurable settings available in the following steps.',
        'Tooltip explaining what base templates represent on the config details step',
        translationKey('Form.BaseTemplate.Tooltip', TranslationNamespace.RecommendationService),
      );
      const baseTemplateTooltipAriaLabel = tPendingTranslation(
        'Learn more about base templates',
        'Aria label for the base template tooltip icon button',
        translationKey(
          'Form.BaseTemplate.Tooltip.AriaLabel',
          TranslationNamespace.RecommendationService,
        ),
      );

      const optionMaxLabel = tPendingTranslation(
        'Maximize engagement',
        'Radio option label for the maximize engagement template',
        translationKey(
          'Template.MaximizeEngagement.Label',
          TranslationNamespace.RecommendationService,
        ),
      );
      const optionMaxHint = tPendingTranslation(
        'Prioritize content with the highest engagement.',
        'Hint text below the maximize engagement radio option',
        translationKey(
          'Template.MaximizeEngagement.Hint',
          TranslationNamespace.RecommendationService,
        ),
      );
      const optionPurchasesLabel = tPendingTranslation(
        'Maximize purchases',
        'Radio option label for the maximize purchases template',
        translationKey(
          'Template.MaximizePurchases.Label',
          TranslationNamespace.RecommendationService,
        ),
      );
      const optionPurchasesHint = tPendingTranslation(
        'Prioritize content that is more likely to lead to purchases.',
        'Hint text below the maximize purchases radio option',
        translationKey(
          'Template.MaximizePurchases.Hint',
          TranslationNamespace.RecommendationService,
        ),
      );
      const optionRecentLabel = tPendingTranslation(
        'Recently added',
        'Radio option label for the recently added template',
        translationKey('Template.RecentlyAdded.Label', TranslationNamespace.RecommendationService),
      );
      const optionRecentHint = tPendingTranslation(
        'Prioritize newer content.',
        'Hint text below the recently added radio option',
        translationKey('Template.RecentlyAdded.Hint', TranslationNamespace.RecommendationService),
      );
      const optionPlayerLabel = tPendingTranslation(
        'Player specific',
        'Radio option label for the player-specific template',
        translationKey('Template.PlayerSpecific.Label', TranslationNamespace.RecommendationService),
      );
      const optionPlayerHint = tPendingTranslation(
        'Prioritize content posted by a specific player.',
        'Hint text below the player-specific radio option',
        translationKey('Template.PlayerSpecific.Hint', TranslationNamespace.RecommendationService),
      );

      return (
        <div className={WIZARD_WIDE_SECTION_CLASSNAME} style={WIZARD_MAX_WIDTH_STYLE}>
          <div className={WIZARD_NARROW_SECTION_CLASSNAME}>
            <TextInput
              id='config-name'
              size='Large'
              label={serviceNameLabel}
              isRequired
              hasError={shouldShowConfigKeyError}
              error={configKeyErrorMessage}
              value={serviceName}
              isDisabled={mode === 'edit'}
              placeholder={serviceNamePlaceholder}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setServiceName(e.target.value)}
              onBlur={() => setHasBlurredConfigKey(true)}
            />
          </div>
          <div className='flex flex-col gap-large'>
            <div className='text-body-large content-default flex items-center gap-xsmall'>
              <span>{baseTemplateLabel}</span>
              <RightCenterInfoTooltip
                tooltipText={baseTemplateTooltip}
                ariaLabel={baseTemplateTooltipAriaLabel}
              />
            </div>
            <RadioGroup
              size='Medium'
              value={baseTemplate}
              onValueChange={(v: string) => setBaseTemplate(v as BaseTemplate)}>
              <Radio value='maximize_engagement' label={optionMaxLabel} hint={optionMaxHint} />
              <Radio
                value='maximize_purchases'
                label={optionPurchasesLabel}
                hint={optionPurchasesHint}
              />
              <Radio value='recently_added' label={optionRecentLabel} hint={optionRecentHint} />
              <Radio value='player_specific' label={optionPlayerLabel} hint={optionPlayerHint} />
            </RadioGroup>
          </div>
        </div>
      );
    }

    if (step === 1) {
      const toggleHideSeen = tPendingTranslation(
        'Hide items the player has already seen',
        'Toggle label to hide content the player has already seen',
        translationKey('Form.Toggle.HideSeen', TranslationNamespace.RecommendationService),
      );
      const toggleTreatUpdated = tPendingTranslation(
        'Treat updated items as new',
        'Toggle label to treat updated content items as new',
        translationKey('Form.Toggle.TreatUpdatedAsNew', TranslationNamespace.RecommendationService),
      );
      const treatUpdatedTooltip = tPendingTranslation(
        'When enabled, the update time of an item will be used to determine if it is within the lookback window.',
        'Tooltip explaining the Treat updated items as new toggle',
        translationKey(
          'Form.Toggle.TreatUpdatedAsNew.Tooltip',
          TranslationNamespace.RecommendationService,
        ),
      );
      const treatUpdatedTooltipAriaLabel = tPendingTranslation(
        'Learn more about treating updated items as new',
        'Aria label for the Treat updated items as new tooltip icon button',
        translationKey(
          'Form.Toggle.TreatUpdatedAsNew.Tooltip.AriaLabel',
          TranslationNamespace.RecommendationService,
        ),
      );

      const contentTypeFilterLabel = tPendingTranslation(
        'Content type',
        'Label for the content type filter checkboxes',
        translationKey('Form.ContentTypeFilter.Label', TranslationNamespace.RecommendationService),
      );
      const staticLabel = tPendingTranslation(
        'Static',
        'Checkbox label for the static content type filter',
        translationKey('ContentType.Static', TranslationNamespace.RecommendationService),
      );
      const dynamicLabel = tPendingTranslation(
        'Dynamic',
        'Checkbox label for the dynamic content type filter',
        translationKey('ContentType.Dynamic', TranslationNamespace.RecommendationService),
      );
      const interactiveLabel = tPendingTranslation(
        'Interactive',
        'Checkbox label for the interactive content type filter',
        translationKey('ContentType.Interactive', TranslationNamespace.RecommendationService),
      );

      const onContentTypeCheckedChange = (value: ContentTypeFilterValue, checked: boolean) => {
        setContentTypeFilter((prev) => {
          if (checked) {
            return prev.includes(value) ? prev : [...prev, value];
          }
          return prev.filter((v) => v !== value);
        });
      };

      const lookbackWindowSection = (() => {
        if (!usesEngagementStyleConfig(baseTemplate)) {
          return null;
        }

        const lookbackLabel = tPendingTranslation(
          'Lookback window',
          'Label for the lookback window dropdown on the filtering step',
          translationKey('Form.LookbackWindow.Label', TranslationNamespace.RecommendationService),
        );
        const lookbackHelperText = tPendingTranslation(
          'How old content can be served',
          'Helper text shown below the lookback window dropdown',
          translationKey(
            'Form.LookbackWindow.HelperText',
            TranslationNamespace.RecommendationService,
          ),
        );
        const lookbackPlaceholder = tPendingTranslation(
          'Select a window',
          'Placeholder text for the lookback window dropdown',
          translationKey(
            'Form.LookbackWindow.Placeholder',
            TranslationNamespace.RecommendationService,
          ),
        );

        const window7d = tPendingTranslation(
          'Last 7 days',
          'Dropdown option for a 7-day lookback window',
          translationKey('LookbackWindow.7d', TranslationNamespace.RecommendationService),
        );
        const window28d = tPendingTranslation(
          'Last 28 days',
          'Dropdown option for a 28-day lookback window',
          translationKey('LookbackWindow.28d', TranslationNamespace.RecommendationService),
        );
        const window90d = tPendingTranslation(
          'Last 90 days',
          'Dropdown option for a 90-day lookback window',
          translationKey('LookbackWindow.90d', TranslationNamespace.RecommendationService),
        );

        return (
          <div className={WIZARD_NARROW_SECTION_CLASSNAME}>
            <div className='text-body-large content-default'>
              {lookbackLabel}{' '}
              <span className='content-system-error' aria-hidden='true'>
                *
              </span>
            </div>
            <Dropdown
              size='Large'
              placeholder={lookbackPlaceholder}
              value={lookbackWindow ?? undefined}
              onValueChange={(v: string) => setLookbackWindow(v as LookbackWindow)}>
              <Menu className='bg-action-soft-emphasis'>
                <MenuItem value='7d' title={window7d} />
                <MenuItem value='28d' title={window28d} />
                <MenuItem value='90d' title={window90d} />
              </Menu>
            </Dropdown>
            <div className='text-body-medium content-default'>{lookbackHelperText}</div>
          </div>
        );
      })();

      const hideSeenToggle = (() => {
        if (!usesEngagementStyleConfig(baseTemplate)) {
          return null;
        }
        return (
          <Toggle
            label={toggleHideSeen}
            size='Medium'
            placement='Start'
            isChecked={hideSeen}
            onCheckedChange={setHideSeen}
          />
        );
      })();

      const treatUpdatedToggle = (() => {
        if (!usesEngagementStyleConfig(baseTemplate)) {
          return null;
        }
        return (
          <div className='flex items-center gap-xsmall'>
            <Toggle
              label={toggleTreatUpdated}
              size='Medium'
              placement='Start'
              isChecked={treatUpdatedAsNew}
              onCheckedChange={setTreatUpdatedAsNew}
            />
            <RightCenterInfoTooltip
              tooltipText={treatUpdatedTooltip}
              ariaLabel={treatUpdatedTooltipAriaLabel}
            />
          </div>
        );
      })();

      return (
        <div className={WIZARD_WIDE_SECTION_CLASSNAME} style={WIZARD_MAX_WIDTH_STYLE}>
          {lookbackWindowSection}

          <div className={WIZARD_NARROW_SECTION_CLASSNAME}>
            <div className='text-body-large content-default'>{contentTypeFilterLabel}</div>
            <div className='flex flex-col gap-medium'>
              <Checkbox
                label={staticLabel}
                size='Medium'
                placement='Start'
                isChecked={contentTypeFilter.includes(1)}
                onCheckedChange={(checked: boolean | 'indeterminate') =>
                  onContentTypeCheckedChange(1, checked === true)
                }
              />
              <Checkbox
                label={dynamicLabel}
                size='Medium'
                placement='Start'
                isChecked={contentTypeFilter.includes(2)}
                onCheckedChange={(checked: boolean | 'indeterminate') =>
                  onContentTypeCheckedChange(2, checked === true)
                }
              />
              <Checkbox
                label={interactiveLabel}
                size='Medium'
                placement='Start'
                isChecked={contentTypeFilter.includes(3)}
                onCheckedChange={(checked: boolean | 'indeterminate') =>
                  onContentTypeCheckedChange(3, checked === true)
                }
              />
            </div>
          </div>

          {hideSeenToggle}
          {treatUpdatedToggle}
        </div>
      );
    }

    if (step === 2) {
      const explorationEnabledLabel = tPendingTranslation(
        'Is exploration enabled',
        'Toggle label to enable or disable exploration for the service',
        translationKey(
          'Form.IsExplorationEnabled.Label',
          TranslationNamespace.RecommendationService,
        ),
      );
      const explorationEnabledTooltip = tPendingTranslation(
        'Enabling exploration will allow the recommendation service to occasionally show less engaged with items to help discover new high-performing items.',
        'Tooltip explaining the Is exploration enabled toggle',
        translationKey(
          'Form.IsExplorationEnabled.Tooltip',
          TranslationNamespace.RecommendationService,
        ),
      );
      const explorationEnabledTooltipAriaLabel = tPendingTranslation(
        'Learn more about exploration',
        'Aria label for the Is exploration enabled tooltip icon button',
        translationKey(
          'Form.IsExplorationEnabled.Tooltip.AriaLabel',
          TranslationNamespace.RecommendationService,
        ),
      );
      const explorationSlotsLabel = tPendingTranslation(
        'Exploration slots',
        'Label for the exploration slots input field',
        translationKey('Form.ExplorationSlots.Label', TranslationNamespace.RecommendationService),
      );
      const explorationSlotsTooltip = tPendingTranslation(
        'The positions in the returned list of items that will be reserved for exploration items.',
        'Tooltip explaining the Exploration slots field',
        translationKey('Form.ExplorationSlots.Tooltip', TranslationNamespace.RecommendationService),
      );
      const explorationSlotsTooltipAriaLabel = tPendingTranslation(
        'Learn more about exploration slots',
        'Aria label for the Exploration slots tooltip icon button',
        translationKey(
          'Form.ExplorationSlots.Tooltip.AriaLabel',
          TranslationNamespace.RecommendationService,
        ),
      );
      const explorationSlotsPlaceholder = tPendingTranslation(
        'e.g. 2, 3, 5',
        'Placeholder text showing example input format for exploration slots',
        translationKey(
          'Form.ExplorationSlots.Placeholder',
          TranslationNamespace.RecommendationService,
        ),
      );
      const explorationSlotsHint = tPendingTranslation(
        'Comma-separated list of integers greater than or equal to 1.',
        'Hint text describing the expected input format for exploration slots',
        translationKey('Form.ExplorationSlots.Hint', TranslationNamespace.RecommendationService),
      );

      return (
        <div className={WIZARD_WIDE_SECTION_CLASSNAME} style={WIZARD_MAX_WIDTH_STYLE}>
          <div className='flex items-center gap-xsmall'>
            <Toggle
              label={explorationEnabledLabel}
              size='Large'
              placement='Start'
              isChecked={isExplorationEnabled}
              onCheckedChange={setIsExplorationEnabled}
            />
            <RightCenterInfoTooltip
              tooltipText={explorationEnabledTooltip}
              ariaLabel={explorationEnabledTooltipAriaLabel}
            />
          </div>

          {isExplorationEnabled ? (
            <div className={WIZARD_NARROW_SECTION_CLASSNAME}>
              <div className='text-body-large content-default flex items-center gap-xsmall'>
                <span>{explorationSlotsLabel}</span>
                <RightCenterInfoTooltip
                  tooltipText={explorationSlotsTooltip}
                  ariaLabel={explorationSlotsTooltipAriaLabel}
                />
              </div>
              <TextInput
                size='Large'
                value={explorationSlotsInput}
                placeholder={explorationSlotsPlaceholder}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setExplorationSlotsInput(e.target.value)
                }
              />
              <div className='text-body-medium content-muted'>{explorationSlotsHint}</div>
            </div>
          ) : null}
        </div>
      );
    }

    if (step === 3) {
      const tableLeftHeader = tPendingTranslation(
        'Ranking factor',
        'Table column header for ranking factor names',
        translationKey('Ranking.Table.LeftHeader', TranslationNamespace.RecommendationService),
      );
      const rankingFactorsTooltip = tPendingTranslation(
        'Ranking factors determine how each signal is weighted in the final ranking of items.',
        'Tooltip explaining what ranking factors are',
        translationKey(
          'Ranking.Table.LeftHeader.Tooltip',
          TranslationNamespace.RecommendationService,
        ),
      );
      const rankingFactorsTooltipAriaLabel = tPendingTranslation(
        'Learn more about ranking factors',
        'Aria label for the ranking factors tooltip icon button',
        translationKey(
          'Ranking.Table.LeftHeader.Tooltip.AriaLabel',
          TranslationNamespace.RecommendationService,
        ),
      );
      const tableRightHeader = tPendingTranslation(
        'Weight',
        'Table column header for ranking factor weight values',
        translationKey('Ranking.Table.RightHeader', TranslationNamespace.RecommendationService),
      );

      const rankingFactorLabels: Record<RankingFactorKey, string> = {
        QualityViews: tPendingTranslation(
          'Quality views',
          'Row label for the quality views ranking factor',
          translationKey('RankingFactor.QualityViews', TranslationNamespace.RecommendationService),
        ),
        QualityPlays: tPendingTranslation(
          'Quality plays',
          'Row label for the quality plays ranking factor',
          translationKey('RankingFactor.QualityPlays', TranslationNamespace.RecommendationService),
        ),
        ActionRate: tPendingTranslation(
          'Action rate',
          'Row label for the action rate ranking factor',
          translationKey('RankingFactor.ActionRate', TranslationNamespace.RecommendationService),
        ),
      };

      const setWeight = (key: RankingFactorKey, value: string) => {
        setRankingWeights((prev) => ({ ...prev, [key]: sanitizeIntegerInput(value) }));
      };

      return (
        <div className='flex flex-col gap-xxlarge' style={{ maxWidth: 900 }}>
          <div className='border border-stroke-default radius-large overflow-hidden'>
            <div className='grid' style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className='padding-medium text-body-large content-emphasis'>
                <span className='flex items-center gap-xsmall'>
                  <span>{tableLeftHeader}</span>
                  <RightCenterInfoTooltip
                    tooltipText={rankingFactorsTooltip}
                    ariaLabel={rankingFactorsTooltipAriaLabel}
                  />
                </span>
              </div>
              <div className='padding-medium text-body-large content-emphasis'>
                {tableRightHeader}
              </div>
            </div>
            {(Object.keys(RANKING_FACTOR_TRANSLATION_KEYS) as RankingFactorKey[]).map((key) => (
              <div
                key={key}
                className='grid border-t border-stroke-default'
                style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className='padding-medium text-body-large content-emphasis'>
                  {rankingFactorLabels[key]}
                </div>
                <div className='padding-medium'>
                  <TextInput
                    size='Large'
                    type='number'
                    value={rankingWeights[key]}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setWeight(key, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (step === 4) {
      const baseTemplateDisplay = (() => {
        switch (baseTemplate) {
          case 'maximize_engagement':
            return tPendingTranslation(
              'Maximize engagement',
              'Radio option label for the maximize engagement template',
              translationKey(
                'Template.MaximizeEngagement.Label',
                TranslationNamespace.RecommendationService,
              ),
            );
          case 'maximize_purchases':
            return tPendingTranslation(
              'Maximize purchases',
              'Radio option label for the maximize purchases template',
              translationKey(
                'Template.MaximizePurchases.Label',
                TranslationNamespace.RecommendationService,
              ),
            );
          case 'recently_added':
            return tPendingTranslation(
              'Recently added',
              'Radio option label for the recently added template',
              translationKey(
                'Template.RecentlyAdded.Label',
                TranslationNamespace.RecommendationService,
              ),
            );
          case 'player_specific':
            return tPendingTranslation(
              'Player specific',
              'Radio option label for the player-specific template',
              translationKey(
                'Template.PlayerSpecific.Label',
                TranslationNamespace.RecommendationService,
              ),
            );
          default: {
            const exhaustiveCheck: never = baseTemplate;
            return exhaustiveCheck;
          }
        }
      })();

      const bannerTitle = tPendingTranslation(
        'Review and create',
        'Title of the informational banner on the review step',
        translationKey('Review.ImpactBanner.Title', TranslationNamespace.RecommendationService),
      );
      const bannerDescription = tPendingTranslation(
        'Review your settings before creating the service.',
        'Description of the informational banner on the review step',
        translationKey(
          'Review.ImpactBanner.Description',
          TranslationNamespace.RecommendationService,
        ),
      );

      const nameLabel = tPendingTranslation(
        'Name',
        'Review summary field label for the config name',
        translationKey('Review.Field.Name', TranslationNamespace.RecommendationService),
      );
      const templateNameLabel = tPendingTranslation(
        'Template',
        'Review summary field label for the selected template',
        translationKey('Review.Field.TemplateName', TranslationNamespace.RecommendationService),
      );

      const hideSeenLabel = tPendingTranslation(
        'Hide seen items',
        'Review summary field label for the hide-seen-items setting',
        translationKey('Review.Field.HideSeenItems', TranslationNamespace.RecommendationService),
      );
      const treatUpdatedLabel = tPendingTranslation(
        'Treat updated as new',
        'Review summary field label for the treat-updated-as-new setting',
        translationKey(
          'Review.Field.TreatUpdatedAsNew',
          TranslationNamespace.RecommendationService,
        ),
      );
      const contentTypeFilterLabel = tPendingTranslation(
        'Content type',
        'Review summary field label for the content type filter',
        translationKey(
          'Review.Field.ContentTypeFilter',
          TranslationNamespace.RecommendationService,
        ),
      );
      const enabledLabel = tPendingTranslation(
        'Enabled',
        'Display value when a boolean setting is enabled',
        translationKey('Review.Value.Enabled', TranslationNamespace.RecommendationService),
      );
      const disabledLabel = tPendingTranslation(
        'Disabled',
        'Display value when a boolean setting is disabled',
        translationKey('Review.Value.Disabled', TranslationNamespace.RecommendationService),
      );

      const rankingLabel = tPendingTranslation(
        'Ranking',
        'Review summary field label for the ranking weights section',
        translationKey('Review.Field.Ranking', TranslationNamespace.RecommendationService),
      );

      const hideSeenValue = hideSeen ? enabledLabel : disabledLabel;
      const treatUpdatedValue = treatUpdatedAsNew ? enabledLabel : disabledLabel;
      const explorationEnabledValue = isExplorationEnabled ? enabledLabel : disabledLabel;
      const explorationSlotsValue = isExplorationEnabled ? explorationSlotsParsed.join(', ') : '';

      const lookbackWindowRow = (() => {
        if (!usesEngagementStyleConfig(baseTemplate)) {
          return null;
        }

        const lookbackWindowLabel = tPendingTranslation(
          'Lookback window',
          'Review summary field label for the lookback window setting',
          translationKey('Review.Field.LookbackWindow', TranslationNamespace.RecommendationService),
        );
        const lookbackWindowValue = (() => {
          switch (lookbackWindow) {
            case '7d':
              return tPendingTranslation(
                'Last 7 days',
                'Dropdown option for a 7-day lookback window',
                translationKey('LookbackWindow.7d', TranslationNamespace.RecommendationService),
              );
            case '28d':
              return tPendingTranslation(
                'Last 28 days',
                'Dropdown option for a 28-day lookback window',
                translationKey('LookbackWindow.28d', TranslationNamespace.RecommendationService),
              );
            case '90d':
              return tPendingTranslation(
                'Last 90 days',
                'Dropdown option for a 90-day lookback window',
                translationKey('LookbackWindow.90d', TranslationNamespace.RecommendationService),
              );
            case null:
              return '';
            default: {
              const exhaustiveCheck: never = lookbackWindow;
              throw new Error(`Unexpected lookback window: ${exhaustiveCheck}`);
            }
          }
        })();

        return (
          <>
            <div className='text-title-large content-emphasis'>{lookbackWindowLabel}</div>
            <div className='text-body-large content-default text-right'>{lookbackWindowValue}</div>
          </>
        );
      })();

      const hideSeenRow = (() => {
        if (!usesEngagementStyleConfig(baseTemplate)) {
          return null;
        }
        return (
          <>
            <div className='text-title-large content-emphasis'>{hideSeenLabel}</div>
            <div className='text-body-large content-default text-right'>{hideSeenValue}</div>
          </>
        );
      })();

      const treatUpdatedRow = (() => {
        if (!usesEngagementStyleConfig(baseTemplate)) {
          return null;
        }
        return (
          <>
            <div className='text-title-large content-emphasis'>{treatUpdatedLabel}</div>
            <div className='text-body-large content-default text-right'>{treatUpdatedValue}</div>
          </>
        );
      })();

      const contentTypeLabels: Record<ContentTypeFilterValue, string> = {
        1: tPendingTranslation(
          'Static',
          'Checkbox label for the static content type filter',
          translationKey('ContentType.Static', TranslationNamespace.RecommendationService),
        ),
        2: tPendingTranslation(
          'Dynamic',
          'Checkbox label for the dynamic content type filter',
          translationKey('ContentType.Dynamic', TranslationNamespace.RecommendationService),
        ),
        3: tPendingTranslation(
          'Interactive',
          'Checkbox label for the interactive content type filter',
          translationKey('ContentType.Interactive', TranslationNamespace.RecommendationService),
        ),
      };
      const contentTypeFilterValue = ALL_CONTENT_TYPE_FILTER_VALUES.filter((v) =>
        contentTypeFilter.includes(v),
      )
        .map((v) => contentTypeLabels[v])
        .join(', ');

      const rankingSummaryRows = [
        {
          label: tPendingTranslation(
            'Quality views',
            'Row label for the quality views ranking factor',
            translationKey(
              'RankingFactor.QualityViews',
              TranslationNamespace.RecommendationService,
            ),
          ),
          value: rankingWeights.QualityViews,
        },
        {
          label: tPendingTranslation(
            'Quality plays',
            'Row label for the quality plays ranking factor',
            translationKey(
              'RankingFactor.QualityPlays',
              TranslationNamespace.RecommendationService,
            ),
          ),
          value: rankingWeights.QualityPlays,
        },
        {
          label: tPendingTranslation(
            'Action rate',
            'Row label for the action rate ranking factor',
            translationKey('RankingFactor.ActionRate', TranslationNamespace.RecommendationService),
          ),
          value: rankingWeights.ActionRate,
        },
      ];

      return (
        <div className='flex flex-col gap-xlarge' style={WIZARD_MAX_WIDTH_STYLE}>
          {createOrPublishErrorMessage ? (
            <FeedbackBanner severity='Error' layout='Inline' title={createOrPublishErrorMessage} />
          ) : null}
          <FeedbackBanner
            severity='Info'
            layout='Inline'
            title={bannerTitle}
            description={bannerDescription}
          />

          <div className='flex flex-col gap-xxlarge' style={{ maxWidth: 400 }}>
            <div className='grid gap-large' style={{ gridTemplateColumns: '1fr auto' }}>
              <div className='text-title-large content-emphasis'>{nameLabel}</div>
              <div className='text-body-large content-default text-right'>{serviceName.trim()}</div>

              <div className='text-title-large content-emphasis'>{templateNameLabel}</div>
              <div className='text-body-large content-default text-right'>
                {baseTemplateDisplay}
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <Divider variant='Standard' />
              </div>

              {lookbackWindowRow}

              {hideSeenRow}
              {treatUpdatedRow}

              <div className='text-title-large content-emphasis'>{contentTypeFilterLabel}</div>
              <div className='text-body-large content-default text-right'>
                {contentTypeFilterValue}
              </div>

              {includeExploration ? (
                <>
                  <div className='text-title-large content-emphasis'>
                    {tPendingTranslation(
                      'Exploration enabled',
                      'Review summary field label for whether exploration is enabled',
                      translationKey(
                        'Review.Field.ExplorationEnabled',
                        TranslationNamespace.RecommendationService,
                      ),
                    )}
                  </div>
                  <div className='text-body-large content-default text-right'>
                    {explorationEnabledValue}
                  </div>

                  {isExplorationEnabled ? (
                    <Fragment>
                      <div className='text-title-large content-emphasis'>
                        {tPendingTranslation(
                          'Exploration slots',
                          'Review summary field label for the configured exploration slots',
                          translationKey(
                            'Review.Field.ExplorationSlots',
                            TranslationNamespace.RecommendationService,
                          ),
                        )}
                      </div>
                      <div className='text-body-large content-default text-right'>
                        {explorationSlotsValue}
                      </div>
                    </Fragment>
                  ) : null}
                </>
              ) : null}

              {includeRanking ? (
                <>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <Divider variant='Standard' />
                  </div>

                  <div className='text-title-large content-emphasis'>{rankingLabel}</div>
                  <div className='text-body-large content-default text-right flex flex-col gap-xsmall'>
                    {rankingSummaryRows.map(({ label, value }) => (
                      <div key={label}>
                        {label}: {value}
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      );
    }

    const snippetHeading = tPendingTranslation(
      'Add to your experience',
      'Heading for the code snippet section on the final wizard step',
      translationKey('Snippet.Heading', TranslationNamespace.RecommendationService),
    );
    const snippetDescription = tPendingTranslation(
      'Copy this snippet into your experience to use the service.',
      'Instructional text below the code snippet',
      translationKey('Snippet.Description', TranslationNamespace.RecommendationService),
    );
    const copyLabel = tPendingTranslation(
      'Copy',
      'Button label to copy the code snippet to clipboard',
      translationKey('Snippet.Action.Copy', TranslationNamespace.RecommendationService),
    );

    return (
      <div className='flex flex-col gap-xlarge' style={WIZARD_MAX_WIDTH_STYLE}>
        <div className='flex flex-col gap-medium'>
          <div className='text-body-large content-default'>{snippetHeading}</div>
          <pre className='bg-surface-200 stroke-standard stroke-thick radius-large padding-medium text-body-medium content-default scroll-x margin-none'>
            {snippetText ?? ''}
          </pre>
        </div>
        <div className='text-body-medium content-muted'>{snippetDescription}</div>
        <div className='flex'>
          <Button variant='Standard' size='Large' onClick={onCopy} isDisabled={!snippetText}>
            {copyLabel}
          </Button>
        </div>
      </div>
    );
  }, [
    baseTemplate,
    includeExploration,
    includeRanking,
    contentTypeFilter,
    createOrPublishErrorMessage,
    hideSeen,
    explorationSlotsInput,
    explorationSlotsParsed,
    isExplorationEnabled,
    lookbackWindow,
    mode,
    onCopy,
    rankingWeights,
    serviceName,
    hasBlurredConfigKey,
    snippetText,
    step,
    treatUpdatedAsNew,
    tPendingTranslation,
  ]);

  const footer = useMemo(() => {
    const primaryLabel = step === 4 ? confirmLabel : nextLabel;
    const isPersisting = persistMutation.isPending;
    const requiredFieldsHint = tPendingTranslation(
      'All required fields must be filled out to continue.',
      'Hint shown in the footer when the user cannot advance due to incomplete required fields',
      translationKey(
        'CreateStepper.RequiredFieldsHint',
        TranslationNamespace.RecommendationService,
      ),
    );
    const editPropagationNote = tPendingTranslation(
      'Changes can take up to 30 minutes to apply.',
      'Note shown on the edit confirmation step about propagation delay before changes take effect',
      translationKey(
        'Edit.Confirmation.PropagationDelay',
        TranslationNamespace.RecommendationService,
      ),
    );
    return (
      <div className='sticky border-t border-stroke-default padding-y-large' style={{ bottom: 16 }}>
        <div className='flex flex-col gap-medium'>
          {!canAdvanceFromStep && step < 5 && !isPersisting ? (
            <div className='text-body-medium content-muted'>{requiredFieldsHint}</div>
          ) : null}
          {mode === 'edit' && step === 4 ? (
            <div className='text-body-medium content-muted'>{editPropagationNote}</div>
          ) : null}
          <div className='flex items-center gap-medium'>
            {step < 5 ? (
              <Button
                variant='Emphasis'
                size='Large'
                onClick={() => {
                  onNext().catch(() => {});
                }}
                isLoading={step === 4 && isPersisting}
                isDisabled={!canAdvanceFromStep || isPersisting}>
                {primaryLabel}
              </Button>
            ) : (
              <Button variant='Emphasis' size='Large' onClick={onCancel}>
                {doneLabel}
              </Button>
            )}
            {step > 0 && step < 5 ? (
              <Button variant='Standard' size='Large' onClick={onBack} isDisabled={isPersisting}>
                {backLabel}
              </Button>
            ) : null}
            {step < 5 ? (
              <Button variant='Standard' size='Large' onClick={onCancel} isDisabled={isPersisting}>
                {cancelLabel}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }, [
    backLabel,
    canAdvanceFromStep,
    cancelLabel,
    confirmLabel,
    doneLabel,
    nextLabel,
    onBack,
    onCancel,
    onNext,
    persistMutation.isPending,
    step,
    mode,
    tPendingTranslation,
  ]);

  const configNotFoundTitle = tPendingTranslation(
    'Config not found',
    'Error message shown when trying to edit a config that does not exist',
    translationKey('Edit.Error.ConfigNotFound', TranslationNamespace.RecommendationService),
  );
  const tryAgainLabel = translate(
    translationKey('Action.FailedToLoadPage', TranslationNamespace.Error),
  );

  if (!ready) {
    return <CircularProgress data-testid='loading' />;
  }

  if (mode === 'edit') {
    if (!editKey) {
      return (
        <div className='flex flex-col gap-medium padding-xlarge'>
          <FeedbackBanner severity='Error' layout='Inline' title={configNotFoundTitle} />
          <div>
            <Button variant='Standard' size='Large' onClick={onCancel}>
              {tryAgainLabel}
            </Button>
          </div>
        </div>
      );
    }

    if (!hasHydratedFromExisting && isExistingLoading) {
      return <CircularProgress data-testid='loading' />;
    }

    if (!hasHydratedFromExisting) {
      return (
        <div className='flex flex-col gap-medium padding-xlarge'>
          <FeedbackBanner severity='Error' layout='Inline' title={configNotFoundTitle} />
          <div className='flex items-center gap-small'>
            <Button
              variant='Standard'
              size='Large'
              onClick={() => refetchExistingValues().catch(() => {})}>
              {tryAgainLabel}
            </Button>
            <Button variant='Standard' size='Large' onClick={onCancel}>
              {cancelLabel}
            </Button>
          </div>
        </div>
      );
    }
  }

  return (
    <div className='flex flex-col' style={{ minHeight: '100vh' }}>
      <div className='flex flex-col gap-xlarge' style={{ flex: 1 }}>
        <div className='text-heading-large content-emphasis'>{pageTitle}</div>
        <div style={{ width: '100%' }}>
          <Stepper
            steps={wizardSteps}
            size='Medium'
            borderPosition='Bottom'
            currentStepIndex={currentStepperIndex}
          />
        </div>
        <div style={{ paddingBottom: 34 }}>{content}</div>
      </div>
      {footer}
      <Snackbar
        key={copyToastKey}
        open={isCopyToastOpen}
        autoHide
        onClose={() => setIsCopyToastOpen(false)}
        anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}>
        <Alert
          variant='standard'
          severity='success'
          style={{
            width: 'fit-content',
            maxWidth: 'calc(100vw - 32px)',
            display: 'inline-flex',
          }}>
          {copySuccessToastMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}

const RecommendationServiceCreateServicePageContainer: FC = () => {
  return <RecommendationServiceServiceWizard mode='create' />;
};

export default withNamespaceSwitchedTranslation(RecommendationServiceCreateServicePageContainer, [
  TranslationNamespace.RecommendationService,
  TranslationNamespace.UniverseConfigAndExperimentation,
  TranslationNamespace.Error,
]);
