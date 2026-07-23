import React, { FunctionComponent, useMemo, useCallback, ReactNode } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { useAnalyticsPageControlBarStyles } from '@modules/experience-analytics-shared';
import { Item } from '@modules/miscellaneous/common';
import { Grid, Typography, Select, makeStyles } from '@rbx/ui';
import { PageResponse, SortOrder } from '@rbx/core';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { CreationData, ItemGridContainer, ItemCardContainer } from '@modules/creations/common';
import { AssociatedItemsGridPagingParameters } from '../../common/interfaces/AssociatedItemsGridPagingParameters';
import getAvatarCreations from '../utils/loadAvatarCreationUtils';

export interface AvatarCreationsGridComponentProps {
  currToken: string | undefined;
  tokenMenuItems: React.JSX.Element[];
  setCurrToken: (newToken: string) => void;
  universeId: number | undefined;
}

const useStyles = makeStyles()(() => ({
  dropdown: {
    marginTop: 10,
  },
}));

const AvatarCreationsGridComponent: FunctionComponent<AvatarCreationsGridComponentProps> = ({
  currToken,
  tokenMenuItems,
  setCurrToken,
  universeId,
}) => {
  const { translate } = useTranslation();
  const {
    classes: { dropdown },
  } = useStyles();

  const {
    classes: { controlBarSelector },
  } = useAnalyticsPageControlBarStyles();
  const sortOrder = SortOrder.Desc;

  const pagingParameters = useMemo(() => {
    if (universeId === undefined) {
      return {};
    }
    return { itemType: Item.Bundle, universeId, sortOrder };
  }, [sortOrder, universeId]);

  const loadAvatarCreations = useCallback(
    async (
      parameters: AssociatedItemsGridPagingParameters | object,
    ): Promise<PageResponse<CreationData>> => {
      return getAvatarCreations(currToken, parameters as AssociatedItemsGridPagingParameters);
    },
    [currToken],
  );

  const onChangeToken = useCallback(
    (newToken: string) => {
      setCurrToken(newToken);
    },
    [setCurrToken],
  );

  const onTokenChange = useCallback(
    (event: React.ChangeEvent<{ value: string }>) => {
      const newToken = event.target.value as string;
      onChangeToken(newToken);
    },
    [onChangeToken],
  );

  const getTextFieldValueForToken = useCallback(
    (tokenId: unknown): ReactNode => {
      const tokenIdToNameMap = new Map<string, string>();
      tokenMenuItems.forEach((item) => {
        tokenIdToNameMap.set(item.key as string, item.props.children as string);
      });
      return tokenIdToNameMap.get(tokenId as string) ?? '';
    },
    [tokenMenuItems],
  );

  function getKey(item: CreationData) {
    return item.itemType === Item.Bundle ? `Bundle:${item.bundleId}` : `Asset:${item.assetId}`;
  }

  const selectTokenDropdown = useMemo(() => {
    return (
      <Select
        SelectProps={{
          renderValue: getTextFieldValueForToken,
        }}
        label={translate('Label.SelectToken')}
        variant='outlined'
        className={controlBarSelector}
        data-testid='tokenSelector'
        value={currToken}
        onChange={onTokenChange}>
        {tokenMenuItems}
      </Select>
    );
  }, [
    controlBarSelector,
    currToken,
    getTextFieldValueForToken,
    onTokenChange,
    tokenMenuItems,
    translate,
  ]);

  const avatarCreationsHeaderAndTokenDropdown = useMemo(() => {
    return (
      <Grid container direction='column'>
        <Typography variant='h4'>{translate('Label.AvatarCreations')}</Typography>
        <br />
        {selectTokenDropdown}
      </Grid>
    );
  }, [selectTokenDropdown, translate]);

  const emptyState = useMemo(() => {
    return <div />;
  }, []);

  if (tokenMenuItems.length === 0) {
    return emptyState;
  }

  if (!currToken) {
    return (
      <Grid container direction='column' spacing={2} classes={{ root: dropdown }}>
        <Grid item>{avatarCreationsHeaderAndTokenDropdown}</Grid>
      </Grid>
    );
  }

  return (
    <Grid container direction='column' spacing={2} classes={{ root: dropdown }}>
      <Grid item>{avatarCreationsHeaderAndTokenDropdown}</Grid>
      <Grid item>
        <ItemGridContainer
          pagingParameters={pagingParameters}
          loadItems={loadAvatarCreations}
          getItemKey={(item) => getKey(item)}
          GridItemComponent={ItemCardContainer}
          errorMessage={translate('Message.LoadItemsError', { itemType: Item.Bundle })}
          emptyMessage={emptyState}
          onLoad={undefined}
          useWideIcons={false}
        />
      </Grid>
    </Grid>
  );
};

export default withTranslation(AvatarCreationsGridComponent, [TranslationNamespace.Creations]);
