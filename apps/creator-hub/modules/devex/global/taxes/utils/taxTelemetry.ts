import type { UnifiedLogger } from '@rbx/unified-logger';
import type { TaxDocumentationStatusVariant } from './taxDocumentationStatus';

export const TAX_HUB_ENTRY_CLICK_EVENT = 'tax_hub_entry_click';
export const TAX_HUB_FLOW_STARTED_EVENT = 'tax_hub_flow_started';
export const TAX_HUB_FLOW_STEP_VIEWED_EVENT = 'tax_hub_flow_step_viewed';
export const TAX_HUB_FLOW_COMPLETED_EVENT = 'tax_hub_flow_completed';
export const TAX_HUB_FLOW_DURATION_EVENT = 'tax_hub_flow_duration';
export const TAX_HUB_HELP_RAIL_TOGGLE_EVENT = 'tax_hub_help_rail_toggle';
export const TAX_HUB_ERROR_OUT_EVENT = 'tax_hub_error_out';

export type TaxEntryPoint = 'devex_banner' | 'tax_status_card' | 'replace_form_dialog';
export type TaxEntryAction = 'view' | 'start' | 'continue' | 'new_form' | 'replace_form';
export type TaxFlowType = 'tax_form' | 'curing';
export type TaxFlowStartReason = 'new' | 'resume' | 'replace' | 'curing';
export type TaxFlowStep =
  | 'account_classification'
  | 'identification_w9'
  | 'identification_treaty'
  | 'treaty_claims'
  | 'collect_tax_w9'
  | 'collect_tax_treaty'
  | 'review_w9'
  | 'review_treaty'
  | 'unknown';
export type TaxStepDirection = 'initial' | 'next' | 'previous';
export type TaxFlowOutcome = 'completed' | 'error' | 'exited';
export type TaxTelemetryStatus =
  | 'not_started'
  | 'approved'
  | 'under_review'
  | 'additional_info_needed'
  | 'curing_required'
  | 'failed';
export type TaxHelpRailAction = 'expand' | 'collapse';
export type TaxFrontendErrorStage =
  | 'tax_center_load'
  | 'tax_form_load'
  | 'session_expired'
  | 'account_changed'
  | 'submission_status_load'
  | 'onboarding_unavailable';

export type TaxTelemetryLogger = Pick<
  UnifiedLogger,
  'logClickEvent' | 'logImpressionEvent' | 'logErrorEvent'
>;

type TaxEntryClickParameters = {
  entryPoint: TaxEntryPoint;
  action: TaxEntryAction;
  taxStatus: TaxTelemetryStatus;
};

type TaxFlowParameters = {
  flowType: TaxFlowType;
  taxStatus: TaxTelemetryStatus;
};

type TaxbitProgressForTelemetry = {
  stepId?: string;
  steps?: readonly string[];
};

const TREATY_STEP_IDS = ['accountHolderTreatyClaims', 'regardedOwnerTreatyClaims'] as const;
const TAX_DOCUMENTATION_STATUS_MAP: Record<TaxDocumentationStatusVariant, TaxTelemetryStatus> = {
  approved: 'approved',
  underReview: 'under_review',
  additionalInfoNeeded: 'additional_info_needed',
  curingRequired: 'curing_required',
  failed: 'failed',
  notStarted: 'not_started',
};

export const mapTaxDocumentationStatusToTelemetryStatus = (
  status: TaxDocumentationStatusVariant,
): TaxTelemetryStatus => TAX_DOCUMENTATION_STATUS_MAP[status];

export const mapTaxbitProgressToTaxFlowStep = (
  progress: TaxbitProgressForTelemetry | null,
): TaxFlowStep => {
  if (!progress?.stepId) {
    return 'unknown';
  }

  const hasTreatyStep = TREATY_STEP_IDS.some((stepId) => progress.steps?.includes(stepId));
  switch (progress.stepId) {
    case 'accountHolderClassification':
    case 'regardedOwnerClassification':
      return 'account_classification';
    case 'accountHolderContactInformation':
    case 'regardedOwnerContactInformation':
      return hasTreatyStep ? 'identification_treaty' : 'identification_w9';
    case 'accountHolderTreatyClaims':
    case 'regardedOwnerTreatyClaims':
      return 'treaty_claims';
    case 'accountHolderTaxInformation':
    case 'accountHolderUsTinValidation':
    case 'accountHolderAdditionalInfo':
    case 'exemptions':
    case 'regardedOwnerTaxInformation':
    case 'regardedOwnerUsTinValidation':
      return hasTreatyStep ? 'collect_tax_treaty' : 'collect_tax_w9';
    case 'accountHolderCertifications':
    case 'regardedOwnerCertifications':
    case 'confirmation':
    case 'summary':
      return hasTreatyStep ? 'review_treaty' : 'review_w9';
    default:
      return 'unknown';
  }
};

