import React, { FunctionComponent, useMemo } from 'react';
import { Asset, assetTypeToItemType, Item } from '@modules/miscellaneous/common';
import AssetCreationEntryway from '@modules/asset-creation/components/AssetCreationEntryway';
import { isCreateAssetAvailable } from '@modules/asset-creation/constants/AssetTypeConstants';
import { EmptyState, Flex } from '@modules/miscellaneous/common/components';
import useCurrentOrganization from '@modules/group/hooks/useCurrentOrganization';
import { useTranslation } from '@rbx/intl';
import { Link, makeStyles } from '@rbx/ui';
import Look from '@modules/miscellaneous/common/enums/Look';
import getEmptyStateProps from './assetConstants';

type TCreationsGridEmptyStateProps = {
  assetType: Asset;
  lookType?: Look;
  children?: React.ReactNode;
};

const useStyles = makeStyles()((theme) => ({
  emptyStateContainer: {
    width: '100%',
  },
  withBorder: {
    ...theme.border.radius.medium,
    border: `1px solid ${theme.palette.components.divider}`,
  },
}));

const CreationsGridEmptyState: FunctionComponent<
  React.PropsWithChildren<TCreationsGridEmptyStateProps>
> = ({ assetType, lookType, children }) => {
  const { translate, translateHTML } = useTranslation();
  const { organization, permissions } = useCurrentOrganization();

  const {
    classes: { emptyStateContainer, withBorder },

    cx,
  } = useStyles();

  const emptyStateProps = getEmptyStateProps(assetType, lookType);

  const description = emptyStateProps.linkHref
    ? translateHTML(emptyStateProps.description, [
        {
          opening: 'linkStart',
          closing: 'linkEnd',
          content(chunks) {
            return <Link href={emptyStateProps.linkHref}>{chunks}</Link>;
          },
        },
      ])
    : translate(emptyStateProps.description);

  const canCreateAsset = useMemo(() => {
    const hasFileUpload = isCreateAssetAvailable(assetType);
    const itemType = assetTypeToItemType[assetType];

    if (itemType === Item.LibraryAsset && organization?.groupId !== undefined) {
      // Library assets, within groups, are only available to users with the correct permissions
      return hasFileUpload && permissions?.canCreateAssets;
    }

    // User assets or non-library group assets are always creatable if hasFileUpload
    return hasFileUpload;
  }, [assetType, organization?.groupId, permissions?.canCreateAssets]);

  return (
    <Flex
      flexDirection='column'
      justifyContent='center'
      alignItems='center'
      classes={{
        root: cx(emptyStateContainer, {
          [withBorder]: !canCreateAsset,
        }),
      }}>
      <EmptyState
        size='small'
        {...emptyStateProps}
        title={translate(emptyStateProps.title)}
        description={description}>
        {children}
      </EmptyState>
      {canCreateAsset && (
        <AssetCreationEntryway containerHasData={() => false} assetType={assetType} />
      )}
    </Flex>
  );
};

export default CreationsGridEmptyState;
