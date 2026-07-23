import React, { FC } from 'react';
import { useTranslation } from '@rbx/intl';
import { Button, Grid, RobuxIcon } from '@rbx/ui';
import useAvatarCreationTokenStyles from './Styles/AvatarCreationTokenStyles.styles';

export type TSubmitButtonComponentProps = {
  clickFunction: () => void;
  disabled: boolean;
  loading: boolean;
  price?: number | undefined;
};

const SubmitButtonComponent: FC<React.PropsWithChildren<TSubmitButtonComponentProps>> = ({
  clickFunction,
  disabled,
  loading,
  price,
}) => {
  const {
    classes: { submitButton },
  } = useAvatarCreationTokenStyles();
  const { translate } = useTranslation();
  const CreateJsx =
    price === undefined ? (
      <div />
    ) : (
      <Grid alignItems='center' container>
        {translate('Action.CreateToken', { price: '' })}
        <RobuxIcon style={{ margin: '0px 5px 0px 10px' }} />
        {price.toLocaleString()}
      </Grid>
    );

  return (
    <Button
      data-testid='save-button'
      variant='contained'
      size='large'
      disabled={disabled}
      className={submitButton}
      loading={loading}
      onClick={() => clickFunction()}>
      {price !== undefined ? CreateJsx : translate('Action.SaveChanges')}
    </Button>
  );
};

export default SubmitButtonComponent;
