import { TableCell, type TTableCellAlign } from '@rbx/foundation-ui';

import Creative from '@components/common/Creative';
import { openReachCreativePreviewDialog } from '@components/common/dialogs/ReachCreativePreviewDialog';
import EntityIdTooltip from '@components/reporting/EntityIdTooltip';
import useReachTableCreativeCellStyles from '@components/reporting/ReachTableCreativeCell.styles';
import { defaultAlign } from '@constants/genericManagementTableStyles';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import type { ReachTablePreviewData } from '@type/genericManagementTable';

/**
 * Creative cell for Reach ads in the management table. Shows only the
 * background asset thumbnail (sized to match `TableCreativeCell` so the
 * column stays aligned across campaign types) and opens the rich
 * `TwoByOneTile` preview in a dialog on click — the logo / headline /
 * subtitle / CTA overlays are illegible at table scale, so they only
 * appear in the dialog where they're at native size.
 */
const ReachTableCreativeCell = ({
  align = defaultAlign,
  className,
  copyToClipboardContent,
  reachPreview,
}: {
  align: TTableCellAlign;
  className?: string;
  copyToClipboardContent: string;
  reachPreview: ReachTablePreviewData;
}) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Report);
  const {
    classes: { creative, previewButton },
  } = useReachTableCreativeCellStyles();

  return (
    <TableCell align={align} className={className}>
      <EntityIdTooltip copyToClipboardContent={copyToClipboardContent}>
        <button
          aria-label={translate('Label.Preview')}
          className={previewButton}
          onClick={() => openReachCreativePreviewDialog(reachPreview)}
          type='button'>
          <Creative assetId={reachPreview.backgroundAssetId} className={creative} />
        </button>
      </EntityIdTooltip>
    </TableCell>
  );
};

export default ReachTableCreativeCell;
