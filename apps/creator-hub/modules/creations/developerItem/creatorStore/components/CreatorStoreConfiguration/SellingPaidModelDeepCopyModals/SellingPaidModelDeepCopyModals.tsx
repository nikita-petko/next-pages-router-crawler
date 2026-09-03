import type { FunctionComponent } from 'react';
import React, { Fragment, useCallback, useEffect, useReducer } from 'react';
import type { ErrorCode } from '@rbx/client-creator-asset-tooling-api/v1';
import { OperationStatus } from '@rbx/client-creator-asset-tooling-api/v1';
import type { CreatorType } from '@modules/miscellaneous/common';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import useCreatorAssetToolingDeepCopy from '../../../hooks/useCreatorAssetToolingDeepCopy';
import SellingPaidModelCopyingModal from './SellingPaidModelCopyingModal/SellingPaidModelCopyingModal';
import SellingPaidModelCopyModal from './SellingPaidModelCopyModal/SellingPaidModelCopyModal';
import SellingPaidModelCopyResultModal from './SellingPaidModelCopyResultModal/SellingPaidModelCopyResultModal';
import SellingPaidModelDependenciesModal from './SellingPaidModelDependenciesModal/SellingPaidModelDependenciesModal';

export type SellingPaidModelDeepCopyModalsProps = {
  assetId: number;
  assetName?: string;
  creator: { id: number; type: CreatorType };
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

interface ModalState {
  step: 'idle' | 'dependencies' | 'copyName' | 'copying' | 'result';
  status: OperationStatus | null;
  newAssetId: number | null;
  newModelName: string | null;
  errorDetails: ErrorCode[] | null;
}

type ModalAction =
  | { type: 'OPEN' } // When the 'open' prop becomes true
  | { type: 'RESET' } // When 'open' prop is false or flow is cancelled
  | { type: 'DEPENDENCIES_COPY' } // User clicked "Copy" on dependencies
  | { type: 'COPY_NAME_CANCEL' } // User clicked "Cancel" on copy name
  | { type: 'COPY_START'; payload: { newModelName: string } } // Async copy begins
  | {
      type: 'COPY_END';
      payload: {
        status: OperationStatus;
        newAssetId?: number | null;
        errorDetails?: ErrorCode[] | null;
      };
    }; // Async copy completed

const initialState: ModalState = {
  step: 'idle',
  status: null,
  newAssetId: null,
  newModelName: null,
  errorDetails: null,
};

function modalReducer(state: ModalState, action: ModalAction): ModalState {
  switch (action.type) {
    case 'OPEN':
      // When opened, always reset to the first step
      return { ...initialState, step: 'dependencies' };
    case 'RESET':
      // Sent by onCancel, onClose, or when 'open' prop is false
      return initialState;
    case 'DEPENDENCIES_COPY':
      return { ...state, step: 'copyName' };
    case 'COPY_NAME_CANCEL':
      // Go back to the dependencies modal
      return { ...state, step: 'dependencies' };
    case 'COPY_START':
      return {
        ...state,
        step: 'copying',
        newModelName: action.payload.newModelName,
      };
    case 'COPY_END':
      return {
        ...state,
        step: 'result',
        status: action.payload.status,
        newAssetId: action.payload.newAssetId ?? null,
        errorDetails: action.payload.errorDetails ?? null,
      };
    default:
      return state;
  }
}

const SellingPaidModelDeepCopyModals: FunctionComponent<
  React.PropsWithChildren<SellingPaidModelDeepCopyModalsProps>
> = ({ assetId, assetName, creator, open, onCancel, onConfirm }) => {
  const [state, dispatch] = useReducer(modalReducer, initialState);

  const { deepCopyAndWait } = useCreatorAssetToolingDeepCopy();

  useEffect(() => {
    if (open) {
      dispatch({ type: 'OPEN' });
    } else {
      dispatch({ type: 'RESET' });
    }
  }, [open]);

  const handleDependenciesCancel = useCallback(() => {
    dispatch({ type: 'RESET' });
    onCancel();
  }, [onCancel]);

  const handleDependenciesConfirm = useCallback(() => {
    dispatch({ type: 'RESET' });
    onConfirm();
  }, [onConfirm]);

  const handleDependenciesCopy = useCallback(() => {
    dispatch({ type: 'DEPENDENCIES_COPY' });
  }, []);

  const handleCopyModalCancel = useCallback(() => {
    dispatch({ type: 'COPY_NAME_CANCEL' });
  }, []);

  const handleStartDeepCopy = useCallback(
    async (modelName: string) => {
      dispatch({ type: 'COPY_START', payload: { newModelName: modelName } });
      try {
        const response = await deepCopyAndWait({
          sourceAssetId: assetId,
          destinationAssetName: modelName,
        });

        dispatch({
          type: 'COPY_END',
          payload: {
            status: response.status ?? OperationStatus.Failed,
            newAssetId: response.result?.destinationAssetId ?? null,
            errorDetails: response.parsedErrorCodes ?? null,
          },
        });
      } catch {
        dispatch({
          type: 'COPY_END',
          payload: { status: OperationStatus.Failed },
        });
      }
    },
    [assetId, deepCopyAndWait],
  );

  const handleResultClose = useCallback(() => {
    dispatch({ type: 'RESET' });
    onCancel();
  }, [onCancel]);

  return (
    <>
      <SellingPaidModelDependenciesModal
        assetId={assetId}
        assetName={assetName}
        creator={creator}
        open={state.step === 'dependencies'}
        onCancel={handleDependenciesCancel}
        onConfirm={handleDependenciesConfirm}
        onCopy={handleDependenciesCopy}
      />
      <SellingPaidModelCopyModal
        open={state.step === 'copyName'}
        defaultModelName={assetName}
        onCancel={handleCopyModalCancel}
        onStartCopy={handleStartDeepCopy}
      />
      <SellingPaidModelCopyingModal open={state.step === 'copying'} />
      <SellingPaidModelCopyResultModal
        open={state.step === 'result'}
        result={state.status}
        assetUrl={
          state.newAssetId ? dashboard.getConfigureCreatorStoreItemUrl(state.newAssetId) : undefined
        }
        errorDetails={state.errorDetails}
        onClose={handleResultClose}
      />
    </>
  );
};

export default SellingPaidModelDeepCopyModals;
