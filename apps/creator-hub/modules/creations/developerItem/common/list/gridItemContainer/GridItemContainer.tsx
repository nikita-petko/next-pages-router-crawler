import type { Dispatch, FunctionComponent, ReactNode, SetStateAction } from 'react';
import React, { useMemo, useState } from 'react';
import { ReturnPolicy, ThumbnailTypes } from '@rbx/thumbnails';
import CreatorDashboardLink from '@modules/miscellaneous/components/CreatorDashboardLink';
import useThumbnailImage from '@modules/miscellaneous/components/ThumbnailImage/useThumbnailImage';
import { creatorHub } from '@modules/miscellaneous/urls';
import useGridItemStyles from '../menuItems/useGridItemStyles';
import OperationMenu from '../operationMenu/OperationMenu';

const { dashboard } = creatorHub;
export type TMenuNodesFactory = (
  setMenuOpen: Dispatch<SetStateAction<boolean>>,
) => Array<Array<ReactNode>>;

export type TGridItemContainerProps = {
  assetId: number;
  menuNodesFactory: TMenuNodesFactory;
  bottomRightAdornment?: ReactNode;
};

const GridItemContainer: FunctionComponent<React.PropsWithChildren<TGridItemContainerProps>> = (
  props,
) => {
  const { assetId, menuNodesFactory, children, bottomRightAdornment } = props;
  const {
    classes: { container, menuIcon },
  } = useGridItemStyles();
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  const { thumbnailImage } = useThumbnailImage({
    targetId: assetId,
    targetType: ThumbnailTypes.assetThumbnail,
    bottomRightAdornment,
    returnPolicy: ReturnPolicy.PlaceHolder,
  });

  const menuNodes = useMemo(() => menuNodesFactory(setMenuOpen), [menuNodesFactory]);
  return (
    <div className={container}>
      <CreatorDashboardLink
        tabIndex={0}
        href={dashboard.getConfigureCreatorStoreItemUrl(assetId)}
        underline='none'
        color='inherit'>
        {thumbnailImage}
        {children}
      </CreatorDashboardLink>
      <OperationMenu
        iconClass={menuIcon}
        menuItems={menuNodes}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />
    </div>
  );
};

export default GridItemContainer;
