import { useEffect, useState } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TextField, SearchIcon, makeStyles } from '@rbx/ui';
import type { User } from '@modules/clients/users';
import { CreatorType } from '@modules/miscellaneous/common';
import ThumbnailWithNames from '@modules/miscellaneous/components/ThumbnailWithNames';
import useUserOptionsForGroupMembers from '@modules/miscellaneous/components/UserSelect/optionsHook/useUserOptionsForGroupMembers';
import UserSelect from '@modules/miscellaneous/components/UserSelect/UserSelect';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

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
  excludeUserIds?: Set<number>;
};

const GroupMemberSelector = ({ onSelectUser, excludeUserIds }: TGroupMemberSelectorProps) => {
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);
  const { translate } = useTranslation();
  const {
    classes: { inputContainer, inputAdornment: inputAdornmentClass },
  } = useStyles();

  const userSelectProps = useUserOptionsForGroupMembers({
    excludeCurrentUser: true,
    excludeUserIds,
  });

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
