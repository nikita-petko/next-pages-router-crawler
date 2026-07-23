import React, { ChangeEvent, FunctionComponent, useCallback, useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { HorizontalTabs, Item } from '@modules/miscellaneous/common';
import { Grid, Tab } from '@rbx/ui';
import Router, { useRouter } from 'next/router';
import { buildTitle, HubMeta } from '@rbx/creator-hub-history';
import PlacesContainer from './PlacesContainer';
import CreatedPlacesContainer from '../../createdPlaces/containers/CreatedPlacesContainer';

const PlacesPageContainer: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const {
    query: { activeTab },
  } = useRouter();

  const menuItems = useMemo(() => {
    return [
      { type: Item.Places, nameKey: 'Heading.Places' },
      { type: Item.CreatedPlaces, nameKey: 'Heading.CreatedPlaces' },
    ];
  }, []);

  const activeItemType = useMemo(() => {
    if (!Object.values(Item).includes(activeTab as Item)) {
      return Item.Places;
    }
    return activeTab as Item;
  }, [activeTab]);

  const handleMenuChange = useCallback(async (_: ChangeEvent<unknown>, value: unknown) => {
    await Router.push({
      pathname: Router.pathname,
      query: {
        ...Router.query,
        activeTab: value as Item,
      },
    });
  }, []);

  const { translate } = useTranslation();

  return (
    <Grid container direction='column'>
      <Grid item XSmall={12}>
        <HorizontalTabs value={activeItemType} onChange={handleMenuChange}>
          {menuItems.map((menuItem) => (
            <Tab key={menuItem.type} value={menuItem.type} label={translate(menuItem.nameKey)} />
          ))}
        </HorizontalTabs>
      </Grid>
      {activeItemType === Item.Places ? (
        <React.Fragment>
          <HubMeta hubOnly title={buildTitle(translate('Heading.Places'))} />
          <PlacesContainer />
        </React.Fragment>
      ) : null}
      {activeItemType === Item.CreatedPlaces ? (
        <React.Fragment>
          <HubMeta hubOnly title={buildTitle(translate('Heading.CreatedPlaces'))} />
          <CreatedPlacesContainer />
        </React.Fragment>
      ) : null}
    </Grid>
  );
};

export default PlacesPageContainer;
