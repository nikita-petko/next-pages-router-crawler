import Router from 'next/router';
import type { FunctionComponent } from 'react';
import React from 'react';
import { Icon } from '@rbx/foundation-ui';
import { IconButton } from '@rbx/ui';
import useNavigationConfigs from '../../hooks/useNavigationConfigs';
import type { TUser } from '../../types';
import useProductUrls from '../../utils/useProductUrls';
import { ASSISTANT_PRODUCTS } from '../constants';

export interface AssistantTabProps {
  user: TUser;
}

const Assistant: FunctionComponent<AssistantTabProps> = ({ user }) => {
  const {
    Documentation: { assistant },
  } = useProductUrls();
  const { currentProduct } = useNavigationConfigs();

  if (!user || !ASSISTANT_PRODUCTS.includes(currentProduct)) {
    return null;
  }

  return (
    <IconButton
      color='secondary'
      size='medium'
      aria-label='Assistant Button'
      onClick={() => {
        Router.push(assistant);
      }}>
      <Icon name='icon-regular-nebula' />
    </IconButton>
  );
};

export default Assistant;
