import React from 'react';
import type { TButtonProps } from '@rbx/ui';
import OwnershipTransferAcknowledgeExpiredTransfer from './components/OwnershipTransferAcknowledgeExpiredTransfer';
import OwnershipTransferCancelledTransfer from './components/OwnershipTransferCancelledTransfer';
import OwnershipTransferCancelTransfer from './components/OwnershipTransferCancelTransfer';
import OwnershipTransferDisclaimerContent from './components/OwnershipTransferDisclaimerContent';
import OwnershipTransferEligibilityStage from './components/OwnershipTransferEligibilityStage';
import OwnershipTransferInitiateTransferStage from './components/OwnershipTransferInitiateTransferStage';
import OwnershipTransferReceivedRequest from './components/OwnershipTransferReceivedRequest';
import OwnershipTransferVerification from './components/OwnershipTransferVerification';
import type { TOwnershipTransferDialogInternalState } from './providers/OwnershipTransferDialogInternalStateProvider';
import type {
  TOwnershipTransferDialogStages,
  TOwnershipTransferDialogVariant,
  TSupportedOwnershipTransferResourceTypes,
  TOwnershipTransferActions,
  TOwnershipTransferStageInfo,
  TMutationStates,
} from './types';
import { type TModalStageComponentProps } from './types';

export type TModalFlows = {
  [resource in TSupportedOwnershipTransferResourceTypes]?: {
    [flow in TOwnershipTransferDialogVariant]?: {
      stages: Array<TModalFlowStage>;
    };
  };
};

type TModalAction = {
  label: string;
  onClick: (actions: TOwnershipTransferActions) => void;
  disabled?: (
    componentState: TOwnershipTransferDialogInternalState,
    mutationStates: TMutationStates,
  ) => boolean;
  shouldHide?: (componentState: TOwnershipTransferDialogInternalState) => boolean;
  isLoading?: (mutationStates: TMutationStates) => boolean;
  variant: TButtonProps['variant'];
  color: TButtonProps['color'];
};

export type TModalFlowStage = {
  key: TOwnershipTransferDialogStages;
  // The dialog's title for this stage
  titleKey: string;
  // The component to render for the given stage
  component: React.ComponentType<TModalStageComponentProps>;
  // The dialog buttons
  actions: Array<TModalAction>;
  // Allow some stages to be conditionally rendered
  shouldRender?: (stageDetails: TOwnershipTransferStageInfo) => boolean;
  // Some stages should not show dividers between the title and actions
  hideDividers?: boolean;
};

const transferDetailsTitleKey = 'Title.TransferDetails';
const transferPrerequisitesTitleKey = 'Title.TransferPrerequisites';
const expiredTransferTitleKey = 'Heading.RequestExpired';
const cancelledTransferTitleKey = 'Title.RequestCancelledForRecipient';
const receivedRequestTitleKey = 'Title.RequestToOwn';

const cancelButtonDefaultProps: TModalAction = {
  label: 'Action.Cancel',
  onClick: (actions) => actions.closeDialog(),
  variant: 'contained',
  color: 'secondary',
};

const backButtonDefaultProps: TModalAction = {
  label: 'Action.Back',
  onClick: (actions) => actions.goPreviousStage(),
  variant: 'contained',
  color: 'secondary',
};

const nextButtonDefaultProps: TModalAction = {
  label: 'Action.Next',
  onClick: (actions) => actions.goNextStage(),
  variant: 'contained',
  color: 'primaryBrand',
};

const initiateTransferButtonDefaultProps: TModalAction = {
  label: 'Action.InitiateTransfer',
  onClick: (actions) => actions.createTransfer(),
  isLoading: (mutationStates) => mutationStates.isCreatingTransfer,
  variant: 'contained',
  color: 'primaryBrand',
};

const declineTransferButtonDefaultProps: TModalAction = {
  label: 'Action.DeclineTransfer',
  onClick: (actions) => actions.declineTransfer(),
  isLoading: (mutationStates) => mutationStates.isRejectingTransfer,
  variant: 'outlined',
  color: 'destructive',
};

const acceptTransferButtonDefaultProps: TModalAction = {
  label: 'Action.AcceptTransfer',
  onClick: (actions) => actions.acceptTransfer(),
  isLoading: (mutationStates) => mutationStates.isAcceptingTransfer,
  variant: 'contained',
  color: 'primaryBrand',
};

