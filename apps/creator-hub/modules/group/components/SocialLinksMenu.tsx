import React, { FunctionComponent } from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, makeStyles, MenuItem, Select } from '@rbx/ui';
import {
  RobloxGroupsApiSocialLinkRequestTypeEnum,
  RobloxGroupsApiSocialLinkResponse,
} from '@rbx/clients/groups';
import { GroupSocialLinkTypesToNameMap } from '../constants/groupConstants';
import { sanitizeGroupLinkType } from '../utils/groupUtils';

const useSocialLinksMenuStyles = makeStyles()(() => ({
  menuContainer: {
    minWidth: 220,
  },
}));

export interface SocialLinksMenuProps {
  value?: RobloxGroupsApiSocialLinkResponse;
  options: [string, RobloxGroupsApiSocialLinkRequestTypeEnum][];
  onSelectType: (type: RobloxGroupsApiSocialLinkRequestTypeEnum) => void;
  disabled?: boolean;
}

const SocialLinksMenu: FunctionComponent<React.PropsWithChildren<SocialLinksMenuProps>> = ({
  value,
  options,
  onSelectType,
  disabled = false,
}) => {
  const { translate } = useTranslation();

  const {
    classes: { menuContainer },
  } = useSocialLinksMenuStyles();

  return (
    <Grid container>
      <Select
        value={sanitizeGroupLinkType(value?.type)}
        size='small'
        label={translate('Label.LinkType')}
        disabled={disabled}
        data-testid={disabled ? 'disabled-social-link-type' : 'social-link-type'}
        className={menuContainer}>
        {options.map(([, enumValue]) => {
          const linkName = GroupSocialLinkTypesToNameMap.get(enumValue);

          return (
            <MenuItem
              key={linkName}
              value={linkName}
              selected={sanitizeGroupLinkType(value?.type) === linkName}
              disabled={linkName === 'GooglePlus' || linkName === 'Amazon'}
              onClick={() => onSelectType(enumValue)}>
              {translate(`Label.${linkName}`)}
            </MenuItem>
          );
        })}
      </Select>
    </Grid>
  );
};

export default SocialLinksMenu;
