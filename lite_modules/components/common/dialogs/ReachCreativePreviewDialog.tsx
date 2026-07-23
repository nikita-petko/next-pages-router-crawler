import { DialogHeroMedia, DialogTitle } from '@rbx/foundation-ui';
import { type ReactElement } from 'react';

import { openDialog } from '@components/common/dialog/actions';
import type { BaseInjectedDialogProps } from '@components/common/dialog/types';
import styles from '@components/common/dialogs/ReachCreativePreviewDialog.module.css';
import ReachHomeFeedTilePreview from '@components/common/ReachHomeFeedTilePreview';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import type { ReachTablePreviewData } from '@type/genericManagementTable';

interface ReachCreativePreviewDialogProps extends BaseInjectedDialogProps {
  reachPreview: ReachTablePreviewData;
}

/**
 * Media-first lightbox for the full Reach home-feed tile (logo, headline,
 * subtitle, CTA, badge). Mirrors `CreativePreviewDialog`'s shape but renders
 * the composite `TwoByOneTile` instead of a single asset image, so the
 * scaled-down version in the management table can collapse to a plain
 * thumbnail and the rich preview only appears on click.
 */
const ReachCreativePreviewDialog = ({
  reachPreview,
}: ReachCreativePreviewDialogProps): ReactElement => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Report);

  return (
    <>
      <DialogHeroMedia className={styles.heroMedia}>
        <div className={styles.tileContainer}>
          <ReachHomeFeedTilePreview
            backgroundAssetId={reachPreview.backgroundAssetId}
            headline={reachPreview.headline}
            logoAspectRatio={reachPreview.logoAspectRatio}
            logoAssetId={reachPreview.logoAssetId}
            // Lightbox is a read-only preview — render the CTA as non-interactive
            // markup so it doesn't look clickable when it isn't wired to any action.
            previewProps={{ disableCtaInteraction: true }}
            subtitle={reachPreview.subtitle}
          />
        </div>
      </DialogHeroMedia>
      <DialogTitle hidden>{translate('Description.CreativeAlt')}</DialogTitle>
    </>
  );
};

export const openReachCreativePreviewDialog = (reachPreview: ReachTablePreviewData): void => {
  openDialog({
    component: ReachCreativePreviewDialog,
    options: { hasCloseAffordance: true, size: 'Large' },
    props: { reachPreview },
  });
};

export default ReachCreativePreviewDialog;
