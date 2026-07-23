import React, { useEffect, useState } from 'react';
import { User } from '@modules/clients';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  ThumbnailWithNames,
  UserSelect,
  TUseUserOptionsForGroupMembersOptions,
  useUserOptionsForGroupMembers,
} from '@modules/miscellaneous/common/components';
import { CreatorType } from '@modules/miscellaneous/common';
import { TextField, SearchIcon, makeStyles } from '@rbx/ui';

const useStyles = makeStyles()(() => ({
  inputContainer: {
    position: 'relative',
  },
  inputAdornment: {
    position: 'absolute',
    paddingLeft: 44, // to account for any startAdornment
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
    zIndex: 1,
  },
}));

type TGroupMemberSelectorProps = {
  onSelectUser: (user: User | undefined) => void;
};

const useUserOptionsForGroupMembersProps: TUseUserOptionsForGroupMembersOptions = {
  excludeCurrentUser: true,
};

const GroupMemberSelector = ({ onSelectUser }: TGroupMemberSelectorProps) => {
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);
  const { translate } = useTranslation();
  const {
    classes: { inputContainer, inputAdornment: inputAdornmentClass },
  } = useStyles();

  const userSelectProps = useUserOptionsForGroupMembers(useUserOptionsForGroupMembersProps);

  useEffect(() => {
    onSelectUser(selectedUser);
  }, [selectedUser, onSelectUser]);

  return (
    <UserSelect
      {...userSelectProps}
      onSelect={(user) => setSelectedUser(user)}
      renderInput={(params, isFocused: boolean) => (
        <div className={inputContainer}>
          <TextField
            {...params}
            InputProps={{
              ...params.InputProps,
              startAdornment: <SearchIcon />,
              placeholder: !selectedUser ? translate('Label.SearchOrganizationMembers') : '',
            }}
            label=''
          />
          {selectedUser && !isFocused && (
            <div className={inputAdornmentClass}>
              <ThumbnailWithNames
                target={selectedUser}
                targetType={CreatorType.User}
                variant='compact'
              />
            </div>
          )}
        </div>
      )}
    />
  );
};

export default withTranslation(GroupMemberSelector, [TranslationNamespace.Organization]);
