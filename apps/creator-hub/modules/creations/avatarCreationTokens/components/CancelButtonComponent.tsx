import React from 'react';
import { useTranslation } from '@rbx/intl';
import { Button } from '@rbx/ui';
import useAvatarCreationTokenStyles from './Styles/AvatarCreationTokenStyles.styles';

function CancelButtonComponent({
  clickFunction,
  disabled,
  loading,
}: {
  clickFunction: () => void;
  disabled: boolean;
  loading: boolean;
}) {
  const {
    classes: { submitButton },
  } = useAvatarCreationTokenStyles();
  const { translate } = useTranslation();
  return (
    <Button
      color='secondary'
      data-testid='cancel-button'
      variant='contained'
      size='large'
      disabled={disabled}
      className={submitButton}
      loading={loading}
      onClick={() => clickFunction()}>
      {translate('Action.Cancel')}
    </Button>
  );
}

export default CancelButtonComponent;
