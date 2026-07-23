import React, { Fragment, FunctionComponent, ReactNode } from 'react';
import {
  Checkbox,
  FormControlLabel,
  Grid,
  InfoOutlinedIcon,
  makeStyles,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@rbx/ui';
import { FrontendFlagName } from '@modules/toolboxService/toolboxFeatureManagement';
import { useToolboxServiceApiProvider } from '@modules/toolboxService/ToolboxServiceApiProvider';
import { useTranslationContext } from '../providers/TranslationProvider';

const usePermissionsStyles = makeStyles()((theme) => ({
  checkboxSubtext: {
    paddingLeft: theme.spacing(4),
  },
  tooltipInfo: {
    margin: `0 0 ${theme.spacing(0.25)} ${theme.spacing(0.5)}`,
    verticalAlign: 'middle',
  },
}));

type PermissionProps = {
  permissionId: string;
  isGranted: boolean;
  canEdit: boolean;
  isInherited: boolean;
  localInheritance?: string;
  onChange: (permissionId: string, isGranted: boolean) => void;
};

const Permission: FunctionComponent<PermissionProps> = ({
  permissionId,
  isGranted,
  isInherited,
  localInheritance,
  canEdit,
  onChange,
}) => {
  const {
    classes: { checkboxSubtext, tooltipInfo },
  } = usePermissionsStyles();
  const { translate } = useTranslationContext();
  const { frontendFlags } = useToolboxServiceApiProvider();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('Medium'));

  // This is a one-off solution for a particular case. This pattern shouldn't be repeated. We are
  // granting additional operations for the universe bans manager permission and that needs updated
  // text. We want to be able to gate the change to the label so we can coordinate the rollout.
  // When we detect this particular permission we will replace the label. Once rolled out, we need
  // to update the old label to match the new label and remove this logic.
  const labelKey =
    permissionId === 'Organization.UniverseBansManager' &&
    frontendFlags[FrontendFlagName.FrontendFlagUniverseBansManagerLabelUpdate]
      ? `${permissionId}.LabelV2`
      : `${permissionId}.Label`;

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(permissionId, event.target.checked);
  };

  const isDisabled = !canEdit;
  const isLocallyInherited = !!localInheritance;

  let tooltipText: ReactNode | undefined;

  if (isDisabled) {
    tooltipText = translate('DisabledPermission.Info');
  } else if (isInherited) {
    tooltipText = translate('InheritedPermission.Info');
  } else if (isLocallyInherited) {
    tooltipText = translate('LocallyInheritedPermission.Info', [], {
      localInheritance: translate(`${localInheritance}.Label`),
    });
  }

  return (
    <Fragment>
      <FormControlLabel
        data-testid={permissionId}
        control={
          <Checkbox
            color='secondary'
            size='medium'
            checked={isGranted || isInherited || isLocallyInherited}
            disabled={isDisabled || isInherited || isLocallyInherited}
            onChange={handleCheckboxChange}
          />
        }
        label={
          <Typography variant='body1'>
            {translate(labelKey)}
            {tooltipText && (
              <Tooltip
                arrow
                title={tooltipText}
                placement={isMobile ? 'bottom' : 'right'}
                enterTouchDelay={0}
                leaveTouchDelay={3000}>
                <InfoOutlinedIcon fontSize='small' className={tooltipInfo} />
              </Tooltip>
            )}
          </Typography>
        }
      />
      <Grid container>
        <Typography variant='caption' color='secondary' className={checkboxSubtext}>
          {translate(`${permissionId}.Subtext`)}
        </Typography>
      </Grid>
    </Fragment>
  );
};

export { Permission, type PermissionProps };
