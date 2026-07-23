import React, { FunctionComponent } from 'react';
import Router from 'next/router';
import { IconButton } from '@rbx/ui';
import { Icon } from '@rbx/foundation-ui';
import useProductUrls from '../../utils/useProductUrls';
import { TUser } from '../../types';
import { ASSISTANT_PRODUCTS } from '../constants';
import useNavigationConfigs from '../../hooks/useNavigationConfigs';

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
