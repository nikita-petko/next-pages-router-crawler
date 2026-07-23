import type { ChangeEvent, FunctionComponent } from 'react';
import React, { useCallback, useEffect, useRef } from 'react';
import { CategoryType } from '@rbx/client-toolbox-service/v1';
import { withTranslation, useTranslation } from '@rbx/intl';
import { Alert, Grid, Link, MenuItem, Select, Typography } from '@rbx/ui';
import { UnifiedLogger } from '@rbx/unified-logger';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import { eventStreamBaseUrl } from '@modules/eventStream/tracker';
import AnalyticsTabContentLayout from '@modules/experience-analytics-shared/layout/AnalyticsTabContentLayout';
import type { ExperienceAnalyticsPageControl } from '@modules/experience-analytics-shared/layout/ExperienceAnalyticsPageControlBar/ExperienceAnalyticsPageControlBar';
import getCreatorAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getCreatorAnalyticsPageLayout';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { developerForum } from '@modules/miscellaneous/urls/creatorHub';
import { FrontendFlagName } from '@modules/toolboxService/toolboxFeatureManagement';
import { useToolboxServiceApiProvider } from '@modules/toolboxService/ToolboxServiceApiProvider';
import AssetAnalyticsContent from './AssetAnalyticsContent';
import CreatorInsightsTable from './CreatorInsightsTable';
import useStoreTabContentStyles from './StoreTabContent.styles';

export type StoreTabContentSpec = {
  forceNonStickyControlBar?: boolean;
};
const defaultPageControls: ExperienceAnalyticsPageControl[] = [];

const intersectionObserverThreshold = 0.5;

const developerForumLink = developerForum.getBaseUrl();

export const CategoryTypeToTranslationKey = new Map<CategoryType, string>([
  [CategoryType.Model, 'Label.Models'],
  [CategoryType.Plugin, 'Label.Plugins'],
]);

const StoreTabContent: FunctionComponent<StoreTabContentSpec> = ({ forceNonStickyControlBar }) => {
  const { frontendFlags } = useToolboxServiceApiProvider();
  const { translate } = useTranslation();
  const { classes: styles } = useStoreTabContentStyles();
  const [assetType, setAssetType] = React.useState<CategoryType>(CategoryType.Model);

  const onChangeAssetType = useCallback(async (event: ChangeEvent<{ value: unknown }>) => {
    const type = event.target.value as CategoryType;
    setAssetType(type);
  }, []);

  const tableRef = useRef(null);
  useEffect(() => {
    const unifiedLogger = new UnifiedLogger({
      product: 'CreatorDashboard',
      eventBaseUrl: eventStreamBaseUrl,
    });
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.intersectionRatio >= intersectionObserverThreshold) {
              intersectionObserver.unobserve(entry.target);
              unifiedLogger.logImpressionEvent({
                eventName: CreatorDashboardEventType.ImpressionCreatorOpportunityTable,
              });
            }
          }
        });
      },
      { threshold: [intersectionObserverThreshold] },
    );
    if (tableRef.current) {
      intersectionObserver.observe(tableRef.current);
    }
  }, [tableRef]);

  return (
    <AnalyticsTabContentLayout
      controls={defaultPageControls}
      forceNonStickyControlBar={forceNonStickyControlBar}>
      {getCreatorAnalyticsPageLayout(<AssetAnalyticsContent />)}

      {frontendFlags[FrontendFlagName.FrontendFlagEnableCreatorInsightsPage] && (
        <Grid
          container
          data-testid='creator-insights'
          className={styles.opportunityInsights}
          spacing={6}
          direction='column'>
          <Grid item>
            <Grid container direction='column' spacing={1}>
              <Grid item>
                <Typography variant='h2'>
                  {translate('Heading.StoreOpportunityInsights')}
                </Typography>
              </Grid>
              <Grid item>
                <Typography variant='body1'>
                  {translate('Description.StoreOpportunityInsights')}
                </Typography>
              </Grid>
            </Grid>
            <Grid item>
              <Alert severity='info'>
                <span>{translate('Label.BetaWarning')} </span>
                <Link href={developerForumLink} target='_blank'>
                  {translate('Label.DevForumPage')}
                </Link>
              </Alert>
            </Grid>
          </Grid>
          <Grid item>
            <Select
              className={styles.paymentTypeDropdown}
              label={translate('Label.AssetType')}
              margin='none'
              onChange={onChangeAssetType}
              size='medium'
              value={assetType}
              variant='outlined'>
              {Array.from(CategoryTypeToTranslationKey.keys()).map((category) => {
                return (
                  <MenuItem value={category} key={category}>
                    {translate(CategoryTypeToTranslationKey.get(category) ?? '')}
                  </MenuItem>
                );
              })}
            </Select>
          </Grid>
          <Grid item>
            <CreatorInsightsTable assetType={assetType} />
          </Grid>
        </Grid>
      )}
    </AnalyticsTabContentLayout>
  );
};

export default withTranslation(StoreTabContent, [TranslationNamespace.StoreAnalytics]);
