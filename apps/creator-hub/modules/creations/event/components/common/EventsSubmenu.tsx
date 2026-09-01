import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, Chip, Switch, makeStyles, FormControlLabel } from '@rbx/ui';
import type { ExperienceEventState } from './constants';

export interface EventsSubmenuProps {
  activeTab: ExperienceEventState;
  isPublicOnly: boolean;
  setActiveTab: (tab: ExperienceEventState) => void;
  setIsPublicOnly: React.Dispatch<React.SetStateAction<boolean>>;
  submenuTabs: { name: ExperienceEventState; label: string }[];
}

const useStyles = makeStyles()((theme) => ({
  menuContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    [theme.breakpoints.down('Medium')]: {
      gap: '20px',
    },
  },
  chipContainer: {
    width: 'auto',
    gap: '12px',
    alignItems: 'baseline',
    wrap: 'nowrap',
  },
}));

const EventsSubmenu: FunctionComponent<React.PropsWithChildren<EventsSubmenuProps>> = ({
  activeTab,
  isPublicOnly,
  setActiveTab,
  setIsPublicOnly,
  submenuTabs,
}) => {
  const { translate } = useTranslation();
  const {
    classes: { menuContainer, chipContainer },
  } = useStyles();

  return (
    <Grid className={menuContainer} direction='row' container>
      <Grid className={chipContainer} container>
        {submenuTabs.map((tab) => (
          <Chip
            key={tab.name}
            color={activeTab === tab.name ? 'primary' : 'secondary'}
            label={translate(tab.label)}
            size='medium'
            variant='filled'
            onClick={() => setActiveTab(tab.name)}
            clickable
          />
        ))}
      </Grid>
      <Grid item display='flex' alignItems='center'>
        <FormControlLabel
          control={
            <Switch
              checked={isPublicOnly}
              onChange={() => setIsPublicOnly((prev) => !prev)}
              aria-label={translate('Action.ShowPublicOnly')}
            />
          }
          label={translate('Action.ShowPublicOnly')}
        />
      </Grid>
    </Grid>
  );
};

export default EventsSubmenu;
