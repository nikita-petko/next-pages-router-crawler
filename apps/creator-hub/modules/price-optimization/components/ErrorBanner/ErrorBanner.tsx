import { Alert, AlertTitle, CloseIcon, IconButton, Link } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { usePricingErrorContext } from '../../providers/PricingErrorProvider';
import { supportLink } from '../../constants/links';

const ErrorBanner = () => {
  const { translate, translateHTML } = useTranslation();
  const { hasError, setHasError } = usePricingErrorContext();

  const errorAlertComponent = hasError ? (
    <Alert
      severity='error'
      action={
        <IconButton aria-label='Close' color='secondary' onClick={() => setHasError(false)}>
          <CloseIcon />
        </IconButton>
      }>
      <AlertTitle>{translate('Heading.Error')}</AlertTitle>
      {translateHTML('Message.Error', [
        {
          opening: 'linkStart',
          closing: 'linkEnd',
          content(chunks) {
            return (
              <Link href={supportLink} target='_blank'>
                {chunks}
              </Link>
            );
          },
        },
      ])}
    </Alert>
  ) : null;

  return errorAlertComponent;
};

export default ErrorBanner;
