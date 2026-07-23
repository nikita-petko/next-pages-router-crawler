import type { FunctionComponent } from 'react';
import React, { Fragment, useState, useCallback, useEffect } from 'react';
import { useTranslation } from '@rbx/intl';
import { Typography, Select, MenuItem } from '@rbx/ui';
import groupsClient, { type RobloxGroupsApiGroupDetailResponse } from '@modules/clients/groups';
import type { GroupRoleListRespoonse } from '@modules/clients/groups';
import { TranslatorType } from '@modules/clients/translationRoles';
import { useMetricsMonitoring } from '@modules/miscellaneous/metricsMonitoring';
import useTranslationToast from '../../../common/hooks/useTranslationToast';
import type { TranslatorRoleItem } from '../../types/TranslatorInfo';
import useTranslatorGroupRoleSelectionMenuStyles from './TranslatorGroupRoleSelectionMenu.styles';

export interface TranslatorGroupRoleSelectionMenuProps {
  group: RobloxGroupsApiGroupDetailResponse;
  onRoleSelected: (role: TranslatorRoleItem) => void;
  onLoadRoleListFailed: () => void;
}

const TranslatorGroupRoleSelectionMenu: FunctionComponent<
  React.PropsWithChildren<TranslatorGroupRoleSelectionMenuProps>
> = ({ group, onRoleSelected, onLoadRoleListFailed }) => {
  const { translate } = useTranslation();
  const { error } = useMetricsMonitoring();
  const [roleList, setRoleList] = useState<GroupRoleListRespoonse[] | null>(null);
  const [selectedAssigneeName, setSelectedAssigneeName] = useState<string | null>(null);
  const { showFailureToast } = useTranslationToast();
  const {
    classes: { selectRoleLabel, selectedRoleContainer, groupRoleItem, divider },

    cx,
  } = useTranslatorGroupRoleSelectionMenuStyles();

  const loadGroupRoleSet = useCallback(
    async (groupId: number) => {
      try {
        const res = await groupsClient.getGroupRolesSetsInfo(groupId);
        if (res.roles) {
          setRoleList(res.roles);
        } else {
          throw new Error('TranslatorGroupRoleSelectionMeue - getGroupRolesSetsInfo failed');
        }
      } catch (e) {
        const err = e as Error;
        error(`TranslatorGroupRoleSelectionMeue - getGroupRolesSetsInfo failed - ${err.message}`);
        showFailureToast(translate('Message.LoadRoleListFailure'));
        onLoadRoleListFailed();
      }
    },
    [error, showFailureToast, translate, onLoadRoleListFailed],
  );

  useEffect(() => {
    setSelectedAssigneeName(null);
    if (group.id) {
      loadGroupRoleSet(group.id);
    }
  }, [group, loadGroupRoleSet]);

  const handleRoleSelection = useCallback(
    (role: GroupRoleListRespoonse | null) => {
      let assignee;
      if (role) {
        assignee = {
          id: role.id!,
          type: TranslatorType.GroupRole,
        };
        onRoleSelected(assignee);
      } else {
        assignee = {
          id: group.id!,
          type: TranslatorType.Group,
        };
        onRoleSelected(assignee);
      }
    },
    [group, onRoleSelected],
  );

  const handleRoleChange = useCallback(
    (event: React.ChangeEvent<{ name?: string; value: unknown }>) => {
      setSelectedAssigneeName(event.target.value as string);
    },
    [],
  );

  return (
    <>
      <Typography className={selectRoleLabel} variant='footer' align='left'>
        {translate('Label.GroupRoleSelection')}
      </Typography>
      {roleList && (
        <Select
          className={selectedRoleContainer}
          value={selectedAssigneeName}
          onChange={handleRoleChange}
          helperText={translate('Label.SelectRole')}>
          <MenuItem
            className={cx(groupRoleItem, divider)}
            value={translate('Label.EntireGroup')}
            onClick={() => handleRoleSelection(null)}>
            {translate('Label.EntireGroup')}
          </MenuItem>
          {roleList.map((role, index) => {
            return (
              <MenuItem
                onClick={() => handleRoleSelection(role)}
                key={`groupRole-${role.id}`}
                value={`${translate('Label.Role')} ${role.name}`}
                className={cx({
                  [groupRoleItem]: true,
                  [divider]: index !== roleList.length - 1,
                })}>
                {translate('Label.Role')} {role.name}
              </MenuItem>
            );
          })}
        </Select>
      )}
    </>
  );
};

export default TranslatorGroupRoleSelectionMenu;
