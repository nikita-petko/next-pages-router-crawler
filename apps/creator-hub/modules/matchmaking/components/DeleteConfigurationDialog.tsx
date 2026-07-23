import { Dialog, Typography, Grid, DialogTemplate } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import React, { FunctionComponent, useMemo } from 'react';
import useConfigurationSimulationContainerStyles from '../container/ConfigurationSimulationContainer.styles';
import useConfigurationManagement from '../hooks/useConfigurationManagement';

export interface DeleteConfigurationDialogProps {
  isOpen: boolean;
  configId?: string;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteConfigurationDialog: FunctionComponent<
  React.PropsWithChildren<DeleteConfigurationDialogProps>
> = ({ isOpen, configId, onClose, onConfirm }) => {
  const { allConfigurationBriefInfoList } = useConfigurationManagement();

  const {
    classes: { dialogBoxContent },
  } = useConfigurationSimulationContainerStyles();
  const { translate } = useTranslation();

  const isAppliedToPlaces = useMemo(() => {
    if (configId) {
      const configuration = allConfigurationBriefInfoList?.find((config) => config.id === configId);
      if (configuration && configuration.appliedPlaces) {
        return configuration?.appliedPlaces.size > 0;
      }
    }
    return false;
  }, [allConfigurationBriefInfoList, configId]);

  return (
    <Dialog open={isOpen}>
      <DialogTemplate
        color='destructive'
        title={translate('Dialog.DeleteConfig')}
        cancelText={translate('Button.Cancel')}
        confirmText={translate('Button.Delete')}
        onConfirm={onConfirm}
        onCancel={onClose}
        content={
          <Grid className={dialogBoxContent}>
            <Typography sx={{ whiteSpace: 'pre-wrap' }} variant='body1'>
              {isAppliedToPlaces && translate('Dialog.DeleteConfigAppliedPlaces')}
              {translate('Dialog.ConfirmDeletion')}
            </Typography>
          </Grid>
        }
      />
    </Dialog>
  );
};

export default DeleteConfigurationDialog;
