import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import {
  translationKey,
  translationKeyWithoutNamespace,
} from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { AnalyticsTabbedTableConfig } from '../RAQIV2PredefinedTabbedTableConfigs';
import {
  getTableConfigNewUsersFunnelAcquisitionV2,
  getTableConfigNewUsersFunnelOverviewV2,
  tableConfigFunnelsProgressionBySessionRealtime,
  tableConfigFunnelsProgressionByUserRealtime,
  tableConfigJourneyByNodeChurnSessions,
  tableConfigJourneyByNodeChurnUsers,
  tableConfigJourneyByPathBreakdownSessions,
  tableConfigJourneyByPathBreakdownUsers,
  tableConfigJourneyByStageChurnSessions,
  tableConfigJourneyByStageChurnUsers,
  tableConfigNewUsersFunnelAcquisitionV2,
  tableConfigNewUsersFunnelAcquisitionV2Migration,
  tableConfigNewUsersFunnelEngagement,
  tableConfigNewUsersFunnelEngagementMigration,
  tableConfigNewUsersFunnelMonetization,
  tableConfigNewUsersFunnelMonetizationMigration,
  tableConfigNewUsersFunnelOverviewV2,
  tableConfigNewUsersFunnelOverviewV2Migration,
} from './PredefinedTableConfigLiterals';

export enum RAQIV2PredefinedTabbedTableKey {
  NewUsersFunnelV2 = 'NewUsersFunnelV2',
  NewUsersFunnelV2Migration = 'NewUsersFunnelV2Migration',
  FunnelProgressionBySessionAndUserRealtime = 'FunnelProgressionBySessionAndUserRealtime',
  JourneySessions = 'JourneySessions',
  JourneyUsers = 'JourneyUsers',
}

export const getTabbedTableConfigNewUsersFunnelV2 = (isHomeAcquisitionSignalsEnabled: boolean) =>
  ({
    type: AnalyticsComponentType.TabbedTable,
    tableKey: RAQIV2PredefinedTabbedTableKey.NewUsersFunnelV2,
    tabs: [
      {
        key: tableConfigNewUsersFunnelOverviewV2.tableKey,
        config: getTableConfigNewUsersFunnelOverviewV2(isHomeAcquisitionSignalsEnabled),
        labelKey: translationKeyWithoutNamespace('Label.TableTab.NewUsersFunnelOverview'),
        footerKey: translationKey('Footer.Table.NewUsersFunnel', TranslationNamespace.Analytics),
      },
      {
        key: tableConfigNewUsersFunnelAcquisitionV2.tableKey,
        config: getTableConfigNewUsersFunnelAcquisitionV2(isHomeAcquisitionSignalsEnabled),
        labelKey: translationKeyWithoutNamespace('Label.TableTab.NewUsersFunnelAcquisition'),
      },
      {
        key: tableConfigNewUsersFunnelEngagement.tableKey,
        config: tableConfigNewUsersFunnelEngagement,
        labelKey: translationKeyWithoutNamespace('Label.TableTab.NewUsersFunnelEngagement'),
        footerKey: translationKey('Footer.Table.NewUsersFunnel', TranslationNamespace.Analytics),
      },
      {
        key: tableConfigNewUsersFunnelMonetization.tableKey,
        config: tableConfigNewUsersFunnelMonetization,
        labelKey: translationKeyWithoutNamespace('Label.TableTab.NewUsersFunnelMonetization'),
        footerKey: translationKey('Footer.Table.NewUsersFunnel', TranslationNamespace.Analytics),
      },
    ],
    tabMobileLabelKey: translationKey(
      'Label.TableMobileTab.NewUsersFunnelV2',
      TranslationNamespace.Analytics,
    ),
    titleKey: translationKey('Title.Table.NewUsersFunnelV2', TranslationNamespace.Analytics),
    tooltipKey: translationKey(
      'Description.Table.NewUsersFunnelV2',
      TranslationNamespace.Analytics,
    ),
  }) as const satisfies AnalyticsTabbedTableConfig;

