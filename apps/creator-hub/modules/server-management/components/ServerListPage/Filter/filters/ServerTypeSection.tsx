import React, { FunctionComponent } from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, Typography } from '@rbx/ui';
import { Checkbox } from '@rbx/foundation-ui';
import { ServerType } from '../../../../types/GameServerControls';
import useFilterSidebarStyles from '../FilterSidebar.styles';

export interface ServerTypeSectionProps {
  setServerType: (type: ServerType) => void;
  currentType: ServerType;
}

const ServerTypeSection: FunctionComponent<ServerTypeSectionProps> = ({
  setServerType,
  currentType,
}) => {
  const { translate } = useTranslation();
  const { classes } = useFilterSidebarStyles();

  const { checkboxSection, checkboxGroup } = classes;

  return (
    <Grid container className={checkboxSection}>
      <Grid item>
        <Typography variant='captionHeader'>
          {translate('ServerListTable.Filter.ServerType')}
        </Typography>
      </Grid>
      <Grid item container className={checkboxGroup} direction='column'>
        <Grid item>
          <Checkbox
            label={translate('ServerListTable.Filter.ServerType.Public')}
            size='Medium'
            isChecked={currentType.public}
            placement='Start'
            onCheckedChange={(checked) =>
              setServerType({ ...currentType, public: checked === true })
            }
          />
        </Grid>
        <Grid item>
          <Checkbox
            label={translate('ServerListTable.Filter.ServerType.Reserved')}
            size='Medium'
            isChecked={currentType.reserved}
            placement='Start'
            onCheckedChange={(checked) =>
              setServerType({ ...currentType, reserved: checked === true })
            }
          />
        </Grid>
        <Grid item>
          <Checkbox
            label={translate('ServerListTable.Filter.ServerType.Vip')}
            size='Medium'
            isChecked={currentType.vip}
            placement='Start'
            onCheckedChange={(checked) => setServerType({ ...currentType, vip: checked === true })}
          />
        </Grid>
      </Grid>
    </Grid>
  );
};

export default ServerTypeSection;