const cancelTransferButtonDefaultProps: TModalAction = {
  label: 'Action.Confirm',
  onClick: (actions) => actions.cancelTransfer(),
  isLoading: (mutationStates) => mutationStates.isCancelingTransfer,
  variant: 'contained',
  color: 'destructive',
};

const eligibilityStage: TModalFlowStage = {
  key: 'Eligibility',
  shouldRender: (details) => !!details?.wasIneligible,
  titleKey: transferPrerequisitesTitleKey,
  component: OwnershipTransferEligibilityStage,
  hideDividers: true,
  actions: [
    { ...declineTransferButtonDefaultProps },
    {
      ...cancelButtonDefaultProps,
      label: 'Action.RemindMeLater',
      shouldHide: (componentState) => componentState.isResourceEligible,
    },
    {
      ...nextButtonDefaultProps,
      shouldHide: (componentState) => !componentState.isResourceEligible,
    },
  ],
};

const modalFlows: TModalFlows = {
  Group: {
    Initiate: {
      stages: [
        {
          ...eligibilityStage,
        },
        {
          key: 'Disclaimer',
          titleKey: transferDetailsTitleKey,
          component: OwnershipTransferDisclaimerContent,
          actions: [
            {
              ...cancelButtonDefaultProps,
            },
            {
              ...nextButtonDefaultProps,
              disabled: (componentState) => !componentState.isDisclaimerStepValid,
            },
          ],
        },
        {
          key: 'OwnerVerification',
          titleKey: transferDetailsTitleKey,
          component: OwnershipTransferInitiateTransferStage,
          actions: [
            {
              ...backButtonDefaultProps,
            },
            {
              ...initiateTransferButtonDefaultProps,
              isLoading: (mutationStates) => mutationStates.isCreatingTransfer,
              disabled: (componentState) =>
                !componentState.isVerificationValid || !componentState.isOwnerSelectionValid,
            },
          ],
        },
      ],
    },
    Receive: {
      stages: [
        {
          ...eligibilityStage,
        },
        {
          key: 'ReceiveRequest',
          titleKey: receivedRequestTitleKey,
          component: OwnershipTransferReceivedRequest,
          hideDividers: true,
          actions: [
            { ...cancelButtonDefaultProps, label: 'Action.RemindMeLater' },
            { ...nextButtonDefaultProps },
          ],
        },
        {
          key: 'Disclaimer',
          titleKey: transferDetailsTitleKey,
          component: OwnershipTransferDisclaimerContent,
          actions: [
            {
              ...backButtonDefaultProps,
            },
            {
              ...nextButtonDefaultProps,
              disabled: (componentState) => !componentState.isDisclaimerStepValid,
            },
          ],
        },
        {
          key: 'OwnerVerification',
          titleKey: transferDetailsTitleKey,
          component: OwnershipTransferVerification,
          actions: [
            {
              ...backButtonDefaultProps,
            },
            {
              ...declineTransferButtonDefaultProps,
              disabled: (_, mutationStates) => mutationStates.isAcceptingTransfer,
            },
            {
              ...acceptTransferButtonDefaultProps,
              disabled: (componentState, mutationStates) =>
                !componentState.isVerificationValid || mutationStates.isRejectingTransfer,
            },
          ],
        },
      ],
    },
    Cancel: {
      stages: [
        {
          key: 'Cancel',
          titleKey: transferDetailsTitleKey,
          hideDividers: true,
          component: OwnershipTransferCancelTransfer,
          actions: [
            {
              ...cancelButtonDefaultProps,
              label: 'Action.Close',
            },
            {
              ...cancelTransferButtonDefaultProps,
            },
          ],
        },
      ],
    },
    Timedout: {
      stages: [
        {
          key: 'Timedout',
          titleKey: expiredTransferTitleKey,
          hideDividers: true,
          component: OwnershipTransferAcknowledgeExpiredTransfer,
          actions: [
            {
              ...cancelButtonDefaultProps,
              label: 'Action.Close',
            },
          ],
        },
      ],
    },
    Cancelled: {
      stages: [
        {
          key: 'Cancelled',
          titleKey: cancelledTransferTitleKey,
          hideDividers: true,
          component: OwnershipTransferCancelledTransfer,
          actions: [
            {
              ...cancelButtonDefaultProps,
              label: 'Action.Close',
            },
          ],
        },
      ],
    },
  },
};
export default modalFlows;
