import type { FunctionComponent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  IconButton,
  CloseIcon,
  Dialog,
  Typography,
  DialogActions,
  Button,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@rbx/ui';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import getShowParentalConsentOptionsFeatureAccess from '../../common/clients/parentalConsentOptionsFeatureAccess';

export enum EstablishTrustDialogSource {
  CreationsBanner = 'creationsBanner',
  SafetyCollaborators = 'safetyCollaborators',
}

export interface EstablishTrustDialogProps {
  open: boolean;
  source: EstablishTrustDialogSource;
  universeId?: number;
  onAddTrustedFriends: () => void;
  onAskParent: () => void;
  onClose: () => void;
}

const EstablishTrustDialog: FunctionComponent<EstablishTrustDialogProps> = ({
  open,
  source,
  universeId,
  onAddTrustedFriends,
  onAskParent,
  onClose,
}) => {
  const { translate } = useTranslation();
  const [showParentalConsentOptions, setShowParentalConsentOptions] = useState(false);
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const hasLoggedImpressionRef = useRef(false);

  useEffect(() => {
    async function load() {
      const shouldShowParentalConsentOptions = await getShowParentalConsentOptionsFeatureAccess();
      setShowParentalConsentOptions(shouldShowParentalConsentOptions);
    }
    load();
  }, []);

  useEffect(() => {
    if (!open) {
      hasLoggedImpressionRef.current = false;
      return;
    }
    if (hasLoggedImpressionRef.current) {
      return;
    }
    hasLoggedImpressionRef.current = true;
    unifiedLogger.logImpressionEvent({
      eventName: CreatorDashboardEventType.EstablishTrustDialog,
      parameters: {
        source,
        ...(universeId !== undefined && { universeId: universeId.toString() }),
      },
    });
  }, [open, source, universeId, unifiedLogger]);

  const handleViewDetailsClick = useCallback(() => {
    unifiedLogger.logClickEvent({
      eventName: CreatorDashboardEventType.EstablishTrustDialogClick,
      parameters: {
        source,
        action: 'viewDetails',
        ...(universeId !== undefined && { universeId: universeId.toString() }),
      },
    });
    onAddTrustedFriends();
  }, [unifiedLogger, source, universeId, onAddTrustedFriends]);

  const handleAskParentClick = useCallback(() => {
    unifiedLogger.logClickEvent({
      eventName: CreatorDashboardEventType.EstablishTrustDialogClick,
      parameters: {
        source,
        action: 'askParent',
        ...(universeId !== undefined && { universeId: universeId.toString() }),
      },
    });
    onAskParent();
  }, [unifiedLogger, source, universeId, onAskParent]);

  const handleDismissClick = useCallback(() => {
    unifiedLogger.logClickEvent({
      eventName: CreatorDashboardEventType.EstablishTrustDialogClick,
      parameters: {
        source,
        action: 'dismiss',
        ...(universeId !== undefined && { universeId: universeId.toString() }),
      },
    });
    onClose();
  }, [unifiedLogger, source, universeId, onClose]);

  return (
    <Dialog open={open} maxWidth='XLarge'>
      <DialogTitle>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
          <Typography variant='h1'>{translate('Title.AddTrustedFriendsDialog')}</Typography>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginLeft: '16px' }}>
            <IconButton
              onClick={handleDismissClick}
              size='small'
              aria-label={translate('Action.CloseDialog')}
              color='inherit'>
              <CloseIcon color='inherit' />
            </IconButton>
          </div>
        </div>
      </DialogTitle>
      <DialogContent>
        <DialogContentText id='dialog-content-text-describe-id'>
          <Typography variant='body1'>
            {showParentalConsentOptions
              ? translate('Label.CollaborateOutsideAgeGroupWithParent2')
              : translate('Label.CollaborateOutsideAgeGroup2')}
          </Typography>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          size='large'
          variant='contained'
          aria-label={translate('Action.ViewDetails')}
          onClick={handleViewDetailsClick}>
          {translate('Action.ViewDetails')}
        </Button>
        {showParentalConsentOptions && (
          <Button
            size='large'
            variant='outlined'
            aria-label={translate('Action.AskParent')}
            color='secondary'
            onClick={handleAskParentClick}>
            {translate('Action.AskParent')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default withTranslation(EstablishTrustDialog, [TranslationNamespace.Creations]);
