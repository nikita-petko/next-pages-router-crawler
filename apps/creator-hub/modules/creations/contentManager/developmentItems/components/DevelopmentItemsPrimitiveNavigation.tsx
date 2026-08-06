import type { FunctionComponent } from 'react';
import { useCallback } from 'react';
import { Alert, Button } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { CreatorInventoryAssetType } from '@modules/clients/creatorInventory';
import useQueryParams from '@modules/miscellaneous/hooks/useQueryParams';

const PRIMITIVE_NAVIGATION_QUERY_KEYS = ['activeTab'] as const;

const primitiveNavigationConfigs = {
  [CreatorInventoryAssetType.Image]: {
    descriptionKey: 'Description.EmptyStateImages',
    labelKey: 'Action.GoToDecals',
    parentAssetType: CreatorInventoryAssetType.Decal,
  },
  [CreatorInventoryAssetType.Mesh]: {
    descriptionKey: 'Description.EmptyStateMeshes',
    labelKey: 'Action.GoToMeshParts',
    parentAssetType: CreatorInventoryAssetType.MeshPart,
  },
} as const;

export type DevelopmentItemsPrimitiveNavigationProps = {
  assetType: CreatorInventoryAssetType.Image | CreatorInventoryAssetType.Mesh;
  showDescription?: boolean;
};

const DevelopmentItemsPrimitiveNavigation: FunctionComponent<
  DevelopmentItemsPrimitiveNavigationProps
> = ({ assetType, showDescription = false }) => {
  const { translate } = useTranslation();
  const [, setQueryParams] = useQueryParams(PRIMITIVE_NAVIGATION_QUERY_KEYS);
  const config = primitiveNavigationConfigs[assetType];
  const handleNavigate = useCallback(() => {
    setQueryParams({ activeTab: config.parentAssetType });
  }, [config.parentAssetType, setQueryParams]);

  const button = (
    <Button
      as='button'
      data-testid='go-to-parent-button'
      onClick={handleNavigate}
      size='Medium'
      variant='Emphasis'>
      {translate(config.labelKey)}
    </Button>
  );

  if (!showDescription) {
    return button;
  }

  return (
    <Alert
      hasCloseAffordance={false}
      onPrimaryAction={handleNavigate}
      primaryActionLabel={translate(config.labelKey)}
      severity='Info'
      variant='System'>
      {translate(config.descriptionKey)}
    </Alert>
  );
};

export default DevelopmentItemsPrimitiveNavigation;
