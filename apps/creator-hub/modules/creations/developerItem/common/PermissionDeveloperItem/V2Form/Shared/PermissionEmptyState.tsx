import type { FunctionComponent } from 'react';
import React, { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { Button, Link, Typography } from '@rbx/ui';
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';
import Flex from '@modules/miscellaneous/components/Flex';
import { ASSET_ACCESS_PRIVACY } from '../../../../../../miscellaneous/common/constants/linkConstants';
import usePermissionEmptyStateStyles from './PermissionEmptyState.styles';
import { PermissionTab } from './types';

export type PermissionEmptyStateProps = {
  handleOpenAddPermissions: () => void;
  permissionTab: PermissionTab;
};

const PermissionEmptyState: FunctionComponent<
  React.PropsWithChildren<PermissionEmptyStateProps>
> = ({ handleOpenAddPermissions, permissionTab }) => {
  const {
    classes: { container },
  } = usePermissionEmptyStateStyles();
  const { translate } = useTranslation();

  const emptyStateTranslatedTabItems = useMemo(() => {
    switch (permissionTab) {
      case PermissionTab.COLLABORATORS:
        return {
          button: translate('Button.AddCollaborators'),
          description: (
            <Typography variant='body2'>
              {translate('Description.EmptyStateCollaborators.FriendsRename')}
              &nbsp;
            </Typography>
          ),
          title: translate('Title.EmptyStateCollaborators'),
        };
      case PermissionTab.EXPERIENCES:
      default:
        return {
          button: translate('Button.AddExperiences'),
          description: (
            <>
              <Typography variant='body1'>
                {translate('Description.EmptyStateExperiences')}
                &nbsp;
              </Typography>
              <Typography
                variant='body1'
                component={Link}
                aria-label={translate('Link.LearnMore')}
                href={ASSET_ACCESS_PRIVACY}
                target='_blank'>
                {translate('Link.LearnMore')}
              </Typography>
            </>
          ),
          title: translate('Title.EmptyStateExperiences'),
        };
    }
  }, [permissionTab, translate]);

  return (
    <Flex
      alignItems='center'
      flexDirection='column'
      justifyContent='center'
      classes={{ root: container }}>
      <EmptyState
        size='small'
        description={emptyStateTranslatedTabItems.description}
        title={emptyStateTranslatedTabItems.title}>
        <Button color='primary' variant='contained' onClick={handleOpenAddPermissions}>
          {emptyStateTranslatedTabItems.button}
        </Button>
      </EmptyState>
    </Flex>
  );
};

export default PermissionEmptyState;
