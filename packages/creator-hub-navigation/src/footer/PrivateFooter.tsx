import React, { type ReactNode, useMemo } from 'react';
import { getCurrentYear } from '@rbx/core';
import { useTranslation, useLocalization } from '@rbx/intl';
import { Grid, Typography, Link, IconButton, Chip, Avatar, LanguageIcon } from '@rbx/ui';
import {
  companyInfoLinks,
  companyInfoLinksInGermany,
  socialLinks,
} from './constants/links/private';
import type { TFooterProps, TFooterBehavior } from './constants/type';

import usePrivateFooterStyles from './PrivateFooter.styles';
import useNavigationConfigs from '../hooks/useNavigationConfigs';
import getRobloxSiteDomain from '../utils/getRobloxSiteDomain';
import { ProductKey } from '../types';

function stableEmptyFunction(): void {}

type TPrivateFooterProps = TFooterProps & {
  behavior?: TFooterBehavior;
  additionalLinks?: ReactNode;
};

export default function PrivateFooter({
  className,
  behavior,
  additionalLinks,
}: TPrivateFooterProps) {
  const { translate } = useTranslation();
  const { nativeName } = useLocalization();
  const { environment, target, currentProduct } = useNavigationConfigs();

  const settingsHref = useMemo(
    () =>
      behavior?.settingsLink ?? `https://${getRobloxSiteDomain(target, environment)}/my/account`,
    [behavior?.settingsLink, environment, target],
  );
  const {
    classes: { root, container, separator, companyInfo, copyright, links, social },
    cx,
  } = usePrivateFooterStyles();

  return (
    <Grid classes={{ root: cx(root, className) }} container justifyContent='center'>
      <Grid className={container} container>
        <Grid className={companyInfo}>
          <Typography className={copyright} variant='footer' color='secondary'>
            {translate('Description.CopyrightMessage', {
              copyrightYear: `${getCurrentYear()}`,
            })}
          </Typography>
          <Grid className={links}>
            {(behavior?.showGermanyOnlyLink === true
              ? companyInfoLinksInGermany
              : companyInfoLinks
            ).reduce<ReactNode[]>((linkElements, { path, title }, index, array) => {
              linkElements.push(
                <Link key={`link-${title}`} href={path} target='_blank' color='inherit'>
                  <Typography key={title} variant='footer' color='secondary'>
                    {translate(title)}
                  </Typography>
                </Link>,
              );

              if (index < array.length - 1) {
                linkElements.push(
                  <Typography
                    key={`separator-${title}`}
                    className={separator}
                    variant='footer'
                    color='secondary'>
                    ·
                  </Typography>,
                );
              }

              return linkElements;
            }, [])}
            {additionalLinks && (
              <React.Fragment>
                <Typography className={separator} variant='footer' color='secondary'>
                  ·
                </Typography>
                {additionalLinks}
              </React.Fragment>
            )}
          </Grid>
        </Grid>
        <Grid className={social}>
          {socialLinks.map(({ path, title, icon: Icon }) => (
            <Link
              key={title}
              href={title === 'YouTube' && behavior?.youTubeLink ? behavior.youTubeLink : path}
              target='_blank'
              color='inherit'>
              <IconButton aria-label={title} color='default'>
                <Icon />
              </IconButton>
            </Link>
          ))}
        </Grid>
        {currentProduct !== ProductKey.Advertise && (
          <Grid>
            <Link href={settingsHref} target='_blank' color='inherit'>
              <Chip
                size='large'
                color='secondary'
                variant='outlined'
                label={nativeName}
                avatar={
                  <Avatar alt='language'>
                    <LanguageIcon />
                  </Avatar>
                }
                // * (@zwang, 10/16/24): workaround to give chip a hover state pending DS/Eng
                // * discussion, the alternative to put redirection logic into click handler is less
                // * desirable a11y wise
                // * MUI distinguish between a chip for pure data display vs a chip for
                // * action by whether its "clickable (i.e. has a click handler), and only "clickable"
                // * chip has a hover state
                onClick={stableEmptyFunction}
              />
            </Link>
          </Grid>
        )}
      </Grid>
    </Grid>
  );
}
