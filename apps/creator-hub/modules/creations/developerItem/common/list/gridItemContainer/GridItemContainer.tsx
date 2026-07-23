import React, {
  Dispatch,
  FunctionComponent,
  ReactNode,
  SetStateAction,
  useMemo,
  useState,
} from 'react';
import { urls } from '@modules/miscellaneous/common';
import CreatorDashboardLink from '@modules/miscellaneous/common/components/CreatorDashboardLink';
import useThumbnailImage from '@modules/miscellaneous/common/components/ThumbnailImage/useThumbnailImage';
import { ReturnPolicy, ThumbnailTypes } from '@rbx/thumbnails';
import useGridItemStyles from '../menuItems/useGridItemStyles';
import OperationMenu from '../operationMenu/OperationMenu';

const {
  creatorHub: { dashboard },
} = urls;
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
