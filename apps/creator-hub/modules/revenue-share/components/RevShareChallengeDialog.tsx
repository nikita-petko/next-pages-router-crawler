// Hosts the 2SV challenge iframe in a dialog stacked above the lifecycle dialog. Radix only grants
// pointer events and an active focus scope to its topmost layer, so the challenge has to be a layer
// of its own instead of a bare node on document.body that the lifecycle dialog fights with.
import type { CSSProperties, FunctionComponent } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useChallengeFrame from '../hooks/useChallengeFrame';

// The challenge iframe covers the viewport on its own, so this layer contributes no visuals. These
// stay inline because the dialog sizes itself through `.foundation-web-dialog-content[data-size]`,
// which outranks any utility class.
const INVISIBLE_CONTENT_STYLE: CSSProperties = {
  background: 'none',
  border: 'none',
  boxShadow: 'none',
  minWidth: 0,
  maxWidth: 'none',
  width: 0,
  height: 0,
  padding: 0,
};

const noop = () => undefined;

const RevShareChallengeDialog: FunctionComponent = () => {
  const { isActive, setHost } = useChallengeFrame();
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());

  const title = tPendingTranslation(
    '2-Step Verification',
    'Accessible title for the 2-step verification challenge shown over a revenue share dialog.',
    translationKey('Label.TwoStepVerification', TranslationNamespace.RevenueShareAgreements),
  );

  return (
    <Dialog
      open={isActive}
      onOpenChange={noop}
      size='Small'
      isModal={false}
      hasCloseAffordance={false}>
      <DialogContent style={INVISIBLE_CONTENT_STYLE}>
        <DialogTitle hidden>{title}</DialogTitle>
        <div ref={setHost} />
      </DialogContent>
    </Dialog>
  );
};

export default RevShareChallengeDialog;
