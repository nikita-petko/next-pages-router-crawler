import { Button, DialogBody, DialogContent, DialogFooter, DialogTitle } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { closeDialog, openDialog } from '@modules/monetization-shared/dialog/actions';

const shopButtonDetailsIllustrationLink = `${process.env.assetPathPrefix}/shops/shop-button-example.webp`;

type Props = {
  onClose: () => void;
};

function ShopButtonDetailsDialogContent({ onClose }: Props) {
  const { translate } = useTranslation();

  return (
    <DialogContent className='width-full'>
      <DialogBody className='flex flex-col gap-large'>
        <DialogTitle className='text-heading-small content-emphasis margin-none'>
          {translate('Heading.ShopButtonTooltip')}
        </DialogTitle>
        <div className='flex flex-col gap-medium'>
          <div className='aspect-[16/9] width-full radius-small bg-shift-400 clip'>
            <img
              src={shopButtonDetailsIllustrationLink}
              alt=''
              className='size-full [object-fit:cover]'
            />
          </div>
          <span className='text-body-medium content-default margin-none'>
            {translate('Description.ShopButtonTooltip')}
          </span>
        </div>
      </DialogBody>
      <DialogFooter className='flex'>
        <Button variant='Standard' size='Medium' className='width-full' onClick={onClose}>
          {translate('Action.Close')}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

const TranslatedShopButtonDetailsDialogContent = withTranslation(ShopButtonDetailsDialogContent, [
  TranslationNamespace.PersonalizedShop,
]);

export function openShopButtonDetailsDialog() {
  openDialog({
    content: <TranslatedShopButtonDetailsDialogContent onClose={closeDialog} />,
    options: { size: 'Small' },
  });
}
