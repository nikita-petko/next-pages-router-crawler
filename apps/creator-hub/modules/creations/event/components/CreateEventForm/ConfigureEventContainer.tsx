import React, { FunctionComponent, useCallback } from 'react';
import { withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { CircularProgress } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import { HostType } from '@rbx/clients/virtualEventsApi';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import { ErrorPage } from '@modules/miscellaneous/error';
import { StatusCodes } from '@rbx/core';
import { FormState } from 'react-hook-form';
import useCurrentEvent from '../../hooks/useCurrentEvent';
import useUpdateEvent from '../../hooks/useUpdateEvent';
import ConfigureEventFormV2 from './ConfigureEventFormV2';
import { CreateEventFormType } from './types';

const ConfigureEventContainer: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const { eventDetails, isLoading, refreshEventDetails } = useCurrentEvent();
  const { user } = useAuthentication();
  const currentGroup = useCurrentGroup();
  const updateEvent = useUpdateEvent();

  const handleSaveOrPublish = useCallback(
    async (
      data: CreateEventFormType,
      formState: FormState<CreateEventFormType>,
      setErrorMsg: (error: string) => void,
    ) => {
      const result = await updateEvent(data, formState, setErrorMsg);
      refreshEventDetails();
      return result;
    },
    [refreshEventDetails, updateEvent],
  );

  if (isLoading) {
    return <CircularProgress data-testid='configure-event-container-loading' />;
  }

  if (!eventDetails?.id) {
    return <ErrorPage errorCode={StatusCodes.NOT_FOUND} />;
  }
  if (eventDetails?.host?.hostType === HostType.User && user?.id !== eventDetails?.host?.hostId) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }
  if (
    eventDetails?.host?.hostType === HostType.Group &&
    currentGroup?.id !== eventDetails?.host?.hostId
  ) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }
  if (!eventDetails.universeId) {
    return <ErrorPage errorCode={StatusCodes.NOT_FOUND} />;
  }

  return (
    <ConfigureEventFormV2
      universeId={eventDetails?.universeId || 0}
      initialEventDetails={eventDetails ?? undefined}
      onSaveOrPublish={handleSaveOrPublish}
    />
  );
};

export default withTranslation(ConfigureEventContainer, [
  TranslationNamespace.Creations,
  TranslationNamespace.Error,
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.AssetUpload,
]);
