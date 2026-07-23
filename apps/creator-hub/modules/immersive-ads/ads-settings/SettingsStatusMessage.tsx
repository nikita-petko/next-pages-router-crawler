import type { FC } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Typography } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export type SettingsStatusType = 'unsaved' | 'error' | 'success' | null;

interface SettingsStatusMessageProps {
  status: SettingsStatusType;
}

export const SettingsStatusMessage: FC<SettingsStatusMessageProps> = ({ status }) => {
  const { translate } = useTranslation();

  if (!status) {
    return null;
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'unsaved':
        return {
          color: '#ed6c02', // Orange/yellow warning color
          message: translate('Message.UnsavedChanges'),
        };
      case 'error':
        return {
          color: '#d32f2f', // Red error color
          message: translate('Message.ErrorSavingSettings'),
        };
      case 'success':
        return {
          color: '#2e7d32', // Green success color
          message: translate('Message.SettingsSuccessfullyUpdated'),
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config) {
    return null;
  }

  return (
    <Typography
      variant='body2'
      style={{
        color: config.color,
        fontSize: '0.875rem',
      }}>
      {config.message}
    </Typography>
  );
};

export default withTranslation(SettingsStatusMessage, [TranslationNamespace.ImmersiveAdsAnalytics]);
