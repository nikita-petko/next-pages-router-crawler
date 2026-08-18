import { ProgressCircle } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useIpContent from '../../hooks/useIpContent';
import TrademarkContentGrid from './TrademarkContentGrid';

type TrademarkContentGridByIdProps = {
  accountId: string;
  trademarkId: string;
  enabled?: boolean;
};

/**
 * TrademarkContentGridById fetches trademark content by account and IP Content ID before displaying it in the claims/removal request table.
 */
const TrademarkContentGridById = ({
  accountId,
  trademarkId,
  enabled = true,
}: TrademarkContentGridByIdProps) => {
  const { ready, translate } = useTranslation();
  const { data: content, error, isPending } = useIpContent(accountId, trademarkId, enabled);

  // The parent table mounts all rows while collapsed, so defer fetching to avoid bursting the endpoint.
  if (!ready || (enabled && isPending)) {
    return (
      <ProgressCircle variant='Indeterminate' size='Small' ariaLabel={translate('Label.Loading')} />
    );
  }

  if (content !== undefined) {
    return <TrademarkContentGrid content={content} />;
  }

  return (
    <div className='flex flex-col justify-center min-width-0'>
      <span className='text-body-medium content-emphasis text-no-wrap'>
        {translate('Label.ID')}: {trademarkId}
      </span>
      {error && (
        <span className='text-body-medium content-system-alert'>
          {translate('Label.CouldNotFetchCreation')}
        </span>
      )}
    </div>
  );
};

export default withTranslation(TrademarkContentGridById, [TranslationNamespace.RightsPortal]);
