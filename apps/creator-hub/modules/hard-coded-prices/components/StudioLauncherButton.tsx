import { Button, clsx, Icon } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';

type Props =
  | { disabled?: boolean; onOpenInStudio: () => void }
  | { disabled: true; onOpenInStudio?: never };

function StudioLauncherButton({ onOpenInStudio, disabled }: Props) {
  const { translate } = useTranslation();
  return (
    <Button
      type='button'
      variant='ActionUtility'
      onClick={onOpenInStudio}
      isDisabled={disabled}
      className={clsx(
        'content-emphasis hover:content-link transition-colors',
        'margin-left-[-12px] [&>div]:[background:transparent_!important]', // Button overrides for link styles
      )}>
      <span className='flex flex-row items-center gap-small'>
        <Icon name='icon-regular-studio' size='Medium' />
        <span className='text-label-medium underline'>{translate('Action.OpenInStudio')}</span>
      </span>
    </Button>
  );
}

export default StudioLauncherButton;
