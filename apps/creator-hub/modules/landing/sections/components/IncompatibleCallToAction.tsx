import type { FunctionComponent } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Button } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';
import { captureLandingPageEvent } from '../utils/eventUtils';
import useStudioStyles from './StudioV2.styles';

const { docs } = creatorHub;
const IncompatibleCallToAction: FunctionComponent<{ shouldShowCreatePlace: boolean }> = ({
  shouldShowCreatePlace,
}) => {
  const { translate } = useTranslation();
  const {
    classes: { buttonLarge },
  } = useStudioStyles();
  return (
    <Button
      fullWidth
      className={buttonLarge}
      color='primary'
      variant='contained'
      size='large'
      onClick={() => {
        captureLandingPageEvent('clickMobileStartCreating');
        setTimeout(() => {
          window.open(docs.getSettingUpStudioUrl(), '_self');
        }, 100);
      }}>
      {shouldShowCreatePlace
        ? translate('Action.GetRobloxStudio')
        : translate('Action.StartCreating')}
    </Button>
  );
};

export default withTranslation(IncompatibleCallToAction, [TranslationNamespace.Landing]);
