import { IconButton, SheetBody, SheetContent, SheetRoot, SheetTitle } from '@rbx/foundation-ui';
import { Alert } from '@rbx/ui';
import { useRouter } from 'next/router';
import { useState } from 'react';

import Collapse from '@components/common/Collapse';
import useDrawerStyles from '@components/common/Drawer.styles';
import AdsManagementTable from '@components/reporting/AdsManagementTable';
import CampaignDetails from '@components/reporting/CampaignDetails';
import styles from '@components/reporting/CampaignDetailsDrawer.module.css';
import CampaignReportingCharts from '@components/reporting/CampaignReportingCharts';
import { TranslationNamespace } from '@constants/localization';
import Routes from '@constants/routes';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { NewFlowStoreType, useNewFlowStore } from '@stores/newFlowStoreProvider';

const CampaignDetailsDrawer = () => {
  const router = useRouter();
  const { classes } = useDrawerStyles();
  const { translate } = useNamespacedTranslation(TranslationNamespace.Report);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const { campaign } = useNewFlowStore((state: NewFlowStoreType) => state.campaignDetailsState);
  const closeDrawer = useNewFlowStore((state: NewFlowStoreType) => state.closeDrawer);
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(false);

  const hasPendingDecrease = !!campaign?.scheduled_budget_micro_usd;

  const handleClose = () => {
    closeDrawer();
    router.push(Routes.MANAGE, undefined, { scroll: false });
  };

  return (
    <SheetRoot
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
      open={campaign !== undefined}>
      <SheetContent
        closeLabel={translate('Description.CloseCampaignDetails')}
        largeScreenClassName='!max-width-[50vw] width-full'
        largeScreenVariant='side'>
        <SheetTitle className={styles.title}>
          <span title={campaign?.name}>{campaign?.name}</span>
        </SheetTitle>
        <SheetBody>
          {hasPendingDecrease && (
            <Collapse in={!isBannerDismissed} unmountOnExit>
              <Alert
                action={
                  <IconButton
                    ariaLabel={translateMisc('Action.Close')}
                    icon='icon-regular-x'
                    onClick={() => setIsBannerDismissed(true)}
                    size='Small'
                    variant='Utility'
                  />
                }
                className={classes.pendingDecreaseBanner}
                data-testid='scheduled-budget-decrease-banner'
                severity='warning'
                variant='outlined'>
                {translate('Message.BudgetDecreasePending')}
              </Alert>
            </Collapse>
          )}
          <div className={classes.drawerBodyContent}>
            <CampaignDetails />
            <CampaignReportingCharts />
            <AdsManagementTable />
          </div>
        </SheetBody>
      </SheetContent>
    </SheetRoot>
  );
};

export default CampaignDetailsDrawer;
