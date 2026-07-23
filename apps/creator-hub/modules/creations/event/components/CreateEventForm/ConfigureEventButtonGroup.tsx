import React, { FunctionComponent } from 'react';
import { useTranslation } from '@rbx/intl';
import { FormState } from 'react-hook-form';
import { Button } from '@rbx/ui';
import { VirtualEventDetails } from '@modules/clients/virtualEvents';
import { useRouter } from 'next/router';
import ButtonWithDisabledTooltip from '../controls/ButtonWithDisabledTooltip';
import DeleteEventButton from './DeleteEventButton';
import { CreateEventFormType } from './types';
import useConfigureEventFormStyles from './ConfigureEventFormV2.styles';
import {
  FieldErrorType,
  maximumEventDurationDays,
  minimumEventDurationMinutes,
} from '../common/constants';

export type ConfigureEventButtonGroupProps = {
  handlePublishButtonClick: () => void;
  formState: FormState<CreateEventFormType>;
  initialEventDetails?: VirtualEventDetails;
  isSubmitting: boolean;
  isUploadingThumbnail: boolean;
};

const ConfigureEventButtonGroup: FunctionComponent<
  React.PropsWithChildren<ConfigureEventButtonGroupProps>
> = ({
  handlePublishButtonClick,
  formState,
  initialEventDetails,
  isSubmitting,
  isUploadingThumbnail,
}) => {
  const { translate } = useTranslation();
  const router = useRouter();
  // isDirty: true if the form has been changed from its default or last published state
  const { errors, isValid, isValidating } = formState;
  const {
    classes: { buttonContainer },
  } = useConfigureEventFormStyles();

  const getPublishDisableTooltip = (): string => {
    if (errors.title) {
      if (errors.title.type === FieldErrorType.MaxLength) {
        return translate('Tooltip.EventNameTooLong');
      }
      if (errors.title.type === FieldErrorType.Required) {
        return translate('Tooltip.MissingFields');
      }
      return translate('Tooltip.InvalidEventName');
    }
    if (errors.subtitle) {
      if (errors.subtitle.type === FieldErrorType.MaxLength) {
        return translate('Tooltip.EventSubtitleTooLong');
      }
      if (errors.subtitle.type === FieldErrorType.Required) {
        return translate('Tooltip.MissingFields');
      }
      return translate('Tooltip.EEInvalidEventSubtitle');
    }
    if (errors.description) {
      if (errors.description.type === FieldErrorType.MaxLength) {
        return translate('Tooltip.EventDescriptionTooLong');
      }
      return translate('Tooltip.InvalidEventDescription');
    }
    if (errors.startTime) {
      if (errors.startTime.type === FieldErrorType.Required) {
        return translate('Tooltip.MissingFields');
      }
      return translate('Tooltip.InvalidEventStartTime');
    }
    if (errors.endTime) {
      if (errors.endTime.type === FieldErrorType.Min) {
        return translate('Error.EEDurationTooShort', {
          duration: `${minimumEventDurationMinutes}`,
        });
      }
      if (errors.endTime.type === FieldErrorType.Max) {
        return translate('Error.EEDurationTooLong', { duration: `${maximumEventDurationDays}` });
      }
      if (errors.endTime.type === FieldErrorType.Required) {
        return translate('Tooltip.MissingFields');
      }
      return translate('Tooltip.InvalidEventEndTime');
    }
    if (errors.secondaryEventType) {
      return translate('Tooltip.SameEventType');
    }
    if (errors.tagline) {
      if (errors.tagline.type === FieldErrorType.MaxLength) {
        return translate('Tooltip.EETaglineTooLong');
      }
      if (errors.tagline.type === FieldErrorType.Required) {
        return translate('Tooltip.MissingFields');
      }
      return translate('Tooltip.InvalidTagline');
    }
    if (isUploadingThumbnail) {
      return translate('Tooltip.EventThumbnailUploading');
    }
    if (!formState.isDirty) {
      return translate('Tooltip.SaveRequiresChanges');
    }
    return translate('Tooltip.MissingFields');
  };

  const getPublishButtonText = (): string => {
    if (!initialEventDetails?.id) {
      return translate('Action.Create');
    }
    return translate('Action.Update');
  };

  return (
    <div className={buttonContainer}>
      <Button
        data-testid='cancel-create-event-button'
        variant='text'
        color='primary'
        size='large'
        onClick={() => {
          router.push(`/dashboard/creations/experiences/${router.query.id}/events`);
        }}
        aria-label={translate('Action.Cancel')}>
        {translate('Action.Cancel')}
      </Button>
      {!!initialEventDetails?.id && <DeleteEventButton eventId={initialEventDetails.id} />}
      <ButtonWithDisabledTooltip
        data-testid='publish-event-button'
        variant='contained'
        size='large'
        disabled={(!isValidating && !isValid) || isUploadingThumbnail || !formState.isDirty}
        disabledButtonStyle={{ width: '100%' }}
        onClick={handlePublishButtonClick}
        aria-label={getPublishButtonText()}
        loading={isSubmitting}
        tooltipTitle={getPublishDisableTooltip()}>
        {getPublishButtonText()}
      </ButtonWithDisabledTooltip>
    </div>
  );
};

export default ConfigureEventButtonGroup;
