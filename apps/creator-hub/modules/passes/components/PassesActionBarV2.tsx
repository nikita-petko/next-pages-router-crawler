import { memo } from 'react';
import { Button, clsx } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import DebouncedTextInput from '@modules/monetization-shared/DebouncedTextInput';
import {
  useBulkToggleAction,
  type BulkToggleAction,
} from '@modules/monetization-shared/table-selection/hooks';
import type { GamePass } from '../types';

type SearchProps =
  | {
      searchQuery: string;
      onSearchChange: (query: string) => void;
      disableSearch?: boolean;
    }
  | {
      disableSearch: true;
      searchQuery?: never;
      onSearchChange?: never;
    };

type BulkActionProps =
  | {
      onBulkAction: (action: Exclude<BulkToggleAction, 'none'>) => void;
      isBulkActionPending?: boolean;
      isBulkActionDisabled?: boolean;
      hideBulkAction?: boolean;
    }
  | {
      hideBulkAction: true;
      onBulkAction?: never;
      isBulkActionPending?: never;
      isBulkActionDisabled?: never;
    };

type Props = SearchProps &
  BulkActionProps & {
    className?: string;
  };

const ToggleManagedPricingButton = memo(
  ({
    onBulkAction,
    isBulkActionPending,
    isBulkActionDisabled,
  }: Omit<BulkActionProps, 'hideBulkAction'>) => {
    const { translate } = useTranslation();

    const action = useBulkToggleAction((pass: GamePass) => pass.isManagedPricingEnabled);

    return (
      <Button
        className={clsx(
          'min-width-full medium:min-width-fit',
          action === 'none' && 'medium:invisible',
        )}
        variant={action === 'enabling' ? 'Emphasis' : 'Standard'}
        size='Medium'
        isDisabled={!!isBulkActionDisabled || action === 'none'}
        isLoading={isBulkActionPending}
        onClick={() => action !== 'none' && onBulkAction?.(action)}>
        {action === 'disabling'
          ? translate('Action.DisableManagedPricing')
          : translate('Action.EnableManagedPricing')}
      </Button>
    );
  },
);
ToggleManagedPricingButton.displayName = 'ToggleManagedPricingButton';

function PassesActionBarV2({
  searchQuery,
  onSearchChange,
  disableSearch,
  onBulkAction,
  isBulkActionPending,
  isBulkActionDisabled,
  hideBulkAction,
  className,
}: Props) {
  const { translate } = useTranslation();

  return (
    <div
      className={clsx(
        'flex flex-col gap-medium medium:flex-row medium:justify-between medium:items-center',
        className,
      )}>
      <div className='flex items-center gap-medium medium:flex-row medium:width-[70%]'>
        <DebouncedTextInput
          className='medium:min-width-[180px] medium:grow-1 medium:max-width-[280px]'
          value={searchQuery}
          type='search'
          onDebouncedChange={onSearchChange}
          placeholder={translate('Label.Search')}
          leadingIconName='icon-regular-magnifying-glass'
          isDisabled={disableSearch}
          aria-label={translate('Label.SearchItems')}
          size='Medium'
        />
      </div>

      {!hideBulkAction && (
        <ToggleManagedPricingButton
          onBulkAction={onBulkAction}
          isBulkActionPending={isBulkActionPending}
          isBulkActionDisabled={isBulkActionDisabled}
        />
      )}
    </div>
  );
}

export default memo(PassesActionBarV2);
