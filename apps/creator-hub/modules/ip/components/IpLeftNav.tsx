import type { FunctionComponent } from 'react';
import React, { Fragment } from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, Typography } from '@rbx/ui';
import Features from '@modules/navigation/leftNavigation/components/Features';
import useIpFeatures from '../hooks/useIpFeatures';

/**
 * Secondary navigation sidebar for intellectual properties such as
 * - Rights Manager
 * - License Manager
 */
const IpLeftNav: FunctionComponent<React.PropsWithChildren> = () => {
  const { translate } = useTranslation();
  const { features, activeFeature, defaultExpanded } = useIpFeatures();

  return (
    <>
      <Grid item container direction='column'>
        <Typography variant='buttonSmall'>{translate('Heading.IP')}</Typography>
      </Grid>
      {features.length > 0 && (
        <Features
          features={features}
          activeFeature={activeFeature}
          defaultExpanded={defaultExpanded}
          name='licenseManager'
        />
      )}
    </>
  );
};

export default IpLeftNav;
