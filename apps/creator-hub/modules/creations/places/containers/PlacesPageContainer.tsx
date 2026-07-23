import Router, { useRouter } from 'next/router';
import type { ChangeEvent, FunctionComponent } from 'react';
import React, { useCallback, useMemo } from 'react';
import { buildTitle, HubMeta } from '@rbx/creator-hub-history';
import { useTranslation } from '@rbx/intl';
import { Grid, Tab } from '@rbx/ui';
import { Item } from '@modules/miscellaneous/common';
import { HorizontalTabs } from '@modules/miscellaneous/components';
import CreatedPlacesContainer from '../../createdPlaces/containers/CreatedPlacesContainer';
import PlacesContainer from './PlacesContainer';

const PlacesPageContainer: FunctionComponent<React.PropsWithChildren> = () => {
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
        <>
          <HubMeta hubOnly title={buildTitle(translate('Heading.Places'))} />
          <PlacesContainer />
        </>
      ) : null}
      {activeItemType === Item.CreatedPlaces ? (
        <>
          <HubMeta hubOnly title={buildTitle(translate('Heading.CreatedPlaces'))} />
          <CreatedPlacesContainer />
        </>
      ) : null}
    </Grid>
  );
};

export default PlacesPageContainer;
