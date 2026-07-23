import { Fragment, memo, useEffect } from 'react';
import { FormHelperText, Button, Chip, Avatar } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { User } from '@modules/clients';
import { Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import DebouncedUserSearch from '@modules/payouts/components/DebouncedUserSearch';
import { useController, useFormContext } from 'react-hook-form';
import { MAX_USERS, USER_SEARCH_DEBOUNCE_TIME_MS } from './constants';
import usePriceValidationFormStyles from './PriceValidationForm.styles';
import { PriceValidationFormValues } from './types';
import { priceValidationSchema } from './schemas';

type AccountsSelectionProps = {
  disabled?: boolean;
};

function AccountsSelection({ disabled }: AccountsSelectionProps) {
  const { translate } = useTranslation();
  const { classes } = usePriceValidationFormStyles();

  const {
    field: { value: selectedUsers, onChange },
  } = useController<PriceValidationFormValues, 'users'>({
    name: 'users',
    rules: priceValidationSchema.users,
  });

  // NOTE(jeminpark, 20250416): This is a workaround for async default value initialization not
  // automatically validating via controller rules
  const { trigger } = useFormContext<PriceValidationFormValues>();
  const isUsersFieldInitialized = selectedUsers !== undefined;
  useEffect(() => {
    if (isUsersFieldInitialized) {
      trigger();
    }
  }, [trigger, isUsersFieldInitialized]);

  const handleSelectUser = (user?: User) => {
    if (
      user &&
      isUsersFieldInitialized &&
      selectedUsers.length < MAX_USERS &&
      !selectedUsers.some((u) => u.id === user.id)
    ) {
      onChange([...selectedUsers, user]);
    }
  };

  const handleRemoveUser = (userId: number) => {
    const updatedUsers = selectedUsers.filter((user) => user.id !== userId);
    onChange(updatedUsers);
  };

  const handleReset = () => {
    onChange([]);
  };

  const isUserSelectionEmpty = !isUsersFieldInitialized || selectedUsers.length === 0;

  return (
    <Fragment>
      <div className={classes.fullWidth}>
        {/* TODO(jeminpark,20250423): break this out into an accessible combobox (VEO-331) */}
        <DebouncedUserSearch
          onSelect={handleSelectUser}
          textPlaceholder={translate('Label.AddUsername')}
          isDisabled={disabled || selectedUsers?.length >= MAX_USERS}
          debounceTimeValue={USER_SEARCH_DEBOUNCE_TIME_MS}
        />
        <FormHelperText>{translate('Description.MaxUsernames')}</FormHelperText>
      </div>

      <div className={classes.usernameChipsSection}>
        {selectedUsers?.map((user) => (
          <Chip
            key={user.id}
            label={user.displayName}
            avatar={
              <Avatar alt='avatar'>
                <Thumbnail2d
                  targetId={user.id!}
                  type={ThumbnailTypes.avatarHeadshot}
                  alt='thumbnail'
                  includeBackground={false}
                />
              </Avatar>
            }
            size='medium'
            color='secondary'
            onDelete={() => handleRemoveUser(user.id!)}
            disabled={disabled}
          />
        ))}
      </div>
      {!isUserSelectionEmpty && (
        <Button
          size='small'
          className={classes.resetButton}
          disabled={disabled}
          onClick={handleReset}>
          {translate('Action.ResetSearch')}
        </Button>
      )}
    </Fragment>
  );
}

export default memo(AccountsSelection);
