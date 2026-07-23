import { memo, useCallback } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@rbx/ui';
import { useAcceptManagedPricing } from '@modules/managed-pricing/queries/useAcceptManagedPricing';
import { ROBLOX_TERMS_OF_USE } from '@modules/miscellaneous/common/constants/linkConstants';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Link } from '@modules/monetization-shared/link';
import {
  useOneTimeDisclaimer,
  useOneTimeDisclaimerState,
} from '@modules/monetization-shared/useOneTimeDisclaimer';
import { hasAcceptedRegionalPricingDisclaimerKey } from '../../localStorageKeys';

const hasAccepted = (k: string) => !!localStorage.getItem(k);

export const useRegionalPricingDisclaimer = (universeId: number) => {
  return useOneTimeDisclaimer(hasAcceptedRegionalPricingDisclaimerKey(universeId), { hasAccepted });
};

const setAccepted = (k: string) => localStorage.setItem(k, 'true');

function RegionalPricingDisclaimerModal({ universeId }: { universeId: number }) {
  const { translate, translateHTML } = useTranslation();

  const { mutateAsync: acceptManagedPricing } = useAcceptManagedPricing();
  const handleAccept = useCallback(() => {
    acceptManagedPricing({ universeId }).catch(() => {}); // fail-open
  }, [acceptManagedPricing, universeId]);

  const disclaimer = useOneTimeDisclaimerState(
    hasAcceptedRegionalPricingDisclaimerKey(universeId),
    { setAccepted, onAccept: handleAccept },
  );

  return (
    <Dialog fullWidth maxWidth='Medium' open={disclaimer.isOpen} onClose={disclaimer.close}>
      <DialogTitle>{translate('Heading.Disclaimer')}</DialogTitle>
      <DialogContent>
        <p className='text-body-medium content-muted margin-none'>
          {translateHTML(
            'Description.Disclaimer',
            [
              {
                opening: 'linkStart',
                closing: 'linkEnd',
                content: (chunks) => (
                  <Link href={ROBLOX_TERMS_OF_USE} target='_blank'>
                    {chunks}
                  </Link>
                ),
              },
            ],
            { lineBreak: <br /> },
          )}
        </p>
      </DialogContent>
      <DialogActions>
        <Button size='large' variant='contained' color='secondary' onClick={disclaimer.close}>
          {translate('Action.Decline')}
        </Button>
        <Button size='large' variant='contained' onClick={disclaimer.accept}>
          {translate('Action.Proceed')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default withTranslation(memo(RegionalPricingDisclaimerModal), [
  TranslationNamespace.RegionalPricing,
]);
