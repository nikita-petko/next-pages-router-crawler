import moment from 'moment-timezone';
import { useEffect } from 'react';

import { ServerCampaignObjectiveType } from '@constants/campaign';
import { FormField } from '@constants/campaignBuilder';
import { SanitizeUniverseName } from '@utils/campaignBuilder';

interface UseCampaignNameGenerationParams {
  createMode: boolean;
  dirtyFields: { campaignName?: boolean };
  getGoalName?: (goal: ServerCampaignObjectiveType) => string;
  objective?: ServerCampaignObjectiveType;
  setValue: (field: FormField, value: string) => void;
  timezoneDbName: string;
  universeName: string | undefined;
}

export const useCampaignNameGeneration = ({
  createMode,
  dirtyFields,
  getGoalName,
  objective,
  setValue,
  timezoneDbName,
  universeName,
}: UseCampaignNameGenerationParams) => {
  // Disable name generating after the campaign name is changed by the user.
  const isCampaignNameDirty = dirtyFields.campaignName;
  useEffect(() => {
    if (!createMode) {
      return;
    }
    if (universeName !== undefined && !isCampaignNameDirty) {
      // Use current time to generate a unique campaign name
      const goal = getGoalName && objective ? `${getGoalName(objective)}_` : '';
      setValue(
        FormField.CAMPAIGN_NAME,
        `${goal}${SanitizeUniverseName(universeName)}_${moment
          .tz(Date.now(), timezoneDbName)
          .format('MMDDYYYY_hh:mmA')}`,
      );
    }
  }, [
    createMode,
    getGoalName,
    isCampaignNameDirty,
    objective,
    setValue,
    timezoneDbName,
    universeName,
  ]);
};
