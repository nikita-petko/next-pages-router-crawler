import { IconButton } from '@rbx/foundation-ui';
import { ReactElement } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';

import AppTooltip from '@components/common/AppTooltip';
import useTableNameCellStyles from '@components/reporting/TableNameCell.styles';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

const EntityIdTooltip = ({
  children,
  copyToClipboardContent,
}: {
  children: ReactElement;
  copyToClipboardContent: string;
}) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Report);
  const {
    classes: { tooltipContent, tooltipPopper, tooltipText },
  } = useTableNameCellStyles({});

  return (
    <AppTooltip
      contentClassName={tooltipPopper}
      position='top-start'
      title={
        <div className={tooltipContent}>
          <span className={tooltipText}>{copyToClipboardContent}</span>
          <CopyToClipboard text={copyToClipboardContent}>
            <IconButton
              ariaLabel={translate('Description.CopyToClipboard')}
              icon='icon-regular-two-stacked-squares'
              iconColor='Inverse'
              size='Small'
              variant='Utility'
            />
          </CopyToClipboard>
        </div>
      }>
      {children}
    </AppTooltip>
  );
};

export default EntityIdTooltip;
