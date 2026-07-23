import type { FunctionComponent } from 'react';
import React, { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { ArrowBackIcon, Button } from '@rbx/ui';
import { UserRoleType } from '@modules/clients/translationRoles';
import { Link } from '@modules/miscellaneous/components';
import useLeftNavigationStyles from '@modules/navigation/leftNavigation/components/LeftNavigation.styles';

export interface GoBackButtonProps {
  gameId: number | null;
  userRoles: UserRoleType[];
}

const GoBackButton: FunctionComponent<React.PropsWithChildren<GoBackButtonProps>> = ({
  userRoles,
  gameId,
}) => {
  const { translate } = useTranslation();
  const { classes: styles } = useLeftNavigationStyles();

  const backLinkPath = useMemo(() => {
    if (gameId !== null && userRoles.includes(UserRoleType.owner)) {
      return `/dashboard/creations/experiences/${gameId}/localization/`;
    }
    if (gameId !== null && userRoles.includes(UserRoleType.translator)) {
      return `/dashboard/translator-portal/`;
    }
    return '';
  }, [gameId, userRoles]);

  return (
    <span>
      <Link className={styles.backButton} href={backLinkPath}>
        <Button color='primary' size='small' startIcon={<ArrowBackIcon />}>
          {translate('Action.Back')}
        </Button>
      </Link>
    </span>
  );
};

export default GoBackButton;
