import type { FunctionComponent } from 'react';
import React, { useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import { FileCopyOutlinedIcon, Grid, IconButton, Tooltip } from '@rbx/ui';
import TranslationNamespace from '../../constants/TranslationNamespace';
import useCurrentGroup from '../../hooks/useCurrentGroup';

export type RoleIdCopyRowProps = {
  roleId: number;
};

/**
 * Shows the role's id with a button to copy it to the clipboard, so developers can use it with the
 * in-engine group APIs without opening the network console. Rendered on the role Permissions and
 * Settings tabs.
 */
const RoleIdCopyRow: FunctionComponent<RoleIdCopyRowProps> = ({ roleId }) => {
  const { translateWithNamespace } = useTranslation();
  const { showToast } = useCurrentGroup();

  // Placeholder English text is shown until these keys are registered in Translations Hub;
  // translateWithNamespace returns '' for an unregistered key, so `|| <english>` provides the fallback.
  // The id is passed as an interpolation arg (single key) so translators control separator/ordering.
  const copyRoleIdLabel =
    translateWithNamespace(TranslationNamespace.GroupManagement, 'Action.CopyRoleId') ||
    'Copy role ID';
  const roleIdDisplay =
    translateWithNamespace(TranslationNamespace.GroupManagement, 'Label.RoleIdWithValue', {
      id: roleId.toString(),
    }) || `Role ID: ${roleId}`;
  const roleIdCopiedMessage =
    translateWithNamespace(TranslationNamespace.GroupManagement, 'Message.RoleIdCopied') ||
    'Role ID copied to clipboard';

  const handleCopyRoleId = useCallback(() => {
    void navigator.clipboard.writeText(roleId.toString()).then(() => {
      showToast(roleIdCopiedMessage);
    });
  }, [roleId, showToast, roleIdCopiedMessage]);

  return (
    <Grid container item XSmall={12} alignItems='center' gap={1}>
      <span className='text-caption-medium content-emphasis'>{roleIdDisplay}</span>
      <Tooltip title={copyRoleIdLabel}>
        <IconButton
          aria-label={copyRoleIdLabel}
          size='small'
          color='default'
          onClick={handleCopyRoleId}>
          <FileCopyOutlinedIcon fontSize='small' />
        </IconButton>
      </Tooltip>
    </Grid>
  );
};

export default RoleIdCopyRow;
