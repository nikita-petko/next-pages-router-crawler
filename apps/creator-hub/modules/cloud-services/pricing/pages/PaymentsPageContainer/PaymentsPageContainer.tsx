import { useRouter } from 'next/router';
import type { FunctionComponent } from 'react';
import { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { buildTitle, buildBreadcrumb, HubMeta } from '@rbx/creator-hub-history';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogTemplate,
  Divider,
  DeleteOutlinedIcon,
  Grid,
  Typography,
  useDialog,
} from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { useAuthentication } from '@modules/authentication/providers';
import { EmptyGrid } from '@modules/miscellaneous/components';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useDeletePaymentInfo } from '@modules/react-query/serviceEfficiency';
import { parseOverrideId } from '../../../utils/common';
import useTopMessage from '../../../utils/useTopMessage';
import CloudPricingClientProvider, {
  useCloudPricingClient,
} from '../../CloudPricingClientProvider';
import PaymentMethodIcons from '../../components/PaymentMethodIcons/PaymentMethodIcons';
import { CardVerificationResultEnum } from '../../components/shared/stripeConstants';
import StripeElementsProvider from '../../components/StripeElementsProvider/StripeElementsProvider';
import type { PaymentProfile } from '../../types';
import usePaymentsPageContainerStyles from './PaymentsPageContainer.styles';

