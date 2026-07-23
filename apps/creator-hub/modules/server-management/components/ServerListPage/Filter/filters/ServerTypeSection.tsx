import type { FunctionComponent } from 'react';
import { Button, Checkbox } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Grid, Typography } from '@rbx/ui';
import type { ServerType } from '../../../../types/GameServerControls';
import useFilterSidebarStyles from '../FilterSidebar.styles';

export interface ServerTypeSectionProps {
  setServerType: (type: ServerType) => void;
  currentType: ServerType;
}

const ALL_SERVER_TYPES: ServerType = {
  public: true,
  reserved: true,
  vip: true,
  teamCreate: true,
  teamTest: true,
};

const NONE_SERVER_TYPES: ServerType = {
  public: false,
  reserved: false,
  vip: false,
  teamCreate: false,
  teamTest: false,
};

const SERVER_TYPE_OPTIONS = [
  { key: 'public', labelKey: 'ServerListTable.Filter.ServerType.Public' },
  { key: 'reserved', labelKey: 'ServerListTable.Filter.ServerType.Reserved' },
  { key: 'vip', labelKey: 'ServerListTable.Filter.ServerType.Vip' },
  { key: 'teamCreate', labelKey: 'ServerListTable.Filter.ServerType.TeamCreate' },
  { key: 'teamTest', labelKey: 'ServerListTable.Filter.ServerType.TeamTest' },
] as const satisfies readonly { key: keyof ServerType; labelKey: string }[];

const ServerTypeSection: FunctionComponent<ServerTypeSectionProps> = ({
  setServerType,
  currentType,
}) => {
  const { translate } = useTranslation();
  const { classes } = useFilterSidebarStyles();

  const { checkboxSection, checkboxGroup } = classes;
  const allSelected = SERVER_TYPE_OPTIONS.every(({ key }) => currentType[key]);

  return (
    <Grid container className={checkboxSection}>
      <Grid item>
        <Typography variant='captionHeader'>
          {translate('ServerListTable.Filter.ServerType')}
        </Typography>
      </Grid>
      <Grid item>
        <Button
          variant='Link'
          size='Small'
          onClick={() =>
            setServerType(allSelected ? { ...NONE_SERVER_TYPES } : { ...ALL_SERVER_TYPES })
          }>
          {translate(allSelected ? 'Action.DeselectAll' : 'Action.SelectAll')}
        </Button>
      </Grid>
      <Grid item container className={checkboxGroup} direction='column'>
        {SERVER_TYPE_OPTIONS.map(({ key, labelKey }) => (
          <Grid item key={key}>
            <Checkbox
              label={translate(labelKey)}
              size='Medium'
              isChecked={currentType[key]}
              placement='Start'
              onCheckedChange={(checked) =>
                setServerType({ ...currentType, [key]: checked === true })
              }
            />
          </Grid>
        ))}
      </Grid>
    </Grid>
  );
};

export default ServerTypeSection;
