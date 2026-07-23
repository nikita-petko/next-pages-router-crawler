import type { FunctionComponent, ReactNode } from 'react';
import React, { useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Alert, AlertTitle, Button, makeStyles } from '@rbx/ui';
import useVerificationMetadata from '../../verification/hooks/useVerificationMetadata';
import {
  hasPremiumSubscription,
  isUserAgeVerified,
} from '../../verification/hooks/VerificationMetadataContext';

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
          <>
            <Button color='inherit' size='small' href={externalLink}>
              {linkLabel}
            </Button>
            {allowCloseDialog && (
              <Button size='small' onClick={() => setShowAlert(false)}>
                x
              </Button>
            )}
          </>
        }>
        <AlertTitle>{alertTitle}</AlertTitle>
        {alertDescription}
      </Alert>
    );
  }
  return null;
};

function VerificationAlert() {
  const verificationMetadata = useVerificationMetadata();
  const hasPremium = hasPremiumSubscription(verificationMetadata);
  const isIdVerified = isUserAgeVerified(verificationMetadata);
  const { translate } = useTranslation();

  const verifyAccountHref = `https://www.${process.env.robloxSiteDomain}/my/account#!/info`;
  const subscriptionHref = `https://${process.env.robloxSiteDomain}/plus`;

  if (hasPremium && isIdVerified) {
    return null;
  }

  return (
    <div style={{ marginBottom: '32px' }}>
      <div>
        {!hasPremium && !isIdVerified ? (
          <GenericVerificationAlert
            alertTitle={translate('Heading.IdVerificationBlackbirdRequired')}
            alertDescription={translate('Description.IdVerificationBlackbirdUnified')}
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
                  alertTitle={translate('Heading.BlackbirdRequired')}
                  alertDescription={translate('Description.BlackbirdRequired')}
                  severity='info'
                  externalLink={subscriptionHref}
                  linkLabel={translate('Label.GetBlackbird')}
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