const PaymentsPageContainer: FunctionComponent = () => {
  const router = useRouter();
  const cloudPricingClient = useCloudPricingClient();
  const { user } = useAuthentication();
  const { reload: routerReload } = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { translate } = useTranslationWrapper(useTranslation());
  const [paymentProfiles, setPaymentProfiles] = useState<PaymentProfile[] | null>(null);
  const paymentId = useRef<string | null>(null);
  const { userIdOverride } = router.query;
  const {
    classes: {
      formContainer,
      paymentMethodTitle,
      upperDivider,
      lowerDivider,
      paymentProfileContainer,
      paymentIconContainer,
      deleteButton,
      addPaymentMethodButton,
    },
  } = usePaymentsPageContainerStyles();
  const { open, close, configure } = useDialog();
  const { showSuccessMessage, showFailureMessage } = useTopMessage();
  const [isPageInitFailed, setIsPageInitFailed] = useState<boolean>(false);
  const userId = useMemo(() => {
    if (user) {
      return user.id;
    }
    return null;
  }, [user]);

  const loadPageData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (userId) {
        const { paymentProfiles: resPaymentProfiles } =
          await cloudPricingClient.listPaymentProfiles(userId, parseOverrideId(userIdOverride));
        setPaymentProfiles(resPaymentProfiles);
        setIsPageInitFailed(false);
      } else {
        setIsPageInitFailed(true);
      }
    } catch {
      setIsPageInitFailed(true);
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, cloudPricingClient, userId, userIdOverride]);

  // We can only delete user level payment profiles because we do not save group level.
  const { mutateAsync: deletePayment } = useDeletePaymentInfo(userId, () => paymentId.current);

  const handleStripeElementsProviderResponse = useCallback(
    async (stripeResponse: CardVerificationResultEnum) => {
      if (stripeResponse === CardVerificationResultEnum.SUCCESS) {
        showSuccessMessage(
          translate(
            translationKey(
              'Message.PaymentMethodSuccessfullyAdded',
              TranslationNamespace.CloudServices,
            ),
          ),
        );
        close();
        loadPageData();
      } else if (
        stripeResponse === CardVerificationResultEnum.CARD_AUTHENTICATION_FAILED ||
        stripeResponse === CardVerificationResultEnum.UNKNOWN_ERROR
      ) {
        showFailureMessage(
          translate(
            translationKey('Message.PaymentMethodFailedToAuth', TranslationNamespace.CloudServices),
          ),
        );
        close();
      }
    },
    [close, showFailureMessage, showSuccessMessage, translate, loadPageData],
  );

  const deletePaymentMethod = useCallback(
    async (paymentProfileId: string) => {
      if (userId && paymentProfileId) {
        try {
          await deletePayment();
          setPaymentProfiles(
            (profiles) =>
              profiles?.filter((profile) => profile.paymentProfileId !== paymentProfileId) ?? [],
          );
        } catch {
          showFailureMessage(
            translate(
              translationKey(
                'Description.PaymentFailedToDelete',
                TranslationNamespace.CloudServices,
              ),
            ),
          );
        }
      }
      close();
    },
    [deletePayment, userId, showFailureMessage, translate, close],
  );

  const stripeDialog = useMemo(
    () =>
      userId ? (
        <CloudPricingClientProvider>
          <StripeElementsProvider
            creatorId={userId}
            setAsDefault={false}
            closeDialog={close}
            step={0}
            enableDialog
            handleStripeResponse={handleStripeElementsProviderResponse}
            confirmAddressAndCard={() => {}}
          />
        </CloudPricingClientProvider>
      ) : null,
    [close, userId, handleStripeElementsProviderResponse],
  );

  const onCreateApp = () => {
    configure(stripeDialog);
    open();
  };

  const deletePaymentDialog = useMemo(
    () => (
      <Dialog open maxWidth='Medium' onClose={close}>
        <DialogTemplate
          cancelText={translate(translationKey('Label.Cancel', TranslationNamespace.CloudServices))}
          color='destructive'
          confirmText={translate(
            translationKey('Label.Delete', TranslationNamespace.CloudServices),
          )}
          content={
            <div>
              <Divider className={upperDivider} />
              {translate(
                translationKey(
                  'Description.DeletePaymentMethod',
                  TranslationNamespace.CloudServices,
                ),
              )}
              <Divider className={lowerDivider} />
            </div>
          }
          onCancel={close}
          onConfirm={() => {
            // Ensure paymentId.current is used here if directly passing is not feasible
            if (paymentId.current) {
              deletePaymentMethod(paymentId.current);
            }
          }}
          title={translate(
            translationKey('Heading.DeletePaymentMethod', TranslationNamespace.CloudServices),
          )}
          variant='alert'
        />
      </Dialog>
    ),
    [deletePaymentMethod, close, lowerDivider, translate, upperDivider],
  );

  const onDeleteApp = useCallback(
    async (paymentProfileId: string) => {
      if (paymentProfileId) {
        paymentId.current = paymentProfileId;
        configure(deletePaymentDialog);
        open();
      }
    },
    [configure, deletePaymentDialog, open],
  );

  const paymentContents = useMemo(() => {
    return !paymentProfiles || paymentProfiles.length === 0 ? (
      <Typography color='secondary'>
        {translate(
          translationKey('Description.NoPaymentMethods', TranslationNamespace.CloudServices),
        )}
      </Typography>
    ) : (
      paymentProfiles.map((paymentProfile: PaymentProfile) => (
        <div key={paymentProfile.paymentProfileId} className={paymentProfileContainer}>
          <div className={paymentIconContainer}>
            <PaymentMethodIcons
              paymentMethodType={
                paymentProfile ? paymentProfile.cardNetwork || 'default' : 'default'
              }
              largeIcon={false}
              smallIcon={false}
            />
            <Typography variant='smallLabel1'>{`****   ${paymentProfile.last4Digits}`}</Typography>
            <Typography color='secondary' variant='smallLabel2'>
              {paymentProfile.expMonth &&
                paymentProfile.expYear &&
                `${translate(translationKey('Label.Expiration', TranslationNamespace.CloudServices))} ${translate(translationKey('Label.DateFormat	', TranslationNamespace.CloudServices))} ${translate(
                  translationKey('Label.DateFormat', TranslationNamespace.CloudServices),
                )
                  .replace('{month}', paymentProfile.expMonth.toString())
                  .replace('{year}', paymentProfile.expYear.toString())}`}
            </Typography>
          </div>
          <Button
            aria-label='delete'
            size='small'
            color='secondary'
            className={deleteButton}
            onClick={() => onDeleteApp(paymentProfile.paymentProfileId ?? '')}>
            <DeleteOutlinedIcon />
          </Button>
        </div>
      ))
    );
  }, [
    paymentProfiles,
    paymentProfileContainer,
    paymentIconContainer,
    deleteButton,
    translate,
    onDeleteApp,
  ]);

  useEffect(() => {
    if (userId) {
      loadPageData();
    }
  }, [userId, loadPageData]);

  if (!isLoading && isPageInitFailed) {
    return (
      <FailureView
        title={translate(translationKey('Heading.FailedToLoadPage', TranslationNamespace.Error))}
        message={translate(translationKey('Message.FailedToLoadPage', TranslationNamespace.Error))}
        buttonText={translate(
          translationKey('Action.FailedToLoadPage', TranslationNamespace.Error),
        )}
        onReload={() => routerReload()}
      />
    );
  }

  if (user && !isLoading) {
    return (
      <Grid container item XSmall={9} spacing={2} alignItems='center' className={formContainer}>
        <HubMeta
          title={buildTitle(
            translate(translationKey('Heading.PaymentsTitle', TranslationNamespace.CloudServices)),
          )}
          breadcrumb={buildBreadcrumb(
            translate(translationKey('Heading.Finances', TranslationNamespace.Navigation)),
            translate(translationKey('Heading.PaymentsTitle', TranslationNamespace.CloudServices)),
          )}
        />
        <Grid item XSmall={9}>
          <Typography variant='h3' component='h3' className={paymentMethodTitle}>
            {translate(
              translationKey('Heading.PaymentMethodTitle', TranslationNamespace.CloudServices),
            )}
          </Typography>
        </Grid>
        <Grid item XSmall={6} direction='column' spacing={2}>
          {paymentContents}
        </Grid>
        <Grid item XSmall={12} direction='column'>
          <Button
            className={addPaymentMethodButton}
            color='primaryBrand'
            size='large'
            variant='contained'
            onClick={() => {
              onCreateApp();
            }}>
            {translate(
              translationKey('Label.AddPaymentMethodButton', TranslationNamespace.CloudServices),
            )}
          </Button>
        </Grid>
      </Grid>
    );
  }

  return (
    <EmptyGrid>
      <CircularProgress />
    </EmptyGrid>
  );
};

export default withTranslation(PaymentsPageContainer, [
  TranslationNamespace.Table,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.CloudServices,
  TranslationNamespace.Navigation,
]);
