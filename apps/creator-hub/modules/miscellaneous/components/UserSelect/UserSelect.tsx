import type { FunctionComponent, SyntheticEvent } from 'react';
import React, { useRef, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Autocomplete,
  Chip,
  makeStyles,
  SearchIcon,
  TextField,
  Grid,
  Paper,
  Typography,
} from '@rbx/ui';
import type { User } from '@modules/clients/users';
import CreatorType from '../../common/enums/Creator';
import ThumbnailWithNames from '../ThumbnailWithNames';
import type { UserSelectProps, UserSelectLogState } from './types';

const useStyles = makeStyles()(() => ({
  rootClass: {
    width: '100%',
  },
  noOverflow: {
    overflow: 'hidden',
  },
  bottomTextWrapper: {
    padding: '14px 16px',
  },
}));

const UserSelect: FunctionComponent<UserSelectProps> = ({
  onSelect,
  userOptions,
  userStatus,
  isFetching,
  noOptionsText,
  updateUserSuggestions,
  bottomText,
  disabled,
  renderInput,
  renderOption,
}) => {
  const {
    classes: { rootClass, noOverflow, bottomTextWrapper },
  } = useStyles();
  const { translate } = useTranslation();
  const logState = useRef<UserSelectLogState>({});
  const [isFocused, setIsFocused] = useState(false);

  const inputValue = useRef('');

  const handleAutocompleteChange = (event: SyntheticEvent<Element>, selectedUser: User | null) => {
    if (selectedUser && onSelect) {
      logState.current.numCharsInSearchbarOnItemClick = inputValue.current.length;
      logState.current.itemClickedTimestampMilliseconds = Date.now();
      onSelect(
        selectedUser,
        userStatus.get(selectedUser.id!)?.category ?? 'unknown',
        logState.current,
      );
    }
  };

  return (
    <Autocomplete
      disabled={disabled}
      className={rootClass}
      blurOnSelect
      filterOptions={(options) => options}
      onFocus={() => {
        logState.current = {
          numCharsInSearchbarOnFocus: inputValue.current.length,
          searchbarFocusedTimestampMilliseconds: Date.now(),
        };
        setIsFocused(true);
      }}
      onBlur={() => setIsFocused(false)}
      onChange={handleAutocompleteChange}
      // Don't let the Autocomplete have a selected value, so that onChange
      // always gets called when an option is clicked
      value={null}
      onInputChange={(event, value) => {
        if (!inputValue.current) {
          logState.current.searchbarTextFirstChangedTimestampMilliseconds = Date.now();
        }
        if (inputValue.current !== value) {
          inputValue.current = value;
          updateUserSuggestions(value);
        }
      }}
      options={userOptions}
      getOptionDisabled={(option) => userStatus.get(option.id!)?.disabled ?? false}
      // this sets the input value to an empty string whenever a user is selected
      getOptionLabel={() => ''}
      loading={isFetching}
      noOptionsText={translate(noOptionsText)}
      renderOption={(props, option) => {
        const status = userStatus.get(option.id!);

        const renderUserInfo = () => (
          <ThumbnailWithNames
            target={{
              id: option.id,
              name: option.name,
              displayName: option.displayName,
            }}
            disableLink
            textVariant='secondary'
            targetType={CreatorType.User}
          />
        );

        const getDefaultChipLabel = () => {
          if (!status) {
            return null;
          }
          if (status.category === 'Friend') {
            return translate('Label.FriendTitle');
          }
          return translate(`Label.${status.category}`);
        };

        const renderChipLabel = (label: React.ReactNode) => (
          <Grid item flex='0 0 auto'>
            <Chip color='secondary' label={label} size='small' variant='filled' />
          </Grid>
        );

        const defaultRender = () => {
          const chipLabel = getDefaultChipLabel();

          return (
            <Grid container alignItems='center' spacing={1}>
              <Grid item flex='1 1 0' className={noOverflow}>
                {renderUserInfo()}
              </Grid>
              {status && chipLabel && renderChipLabel(chipLabel)}
            </Grid>
          );
        };

        const content = renderOption
          ? renderOption({
              user: option,
              status,
              defaultRender,
              renderUserInfo,
              getDefaultChipLabel,
              renderChipLabel,
            })
          : defaultRender();

        return <li {...props}>{content}</li>;
      }}
      PaperComponent={({ children }) => (
        <Paper>
          {children}
          {bottomText && (
            <div className={bottomTextWrapper}>
              <Typography variant='body2' color='secondary'>
                {translate(bottomText)}
              </Typography>
            </div>
          )}
        </Paper>
      )}
      renderInput={
        renderInput
          ? (params) => renderInput(params, isFocused)
          : (params) => (
              <TextField
                {...params}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: <SearchIcon />,
                  placeholder: translate('Label.SearchCreators'),
                }}
                label=''
              />
            )
      }
    />
  );
};

export default UserSelect;
