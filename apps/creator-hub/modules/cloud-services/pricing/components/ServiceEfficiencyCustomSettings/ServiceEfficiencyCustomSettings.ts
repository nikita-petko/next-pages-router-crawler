import { createCustomSettingsWithArgs } from '@modules/settings';
import { serviceEfficiencyClient } from '@modules/clients';
import ServiceEfficiencyCustomSettingsManager, {
  ServiceEfficiencyCustomSettings,
} from './ServiceEfficiencyCustomSettingsManager';

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
