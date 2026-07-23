import React, { FunctionComponent, ReactNode, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Alert, AlertTitle, Button, makeStyles } from '@rbx/ui';
import { useSettings } from '@modules/settings';
import {
  hasPremiumSubscription,
  isUserAgeVerified,
} from '../../verification/hooks/VerificationMetadataContext';
import { useVerificationMetadata } from '../../verification';

export interface GenericVerificationAlertProps {
  alertTitle: string | undefined;
  alertDescription: string | ReactNode | undefined;
  severity: 'info' | 'warning' | 'error';
  externalLink: string | undefined;
  linkLabel: string | undefined;
  allowCloseDialog: boolean;
}

const useVerificationStyles = makeStyles()(() => ({
  alertStyle: {
    width: '100%',
  },
}));

const GenericVerificationAlert: FunctionComponent<
  React.PropsWithChildren<GenericVerificationAlertProps>
> = ({ alertTitle, alertDescription, severity, externalLink, linkLabel, allowCloseDialog }) => {
  const {
    classes: { alertStyle },
  } = useVerificationStyles();
  const [showAlert, setShowAlert] = useState<boolean>(true);

  if (showAlert) {
    return (
      <Alert
        severity={severity}
        onClose={undefined}
        className={alertStyle}
        action={
          <React.Fragment>
            <Button color='inherit' size='small' href={externalLink}>
              {linkLabel}
            </Button>
            {allowCloseDialog && (
              <Button size='small' onClick={() => setShowAlert(false)}>
                x
              </Button>
            )}
          </React.Fragment>
        }>
        <AlertTitle>{alertTitle}</AlertTitle>
        {alertDescription}
      </Alert>
    );
  }
  return null;
};

function VerificationAlert() {
  const { settings } = useSettings();
  const blackbirdEnabled = settings?.enableBlackbird ?? false;
  const verificationMetadata = useVerificationMetadata();
  const hasPremium = hasPremiumSubscription(verificationMetadata);
  const isIdVerified = isUserAgeVerified(verificationMetadata);
  const { translate } = useTranslation();

  const verifyAccountHref = `https://www.${process.env.robloxSiteDomain}/my/account#!/info`;
  const subscriptionHref = blackbirdEnabled
    ? `https://${process.env.robloxSiteDomain}/blackbird`
    : `https://www.${process.env.robloxSiteDomain}/premium/membership`;

  if (hasPremium && isIdVerified) {
    return null;
  }

  return (
    <div style={{ marginBottom: '32px' }}>
      <div>
        {!hasPremium && !isIdVerified ? (
          <GenericVerificationAlert
            alertTitle={translate(
              blackbirdEnabled
                ? 'Heading.IdVerificationBlackbirdRequired'
                : 'Heading.IdVerificationPremiumRequired',
            )}
            alertDescription={translate(
              blackbirdEnabled
                ? 'Description.IdVerificationBlackbirdUnified'
                : 'Description.IdVerificationPremiumUnified',
            )}
            severity='info'
            externalLink={verifyAccountHref}
            linkLabel={translate('Label.VerifyId')}
            allowCloseDialog={false}
          />
        ) : (
          <div>
            {!isIdVerified ? (
              <GenericVerificationAlert
                alertTitle={translate('Heading.IdVerificationRequired')}
                alertDescription={translate('Description.IdVerificationUnified')}
                severity='info'
                externalLink={verifyAccountHref}
                linkLabel={translate('Label.VerifyId')}
                allowCloseDialog={false}
              />
            ) : (
              !hasPremium && (
                <GenericVerificationAlert
                  alertTitle={translate(
                    blackbirdEnabled ? 'Heading.BlackbirdRequired' : 'Heading.PremiumRequired',
                  )}
                  alertDescription={translate(
                    blackbirdEnabled
                      ? 'Description.BlackbirdRequired'
                      : 'Description.PremiumRequiredUnified',
                  )}
                  severity='info'
                  externalLink={subscriptionHref}
                  linkLabel={translate(
                    blackbirdEnabled ? 'Label.GetBlackbird' : 'Label.GetPremium',
                  )}
                  allowCloseDialog={false}
                />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default VerificationAlert;
