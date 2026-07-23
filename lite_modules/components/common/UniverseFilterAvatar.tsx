import { Avatar } from '@rbx/foundation-ui';
import { memo } from 'react';

import useUniverseFilterAvatarStyles from '@components/common/UniverseFilterAvatar.styles';

interface UniverseFilterAvatarProps {
  src?: string;
}

const UniverseFilterAvatar = memo(({ src }: UniverseFilterAvatarProps) => {
  const {
    classes: { avatar },
  } = useUniverseFilterAvatarStyles();
  return <Avatar alt='universe-thumbnail' className={avatar} size='Small' src={src} />;
});

export default UniverseFilterAvatar;
