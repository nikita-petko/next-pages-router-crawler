import { memo } from 'react';
import { clsx } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Button } from '@rbx/ui';
import {
  useBulkToggleAction,
  useHasViewableSelection,
  type BulkToggleAction,
} from '@modules/monetization-shared/table-selection/hooks';
import type { GamePass } from '../types';
import CreatePassButton from './common/CreatePassButton';

type Props = {
  universeId: number;
  onBulkAction: (action: Exclude<BulkToggleAction, 'none'>) => void;
  /** Disable state for the bulk button (e.g. raw mutation isPending). */
  isBulkActionDisabled?: boolean;
  /** Loading spinner state (e.g. active bulk submit). */
  isBulkActionPending?: boolean;
  className?: string;
};

const ToggleRegionalPricingButton = memo(
  ({
    onBulkAction,
    isBulkActionDisabled,
    isBulkActionPending,
  }: Omit<Props, 'universeId' | 'className'>) => {
    const { translate } = useTranslation();

    const action = useBulkToggleAction((pass: GamePass) => pass.isRegionalPricingEnabled);

    if (action === 'none') {
      return null;
    }

    return (
      <Button
        variant='contained'
        size='large'
        color='secondary'
        disabled={isBulkActionDisabled}
        loading={isBulkActionPending}
        onClick={() => onBulkAction(action)}>
        {action === 'enabling'
          ? translate('Action.EnableRegionalPricing')
          : translate('Action.DisableRegionalPricing')}
      </Button>
    );
  },
);
ToggleRegionalPricingButton.displayName = 'ToggleRegionalPricingButton';

const CreateOrBulkActionButton = memo(
  ({
    universeId,
    onBulkAction,
    isBulkActionDisabled,
    isBulkActionPending,
  }: Omit<Props, 'className'>) => {
    const hasSelection = useHasViewableSelection();

    if (!hasSelection) {
      return <CreatePassButton universeId={universeId} />;
    }

    return (
      <ToggleRegionalPricingButton
        onBulkAction={onBulkAction}
        isBulkActionDisabled={isBulkActionDisabled}
        isBulkActionPending={isBulkActionPending}
      />
    );
  },
);
CreateOrBulkActionButton.displayName = 'CreateOrBulkActionButton';

function PassesActionBar({
  universeId,
  onBulkAction,
  isBulkActionDisabled,
  isBulkActionPending,
  className,
}: Props) {
  return (
    <div className={clsx('flex justify-start items-center gap-[10px]', className)}>
      <CreateOrBulkActionButton
        universeId={universeId}
        onBulkAction={onBulkAction}
        isBulkActionDisabled={isBulkActionDisabled}
        isBulkActionPending={isBulkActionPending}
      />
    </div>
  );
}

export default memo(PassesActionBar);
