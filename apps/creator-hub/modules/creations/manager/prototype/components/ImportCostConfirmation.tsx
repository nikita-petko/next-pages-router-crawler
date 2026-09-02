import { memo, type FunctionComponent } from 'react';
import { Icon } from '@rbx/foundation-ui';
import ConfirmationSheet from '@modules/miscellaneous/components/ConfirmationSheet/ConfirmationSheet';
import type { ImportQueueTranslations } from '../useImportQueueTranslations';

export type ImportCostConfirmationProps = {
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  totalCost: number;
  translations: ImportQueueTranslations;
  videoCount: number;
};

const ImportCostConfirmation: FunctionComponent<ImportCostConfirmationProps> = ({
  onCancel,
  onConfirm,
  open,
  totalCost,
  translations,
  videoCount,
}) => (
  <ConfirmationSheet
    open={open}
    onOpenChange={(nextOpen) => {
      if (!nextOpen) {
        onCancel();
      }
    }}
    title={translations.confirmUploadCosts}
    description={
      <>
        <span className='block'>{translations.costConfirmationDescription}</span>
        <span className='block padding-top-small'>
          {translations.uploadFeeBreakdown(videoCount)}
        </span>
        <strong className='inline-flex items-center gap-xxsmall padding-top-medium'>
          {translations.totalCost(
            totalCost.toLocaleString(),
            <Icon name='icon-filled-robux' size='Small' aria-label={translations.robux} />,
          )}
        </strong>
      </>
    }
    confirmLabel={translations.confirmAndImport}
    onConfirm={onConfirm}
  />
);

export default memo(ImportCostConfirmation);
