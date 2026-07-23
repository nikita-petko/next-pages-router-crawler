import { memo, useCallback } from 'react';
import NextLink from 'next/link';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  useOneTimeDisclaimer,
  useOneTimeDisclaimerState,
} from '@modules/monetization-shared/useOneTimeDisclaimer';
import { ROBLOX_TERMS_OF_USE } from '@modules/miscellaneous/common/constants/linkConstants';
import { useAcceptManagedPricing } from '@modules/managed-pricing/queries/useAcceptManagedPricing';
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
                  <NextLink
                    className='content-link no-underline hover:underline'
                    target='_blank'
                    href={ROBLOX_TERMS_OF_USE}>
                    {chunks}
                  </NextLink>
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
