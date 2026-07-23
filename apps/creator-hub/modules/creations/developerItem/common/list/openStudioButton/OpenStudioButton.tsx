import type { FunctionComponent } from 'react';
import React, { useCallback, Fragment } from 'react';
import { useTranslation } from '@rbx/intl';
import type { TButtonProps } from '@rbx/ui';
import { Button, StudioIcon } from '@rbx/ui';
import useStudio, { EStudioTaskType } from '@modules/miscellaneous/hooks/useStudio';
import { creatorHub } from '@modules/miscellaneous/urls';

const OpenStudioButton: FunctionComponent<React.PropsWithChildren> = () => {
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
    <>
      <Button {...commonProps} onClick={handleOpenStudio}>
        {translate('Action.LaunchStudio')}
      </Button>
      {dialog}
    </>
  );
};

export default OpenStudioButton;
