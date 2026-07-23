import { IconButton } from '@rbx/foundation-ui';
import { Alert, AlertTitle } from '@rbx/ui';
import { useState } from 'react';

import useCampaignBuilderCommonStyles from '@components/campaignBuilder/common/CampaignBuilderCommon.styles';
import Collapse from '@components/common/Collapse';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

const CreateCampaignCalloutBanner = ({
  action,
  description,
  icon,
  severity,
  title,
}: {
  action?: React.ReactNode;
  description: string;
  icon?: React.ReactNode;
  severity: 'info' | 'warning' | 'error' | 'success';
  title: string;
}) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Misc);
  const {
    classes: { alertTitle, mb4 },
  } = useCampaignBuilderCommonStyles();
  const [open, setOpen] = useState<boolean>(true);
  return (
    <Collapse in={open} unmountOnExit>
      <div className='text-body-large'>
        <Alert
          action={
            <div>
              {action}
              <IconButton
                ariaLabel={translate('Action.Close')}
                data-testid='close-button'
                icon='icon-regular-x'
                onClick={() => {
                  setOpen(false);
                }}
                size='Small'
                variant='Utility'
              />
            </div>
          }
          className={mb4}
          icon={icon}
          severity={severity}
          variant='standard'>
          <AlertTitle className={alertTitle} data-testid='alert-title'>
            {title}
          </AlertTitle>
          {description}
        </Alert>
      </div>
    </Collapse>
  );
};

export default CreateCampaignCalloutBanner;
