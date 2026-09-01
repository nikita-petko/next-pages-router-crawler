import type { FunctionComponent } from 'react';
import React, { useCallback } from 'react';
import type { NotificationButton } from '@rbx/client-creator-notification-streams-api/v1';
import { Button, Snackbar } from '@rbx/foundation-ui';
import useSendNotificationCtaRequest from '../../queries/useSendNotificationCtaRequest';
import useLaunchStudioAction from '../hooks/useLaunchStudioAction';

type TNotificationCtaButtonProps = {
  button: NotificationButton;
};

const NotificationCtaButton: FunctionComponent<TNotificationCtaButtonProps> = ({ button }) => {
  const { action, httpRequest, timeoutMs, buttonText, successText, errorText } = button;

  const launchStudioAction = useLaunchStudioAction();
  const { mutate, reset, isPending, isSuccess, isError } = useSendNotificationCtaRequest();

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      // The notification card may be wrapped in a link; keep the click local.
      event.stopPropagation();
      event.preventDefault();
      // Assumes only one of httpRequest and action is provided
      if (httpRequest) {
        // A GET request is a plain redirect to its URL, like the notification's clickAction;
        // all other button fields are ignored in this flow.
        if (httpRequest.method.toLowerCase() === 'get') {
          window.open(httpRequest.url, '_self');
          return;
        }
        // Otherwise, fire HTTP request in background
        mutate({ httpRequest, timeoutMs });
      } else if (action) {
        launchStudioAction(action);
      }
    },
    [action, launchStudioAction, httpRequest, timeoutMs, mutate],
  );

  return (
    <>
      <Button
        variant='Standard'
        size='Small'
        className='grow basis-0'
        isLoading={isPending}
        onClick={handleClick}>
        {buttonText}
      </Button>
      {/* Note that clicking the Snackbar will trigger notification click action
        if one exists, but we assume that click action and CTA buttons are mutually exclusive */}
      {isSuccess && successText ? (
        <Snackbar title={successText} shouldAutoDismiss onClose={reset} />
      ) : null}
      {isError && errorText ? (
        <Snackbar title={errorText} shouldAutoDismiss onClose={reset} />
      ) : null}
    </>
  );
};

NotificationCtaButton.displayName = 'NotificationCtaButton';

export default NotificationCtaButton;
