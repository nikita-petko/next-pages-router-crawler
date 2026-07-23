import type { ForwardRefRenderFunction } from 'react';
import { forwardRef } from 'react';
import { useTranslation } from '@rbx/intl';
import { Link, makeStyles, MenuItem, OpenInNewIcon } from '@rbx/ui';
import { creatorHub } from '@modules/miscellaneous/urls';

const { creatorStore } = creatorHub;
export type TOpenAssetDetailsProps = {
  assetId: number;
  onCloseMenu?: () => void;
};

const useStyles = makeStyles()({
  menuItemIcon: {
    marginLeft: 8,
  },
});

const OpenAssetDetails: ForwardRefRenderFunction<HTMLLIElement, TOpenAssetDetailsProps> = (
  { assetId, onCloseMenu },
  ref,
) => {
  const {
    classes: { menuItemIcon },
  } = useStyles();
  const { translate } = useTranslation();
  if (process.env.buildTarget === 'luobu') {
    return null;
  }
  return (
    <Link
      color='inherit'
      underline='none'
      onClick={() => {
        if (onCloseMenu) {
          onCloseMenu();
        }
      }}
      href={creatorStore.getAssetUrl(assetId)}
      target='__blank'>
      <MenuItem key='action.OpenAssetDetails' ref={ref}>
        {translate('Action.OpenAssetDetails')}
        <OpenInNewIcon className={menuItemIcon} />
      </MenuItem>
    </Link>
  );
};

export default forwardRef(OpenAssetDetails);