export const logTaxHubEntryClick = (
  logger: TaxTelemetryLogger,
  { entryPoint, action, taxStatus }: TaxEntryClickParameters,
) => {
  logger.logClickEvent({
    eventName: TAX_HUB_ENTRY_CLICK_EVENT,
    parameters: {
      entry_point: entryPoint,
      action,
      tax_status: taxStatus,
    },
  });
};

export const logDevExTaxHubEntryClick = (
  logger: TaxTelemetryLogger,
  parameters: Omit<TaxEntryClickParameters, 'entryPoint'>,
) => {
  logger.logClickEvent({
    eventName: TAX_HUB_ENTRY_CLICK_EVENT,
    parameters: {
      entry_point: 'devex_banner',
      action: parameters.action,
      tax_status: parameters.taxStatus,
    },
    tags: ['tax-hub'],
  });
};

export const logTaxHubFlowStarted = (
  logger: TaxTelemetryLogger,
  { flowType, startReason, taxStatus }: TaxFlowParameters & { startReason: TaxFlowStartReason },
) => {
  logger.logImpressionEvent({
    eventName: TAX_HUB_FLOW_STARTED_EVENT,
    parameters: {
      flow_type: flowType,
      start_reason: startReason,
      tax_status: taxStatus,
    },
  });
};

export const logTaxHubFlowStepViewed = (
  logger: TaxTelemetryLogger,
  {
    direction,
    step,
    taxStatus,
  }: Pick<TaxFlowParameters, 'taxStatus'> & {
    direction: TaxStepDirection;
    step: TaxFlowStep;
  },
) => {
  logger.logImpressionEvent({
    eventName: TAX_HUB_FLOW_STEP_VIEWED_EVENT,
    parameters: {
      flow_type: 'tax_form',
      step,
      direction,
      tax_status: taxStatus,
    },
  });
};

export const logTaxHubFlowCompleted = (
  logger: TaxTelemetryLogger,
  { flowType, taxStatus }: TaxFlowParameters,
) => {
  logger.logImpressionEvent({
    eventName: TAX_HUB_FLOW_COMPLETED_EVENT,
    parameters: {
      flow_type: flowType,
      tax_status: taxStatus,
    },
  });
};

export const logTaxHubFlowDuration = (
  logger: TaxTelemetryLogger,
  {
    durationMs,
    flowType,
    outcome,
    taxStatus,
  }: TaxFlowParameters & {
    durationMs: number;
    outcome: TaxFlowOutcome;
  },
) => {
  logger.logImpressionEvent({
    eventName: TAX_HUB_FLOW_DURATION_EVENT,
    parameters: {
      flow_type: flowType,
      duration_ms: String(Math.max(Math.round(durationMs), 0)),
      outcome,
      tax_status: taxStatus,
    },
  });
};

export const logTaxHubHelpRailToggle = (
  logger: TaxTelemetryLogger,
  action: TaxHelpRailAction,
  step: TaxFlowStep | 'unknown',
) => {
  logger.logClickEvent({
    eventName: TAX_HUB_HELP_RAIL_TOGGLE_EVENT,
    parameters: {
      action,
      step,
    },
  });
};

export const logTaxHubErrorOut = (
  logger: TaxTelemetryLogger,
  stage: TaxFrontendErrorStage,
  flowType: TaxFlowType | 'unknown' = 'unknown',
  recoverable = false,
) => {
  logger.logErrorEvent({
    eventName: TAX_HUB_ERROR_OUT_EVENT,
    parameters: {
      stage,
      flow_type: flowType,
      recoverable: String(recoverable),
    },
  });
};
