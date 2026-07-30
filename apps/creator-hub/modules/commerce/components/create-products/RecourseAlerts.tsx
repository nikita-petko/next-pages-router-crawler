import { memo } from 'react';
import { useTranslation } from '@rbx/intl';
import { Alert, Button, Grid, AlertTitle } from '@rbx/ui';
import { BundlingEligibilityRecourse } from '@modules/clients/commerce';

type RecourseAlertConfig = {
  titleKey: string;
  messageKey: string;
  showAction: (hasBusinessInfoPermissions: boolean) => boolean;
  actionTextKey?: string;
  onClick?: (props: {
    onClickCreatorActivation?: () => void;
    onClickInvoicingInfo?: () => void;
  }) => (() => void) | undefined;
};

const BUNDLING_RECOURSE_ALERT_CONFIGS: Record<
  BundlingEligibilityRecourse,
  RecourseAlertConfig | null
> = {
  [BundlingEligibilityRecourse.BrandActivation]: {
    titleKey: 'Heading.Eligibility.BundlingRecourse.BrandActivation',
    messageKey: 'Message.Eligibility.BundlingRecourse.BrandActivation',
    showAction: () => false,
  },
  [BundlingEligibilityRecourse.CreatorActivation]: {
    titleKey: 'Heading.Eligibility.BundlingRecourse.CreatorActivation',
    messageKey: 'Message.Eligibility.BundlingRecourse.CreatorActivation',
    showAction: () => true,
    actionTextKey: 'Action.Eligibility.BundlingRecourse.CreatorActivationApplication',
    onClick: ({ onClickCreatorActivation }) => onClickCreatorActivation,
  },
  [BundlingEligibilityRecourse.InvoicingInfo]: {
    titleKey: 'Heading.Eligibility.BundlingRecourse.InvoicingRequired',
    messageKey: 'Message.Eligibility.BundlingRecourse.Invoicing',
    showAction: (hasBusinessInfoPermissions) => hasBusinessInfoPermissions,
    actionTextKey: 'Action.UpdateInfo',
    onClick: ({ onClickInvoicingInfo }) => onClickInvoicingInfo,
  },
  [BundlingEligibilityRecourse.Invalid]: null,
};

interface RecourseAlertsProps {
  recourses: BundlingEligibilityRecourse[];
  onClickCreatorActivation?: () => void;
  onClickInvoicingInfo?: () => void;
  hasBusinessInfoPermissions?: boolean;
}

const RecourseAlerts = memo(
  ({
    recourses,
    onClickCreatorActivation,
    onClickInvoicingInfo,
    hasBusinessInfoPermissions = true,
  }: RecourseAlertsProps) => {
    const { translate } = useTranslation();

    return recourses.map((recourse) => {
      const alertConfig = BUNDLING_RECOURSE_ALERT_CONFIGS[recourse];
      if (!alertConfig) {
        return null;
      }

      return (
        <Grid key={recourse} minWidth='100%'>
          <Alert
            severity='info'
            action={
              alertConfig.showAction(hasBusinessInfoPermissions) ? (
                <Button
                  variant='text'
                  color='primary'
                  size='small'
                  onClick={alertConfig.onClick?.({
                    onClickCreatorActivation,
                    onClickInvoicingInfo,
                  })}>
                  {alertConfig.actionTextKey ? translate(alertConfig.actionTextKey) : ''}
                </Button>
              ) : undefined
            }>
            <AlertTitle paddingBottom={1}>{translate(alertConfig.titleKey)}</AlertTitle>
            {translate(alertConfig.messageKey)}
          </Alert>
        </Grid>
      );
    });
  },
);

RecourseAlerts.displayName = 'RecourseAlerts';

export default RecourseAlerts;
