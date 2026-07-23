import React, { FunctionComponent, PropsWithChildren } from 'react';
import { Link, Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import StudioIcon from '../../topNavigation/components/StudioIcon';
import useHeaderStyles from './Header.styles';

type TCreatorHubHeader = {
  creatorHubUrl?: string;
  onClick?: VoidFunction;
};

const Header: FunctionComponent<PropsWithChildren<TCreatorHubHeader>> = ({
  creatorHubUrl,
  onClick,
}) => {
  const {
    classes: { heading, link },
  } = useHeaderStyles();
  const { translate } = useTranslation();

  return (
    <Link onClick={onClick} classes={{ root: link }} href={creatorHubUrl}>
      <StudioIcon />
      <Typography variant='h4' classes={{ root: heading }}>
        {translate('Heading.Creator')}
      </Typography>
    </Link>
  );
};

export default Header;
