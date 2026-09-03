import {
  EducationalTooltip,
  EducationalTooltipBody,
  EducationalTooltipContent,
  EducationalTooltipDescription,
  EducationalTooltipTitle,
  EducationalTooltipTrigger,
  IconButton,
  Link,
} from '@rbx/foundation-ui';
import { useEffect, useRef, useState } from 'react';

import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

interface GamePreviewVideoTooltipProps {
  uploadUrl?: string;
}

const GamePreviewVideoTooltip = ({ uploadUrl }: GamePreviewVideoTooltipProps) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelScheduledClose = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const openTooltip = () => {
    cancelScheduledClose();
    setIsOpen(true);
  };

  const scheduleTooltipClose = () => {
    cancelScheduledClose();
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      closeTimeoutRef.current = null;
    }, 200);
  };

  useEffect(
    () => () => {
      cancelScheduledClose();
    },
    [],
  );

  return (
    <EducationalTooltip
      onOpenChange={(open) => {
        cancelScheduledClose();
        setIsOpen(open);
      }}
      open={isOpen}>
      <span onMouseEnter={openTooltip} onMouseLeave={scheduleTooltipClose}>
        <EducationalTooltipTrigger asChild>
          <IconButton
            ariaLabel={translate('Label.GameplayVideo')}
            data-testid='video-config-info'
            icon='icon-regular-circle-i'
            size='Small'
            variant='Utility'
          />
        </EducationalTooltipTrigger>
      </span>
      <EducationalTooltipContent
        className='!min-width-[216px] !max-width-[216px]'
        position='top-center'>
        <div onMouseEnter={cancelScheduledClose} onMouseLeave={scheduleTooltipClose}>
          <EducationalTooltipBody className='padding-small'>
            <EducationalTooltipTitle>
              <span className='text-caption-medium'>{translate('Label.GameplayVideo')}</span>
            </EducationalTooltipTitle>
            <EducationalTooltipDescription>
              <div className='text-body-small'>
                {translate('Description.GameplayVideoTooltip')}
                {uploadUrl ? (
                  <>
                    <br />
                    <Link
                      color='Standard'
                      href={uploadUrl}
                      rel='noopener noreferrer'
                      size='Small'
                      target='_blank'
                      underline='always'
                      variant='Inline'>
                      {translate('Action.UploadGameplayVideo')}
                    </Link>
                  </>
                ) : null}
              </div>
            </EducationalTooltipDescription>
          </EducationalTooltipBody>
        </div>
      </EducationalTooltipContent>
    </EducationalTooltip>
  );
};

export default GamePreviewVideoTooltip;
