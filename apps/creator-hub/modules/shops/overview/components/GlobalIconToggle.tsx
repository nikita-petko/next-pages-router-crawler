import { Link, Toggle } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { GLOBAL_ICON_ENTRY_POINT_NAME } from '../../constants';
import { usePersonalizedShop } from '../../hooks/usePersonalizedShop';
import { useUpdateEntryPoints } from '../../queries/useUpdateEntryPoints';
import { openShopButtonDetailsDialog } from '../dialogs/ShopButtonDetailsDialog';

export default function GlobalIconToggle({ universeId }: { universeId: number }) {
  const { data: shop } = usePersonalizedShop(universeId);
  const { mutate } = useUpdateEntryPoints(universeId);
  const { translate } = useTranslation();

  if (!shop) {
    return null;
  }

  const globalIconEntryPoint = shop.entryPoints.find(
    (ep) => ep.name === GLOBAL_ICON_ENTRY_POINT_NAME,
  );

  if (!globalIconEntryPoint) {
    return null;
  }

  return (
    <div className='flex items-center gap-large'>
      <div className='flex flex-col'>
        <span className='text-heading-small'>{translate('Label.ShopButton')}</span>
        <div className='flex flex-col items-start gap-xsmall medium:flex-row medium:items-center'>
          <span id='shop-button-description' className='text-body-medium'>
            {translate('Description.ShopButton')}
          </span>
          <Link
            as='button'
            color='Standard'
            underline='always'
            size='Medium'
            className='text-no-wrap'
            onClick={openShopButtonDetailsDialog}>
            {translate('Action.ViewShopButtonDetails')}
          </Link>
        </div>
      </div>
      <Toggle
        aria-label={translate('Label.AriaLabel.ShopButton')}
        aria-describedby='shop-button-description'
        size='Medium'
        placement='End'
        isChecked={globalIconEntryPoint.isEnabled}
        onCheckedChange={(isChecked) =>
          mutate({
            shopId: shop.shopId,
            entryPoints: [{ name: GLOBAL_ICON_ENTRY_POINT_NAME, isEnabled: isChecked }],
          })
        }
      />
    </div>
  );
}
