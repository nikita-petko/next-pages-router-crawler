import type { FunctionComponent } from 'react';
import React, { useMemo } from 'react';
import { getCurrentYear } from '@rbx/core';
import { useTranslation } from '@rbx/intl';
import { Grid, Typography, Link } from '@rbx/ui';
import useNavigationConfigs from '../hooks/useNavigationConfigs';
import getRobloxSiteDomain from '../utils/getRobloxSiteDomain';
import globalColumnList from './constants/links/global';
import luobuColumnList from './constants/links/luobu';
import type { TLink } from './constants/type';
import useFooterStyles from './Footer.styles';
import FooterGrid from './FooterGrid';
import GlobalLogo from './GlobalLogo';

const footerLogoWidth = 124;

const formatGridComponent = (item: { title: string; linkList: TLink[] }) => {
  return <FooterGrid key={item.title} header={item.title} linkList={item.linkList} />;
};

type TFooterProps = {
  className?: string;
};

/**
 * @deprecated Use `PublicFooter`, `PrivateFooter` or `LuobuFooter` instead
 */
const Footer: FunctionComponent<TFooterProps> = ({ className }) => {
  const {
    classes: { column, footer },
    cx,
  } = useFooterStyles();
  const { translate } = useTranslation();
  const { environment, target } = useNavigationConfigs();
  const columnList = useMemo(
    () => (target === 'luobu' ? luobuColumnList : globalColumnList),
    [target],
  );

  return (
    <Grid
      classes={{ root: cx(footer, className) }}
      component='footer'
      container
      justifyContent='center'>
      <Grid item container justifyContent='center'>
        <Grid item XLarge='auto' Medium={12}>
          <Grid container direction='column' classes={{ root: column }}>
            <Grid item>
              <Link href={`https://${getRobloxSiteDomain(target, environment)}`} target='_blank'>
                <GlobalLogo width={footerLogoWidth} />
              </Link>
            </Grid>
            <Grid item>
              <Typography variant='body2' component='p'>
                {translate('Description.CopyrightMessage', {
                  copyrightYear: `${getCurrentYear()}`,
                })}
              </Typography>
              {/* This is a website license string from governments, not needing translation, only need for Luobu usage */}
              {target === 'luobu' && (
                <Typography component='p'>
                  <Link href='https://beian.miit.gov.cn/' rel='noreferrer' target='_blank'>
                    <Typography variant='footer' color='secondary' align='inherit'>
                      粤ICP备20013629号
                    </Typography>
                  </Link>
                </Typography>
              )}
            </Grid>
          </Grid>
        </Grid>
        {columnList.map((item) => formatGridComponent(item))}
      </Grid>
    </Grid>
  );
};

export default Footer;
