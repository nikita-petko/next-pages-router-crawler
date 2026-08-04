import { Button, Divider, Icon, IconButton, Link } from '@rbx/foundation-ui';
import { Tooltip } from '@rbx/ui';
import { useRouter } from 'next/router';
import { useCallback, useEffect } from 'react';

import { EventName, logNativeClickEvent, logNativeImpressionEvent } from '@clients/unifiedLogger';
import DateQuickPick from '@components/reporting/DateQuickPick';
import { openReportDownloadDialog } from '@components/reporting/dialogs/ReportDownloadDialog';
import ExperienceFilterPicker from '@components/reporting/ExperienceFilterPicker';
import PageHeaderBanners from '@components/reporting/PageHeaderBanners';
import PromotionBanner from '@components/reporting/PromotionBanner';
import ReportingViewQuickPick from '@components/reporting/ReportingViewQuickPick';
import SearchBox from '@components/reporting/SearchBox';
import SummaryCardRow from '@components/reporting/SummaryCardRow';
import { TranslationNamespace } from '@constants/localization';
import Routes from '@constants/routes';
import useAdAccountAutoCreateCreateAction from '@hooks/account/useAdAccountAutoCreateCreateAction';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { useAppStore } from '@stores/appStoreProvider';
import { NewFlowStoreType, useNewFlowStore } from '@stores/newFlowStoreProvider';

const PageHeader = () => {
  const { translate, translateHTML } = useNamespacedTranslation(TranslationNamespace.Report);
  const { translate: translateCampaign } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const router = useRouter();
  const { advertisingShouldBeEnabled, disabledTooltip } = useAppStore((state) =>
    state.advertisingShouldBeEnabled(),
  );
  const { isError: summaryStatsIsError, isLoading: summaryStatsIsLoading } = useNewFlowStore(
    (state: NewFlowStoreType) => state.summaryStatsState,
  );
  const retrySummaryStats = useNewFlowStore((state: NewFlowStoreType) => state.retrySummaryStats);
  const navigateToCreateCampaign = useCallback(() => {
    logNativeClickEvent(EventName.CreateCampaignButtonClicked);
    router.push(Routes.NEW_CREATE_CAMPAIGN);
  }, [router]);
  const handleCreateClick = useAdAccountAutoCreateCreateAction(
    navigateToCreateCampaign,
    'reportingPageHeader',
  );

  useEffect(() => {
    if (!advertisingShouldBeEnabled) {
      logNativeImpressionEvent(EventName.CreateButtonDisabled, {
        tooltipText: disabledTooltip || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- would like it to run only on first render
  }, []);

  return (
    <>
      <div className='margin-bottom-medium flex width-full flex-col gap-xxlarge'>
        {/* Figma Body order: pageHeaderStack → banners → filters/metrics/search */}
        <div className='flex width-full wrap items-center justify-between gap-xlarge padding-y-xsmall'>
          <h1 className='margin-[0px] text-heading-large content-emphasis min-width-[300px] grow'>
            {translateCampaign('Heading.ManageAds')}
          </h1>
          <Tooltip arrow placement='left' title={disabledTooltip ? translate(disabledTooltip) : ''}>
            <div>
              <Button
                data-testid='newflow-create-button'
                isDisabled={!advertisingShouldBeEnabled}
                onClick={handleCreateClick}
                size='Medium'
                variant='Emphasis'>
                {translate('Action.Create')}
              </Button>
            </div>
          </Tooltip>
        </div>

        <PageHeaderBanners />
        <PromotionBanner />

        <div className='flex width-full flex-col gap-small'>
          <div className='flex width-full wrap items-start justify-between gap-medium'>
            <div className='flex wrap items-start gap-medium'>
              <DateQuickPick />
              <ExperienceFilterPicker />
              <ReportingViewQuickPick />
            </div>
            <div className='flex items-center gap-small'>
              <Icon
                className='content-emphasis shrink-0'
                name='icon-regular-circle-i'
                size='Medium'
              />
              <div className='text-body-medium content-emphasis'>
                {translateHTML('Description.ReportingDataFiltered', [
                  {
                    closing: 'linkEnd',
                    content: (chunks) => (
                      <Link
                        href='https://create.roblox.com/docs/production/promotion/ads-manager'
                        rel='noopener noreferrer'
                        target='_blank'
                        underline='always'>
                        {chunks}
                      </Link>
                    ),
                    opening: 'linkStart',
                  },
                ])}
              </div>
            </div>
          </div>
          {summaryStatsIsError ? (
            <div className='flex items-center gap-xsmall'>
              <p className='margin-[0px] text-body-small content-system-alert'>
                {translate('Description.SummaryDataFailedToFetch')}
              </p>
              <IconButton
                ariaLabel={translateMisc('Action.Retry')}
                icon='icon-regular-arrow-spin-clockwise'
                isCircular
                isDisabled={summaryStatsIsLoading}
                onClick={() => {
                  logNativeClickEvent(EventName.ReportingRetryClicked, {
                    retryTarget: 'summary',
                  });
                  retrySummaryStats().catch(() => undefined);
                }}
                size='XSmall'
                variant='Utility'
              />
            </div>
          ) : (
            <p className='margin-[0px] text-body-small content-default'>
              {translate('Description.StatsDelayedUnifiedAttribution')}
            </p>
          )}
        </div>

        <SummaryCardRow />

        <div className='flex width-full items-center justify-between gap-medium'>
          <SearchBox />
          <Button
            onClick={() => openReportDownloadDialog({ isNewFlowType: true })}
            size='Medium'
            variant='Standard'>
            {translate('Action.Download')}
          </Button>
        </div>
      </div>
      <Divider data-testid='header-table-divider' />
    </>
  );
};

export default PageHeader;
