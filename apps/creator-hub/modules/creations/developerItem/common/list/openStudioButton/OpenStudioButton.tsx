import React, { FunctionComponent, useCallback, Fragment } from 'react';
import { Button, StudioIcon, TButtonProps } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import useStudio, { EStudioTaskType } from '@modules/miscellaneous/hooks/useStudio';
import { creatorHub } from '@modules/miscellaneous/common/urls';

const OpenStudioButton: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const { translate } = useTranslation();
  const { isCompatible, open, dialog } = useStudio();

  const handleOpenStudio = useCallback(() => {
    open({ task: EStudioTaskType.Default });
  }, [open]);

  const commonProps: Pick<TButtonProps, 'size' | 'color' | 'variant' | 'startIcon'> = {
    size: 'medium',
    color: 'primary',
    variant: 'contained',
    startIcon: <StudioIcon />,
  };

  if (!isCompatible) {
    return (
      <Button {...commonProps} href={creatorHub.docs.getSettingUpStudioUrl()} component='a'>
        {translate('Action.LaunchStudio')}
      </Button>
    );
  }

  return (
    <Fragment>
      <Button {...commonProps} onClick={handleOpenStudio}>
        {translate('Action.LaunchStudio')}
      </Button>
      {dialog}
    </Fragment>
  );
};

export default OpenStudioButton;
