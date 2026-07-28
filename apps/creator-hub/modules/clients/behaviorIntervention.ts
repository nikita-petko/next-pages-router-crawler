import { DefaultApi } from '@rbx/client-behavior-intervention/v1';
import { mapNotApprovedResponseToDevExIntervention } from './behaviorInterventionMapper';
import {
  createDevExNotApprovedRequest,
  createDismissInterventionInitOverride,
} from './behaviorInterventionRequests';
import type { DevExInterventionDetail } from './userModerationTypes';
import { createClientConfiguration } from './utils/createClientConfiguration';

export class BehaviorInterventionClient extends DefaultApi {
  constructor() {
    super(createClientConfiguration('usermoderation', 'bedev1'));
  }

  async getDevExIntervention(): Promise<DevExInterventionDetail | null> {
    try {
      const response = await this.behaviorInterventionGetNotApproved(
        createDevExNotApprovedRequest(),
      );
      return mapNotApprovedResponseToDevExIntervention(response);
    } catch {
      return null;
    }
  }

  async dismissIntervention(interventionId: string): Promise<void> {
    await this.behaviorInterventionDismissIntervention(
      createDismissInterventionInitOverride(interventionId),
    );
  }
}

const behaviorInterventionClient = new BehaviorInterventionClient();

export default behaviorInterventionClient;
