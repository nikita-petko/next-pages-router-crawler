import { Button, Divider, Link } from '@rbx/foundation-ui';
import { Alert, Grid, Tooltip } from '@rbx/ui';
import { useRouter } from 'next/router';
import { useCallback, useEffect } from 'react';

import { EventName, logNativeClickEvent, logNativeImpressionEvent } from '@clients/unifiedLogger';
import DateQuickPick from '@components/reporting/DateQuickPick';
import { openReportDownloadDialog } from '@components/reporting/dialogs/ReportDownloadDialog';
import ExperienceFilterPicker from '@components/reporting/ExperienceFilterPicker';
import usePageHeaderStyles from '@components/reporting/PageHeader.styles';
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

const PageHeader = () => {
  const { translate, translateHTML } = useNamespacedTranslation(TranslationNamespace.Report);
  const router = useRouter();
  const {
    classes: {
      bodyContainer,
      filteredMessage,
      pickerContainer,
      searchCreateRow,
      searchDownloadContainer,
    },
  } = usePageHeaderStyles();
  const { advertisingShouldBeEnabled, disabledTooltip } = useAppStore((state) =>
    state.advertisingShouldBeEnabled(),
  );
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
      <PageHeaderBanners />
      <PromotionBanner />
      <Grid className={bodyContainer} container>
        <Grid className={pickerContainer} container>
          <DateQuickPick />
          <ExperienceFilterPicker />
          <ReportingViewQuickPick />
          <Alert className={filteredMessage} severity='info' variant='outlined'>
            <div className='text-body-medium'>
              {translateHTML('Description.ReportingDataFiltered', [
                {
                  closing: 'linkEnd',
                  content: (chunks) => (
                    <Link
                      href='https://create.roblox.com/docs/production/promotion/ads-manager'
                      isExternal={false}
                      rel='noopener noreferrer'
                      target='_blank'>
                      {chunks}
                    </Link>
                  ),
                  opening: 'linkStart',
                },
              ])}
            </div>
          </Alert>
        </Grid>
        <SummaryCardRow />
        <Grid className={searchCreateRow} container>
          <Grid item>
            <Tooltip
              arrow
              placement='left'
              title={disabledTooltip ? translate(disabledTooltip) : ''}>
              <div>
                <Button
                  data-testid='newflow-create-button'
                  icon='icon-regular-plus-large'
                  isDisabled={!advertisingShouldBeEnabled}
                  onClick={handleCreateClick}
                  size='Medium'
                  variant='Emphasis'>
                  {translate('Action.Create')}
                </Button>
              </div>
            </Tooltip>
          </Grid>
          <Grid item>
            <Grid className={searchDownloadContainer} container>
              <SearchBox />
              <Button
                icon='icon-regular-arrow-down-to-line'
                onClick={() => openReportDownloadDialog({ isNewFlowType: true })}
                size='Medium'
                variant='Standard'>
                {translate('Action.Download')}
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <Divider data-testid='header-table-divider' />
    </>
  );
};

export default PageHeader;
