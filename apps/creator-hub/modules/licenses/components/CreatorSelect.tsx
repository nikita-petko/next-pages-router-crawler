import type { FunctionComponent } from 'react';
import { useMemo } from 'react';
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

/** A dropdown component that shows a list of creators (users and groups) along with their icons */
const CreatorSelect: FunctionComponent<CreatorSelectProps> = ({
  authenticatedUser,
  groups,
  currentCreator,
  setCurrentCreator,
}) => {
  const { translate } = useTranslation();
  const { classes } = useStyles();

  const menuItems = useMemo(() => {
    return [
      <MenuItem
        key={`${CreatorType.User}-${authenticatedUser?.id}`}
        selected={
          currentCreator?.creatorType === CreatorType.User &&
          authenticatedUser?.id === currentCreator.creatorId
        }
        value={`${CreatorType.User}-${authenticatedUser?.id}`}
        onClick={() =>
          setCurrentCreator({
            creatorId: authenticatedUser?.id,
            creatorName: authenticatedUser?.name,
            creatorType: CreatorType.User,
          })
        }>
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
          selected={
            currentCreator?.creatorType === CreatorType.Group &&
            group.id === currentCreator?.creatorId
          }
          value={`${CreatorType.Group}-${group.id}`}
          onClick={() =>
            setCurrentCreator({
              creatorId: group.id,
              creatorName: group.name,
              creatorType: CreatorType.Group,
            })
          }>
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
  }, [authenticatedUser, groups, classes, currentCreator, setCurrentCreator]);

  return (
    <Select
      label={translate('Label.ExperiencesBy')}
      size='medium'
      margin='dense'
      value={`${currentCreator.creatorType}-${currentCreator.creatorId}`}>
      {menuItems}
    </Select>
  );
};

export default CreatorSelect;
