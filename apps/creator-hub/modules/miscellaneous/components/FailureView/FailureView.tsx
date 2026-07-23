import alertDark from '@rbx/foundation-images/pictograms/alert_dark.svg';
import alertLight from '@rbx/foundation-images/pictograms/alert_light.svg';
import { Button, clsx } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import TranslationNamespace from '../../localization/enums/TranslationNamespace';
import ThemedImage from '../ThemedImage';

export interface FailureViewProps {
  title?: string;
  message: string;
  buttonText?: string;
  onReload?: () => void;
  className?: string;
}

const FailureView = ({ title, message, buttonText, onReload, className }: FailureViewProps) => {
  const { translate } = useTranslation();

  return (
    <div className={clsx('flex flex-col justify-center items-center size-full', className)}>
      <ThemedImage lightSrc={alertLight} darkSrc={alertDark} alt='failure' />

      <div className='flex flex-col text-align-x-center gap-small margin-bottom-medium'>
        <h2 className='text-heading-small content-emphasis margin-none'>
          {title || translate('Heading.GenericError')}
        </h2>
        <span className='text-body-medium content-default'>{message}</span>
      </div>
      {onReload && (
        <Button variant='Standard' size='Medium' onClick={onReload}>
          {buttonText || translate('Action.FailedToLoadPage')}
        </Button>
      )}
    </div>
  );
};

export default withTranslation(FailureView, [TranslationNamespace.Error]);
