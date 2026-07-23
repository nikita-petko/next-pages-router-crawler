import { Label, Tooltip } from '@rbx/ui';
import { ReactNode } from 'react';

import useTableStatusCellStyles from '@components/reporting/TableStatusCell.styles';
import { StatusText } from '@constants/campaignStatus';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

const StatusLabel = ({
  status,
  tooltipContent,
}: {
  status: StatusText;
  tooltipContent: ReactNode;
}) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Report);
  const {
    classes: { labelClasses, statusCircle },
  } = useTableStatusCellStyles({ status });

  const displayText = translate(status).split('\n')[0];

  return (
    // For tooltip to show on StatusLabel, must wrap in a div
    <Tooltip placement='top' title={tooltipContent}>
      <div data-testid='status-label'>
        <Label
          classes={{ root: labelClasses }}
          icon={<div className={statusCircle} />}
          labelText={displayText}
          severity='default'
          variant='contained'
        />
      </div>
    </Tooltip>
  );
};

export default StatusLabel;
