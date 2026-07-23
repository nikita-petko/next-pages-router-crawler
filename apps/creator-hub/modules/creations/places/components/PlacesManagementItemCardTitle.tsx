import React, { FunctionComponent } from 'react';
import { Typography, Skeleton, Grid } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import usePlacesManagementItemCardTitleStyles from './PlacesManagementItemCardTitle.styles';

export interface PlacesManagementItemCardTitleProps {
  placeName: string;
  experienceName: string;
  isLoading: boolean;
  isDisabled: boolean;
}

const PlacesManagementItemCardTitle: FunctionComponent<
  React.PropsWithChildren<PlacesManagementItemCardTitleProps>
> = ({ placeName, experienceName, isLoading, isDisabled }) => {
  const {
    classes: { titleTypography, subTitleTypography, titleGridStyle, subTitleGridStyle },
  } = usePlacesManagementItemCardTitleStyles(isDisabled)();
  const { translate } = useTranslation();
  return (
    <Grid container direction='column'>
      <Grid classes={{ root: titleGridStyle }}>
        {isLoading && <Skeleton />}
        <Typography className={titleTypography}>{placeName}</Typography>
      </Grid>
      <Grid classes={{ root: subTitleGridStyle }}>
        {isLoading && <Skeleton />}
        <Typography variant='body2' className={subTitleTypography}>
          {`${translate('Label.Games')}: ${experienceName || translate('Message.None')}`}
        </Typography>
      </Grid>
    </Grid>
  );
};

export default PlacesManagementItemCardTitle;
