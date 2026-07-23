import type { FunctionComponent } from 'react';
import React, { useCallback } from 'react';
import type { FormState } from 'react-hook-form';
import { HostType } from '@rbx/client-virtual-events-api/v1';
import { StatusCodes } from '@rbx/core';
import { withTranslation } from '@rbx/intl';
import { CircularProgress } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import useCurrentEvent from '../../hooks/useCurrentEvent';
import useUpdateEvent from '../../hooks/useUpdateEvent';
import ConfigureEventFormV2 from './ConfigureEventFormV2';
import type { CreateEventFormType } from './types';

const ConfigureEventContainer: FunctionComponent<React.PropsWithChildren> = () => {
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
