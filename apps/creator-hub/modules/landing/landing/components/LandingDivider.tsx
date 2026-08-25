import type { FunctionComponent } from 'react';
import React from 'react';
import { Divider, Grid } from '@rbx/ui';
import { studioLogoPath, logoDimension } from '../constants/assetConstants';
import useLandingDividerStyles from './LandingDivider.styles';

type TLandingDividerProps = {
  showHighlight?: boolean;
};

const LandingDivider: FunctionComponent<React.PropsWithChildren<TLandingDividerProps>> = ({
  showHighlight = false,
}) => {
  const {
    classes: { root, divider, logo, highlight },
  } = useLandingDividerStyles();

  return (
    <Grid classes={{ root }} container item justifyContent='center'>
      <Divider className={divider} orientation='vertical' />
      <img
        className={logo}
        src={studioLogoPath}
        alt='Roblox Logo'
        width={logoDimension}
        height={logoDimension}
      />
      {showHighlight && <Grid className={highlight} />}
    </Grid>
  );
};

export default LandingDivider;
