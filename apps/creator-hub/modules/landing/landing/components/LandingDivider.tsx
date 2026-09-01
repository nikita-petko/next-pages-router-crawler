import type { FunctionComponent } from 'react';
import React from 'react';
import { Icon } from '@rbx/foundation-ui';
import { Divider, Grid } from '@rbx/ui';
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
      <div className={logo}>
        <Icon
          name='icon-regular-tilt'
          className='dark-theme content-emphasis height-1000 width-1000'
        />
      </div>
      {showHighlight && <Grid className={highlight} />}
    </Grid>
  );
};

export default LandingDivider;
