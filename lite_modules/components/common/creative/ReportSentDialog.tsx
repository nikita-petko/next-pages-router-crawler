import { DialogBody, DialogTitle } from '@rbx/foundation-ui';
import type { ReactElement } from 'react';

import { openDialog } from '@components/common/dialog/actions';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

// Roblox legal / safety destinations surfaced in the post-report confirmation.
// Terms URL matches the one already used by the AI Create agreement copy in this
// module so the two surfaces point at the same canonical page.
const TERMS_OF_USE_URL = 'https://www.roblox.com/info/terms';
const ROBLOX_SAFETY_URL =
  'https://en.help.roblox.com/hc/en-us/categories/200213830-Safety-Civility';

/**
 * Confirmation shown after a user successfully reports an AI-generated creative.
 * Matches the Figma "Report has been sent" modal: title + body paragraph + two
 * informational links, dismissed only via the close affordance (no footer
 * actions), so it's opened with `hasCloseAffordance` and composes the raw
 * Foundation primitives rather than `BaseDialog` (which mandates a footer).
 */
const ReportSentDialog = (): ReactElement => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.CreativeLibrary);

  return (
    <DialogBody className='flex flex-col gap-y-small'>
      <DialogTitle className='text-heading-medium margin-none'>
        {translate('Heading.ReportSent')}
      </DialogTitle>
      <p className='text-body-medium content-default margin-none'>
        {translate('Description.ReportSent')}
      </p>
      <div className='flex flex-col gap-small'>
        <a
          className='text-title-medium content-default self-start'
          href={TERMS_OF_USE_URL}
          rel='noopener noreferrer'
          target='_blank'>
          {translate('Action.ViewTermsOfUse')}
        </a>
        <a
          className='text-title-medium content-default self-start'
          href={ROBLOX_SAFETY_URL}
          rel='noopener noreferrer'
          target='_blank'>
          {translate('Action.ReadAboutRobloxSafety')}
        </a>
      </div>
    </DialogBody>
  );
};

export const openReportSentDialog = (): void => {
  openDialog({ component: ReportSentDialog, options: { hasCloseAffordance: true } });
};

export default ReportSentDialog;
