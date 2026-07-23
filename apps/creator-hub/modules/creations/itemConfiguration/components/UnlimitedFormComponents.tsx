import React from 'react';
import { useTranslation } from '@rbx/intl';
import { Button, Typography } from '@rbx/ui';
import useItemConfigureFormStyles from './ItemConfigureForm.styles';

function CreatorEarningsMessage({
  creatorEarningsPercentage,
}: {
  creatorEarningsPercentage: number;
}) {
  const {
    classes: { earningMessage },
  } = useItemConfigureFormStyles();
  const { translate } = useTranslation();
  return (
    <Typography variant='body2' color='secondary' className={earningMessage}>
      {translate('Message.CreatorEarnings', {
        percentage: `${creatorEarningsPercentage}%`,
      })}
    </Typography>
  );
}

function SaveConfigurationButton({
  clickFunction,
  disabled,
  loading,
  isPublish,
}: {
  clickFunction: () => void;
  disabled: boolean;
  loading: boolean;
  isPublish: boolean;
}) {
  const {
    classes: { submitButton },
  } = useItemConfigureFormStyles();
  const { translate } = useTranslation();
  return (
    <Button
      data-testid='save-button'
      variant='contained'
      size='large'
      disabled={disabled}
      className={submitButton}
      loading={loading}
      onClick={() => clickFunction()}>
      {isPublish ? translate('Action.Publish') : translate('Action.SaveChanges')}
    </Button>
  );
}

export { CreatorEarningsMessage, SaveConfigurationButton };
