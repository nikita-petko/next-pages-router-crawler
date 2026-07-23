enum RAQIV2PredefinedChartKey {
  TotalSourceAndSinkMigration = 'TotalSourceAndSinkMigration',
  AverageWalletBalanceMigration = 'AverageWalletBalanceMigration',
  TopSourcesMigration = 'TopSourcesMigration',
  TopSinksMigration = 'TopSinksMigration',

  AcquisitionNewUsersWithPlays = 'AcquisitionNewUsersWithPlays',
  AcquisitionReturningUsersWithPlays = 'AcquisitionReturningUsersWithPlays',
  AcquisitionNewUsersWithImpressions = 'AcquisitionNewUsersWithImpressions',
  AcquisitionReturningUsersWithImpressions = 'AcquisitionReturningUsersWithImpressions',
  AcquisitionHomeRecommendationQualifiedPTR = 'AcquisitionHomeRecommendationQualifiedPTR',
  AcquisitionHomeRecommendationQualifiedPTRMigration = 'AcquisitionHomeRecommendationQualifiedPTRMigration',

  AcquisitionNewUsersWithPlaysV2 = 'AcquisitionNewUsersWithPlaysV2',
  AcquisitionReturningUsersWithPlaysV2 = 'AcquisitionReturningUsersWithPlaysV2',
  AcquisitionNewUsersWithImpressionsV2 = 'AcquisitionNewUsersWithImpressionsV2',
  AcquisitionReturningUsersWithImpressionsV2 = 'AcquisitionReturningUsersWithImpressionsV2',

  AcquisitionNewUsersWithPlaysV2Migration = 'AcquisitionNewUsersWithPlaysV2Migration',
  AcquisitionReturningUsersWithPlaysV2Migration = 'AcquisitionReturningUsersWithPlaysV2Migration',
  AcquisitionNewUsersWithImpressionsV2Migration = 'AcquisitionNewUsersWithImpressionsV2Migration',
  AcquisitionReturningUsersWithImpressionsV2Migration = 'AcquisitionReturningUsersWithImpressionsV2Migration',

  TopSourcesByNewUsersWithPlays = 'TopSourcesByNewUsersWithPlays',
  TopSourcesBy30DRevenuePerUser = 'TopSourcesBy30DRevenuePerUser',

  TopSourcesByNewUsersWithPlaysMigration = 'TopSourcesByNewUsersWithPlaysMigration',
  TopSourcesBy30DRevenuePerUserMigration = 'TopSourcesBy30DRevenuePerUserMigration',

  D1Retention = 'D1Retention',
  ForwardD1Retention = 'ForwardD1Retention',
  D7Retention = 'D7Retention',
  ForwardD7Retention = 'ForwardD7Retention',
  D30Retention = 'D30Retention',
  ForwardD30Retention = 'ForwardD30Retention',
  DauMauStickiness = 'DauMauStickiness',

  DailyActiveUsers = 'DailyActiveUsers',
  MonthlyActiveUsers = 'MonthlyActiveUsers',
  EngagementNewUsers = 'EngagementNewUsers',
  EngagementReturningUsers = 'EngagementReturningUsers',
  EngagementNewUsersSessionTime = 'EngagementNewUsersSessionTime',
  EngagementReturningUsersSessionTime = 'EngagementReturningUsersSessionTime',
  EngagementAverageSessionTime = 'EngagementAverageSessionTime',
  EngagementAveragePlayTimePerDAU = 'EngagementAveragePlayTimePerDAU',
  EngagementTotalPlayTime = 'EngagementTotalPlayTime',
  EngagementSessions = 'EngagementSessions',
  EngagementNewUserSessionTimeRetention = 'EngagementNewUserSessionTimeRetention',

  DailyRevenue = 'DailyRevenue',
  DailyRevenueBySource = 'DailyRevenueBySource',
  DailyRevenueByBalanceType = 'DailyRevenueByBalanceType',
  ConversionRate = 'ConversionRate',
  PayingUsers = 'PayingUsers',
  AverageRevenuePerPayingUser = 'AverageRevenuePerPayingUser',
  AverageRevenuePerDailyActiveUser = 'AverageRevenuePerDailyActiveUser',

  PerformanceClientFps = 'PerformanceClientFps',
  PerformanceClientMemoryUsage = 'PerformanceClientMemoryUsage',
  PerformanceClientMemoryUsagePercentage = 'PerformanceClientMemoryUsagePercentage',
  PerformanceClientCrashRate = 'PerformanceClientCrashRate',
  PerformanceSessionTime = 'PerformanceSessionTime',
  PerformanceConcurrentPlayers = 'PerformanceConcurrentPlayers',
  PerformanceServerFps = 'PerformanceServerFps',
  PerformanceServerCpuEfficiency = 'PerformanceServerCpuEfficiency',
  PerformanceServerMemoryUsage = 'PerformanceServerMemoryUsage',
  PerformanceServerCpuUsage = 'PerformanceServerCpuUsage',

  OverviewMiniConcurrentPlayers = 'OverviewConcurrentPlayers',

  AudienceCountry = 'AudienceCountry',
  AudienceGender = 'AudienceGender',
  AudienceAge = 'AudienceAge',
  AudienceLanguage = 'AudienceLanguage',

  // UGC Item Analytics
  ItemMarketplaceVersusInExperience = 'ItemMarketplaceVersusInExperience',
  ItemPurchaserAge = 'ItemPurchaserAge',
  ItemPurchaserDemographics = 'ItemPurchaserDemographics',
  ItemPurchaserGender = 'ItemPurchaserGender',
  ItemPurchasePlatform = 'ItemPurchasePlatform',
  ItemRevenue = 'ItemRevenue',
  ItemSales = 'ItemSales',

  // Creator Store
  StoreAssetSales = 'StoreAssetSales',
  StoreAssetRevenue = 'StoreAssetRevenue',

  PerformanceServerFpsV2 = 'PerformanceServerFpsV2',
  PerformanceServerCpuUsageV2 = 'PerformanceServerCpuUsageV2',
  PerformanceServerCpuTimeV2 = 'PerformanceServerCpuTimeV2',
  PerformanceServerMemoryUsageV2 = 'PerformanceServerMemoryUsageV2',
  PerformanceServerMemoryUsageByAge = 'PerformanceServerMemoryUsageByAge',

  CustomEventsMigration = 'CustomEventsMigration',
  FunnelCohortCompletionRate = 'FunnelCohortCompletionRate',
  FunnelCohortSessionCompletionRate = 'FunnelCohortSessionCompletionRate',

  ThumbnailQualifiedPTR = 'ThumbnailQualifiedPTR',
  ThumbnailImpressions = 'ThumbnailImpressions',
  ThumbnailL7QualifiedPTR = 'ThumbnailL7QualifiedPTR',

  HomeRecommendationImpressions = 'HomeRecommendationImpressions',
  HomeRecommendationPlays = 'HomeRecommendationPlays',
  RFYPlayThroughRate = 'RFYPlayThroughRate',
  RFYL7PlayDays = 'RFYL7PlayDays',
  RFYL7PlayTime = 'RFYL7PlayTime',
  RFYL7RobuxSpent = 'RFYL7RobuxSpent',
  RFYL7RobuxSpentDays = 'RFYL7RobuxSpentDays',
  RFYL7IntentionalCoplayDays = 'RFYL7IntentionalCoplayDays',
  RFYDeepEngagementRate = 'RFYDeepEngagementRate',
  RFYQualifiedPTR = 'RFYQualifiedPTR',
  QualifiedPTRAndImpressionComparison = 'QualifiedPTRAndImpressionComparison',

  // Game Ops - Player Feedback
  PlayerFeedbackVotesCountByVoteType = 'PlayerFeedbackVotesCountByVoteType',

  // Commerce
  CommerceImpressions = 'CommerceImpressions',
  CommerceClicks = 'CommerceClicks',
  CommerceCheckouts = 'CommerceCheckouts',
  CommerceOrders = 'CommerceOrders',

  CommerceUniqueImpressions = 'CommerceUniqueImpressions',
  CommerceUniqueClicks = 'CommerceUniqueClicks',
  CommerceUniqueCheckouts = 'CommerceUniqueCheckouts',
  CommerceUniqueOrders = 'CommerceUniqueOrders',

  CommerceGMV = 'CommerceGMV',
  CommerceQuantitySold = 'CommerceQuantitySold',

  // Ads Insights
  SponsoredAdPlays = 'SponsoredAdPlays',
}

export default RAQIV2PredefinedChartKey;
