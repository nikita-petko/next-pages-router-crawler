import React, { Fragment, FunctionComponent, useEffect, useState } from 'react';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { withTranslation } from '@rbx/intl';
import { Grid, CircularProgress } from '@rbx/ui';
import useCurrentOrganization from '../hooks/useCurrentOrganization';
import GroupRoles from '../components/GroupRoles';

const GroupRolesContainer: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const { organization, permissions, refreshPermission } = useCurrentOrganization();

  const [initialized, setInitialized] = useState<boolean>(false);

  useEffect(() => {
    const fetchPermissions = async () => {
      await refreshPermission();
      setInitialized(true);
    };

    fetchPermissions();
  }, [refreshPermission]);

  return (
    <Fragment>
      {!organization || !initialized ? (
        <Grid container justifyContent='center'>
          <CircularProgress />
        </Grid>
      ) : (
        <GroupRoles
          disabled={
            !permissions?.isOwner &&
            !(permissions?.assignableRoleIds && permissions.assignableRoleIds.length > 0) &&
            !(
              permissions?.permissionEditableRoleIds &&
              permissions.permissionEditableRoleIds?.length > 0
            ) &&
            !(
              permissions?.metadataEditableRoleIds &&
              permissions.metadataEditableRoleIds?.length > 0
            )
          }
        />
      )}
    </Fragment>
  );
};

export default withTranslation(GroupRolesContainer, [TranslationNamespace.Organization]);
