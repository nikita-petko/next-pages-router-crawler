import React, { FunctionComponent, useMemo, useCallback, ReactNode } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  Asset,
  Item,
  itemTypeToCreatePath,
  itemTypeToLearnMoreUrl,
} from '@modules/miscellaneous/common';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { Button, Grid, Link, makeStyles, MenuItem, Select, Typography } from '@rbx/ui';
import { useRouter } from 'next/router';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { PageResponse } from '@rbx/core';
import EmptyState from '@modules/miscellaneous/common/components/EmptyState/EmptyState';
import { useAnalyticsPageControlBarStyles } from '@modules/experience-analytics-shared';
import { creationsMenuManager } from '../../menu';
import { ItemGridContainer, ItemCardContainer, CreationData } from '../../common';
import useEnabledIecItemTypes from '../../common/hooks/useEnabledIecItemTypes';
import { BundleType } from '../../avatarItem/constants/avatarItemConstants';

export interface AvatarCreationTokensGridComponentProps {
  tokens: PageResponse<CreationData>;
  setItemType: (newItemType: Asset | BundleType) => void;
  itemType: Asset | BundleType;
  setIsAssetType: (newIsAssetType: boolean) => void;
}

const useStyles = makeStyles()(() => ({
  createTokenButton: {
    marginTop: 20,
    marginBottom: 30,
    width: 'fit-content',
  },
  itemTypeDropdown: {
    marginTop: 20,
  },
}));

const AvatarCreationTokensGridComponent: FunctionComponent<
  React.PropsWithChildren<AvatarCreationTokensGridComponentProps>
> = ({ tokens, setItemType, itemType, setIsAssetType }) => {
  const { translate, translateHTML } = useTranslation();
  const { gameDetails } = useCurrentGame();
  const router = useRouter();
  const { enabledItemTypes, enabledItemTypesMetadata } = useEnabledIecItemTypes();

  const {
    classes: { createTokenButton, itemTypeDropdown },
  } = useStyles();
  const {
    classes: { controlBarSelector },
  } = useAnalyticsPageControlBarStyles();

  const onItemTypeChange = useCallback(
    (event: React.ChangeEvent<{ value: string }>) => {
      let parsedType = event.target.value;

      // Tshirt is returned from the BE as TshirtAccessory, but we need to use TShirtAccessory
      if (parsedType === 'TshirtAccessory') {
        parsedType = 'TShirtAccessory';
      }

      const isAssetType = Object.values(Asset).includes(parsedType as Asset);
      const newItemType = isAssetType ? (parsedType as Asset) : (Number(parsedType) as BundleType);
      setItemType(newItemType);
      setIsAssetType(isAssetType);
    },
    [setIsAssetType, setItemType],
  );

  const getTextFieldValueForItemType = useCallback((): ReactNode => {
    return enabledItemTypesMetadata[itemType]
      ? translate(enabledItemTypesMetadata[itemType].displayName)
      : '';
  }, [enabledItemTypesMetadata, itemType, translate]);

  const handleCreateButtonClick = useCallback(() => {
    router.push(
      `/dashboard/creations/experiences/${gameDetails?.id}/${itemTypeToCreatePath[Item.AvatarCreationToken]}`,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Do not depend on router
  }, [gameDetails?.id]);

  const emptyStateGridDescription = useMemo(() => {
    const messageKey = 'Message.AvatarCreationTokensEmptyMessagesWithLink';

    return translateHTML(
      messageKey,
      [
        {
          opening: 'LinkStart',
          closing: 'LinkEnd',
          content(chunks) {
            return (
              <Link href={itemTypeToLearnMoreUrl[Item.AvatarCreationToken]} target='_blank'>
                {chunks}
              </Link>
            );
          },
        },
      ],
      {
        itemType: translate(creationsMenuManager.getItemFullNameKey(Item.AvatarCreationToken)),
      },
    );
  }, [translate, translateHTML]);

  const emptyState = useMemo(() => {
    return (
      <EmptyState
        title={translate('Message.NoTokens')}
        description={emptyStateGridDescription}
        size='small'
        illustration='tokens'>
        <Button
          data-testid='createAssociatedItemsButton'
          variant='contained'
          size='large'
          color='primary'
          onClick={handleCreateButtonClick}>
          {translate('Button.CreateNewItem', {
            itemType: translate('Label.Token'),
          })}
        </Button>
      </EmptyState>
    );
  }, [emptyStateGridDescription, handleCreateButtonClick, translate]);

  const itemTypeMenuItems = Array.from(enabledItemTypes).map((key) => (
    <MenuItem key={key} value={key}>
      {translate(enabledItemTypesMetadata[key].displayName)}
    </MenuItem>
  ));

  const selectItemTypeDropdown = useMemo(() => {
    return (
      <Select
        SelectProps={{
          renderValue: getTextFieldValueForItemType,
        }}
        label={translate('Label.SelectTokenType')}
        variant='outlined'
        className={controlBarSelector}
        classes={{ root: itemTypeDropdown }}
        data-testid='itemTypeSelector'
        value={itemType}
        onChange={onItemTypeChange}>
        {itemTypeMenuItems}
      </Select>
    );
  }, [
    controlBarSelector,
    getTextFieldValueForItemType,
    itemType,
    itemTypeDropdown,
    itemTypeMenuItems,
    onItemTypeChange,
    translate,
  ]);

  return (
    <Grid container direction='column'>
      <Button
        data-testid='createAssociatedItemsButton'
        variant='contained'
        size='large'
        color='primaryBrand'
        onClick={handleCreateButtonClick}
        classes={{ root: createTokenButton }}>
        {translate('Button.CreateNewItem', {
          itemType: translate('Label.Token'),
        })}
      </Button>
      <Typography variant='h4'>{translate('Label.Tokens')}</Typography>
      {selectItemTypeDropdown}
      {tokens.items.length === 0 ? (
        emptyState
      ) : (
        <ItemGridContainer
          pagingParameters={{}}
          loadItems={() => Promise.resolve(tokens)}
          getItemKey={(item) => item.assetId ?? 0}
          GridItemComponent={ItemCardContainer}
          errorMessage={translate('Message.LoadItemsError', { itemType: Item.AvatarCreationToken })}
          emptyMessage={emptyState}
          onLoad={undefined}
          useWideIcons={false}
        />
      )}
    </Grid>
  );
};

export default withTranslation(AvatarCreationTokensGridComponent, [
  TranslationNamespace.Creations,
  TranslationNamespace.AssetTypes,
]);
