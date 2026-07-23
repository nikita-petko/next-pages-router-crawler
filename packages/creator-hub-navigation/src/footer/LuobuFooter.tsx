import React, { FunctionComponent } from 'react';
import { getCurrentYear } from '@rbx/core';
import { useTranslation } from '@rbx/intl';
import { Grid, Typography, Link } from '@rbx/ui';
import GlobalLogo from './GlobalLogo';
import useFooterStyles from './Footer.styles';
import luobuColumnList from './constants/links/luobu';
import formatGridComponent from './utils/formatGridComponent';
import type { TFooterProps } from './constants/type';

const footerLogoWidth = 124;

const LuoboFooter: FunctionComponent<TFooterProps> = ({ className }) => {
  const {
    classes: { column, footer },
    cx,
  } = useFooterStyles();
  const { translate } = useTranslation();

  return (
    <Grid classes={{ root: cx(footer, className) }} container justifyContent='center'>
      <Grid item container justifyContent='center'>
        <Grid item XLarge='auto' Medium={12}>
          <Grid container direction='column' classes={{ root: column }}>
            <Grid item>
              <Link href='https://www.roblox.com/' target='_blank'>
                <GlobalLogo width={footerLogoWidth} />
              </Link>
            </Grid>
            <Grid item>
              <Typography variant='body2' component='p'>
                {translate('Description.CopyrightMessage', {
                  copyrightYear: `${getCurrentYear()}123`,
                })}
              </Typography>
              <Typography component='p'>
                <Link href='https://beian.miit.gov.cn/' rel='noreferrer' target='_blank'>
                  <Typography variant='footer' color='secondary' align='inherit'>
                    {/* This is a website license string from governments, not needing translation, only need for Luobu usage */}
                    粤ICP备20013629号
                  </Typography>
                </Link>
              </Typography>
            </Grid>
          </Grid>
        </Grid>
        {luobuColumnList.map((item) => formatGridComponent(item))}
      </Grid>
    </Grid>
  );
};

export default LuoboFooter;
