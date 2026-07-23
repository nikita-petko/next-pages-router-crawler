import { IconButton } from '@rbx/foundation-ui';
import { Tooltip } from '@rbx/ui';
import { ReactElement } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';

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
    <Tooltip
      placement='top-start'
      slotProps={{
        popper: {
          className: tooltipPopper,
          modifiers: [
            {
              name: 'offset',
              options: {
                offset: [0, -6], // to achieve 8px marginBottom vs. default 14px
              },
            },
          ],
        },
      }}
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
    </Tooltip>
  );
};

export default EntityIdTooltip;
