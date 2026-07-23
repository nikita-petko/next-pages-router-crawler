import React, { FunctionComponent, useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { Button, Grid, Tooltip } from '@rbx/ui';
import useConfigureAttributesFormStyles from './ConfigureAttributesForm.styles';

export interface MatchmakingButtonGroupProps {
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  showDeleteButton: boolean;
  isSavingDisabled: boolean;
  isDeleteAllowed: boolean;
}

const MatchmakingButtonGroup: FunctionComponent<
  React.PropsWithChildren<MatchmakingButtonGroupProps>
> = ({ onSave, onCancel, onDelete, showDeleteButton, isDeleteAllowed, isSavingDisabled }) => {
  const {
    classes: { button, buttonContainer },
  } = useConfigureAttributesFormStyles();
  const { translate } = useTranslation();

  const deleteButton = useMemo(() => {
    return (
      <Button
        disabled={!isDeleteAllowed}
        variant='contained'
        aria-label={translate('Button.Delete')}
        color='destructive'
        onClick={onDelete}>
        {translate('Button.Delete')}
      </Button>
    );
  }, [isDeleteAllowed, onDelete, translate]);

  return (
    <Grid container className={buttonContainer} direction='row' justifyContent='space-between'>
      <Grid>
        <Button
          className={button}
          variant='outlined'
          aria-label={translate('Button.Cancel')}
          color='secondary'
          onClick={onCancel}>
          {translate('Button.Cancel')}
        </Button>
        <Button
          className={button}
          disabled={isSavingDisabled}
          variant='contained'
          aria-label={translate('Button.SaveChanges')}
          color='primaryBrand'
          onClick={onSave}>
          {translate('Button.SaveChanges')}
        </Button>
      </Grid>
      <Grid>
        {showDeleteButton &&
          (isDeleteAllowed ? (
            deleteButton
          ) : (
            <Tooltip title={translate('Tooltip.DeleteAttribute')} placement='top'>
              <span style={{ display: 'inline-block' }}>{deleteButton}</span>
            </Tooltip>
          ))}
      </Grid>
    </Grid>
  );
};

export default MatchmakingButtonGroup;
