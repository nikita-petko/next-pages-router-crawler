import React from 'react';
import { Thumbnail2d, ThumbnailTypes, ReturnPolicy } from '@rbx/thumbnails';
import useExperienceIconStyles from './ExperienceIcon.styles';

type ExperienceIconProps = {
  universeId: number;
  name?: string;
};

const ExperienceIcon: React.FC<ExperienceIconProps> = ({ universeId, name = '' }) => {
  const { classes } = useExperienceIconStyles();
  return (
    <div className={classes.container}>
      <Thumbnail2d
        alt={name}
        targetId={universeId}
        containerClass={classes.image}
        type={ThumbnailTypes.gameIcon}
        returnPolicy={ReturnPolicy.PlaceHolder}
      />
    </div>
  );
};

export default ExperienceIcon;
