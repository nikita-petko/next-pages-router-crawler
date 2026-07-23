import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, makeStyles, Typography } from '@rbx/ui';
import type { TLink } from './constants/type';
import FooterUrl from './FooterUrl';

interface FooterGrid {
  header: string;
  linkList: TLink[];
}

const useStyle = makeStyles()((theme) => ({
  title: {
    color: theme.palette.text.disabled,
  },

  column: {
    padding: '16px 24px',
  },
}));

const formatUrlComponent = (link: TLink) => {
  return <FooterUrl key={link.title} path={link.path} title={link.title} />;
};

const FooterGrid: FunctionComponent<FooterGrid> = ({ header, linkList }) => {
  const {
    classes: { title, column },
  } = useStyle();
  const { translate } = useTranslation();
  return (
    <Grid item classes={{ root: column }} XLarge='auto' Medium={4} XSmall={12}>
      <Grid container direction='column' spacing={1}>
        <Grid item>
          <Typography classes={{ root: title }} variant='overline'>
            {translate(header)}
          </Typography>
        </Grid>
        {linkList.map((link) => formatUrlComponent(link))}
      </Grid>
    </Grid>
  );
};

export default FooterGrid;
