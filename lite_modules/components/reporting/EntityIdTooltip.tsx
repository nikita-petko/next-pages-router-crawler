import { IconButton } from '@rbx/foundation-ui';
import { ReactElement } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';

import AppTooltip from '@components/common/AppTooltip';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

/**
 * Hover tooltip that reveals an entity's ID alongside a button to copy it.
 *
 * `pointer-events-auto` on the tooltip content is load-bearing. The content is portaled to
 * `document.body`, which Foundation's Sheet sets to `pointer-events: none` while open, and
 * Foundation bundles Tooltip and Sheet with separate copies of Radix's dismissable-layer
 * context — so the tooltip never learns to re-enable itself as a hit target. Without it the
 * copy button is visible but unclickable inside the campaign details drawer.
 */
const EntityIdTooltip = ({
  children,
  copyToClipboardContent,
}: {
  children: ReactElement;
  copyToClipboardContent: string;
}) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Report);

  return (
    <AppTooltip
      contentClassName='min-width-fit pointer-events-auto'
      position='top-start'
      title={
        <div className='self-center flex gap-xsmall justify-center whitespace-nowrap'>
          <span className='margin-y-auto'>{copyToClipboardContent}</span>
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
