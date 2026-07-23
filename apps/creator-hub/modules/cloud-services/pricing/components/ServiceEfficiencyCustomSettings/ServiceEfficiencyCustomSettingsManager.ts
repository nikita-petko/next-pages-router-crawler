import { CustomSettingsManagerWithArgs } from '@modules/settings';
import { ServiceEfficiencyClient } from '@modules/clients';

export type ServiceEfficiencyCustomSettings = {
  isUserEligibleForServiceEfficiency: boolean;
};

export default class ServiceEfficiencyCustomSettingsManager
  implements CustomSettingsManagerWithArgs<ServiceEfficiencyCustomSettings, []>
{
  name?: string;

  defaultSettings: Readonly<ServiceEfficiencyCustomSettings>;

  constructor(private serviceEfficiencyClient: ServiceEfficiencyClient) {
    this.name = 'ServiceEfficiencySettings';
    this.defaultSettings = Object.freeze({
      isUserEligibleForServiceEfficiency: false,
    });
  }

  async getSettings(): Promise<ServiceEfficiencyCustomSettings> {
    try {
      const isAllowed = await this.serviceEfficiencyClient.serviceEfficiencyApiIsAllowed();
      return { isUserEligibleForServiceEfficiency: isAllowed };
    } catch {
      return { isUserEligibleForServiceEfficiency: false };
    }
  }
}
