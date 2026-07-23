import { useTranslation } from '@rbx/intl';
import { Link, Grid, Typography } from '@rbx/ui';
import React, { FunctionComponent } from 'react';

interface FooterUrl {
  path: string;
  title: string;
}

const FooterUrl: FunctionComponent<FooterUrl> = ({ path, title }) => {
  const { translate } = useTranslation();
  return (
    <Grid item>
      <Typography variant='footer' color='secondary'>
        <Link href={path} target='_blank' color='inherit'>
          {translate(title)}
        </Link>
      </Typography>
    </Grid>
  );
};

export default FooterUrl;