export const tabbedTableConfigNewUsersFunnelV2Migration = {
  type: AnalyticsComponentType.TabbedTable,
  tableKey: RAQIV2PredefinedTabbedTableKey.NewUsersFunnelV2Migration,
  tabs: [
    {
      key: tableConfigNewUsersFunnelOverviewV2Migration.tableKey,
      config: tableConfigNewUsersFunnelOverviewV2Migration,
      labelKey: translationKeyWithoutNamespace('Label.TableTab.NewUsersFunnelOverview'),
      footerKey: translationKey('Footer.Table.NewUsersFunnel', TranslationNamespace.Analytics),
    },
    {
      key: tableConfigNewUsersFunnelAcquisitionV2Migration.tableKey,
      config: tableConfigNewUsersFunnelAcquisitionV2Migration,
      labelKey: translationKeyWithoutNamespace('Label.TableTab.NewUsersFunnelAcquisition'),
    },
    {
      key: tableConfigNewUsersFunnelEngagementMigration.tableKey,
      config: tableConfigNewUsersFunnelEngagementMigration,
      labelKey: translationKeyWithoutNamespace('Label.TableTab.NewUsersFunnelEngagement'),
      footerKey: translationKey('Footer.Table.NewUsersFunnel', TranslationNamespace.Analytics),
    },
    {
      key: tableConfigNewUsersFunnelMonetizationMigration.tableKey,
      config: tableConfigNewUsersFunnelMonetizationMigration,
      labelKey: translationKeyWithoutNamespace('Label.TableTab.NewUsersFunnelMonetization'),
      footerKey: translationKey('Footer.Table.NewUsersFunnel', TranslationNamespace.Analytics),
    },
  ],
  tabMobileLabelKey: translationKey(
    'Label.TableMobileTab.NewUsersFunnelV2',
    TranslationNamespace.Analytics,
  ),
  titleKey: translationKey('Title.Table.NewUsersFunnelV2', TranslationNamespace.Analytics),
  tooltipKey: translationKey('Description.Table.NewUsersFunnelV2', TranslationNamespace.Analytics),
} as const satisfies AnalyticsTabbedTableConfig;

export const tabbedTableConfigFunnelProgressionBySessionAndUserRealtime = {
  type: AnalyticsComponentType.TabbedTable,
  tableKey: RAQIV2PredefinedTabbedTableKey.FunnelProgressionBySessionAndUserRealtime,
  tabs: [
    {
      key: tableConfigFunnelsProgressionByUserRealtime.tableKey,
      config: tableConfigFunnelsProgressionByUserRealtime,
      labelKey: translationKeyWithoutNamespace('Label.TableTab.FunnelsProgressionByUser'),
    },
    {
      key: tableConfigFunnelsProgressionBySessionRealtime.tableKey,
      config: tableConfigFunnelsProgressionBySessionRealtime,
      labelKey: translationKeyWithoutNamespace('Label.TableTab.FunnelsProgressionBySession'),
    },
  ],
  tabMobileLabelKey: translationKey('Heading.Funnels', TranslationNamespace.Analytics),
  titleKey: translationKey('Heading.Funnels', TranslationNamespace.Analytics),
  tooltipKey: translationKey('Description.Table.Funnels', TranslationNamespace.Analytics),
} as const satisfies AnalyticsTabbedTableConfig;

export const tabbedTableConfigJourneySessions = {
  type: AnalyticsComponentType.TabbedTable,
  tableKey: RAQIV2PredefinedTabbedTableKey.JourneySessions,
  tabs: [
    {
      key: tableConfigJourneyByPathBreakdownSessions.tableKey,
      config: tableConfigJourneyByPathBreakdownSessions,
      labelKey: translationKey('Heading.JourneyPathBreakdown', TranslationNamespace.Analytics),
    },
    {
      key: tableConfigJourneyByStageChurnSessions.tableKey,
      config: tableConfigJourneyByStageChurnSessions,
      labelKey: translationKey('Label.JourneyByStage', TranslationNamespace.Analytics),
    },
    {
      key: tableConfigJourneyByNodeChurnSessions.tableKey,
      config: tableConfigJourneyByNodeChurnSessions,
      labelKey: translationKey('Label.JourneyByNode', TranslationNamespace.Analytics),
    },
  ],
  tabMobileLabelKey: translationKey('Heading.TableBreakdown', TranslationNamespace.Analytics),
  titleKey: translationKey('Heading.TableBreakdown', TranslationNamespace.Analytics),
} as const satisfies AnalyticsTabbedTableConfig;

export const tabbedTableConfigJourneyUsers = {
  type: AnalyticsComponentType.TabbedTable,
  tableKey: RAQIV2PredefinedTabbedTableKey.JourneyUsers,
  tabs: [
    {
      key: tableConfigJourneyByPathBreakdownUsers.tableKey,
      config: tableConfigJourneyByPathBreakdownUsers,
      labelKey: translationKey('Heading.JourneyPathBreakdown', TranslationNamespace.Analytics),
    },
    {
      key: tableConfigJourneyByStageChurnUsers.tableKey,
      config: tableConfigJourneyByStageChurnUsers,
      labelKey: translationKey('Label.JourneyByStage', TranslationNamespace.Analytics),
    },
    {
      key: tableConfigJourneyByNodeChurnUsers.tableKey,
      config: tableConfigJourneyByNodeChurnUsers,
      labelKey: translationKey('Label.JourneyByNode', TranslationNamespace.Analytics),
    },
  ],
  tabMobileLabelKey: translationKey('Heading.TableBreakdown', TranslationNamespace.Analytics),
  titleKey: translationKey('Heading.TableBreakdown', TranslationNamespace.Analytics),
} as const satisfies AnalyticsTabbedTableConfig;
