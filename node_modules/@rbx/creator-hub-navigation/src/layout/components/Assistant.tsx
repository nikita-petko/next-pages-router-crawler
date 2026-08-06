import type { FunctionComponent } from 'react';
import React from 'react';
import Router from 'next/router';
import { Icon } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { IconButton } from '@rbx/ui';
import { clickNavAssistantEventModel } from '../../event/eventConstants';
import useNavigationConfigs from '../../hooks/useNavigationConfigs';
import type { TUser } from '../../types';
import useProductUrls from '../../utils/useProductUrls';
import { ASSISTANT_PRODUCTS } from '../constants';

export interface AssistantTabProps {
  user: TUser;
}

const Assistant: FunctionComponent<AssistantTabProps> = ({ user }) => {
  const { translate } = useTranslation();
  const {
    Documentation: { assistant },
  } = useProductUrls();
  const {
    currentProduct,
    analyticsAssistantChatHref,
    analyticsAssistantChatUniverseId,
    sendEvent,
  } = useNavigationConfigs();

  if (!user) {
    return null;
  }

  // The analytics assistant chat entrypoint takes precedence over the legacy docs assistant when
  // its href is set. In practice they're mutually exclusive (analytics chat is experience-scoped /
  // CreatorDashboard, the docs assistant only shows for Documentation/Assistant products).
  if (analyticsAssistantChatHref == null && !ASSISTANT_PRODUCTS.includes(currentProduct)) {
    return null;
  }

  const onClick = () => {
    if (analyticsAssistantChatHref != null) {
      sendEvent(clickNavAssistantEventModel(analyticsAssistantChatUniverseId?.toString()));
      void Router.push(analyticsAssistantChatHref);
      return;
    }
    void Router.push(assistant);
  };

  return (
    <IconButton
      color='secondary'
      size='medium'
      aria-label={translate('Heading.Assistant')}
      onClick={onClick}>
      <Icon name='icon-regular-nebula' />
    </IconButton>
  );
};

export default Assistant;
