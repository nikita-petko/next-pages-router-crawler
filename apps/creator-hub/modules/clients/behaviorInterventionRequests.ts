import {
  BehaviorInterventionGetNotApprovedAbuseVectorEnum,
  type BehaviorInterventionGetNotApprovedRequest,
} from '@rbx/client-behavior-intervention/v1';
import type { InitOverrideFunction } from '@rbx/clients-core';

type DismissInterventionRequestBody = {
  intervention_id: string;
};

export function createDevExNotApprovedRequest(): BehaviorInterventionGetNotApprovedRequest {
  return {
    abuseVector: BehaviorInterventionGetNotApprovedAbuseVectorEnum.Devex,
  };
}

/** OpenAPI spec omits dismiss requestBody; clients-core JSON-stringifies HTTPRequestInit body once. */
export function createDismissInterventionInitOverride(
  interventionId: string,
): InitOverrideFunction {
  const body: DismissInterventionRequestBody = { intervention_id: interventionId };

  return async ({ init }) => {
    init.headers = {
      ...init.headers,
      'Content-Type': 'application/json',
    };
    init.body = body;
    return init as RequestInit;
  };
}
