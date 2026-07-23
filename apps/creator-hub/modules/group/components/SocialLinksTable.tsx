import React, { FunctionComponent } from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, makeStyles, TextField, Button, IconButton, DeleteOutlinedIcon } from '@rbx/ui';
import { GroupSocialLink } from '@modules/clients';
import { RobloxGroupsApiSocialLinkRequestTypeEnum } from '@rbx/clients/groups';
import SocialLinksMenu from './SocialLinksMenu';
import { GroupSocialLinkTypesToNameMap, SocialLinksLimit } from '../constants/groupConstants';
import { validateGroupSocialLink } from '../utils/groupUtils';

const useSocialLinksTableStyles = makeStyles()(() => ({
  tableContainer: {
    marginTop: 16,
    '& > *:not(:first-child)': {
      paddingTop: 32,
    },
  },

  rowContainer: {
    '& > *:not(:last-child)': {
      paddingBottom: 16,
    },
  },
}));

export interface SocialLinksTableProps {
  value: GroupSocialLink[];
  onChange: (socialLinks: GroupSocialLink[]) => void;
  disabled?: boolean;
}

const SocialLinksTable: FunctionComponent<React.PropsWithChildren<SocialLinksTableProps>> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const { translate } = useTranslation();

  const {
    classes: { tableContainer, rowContainer },
  } = useSocialLinksTableStyles();

  return (
    <Grid container direction='column' className={tableContainer}>
      {value.map((link, index) => (
        <Grid item key={link.id} className={rowContainer}>
          <Grid container direction='row' wrap='nowrap'>
            <SocialLinksMenu
              value={link}
              options={Object.entries(RobloxGroupsApiSocialLinkRequestTypeEnum).filter(
                ([, enumValue]) => {
                  const linkName = GroupSocialLinkTypesToNameMap.get(enumValue);

                  if (linkName === 'GooglePlus' || linkName === 'Amazon') {
                    return value.find((l) => l.type === enumValue) !== undefined;
                  }

                  return true;
                },
              )}
              onSelectType={(newType) => {
                const newSocialLinks = value;
                newSocialLinks[index].type = newType;
                onChange(newSocialLinks);
              }}
              disabled={disabled}
            />
            <IconButton
              data-testid='delete-link'
              aria-label='delete'
              color='inherit'
              onClick={() => {
                onChange(value.filter((l) => l !== link));
              }}>
              <DeleteOutlinedIcon />
            </IconButton>
          </Grid>

          <TextField
            value={link.url ?? ''}
            size='small'
            error={!validateGroupSocialLink(link)}
            fullWidth
            required
            id='url'
            inputProps={{ maxLength: 256 }}
            label={translate('Label.Url').toLocaleUpperCase()}
            helperText={translate('Message.CharacterLimit', {
              limit: '256',
            })}
            disabled={disabled}
            onChange={(e) => {
              const newSocialLinks = value;
              newSocialLinks[index].url = e.target.value;
              onChange(newSocialLinks);
            }}
          />
          <TextField
            value={link.title ?? ''}
            size='small'
            fullWidth
            required
            id='title'
            inputProps={{ maxLength: 70 }}
            label={translate('Label.Title')}
            helperText={translate('Message.CharacterLimit', {
              limit: '70',
            })}
            disabled={disabled}
            onChange={(e) => {
              const newSocialLinks = value;
              newSocialLinks[index].title = e.target.value;
              onChange(newSocialLinks);
            }}
          />
        </Grid>
      ))}
      <Grid item>
        <Button
          variant='contained'
          color='primary'
          size='medium'
          onClick={() => {
            const newSocialLinks = value;
            newSocialLinks.push({
              id: undefined,
              title: undefined,
              type: undefined,
              url: undefined,
            });
            onChange(newSocialLinks);
          }}
          disabled={disabled || value.length >= SocialLinksLimit}>
          {translate('Action.AddLink')}
        </Button>
      </Grid>
    </Grid>
  );
};

export default SocialLinksTable;
