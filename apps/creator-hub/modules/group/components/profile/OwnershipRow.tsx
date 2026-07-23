import React, { FunctionComponent, useMemo, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Grid,
  makeStyles,
  AlertTitle,
  Alert,
  IconButton,
  CloseIcon,
  EditOutlinedIcon,
} from '@rbx/ui';
import { User } from '@modules/clients';
import { useAuthentication } from '@modules/authentication/providers';
import { DebouncedTextField } from '@modules/charts-generic';
import { CreatorType } from '@modules/miscellaneous/common';
import { ThumbnailWithNames } from '@modules/miscellaneous/common/components';
import { findGroupMemberByUsername } from '../../utils/groupUtils';

const useOwnershipRowStyles = makeStyles()(() => ({
  textfieldContainer: {
    marginTop: 24,
  },

  alertContainer: {
    marginTop: 16,
    width: '100%',
  },
}));

export interface OwnershipRowProps {
  value: User;
  groupId: number;
  onChange: (user: User | null) => void;
  disabled?: boolean;
}

const OwnershipRow: FunctionComponent<React.PropsWithChildren<OwnershipRowProps>> = ({
  value,
  groupId,
  onChange,
  disabled = false,
}) => {
  const { translate } = useTranslation();
  const { user } = useAuthentication();

  const {
    classes: { textfieldContainer, alertContainer },
  } = useOwnershipRowStyles();

  const [transferring, setTransferring] = useState<boolean>(false);
  const [transferError, setTransferError] = useState<boolean>(false);

  const handleOwnerChange = async (username: string) => {
    const groupMember = await findGroupMemberByUsername(groupId, username);

    onChange(groupMember);
    setTransferError(!groupMember);
  };

  const ownershipAdornment = useMemo(() => {
    if (user?.id !== value.id) return undefined;

    return (
      <Grid item>
        <IconButton
          aria-label={translate('Title.OwnershipTransfer')}
          data-testid='ownership-row-v1'
          size='large'
          color='inherit'
          onClick={() => {
            setTransferring((prevTransferring) => {
              if (!prevTransferring) {
                setTransferError(false);
                onChange(null);
              }

              return !prevTransferring;
            });
          }}
          disabled={disabled}>
          {transferring ? <CloseIcon /> : <EditOutlinedIcon />}
        </IconButton>
      </Grid>
    );
  }, [user, transferring, setTransferring, disabled, onChange, translate, value.id]);

  return (
    <Grid container>
      <ThumbnailWithNames
        target={value}
        targetType={CreatorType.User}
        adornment={ownershipAdornment}
      />

      {transferring && (
        <Grid container className={textfieldContainer}>
          <DebouncedTextField
            variant='outlined'
            size='small'
            error={transferError}
            fullWidth
            id='username'
            debounceTime={300}
            label={translate('Label.NewGroupOwner')}
            helperText={transferError ? translate('Error.InvalidOwner') : undefined}
            disabled={disabled}
            onDebouncedChange={handleOwnerChange}
          />
          <Alert severity='warning' variant='standard' className={alertContainer}>
            <AlertTitle>{translate('Title.OwnershipTransfer')}</AlertTitle>
            {translate('Message.OwnershipTransfer')}
          </Alert>
        </Grid>
      )}
    </Grid>
  );
};

export default OwnershipRow;
