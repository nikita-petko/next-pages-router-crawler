import type { FunctionComponent } from 'react';
import React from 'react';
import { Avatar, Tooltip, makeStyles } from '@rbx/ui';

type TTileAvatarProps = {
  authorName: string;
  authorAvatarUrl: string;
  authorUserId: number | string;
};

const useStyles = makeStyles()((theme) => ({
  avatar: {
    width: 20,
    height: 20,
    marginRight: 8,
    backgroundColor: 'transparent',
    borderColor: theme.palette.background.paper,
  },
}));

export const TileAvatar: FunctionComponent<React.PropsWithChildren<TTileAvatarProps>> = ({
  authorName,
  authorAvatarUrl,
  authorUserId,
}) => {
  const {
    classes: { avatar },
  } = useStyles();
  return (
    <Tooltip key={authorUserId} title={authorName}>
      <Avatar
        classes={{ root: avatar }}
        alt={authorName}
        src={authorAvatarUrl}
        variant='circular'
      />
    </Tooltip>
  );
};

export default TileAvatar;
