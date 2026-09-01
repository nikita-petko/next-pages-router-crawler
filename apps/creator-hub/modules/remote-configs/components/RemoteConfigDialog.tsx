import React, { Fragment, useCallback, useMemo } from 'react';
import type { DeploymentStrategy } from '../api/universeConfigsClientEnums';
import type { ConfigActionError } from '../hooks/useConfigsMutation';
import type { TSnippetGenerationFunction } from '../utils/generateSnippet';
import type { CreateOrEditResult, EditDialogProps } from './CreateOrEditDialog';
import CreateOrEditDialog from './CreateOrEditDialog';
import PublishDialog from './PublishDialog';
import SnippetDialog from './SnippetDialog';

export type RemoteConfigDialogState =
  | null
  | { type: 'create' }
  | ({ type: 'edit' } & EditDialogProps)
  | ({ type: 'snippet' } & CreateOrEditResult)
  | { type: 'publish'; draftCount: number; deploymentStrategy: DeploymentStrategy };

type RemoteConfigDialogProps = {
  state: RemoteConfigDialogState;
  setState: (spec: RemoteConfigDialogState) => void;
  onCreateOrEditSucceeded: () => void;
  onPublish: ({
    message,
    deploymentStrategy,
    onSuccess,
    onError,
  }: {
    message: string;
    deploymentStrategy: DeploymentStrategy;
    onSuccess: (data: { draftHash?: string }) => void;
    onError: (error: ConfigActionError) => void;
  }) => Promise<void>;
  onCopySnippet: TSnippetGenerationFunction;
};
const RemoteConfigDialog = ({
  state: dialogState,
  setState: setDialogState,
  onCreateOrEditSucceeded,
  onPublish: onGivenPublish,
  onCopySnippet: onCopySnippetProp,
}: RemoteConfigDialogProps) => {
  const createOrEditDialog = useMemo(() => {
    const isCreate = dialogState?.type === 'create';
    const isEdit = dialogState?.type === 'edit';
    const isOpen = isCreate || isEdit;
    const onClose = (result: CreateOrEditResult) => {
      if (result) {
        if (isCreate) {
          setDialogState({ type: 'snippet', ...result });
        } else {
          setDialogState(null);
        }
        onCreateOrEditSucceeded();
      } else {
        setDialogState(null);
      }
    };
    const givenEditSpec = isEdit ? dialogState : undefined;
    return <CreateOrEditDialog open={isOpen} onClose={onClose} edit={givenEditSpec} />;
  }, [dialogState, onCreateOrEditSucceeded, setDialogState]);

  const snippetDialog = useMemo(() => {
    if (dialogState?.type !== 'snippet') {
      return null;
    }
    const onClose = () => setDialogState(null);
    const onCopySnippet = () => {
      onCopySnippetProp(dialogState.configKey);
    };
    return <SnippetDialog open {...dialogState} onClose={onClose} onCopySnippet={onCopySnippet} />;
  }, [dialogState, onCopySnippetProp, setDialogState]);

  const onPublish = useCallback(
    ({
      description,
      onSuccess,
      onError,
    }: {
      description: string;
      onSuccess: (data: { draftHash?: string }) => void;
      onError: (error: ConfigActionError) => void;
    }) => {
      if (dialogState?.type !== 'publish') {
        throw new Error('onPublish should only get called from publish dialog');
      }
      return onGivenPublish({
        message: description,
        deploymentStrategy: dialogState.deploymentStrategy,
        onSuccess,
        onError,
      });
    },
    [dialogState, onGivenPublish],
  );

  const publishDialog = useMemo(() => {
    if (dialogState?.type !== 'publish') {
      return null;
    }

    const onCancel = () => setDialogState(null);
    const onPublishSucceedWrapper = () => {
      setDialogState(null);
    };

    return (
      <PublishDialog
        open
        onCancel={onCancel}
        onPublish={onPublish}
        onPublishSucceed={onPublishSucceedWrapper}
        stagedCount={dialogState.draftCount}
      />
    );
  }, [dialogState, onPublish, setDialogState]);

  return (
    <>
      {createOrEditDialog}
      {publishDialog}
      {snippetDialog}
    </>
  );
};
export default RemoteConfigDialog;
