import { ProgressCircle } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';

export function ProgressCircleLoader() {
  const { translate } = useTranslation();

  return (
    <div className='flex justify-center items-center height-[320px]'>
      <ProgressCircle ariaLabel={translate('Label.Loading')} size='Large' variant='Indeterminate' />
    </div>
  );
}
