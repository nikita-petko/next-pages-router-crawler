import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import RAQIV2PredefinedChartKey from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedChartKey';
import type { TabbedChartConfig } from '@modules/experience-analytics-shared/types/RAQIV2TabbedChartConfig';
import {
  CommerceProductEventsTitleTranslationKey,
  CommerceClicksTitleTranslationKey,
  CommerceCheckoutsTitleTranslationKey,
  CommerceOrdersTitleTranslationKey,
  CommerceUniqueCheckoutsTitleTranslationKey,
  CommerceUniqueClicksTitleTranslationKey,
  CommerceUniqueEventsTitleTranslationKey,
  CommerceUniqueOrdersTitleTranslationKey,
  CommerceGMVAndQuantitySoldTitleTranslationKey,
  CommerceGMVTabLabelTranslationKey,
  CommerceQuantitySoldTabLabelTranslationKey,
  CommerceGMVAndQuantitySoldDefinitionTooltipKey,
  CommerceUniqueProductEventsDefinitionTooltipKey,
  CommerceProductEventsDefinitionTooltipKey,
} from './constants';

export const gmvAndQuantityTabbedChartConfigs: TabbedChartConfig = {
  type: AnalyticsComponentType.TabbedChart,
  chartKey: 'CommerceGMV',
  titleKey: CommerceGMVAndQuantitySoldTitleTranslationKey,
  definitionTooltipKey: CommerceGMVAndQuantitySoldDefinitionTooltipKey,
  tabs: [
    {
      chart: RAQIV2PredefinedChartKey.CommerceGMV,
      tabLabel: CommerceGMVTabLabelTranslationKey,
    },
    {
      chart: RAQIV2PredefinedChartKey.CommerceQuantitySold,
      tabLabel: CommerceQuantitySoldTabLabelTranslationKey,
    },
  ],
};

export const productEventsTabbedChartConfigs: TabbedChartConfig = {
  type: AnalyticsComponentType.TabbedChart,
  chartKey: 'CommerceEvents',
  titleKey: CommerceProductEventsTitleTranslationKey,
  definitionTooltipKey: CommerceProductEventsDefinitionTooltipKey,
  tabs: [
    {
      chart: RAQIV2PredefinedChartKey.CommerceClicks,
      tabLabel: CommerceClicksTitleTranslationKey,
    },
    {
      chart: RAQIV2PredefinedChartKey.CommerceCheckouts,
      tabLabel: CommerceCheckoutsTitleTranslationKey,
    },
    {
      chart: RAQIV2PredefinedChartKey.CommerceOrders,
      tabLabel: CommerceOrdersTitleTranslationKey,
    },
  ],
};

export const uniqueEventsTabbedChartConfigs: TabbedChartConfig = {
  type: AnalyticsComponentType.TabbedChart,
  chartKey: 'CommerceUniqueEvents',
  titleKey: CommerceUniqueEventsTitleTranslationKey,
  definitionTooltipKey: CommerceUniqueProductEventsDefinitionTooltipKey,
  tabs: [
    {
      chart: RAQIV2PredefinedChartKey.CommerceUniqueClicks,
      tabLabel: CommerceUniqueClicksTitleTranslationKey,
    },
    {
      chart: RAQIV2PredefinedChartKey.CommerceUniqueCheckouts,
      tabLabel: CommerceUniqueCheckoutsTitleTranslationKey,
    },
    {
      chart: RAQIV2PredefinedChartKey.CommerceUniqueOrders,
      tabLabel: CommerceUniqueOrdersTitleTranslationKey,
    },
  ],
};
