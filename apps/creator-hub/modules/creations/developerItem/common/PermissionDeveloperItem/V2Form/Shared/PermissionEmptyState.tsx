import React, { FunctionComponent, useMemo } from 'react';
import { EmptyState, Flex } from '@modules/miscellaneous/common/components';
import { Button, Link, Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import usePermissionEmptyStateStyles from './PermissionEmptyState.styles';
import { PermissionTab } from './types';
import { ASSET_ACCESS_PRIVACY } from '../../../../../../miscellaneous/common/constants/linkConstants';

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
              {translate('Description.EmptyStateCollaborators')}
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
            <React.Fragment>
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
            </React.Fragment>
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
