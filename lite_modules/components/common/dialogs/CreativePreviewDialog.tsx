import { DialogHeroMedia, DialogTitle } from '@rbx/foundation-ui';
import { type ReactElement } from 'react';

import CreativeAssetImage from '@components/common/CreativeAssetImage';
import { openDialog } from '@components/common/dialog/actions';
import type { BaseInjectedDialogProps } from '@components/common/dialog/types';
import styles from '@components/common/dialogs/CreativePreviewDialog.module.css';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

interface CreativePreviewDialogProps extends BaseInjectedDialogProps {
  assetId: number;
}

/**
 * Media-first lightbox for viewing a creative thumbnail at full size. Composes
 * Foundation primitives directly (not BaseDialog) because the layout is
 * hero-media-only with no footer actions.
 */
const CreativePreviewDialog = ({ assetId }: CreativePreviewDialogProps): ReactElement => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Report);

  return (
    <>
      <DialogHeroMedia className={styles.heroMedia}>
        <CreativeAssetImage assetId={assetId} className='width-full' />
      </DialogHeroMedia>
      <DialogTitle hidden>{translate('Description.CreativeAlt')}</DialogTitle>
    </>
  );
};

export const openCreativePreviewDialog = (assetId: number): void => {
  openDialog({
    component: CreativePreviewDialog,
    options: { hasCloseAffordance: true, size: 'Large' },
    props: { assetId },
  });
};

export default CreativePreviewDialog;
