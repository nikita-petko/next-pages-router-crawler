import type { FunctionComponent } from 'react';
import React from 'react';
import { Checkbox, FormControlLabel, makeStyles, Typography, Grid } from '@rbx/ui';
import { useTranslationContext } from '../providers/TranslationProvider';
import { canPermissionChange } from '../utils/permission';
import type {
  PermissionRequest,
  PermissionGroupMetadata,
  PermissionResponse,
} from '../utils/types';
import { Permission } from './Permission';

type PermissionGroupProps = {
  metadata: PermissionGroupMetadata;
  initialSelections: Record<string, PermissionResponse>;
  currentSelections: Record<string, PermissionRequest>;
  onPermissionChange: (permissionId: string, isGranted: boolean) => void;
};

const usePermissionsCategoryStyles = makeStyles()((theme) => ({
  permissionCategory: {
    listStyle: 'none',
    paddingLeft: theme.spacing(3),
  },
  checkboxSubtext: {
    paddingLeft: theme.spacing(1),
  },
}));

const PermissionGroup: FunctionComponent<PermissionGroupProps> = ({
  metadata,
  initialSelections,
  currentSelections,
  onPermissionChange,
}) => {
  const {
    classes: { permissionCategory, checkboxSubtext },
  } = usePermissionsCategoryStyles();
  const { translate } = useTranslationContext();

  const visiblePermissions = metadata.permissions.filter(
    (perm) => perm.permissionId in initialSelections,
  );

  if (visiblePermissions.length === 0) {
    return null;
  }

  const editablePermissions = visiblePermissions.filter((permission) =>
    canPermissionChange(initialSelections[permission.permissionId]),
  );

  const isDisabled = visiblePermissions.every(
    (permission) => !canPermissionChange(initialSelections[permission.permissionId]),
  );

  const areAllChecked = visiblePermissions.every(
    (permission) =>
      !initialSelections[permission.permissionId].canEdit ||
      currentSelections[permission.permissionId].isGranted ||
      initialSelections[permission.permissionId].isInherited,
  );

  const isNoneChecked = visiblePermissions.every(
    (permission) =>
      !initialSelections[permission.permissionId].canEdit ||
      !(
        currentSelections[permission.permissionId].isGranted ||
        initialSelections[permission.permissionId].isInherited
      ),
  );

  const handleGroupCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isGranted = event.target.checked;
    editablePermissions.forEach((permission) => {
      onPermissionChange(permission.permissionId, isGranted);
    });
  };

  return (
    <li>
      <FormControlLabel
        control={
          <Checkbox
            color='secondary'
            size='medium'
            checked={areAllChecked}
            indeterminate={!(areAllChecked || isNoneChecked)}
            disabled={isDisabled}
            onChange={handleGroupCheckboxChange}
          />
        }
        label={<Typography variant='h6'>{translate(`${metadata.groupId}.Label`)}</Typography>}
      />
      <Grid container>
        <Typography variant='caption' color='secondary' className={checkboxSubtext}>
          {translate(`${metadata.groupId}.Subtext`)}
        </Typography>
      </Grid>

      <ul className={permissionCategory}>
        {visiblePermissions.map((permission) => (
          <li key={permission.permissionId}>
            <Permission
              permissionId={permission.permissionId}
              isGranted={currentSelections[permission.permissionId].isGranted}
              isInherited={initialSelections[permission.permissionId].isInherited ?? false}
              localInheritance={permission.inheritsFrom?.find(
                (p) => currentSelections[p]?.isGranted,
              )}
              canEdit={initialSelections[permission.permissionId].canEdit}
              onChange={onPermissionChange}
            />
          </li>
        ))}
      </ul>
    </li>
  );
};

export { PermissionGroup, type PermissionGroupProps };
