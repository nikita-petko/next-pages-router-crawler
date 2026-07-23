import { FC } from 'react';
import { Button, FiberManualRecordIcon, TButtonProps } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useRAQIV2TranslationDependencies } from '@modules/experience-analytics-shared';
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
