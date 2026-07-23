import serviceEfficiencyClient from '@modules/clients/serviceEfficiency';
import { createCustomSettingsWithArgs } from '@modules/settings/implementations/createCustomSettings';
import type { ServiceEfficiencyCustomSettings } from './ServiceEfficiencyCustomSettingsManager';
import ServiceEfficiencyCustomSettingsManager from './ServiceEfficiencyCustomSettingsManager';

const serviceEfficiencyCustomSettingsManager = new ServiceEfficiencyCustomSettingsManager(
  serviceEfficiencyClient,
);

const { CustomSettingsProvider, useCustomSettings } = createCustomSettingsWithArgs<
  ServiceEfficiencyCustomSettings,
  []
>(serviceEfficiencyCustomSettingsManager, () => []);

export {
  CustomSettingsProvider as ServiceEfficiencyCustomSettingsProvider,
  useCustomSettings as useServiceEfficiencyCustomSettings,
};
