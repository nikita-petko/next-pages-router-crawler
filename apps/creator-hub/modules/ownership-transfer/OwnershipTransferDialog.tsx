import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  CircularProgress,
  Divider,
  makeStyles,
} from '@rbx/ui';
import type { TransferCreator } from '@modules/clients/ownershipTransferApi';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  useAcceptTransfer,
  useCancelTransfer,
  useCreateTransfer,
  useRejectTransfer,
} from '@modules/react-query/ownershipTransfer/ownershipTransferQueries';
import useGetCurrentTransferStages from './hooks/useGetCurrentTransferStages';
import useShowTransferError from './hooks/useShowTransferError';
import useShowTransferSuccess from './hooks/useShowTransferSuccess';
import { useOwnershipTransferDialogInternalState } from './providers/OwnershipTransferDialogInternalStateProvider';
import type {
  TOwnershipTransferDialogVariant,
  TOwnershipTransferResource,
  TOwnershipTransferActions,
  TMutationStates,
} from './types';

type TOwnershipTransferDialogProps = {
  activeVariant: TOwnershipTransferDialogVariant | null;
  closeDialog: () => void;
  resource: TOwnershipTransferResource;
  currentCreator: TransferCreator;
  targetCreator?: TransferCreator;
};

const STAGE_CONTENT_GAP = 24;
const DIVIDER_GAP = 12;

const useStyles = makeStyles()(() => ({
  topDivider: {
    marginBottom: DIVIDER_GAP,
  },
  bottomDivider: {
    marginTop: DIVIDER_GAP,
  },
  contentContainer: {
    paddingBottom: 0,
  },
  stageContainer: {
    paddingTop: STAGE_CONTENT_GAP,
    paddingBottom: STAGE_CONTENT_GAP,
  },
  stageContainerWithoutDividers: {
    paddingTop: 0,
    paddingBottom: DIVIDER_GAP,
  },
  actionsContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  leftAlignedActionButton: {
    marginRight: 'auto',
  },
}));

const OwnershipTransferDialog: React.FC<TOwnershipTransferDialogProps> = ({
  activeVariant,
  closeDialog,
  resource,
  currentCreator,
  targetCreator,
}) => {
  const {
    classes: {
      topDivider,
      bottomDivider,
      contentContainer,
      stageContainer,
      stageContainerWithoutDividers,
      actionsContainer,
      leftAlignedActionButton,
    },
  } = useStyles();

  const showTransferError = useShowTransferError();
  const showTransferSuccess = useShowTransferSuccess();

  const { translate } = useTranslation();
  const { mutate: createTransfer, isPending: isCreatingTransfer } = useCreateTransfer();
  const { mutate: acceptTransfer, isPending: isAcceptingTransfer } = useAcceptTransfer();
  const { mutate: rejectTransfer, isPending: isRejectingTransfer } = useRejectTransfer();
  const { mutate: cancelTransfer, isPending: isCancelingTransfer } = useCancelTransfer();

  const [currentStageIndex, setCurrentStageIndex] = useState<number>(0);

  const state = useOwnershipTransferDialogInternalState();
  const flowStages = useGetCurrentTransferStages(activeVariant, resource);

  const { resetState, selectedRecipient } = state;

  const mutationStates: TMutationStates = {
    isCreatingTransfer,
    isAcceptingTransfer,
    isRejectingTransfer,
    isCancelingTransfer,
  };

  const resetDialogState = useCallback(() => {
    setCurrentStageIndex(0);
    resetState();
  }, [setCurrentStageIndex, resetState]);

  const shouldBeOpen = !!activeVariant;

  useEffect(() => {
    if (!shouldBeOpen) {
      resetDialogState();
    }
  }, [shouldBeOpen, resetDialogState]);

  if (!flowStages) {
    return shouldBeOpen ? <CircularProgress /> : undefined;
  }

  const currentStage = flowStages[currentStageIndex];

  if (!currentStage) {
    return null;
  }

  const actions: TOwnershipTransferActions = {
    closeDialog: () => {
      closeDialog();
      resetDialogState();
    },
    goNextStage: () => setCurrentStageIndex((prevIndex) => prevIndex + 1),
    goPreviousStage: () => setCurrentStageIndex((prevIndex) => prevIndex - 1),
    cancelTransfer: () => {
      cancelTransfer(resource, {
        onSuccess: () => {
          showTransferSuccess('cancelTransfer');
          closeDialog();
          resetDialogState();
        },
        onError: () => {
          showTransferError('cancelTransfer');
        },
      });
    },
    createTransfer: () => {
      if (!selectedRecipient) {
        return;
      }
      createTransfer(
        {
          currentCreator,
          targetCreator: selectedRecipient,
          resource: {
            resourceId: resource.resourceId,
            resourceType: resource.resourceType,
          },
        },
        {
          onSuccess: () => {
            showTransferSuccess('createTransfer');
            closeDialog();
            resetDialogState();
          },
          onError: () => {
            showTransferError('createTransfer');
          },
        },
      );
    },
    declineTransfer: () => {
      rejectTransfer(
        { resourceId: resource.resourceId, resourceType: resource.resourceType },
        {
          onSuccess: () => {
            showTransferSuccess('rejectTransfer');
            closeDialog();
            resetDialogState();
          },
          onError: () => {
            showTransferError('rejectTransfer');
          },
        },
      );
    },
    acceptTransfer: () => {
      acceptTransfer(
        { resourceId: resource.resourceId, resourceType: resource.resourceType },
        {
          onSuccess: () => {
            showTransferSuccess('acceptTransfer');
            closeDialog();
            resetDialogState();
          },
          onError: () => {
            showTransferError('acceptTransfer');
          },
        },
      );
    },
  };

  const StageComponent = currentStage?.component;
  const showDividers = !currentStage?.hideDividers;

  const buttons = currentStage?.actions.filter((action) => !action.shouldHide?.(state));

  return (
    <Dialog
      data-testid='ownershipTransferDialog'
      open={shouldBeOpen}
      onClose={() => {
        actions.closeDialog();
      }}>
      <DialogTitle>
        {translate(currentStage.titleKey, { gameName: resource.resourceName })}
      </DialogTitle>
      <DialogContent className={contentContainer}>
        {showDividers && <Divider className={topDivider} />}
        {StageComponent && (
          <div className={showDividers ? stageContainer : stageContainerWithoutDividers}>
            <StageComponent
              resource={resource}
              variant={activeVariant}
              currentCreator={currentCreator}
              targetCreator={targetCreator}
            />
          </div>
        )}
        {showDividers && <Divider className={bottomDivider} />}
      </DialogContent>
      <DialogActions className={actionsContainer}>
        {buttons.map(({ label, onClick, disabled, isLoading, color, variant }, i) => {
          const leftAlign = buttons.length === 3 && i === 0;
          const size = buttons.length >= 3 ? 'small' : 'medium';

          return (
            <Button
              className={leftAlign ? leftAlignedActionButton : undefined}
              key={label}
              onClick={() => onClick(actions)}
              disabled={disabled?.(state, mutationStates)}
              loading={isLoading?.(mutationStates) || false}
              variant={variant}
              color={color}
              size={size}>
              {translate(label)}
            </Button>
          );
        })}
      </DialogActions>
    </Dialog>
  );
};

export default withTranslation(OwnershipTransferDialog, [TranslationNamespace.OwnershipTransfer]);
