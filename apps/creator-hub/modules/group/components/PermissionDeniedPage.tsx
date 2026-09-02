import React, { useEffect } from 'react';
import { StatusCodes } from '@rbx/core';
import { useTranslation } from '@rbx/intl';
import { ErrorPage } from '@modules/miscellaneous/error';
import useBottomToast from '../hooks/useBottomToast';

const PermissionDeniedPage = () => {
  const { showBottomToast } = useBottomToast();
  const { translate } = useTranslation();

  useEffect(() => {
    showBottomToast(translate('Error.ContactForAccess'), {
      severity: 'info',
    });
  }, [showBottomToast, translate]);

  return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
};

export default PermissionDeniedPage;
