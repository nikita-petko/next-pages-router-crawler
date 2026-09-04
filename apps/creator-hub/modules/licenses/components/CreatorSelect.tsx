import type { ChangeEvent, FunctionComponent } from 'react';
import { useCallback, useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { Select, selectClasses, MenuItem, makeStyles, ListItemText } from '@rbx/ui';
import type { TGroup, TUser } from '@modules/authentication/types';
import type { Creator } from '@modules/miscellaneous/common';
import { CreatorType, CreatorThumbnailContainer } from '@modules/miscellaneous/common';

interface CreatorSelectProps {
  authenticatedUser: TUser | null;
  groups: TGroup[];
  currentCreator: Creator;
  setCurrentCreator: (creator: Creator) => void;
  label?: string;
}

const useStyles = makeStyles()((theme) => ({
  avatar: {
    width: 32,
    height: 32,
    marginRight: theme.spacing(1),
  },

  menuItemWrapper: {
    display: 'flex',
    flexWrap: 'nowrap',
    alignItems: 'center',
    [`.${selectClasses.select} &`]: {
      margin: '-4px 0',
    },
  },
}));

const creatorTypeByToken: Record<string, CreatorType> = {
  [CreatorType.User]: CreatorType.User,
  [CreatorType.Group]: CreatorType.Group,
};

/** A dropdown component that shows a list of creators (users and groups) along with their icons */
const CreatorSelect: FunctionComponent<CreatorSelectProps> = ({
  authenticatedUser,
  groups,
  currentCreator,
  setCurrentCreator,
  label,
}) => {
  const { translate } = useTranslation();
  const { classes } = useStyles();
  const labelText = label ?? translate('Label.ExperiencesBy');

  const handleChange = useCallback(
    (event: ChangeEvent<{ value: unknown }>) => {
      const value = String(event.target.value);
      const [creatorType, creatorIdStr] = value.split('-');
      const creatorId = Number(creatorIdStr);
      const parsedCreatorType = creatorTypeByToken[creatorType];

      if (parsedCreatorType === CreatorType.User) {
        setCurrentCreator({
          creatorId: authenticatedUser?.id,
          creatorName: authenticatedUser?.name,
          creatorType: CreatorType.User,
        });
        return;
      }

      if (parsedCreatorType === CreatorType.Group) {
        const group = groups.find((ownedGroup) => ownedGroup.id === creatorId);
        if (group != null) {
          setCurrentCreator({
            creatorId: group.id,
            creatorName: group.name,
            creatorType: CreatorType.Group,
          });
        }
      }
    },
    [authenticatedUser, groups, setCurrentCreator],
  );

  const menuItems = useMemo(() => {
    return [
      <MenuItem
        key={`${CreatorType.User}-${authenticatedUser?.id}`}
        value={`${CreatorType.User}-${authenticatedUser?.id}`}>
        <div className={classes.menuItemWrapper}>
          <CreatorThumbnailContainer
            className={classes.avatar}
            creator={{
              creatorId: authenticatedUser?.id,
              creatorName: authenticatedUser?.name,
              creatorType: CreatorType.User,
            }}
          />
          <ListItemText primary={authenticatedUser?.name} />
        </div>
      </MenuItem>,
      ...groups.map((group) => (
        <MenuItem
          key={`${CreatorType.Group}-${group.id}`}
          value={`${CreatorType.Group}-${group.id}`}>
          <div className={classes.menuItemWrapper}>
            <CreatorThumbnailContainer
              className={classes.avatar}
              creator={{
                creatorId: group.id,
                creatorName: group.name,
                creatorType: CreatorType.Group,
              }}
            />
            <ListItemText primary={group.name} />
          </div>
        </MenuItem>
      )),
    ];
  }, [authenticatedUser, groups, classes]);

  return (
    <Select
      label={labelText}
      size='medium'
      margin='dense'
      value={`${currentCreator.creatorType}-${currentCreator.creatorId}`}
      onChange={handleChange}
      data-testid='apply-to-license-creator-select'>
      {menuItems}
    </Select>
  );
};

export default CreatorSelect;
