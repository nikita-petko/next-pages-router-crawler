import type { FC } from 'react';
import type { TButtonProps } from '@rbx/ui';
import { Button, FiberManualRecordIcon } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useLiveEventsButtonStyles from './LiveEventsButton.styles';

const LiveEventsButton: FC<TButtonProps & { showRecordIcon?: boolean }> = ({
  showRecordIcon = true,
  ...props
}) => {
  const { translate } = useRAQIV2TranslationDependencies();
  const {
    classes: { button },
  } = useLiveEventsButtonStyles();
  return (
    <Button
      variant='outlined'
      className={button}
      endIcon={showRecordIcon ? <FiberManualRecordIcon /> : undefined}
      {...props}
      data-testid='live-events-button'>
      {translate(translationKey('Label.LiveEvents', TranslationNamespace.Analytics))}
    </Button>
  );
};

export default LiveEventsButton;
