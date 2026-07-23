import React, { FunctionComponent, useState, useCallback, useEffect, useMemo } from 'react';
import { Grid, Typography, Stepper, Step, StepLabel } from '@rbx/ui';
import { useRouter } from 'next/router';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  AccountStatusEnum,
  ClaimContentContentTypeEnum,
  ClaimItemDiscoveredFromEnum,
  ClaimItemSourceEnum,
  SnapshotContentContentTypeEnum,
} from '@rbx/clients/rightsV1';
import type { SnapshotContent } from '@rbx/clients/rightsV1';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { PageLoading } from '@modules/miscellaneous/common';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import { useCurrentAccountContext } from '../../../components/AccountProvider';
import useCreateClaimHandler from '../../hooks/useCreateClaimHandler';
import useSnapshotViewPolling from './useSnapshotViewPolling';
import {
  TakedownRequest,
  AccountsURL,
} from '../createRemovalRequest/CreateRemovalRequestContainer';
import { ClaimsURL } from '../claims/ClaimsContainer';
import LegalAgreementsContainer from '../createRemovalRequest/LegalAgreementsContainer';
import ConflictClaimSubmittedDialog from '../createRemovalRequest/ConflictClaimSubmittedDialog';
import createClaimHandlerErrorDialog from '../error/CreateClaimHandlerErrorDialog';
import AddReportCodeStep from './AddReportCodeStep';
import SelectCreationsStep from './SelectCreationsStep';
import AddDetailsStep from './AddDetailsStep';
import type { AddDetailsResult } from './AddDetailsStep';
import ReviewCreationsStep from './ReviewCreationsStep';

export function getSnapshotContentKey(item: SnapshotContent): string {
  return `${item.contentId ?? ''}-${item.contentType ?? ''}`;
}

export const ReportCodeUrlRemovalRequests = `/dashboard/rights-manager/removal-requests/report-code`;
export const ReportCodeUrlClaims = `/dashboard/rights-manager/claims/report-code`;

const ADD_REPORT_CODE_STEP = 0;
const SELECT_CREATIONS_STEP = 1;
const ADD_DETAILS_STEP = 2;
const REVIEW_CREATIONS_STEP = 3;
const SUBMIT_REQUEST_STEP = 4;
const LAST_STEP = 4;

const STEP_LABELS = [
  'Label.AddReportCodeStep',
  'Label.SelectCreationStep',
  'Label.AddDetailsStep',
  'Label.ReviewCreationStep',
  'Label.SubmitRequestStep',
];

const MAX_REPORT_CODE_CART_SIZE = 250;

const contentTypeToClaimContentType = (
  contentType: SnapshotContentContentTypeEnum,
): ClaimContentContentTypeEnum => {
  switch (contentType) {
    case SnapshotContentContentTypeEnum.Asset:
      return ClaimContentContentTypeEnum.Asset;
    default:
      return ClaimContentContentTypeEnum.Asset;
  }
};

export function buildTakedownRequests(
  cartItems: SnapshotContent[],
  details: AddDetailsResult | null,
  rootPlaceId?: number,
): TakedownRequest[] {
  // Direct experience reporting and individual content reporting are mutually exclusive.
  // When rootPlaceId is set, the experience itself is reported and cart items are ignored.
  if (rootPlaceId && rootPlaceId > 0) {
    return [
      {
        creationSource: details?.creationSource ?? ClaimItemSourceEnum.OnRoblox,
        infringingContent: {
          contentId: rootPlaceId,
          contentType: ClaimContentContentTypeEnum.Asset,
          originalLink: '',
        },
        myContent: details?.originalContent ?? undefined,
        description: details?.description ?? '',
        supportingFiles: details?.documents ?? [],
        key: `direct-experience-${rootPlaceId}`,
        discoveredFrom: ClaimItemDiscoveredFromEnum.Snapshot,
      },
    ];
  }

  return cartItems.map((item) => ({
    creationSource: details?.creationSource ?? ClaimItemSourceEnum.OnRoblox,
    infringingContent: {
      contentId: parseInt(item.contentId ?? '-1', 10) || -1,
      contentType: contentTypeToClaimContentType(
        item.contentType ?? SnapshotContentContentTypeEnum.Asset,
      ),
      originalLink: '',
    },
    myContent: details?.originalContent ?? undefined,
    description: details?.description ?? '',
    supportingFiles: details?.documents ?? [],
    key: getSnapshotContentKey(item),
    discoveredFrom: ClaimItemDiscoveredFromEnum.Snapshot,
  }));
}

interface UseReportCodeContainerProps {
  enableClaimsAndDisputes?: boolean;
}

// Requires TranslationNamespace.RightsPortal provider
const UseReportCodeContainer: FunctionComponent<UseReportCodeContainerProps> = ({
  enableClaimsAndDisputes = false,
}) => {
  const { account, user, features } = useCurrentAccountContext();
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const {
    handler,
    handlerReset,
    handlerIsSuccess,
    handlerIsPending,
    handlerIsError,
    shouldToastConflict,
    shouldEditConflictClaim,
    shouldEditBadRequestClaim,
    shouldRetryCreateClaim,
    shouldToastRateLimit,
  } = useCreateClaimHandler();

  const [snapshotViewId, setSnapshotViewId] = useState<string | undefined>();
  const {
    data: snapshotView,
    isLoading: isSnapshotQueryLoading,
    error: snapshotQueryError,
    isTimedOut: isSnapshotTimedOut,
  } = useSnapshotViewPolling(snapshotViewId);
  const [activeStep, setActiveStep] = useState(ADD_REPORT_CODE_STEP);
  const [selectCreationsFilter, setSelectCreationsFilter] = useState<string>('');
  const router = useRouter();
  const { ready, translate } = useTranslation();
  const {
    isFetched: isIXPFetched,
    params: { enableInExperienceIpReporting },
  } = useIXPParameters(IXPLayers.RightsManager, { restoreInitialValueFromCache: true });
  const [requestName, setRequestName] = useState('');

  const [rootPlaceId, setRootPlaceId] = useState(0);
  const snapshotUniverseId = snapshotView?.snapshot?.universeId;

  const [reportCodeCart, setReportCodeCart] = useState<Map<string, SnapshotContent>>(
    () => new Map(),
  );
  const selectCartItems = useMemo(() => Array.from(reportCodeCart.values()), [reportCodeCart]);
  const selectCartSize = reportCodeCart.size;
  const selectCartIsFull = reportCodeCart.size >= MAX_REPORT_CODE_CART_SIZE;
  const selectCartHasItem = useCallback(
    (item: SnapshotContent) => reportCodeCart.has(getSnapshotContentKey(item)),
    [reportCodeCart],
  );
  const selectCartUpdate = useCallback((item: SnapshotContent) => {
    setReportCodeCart((prev) => {
      const key = getSnapshotContentKey(item);
      const next = new Map(prev);
      if (next.has(key)) next.delete(key);
      else if (next.size < MAX_REPORT_CODE_CART_SIZE) next.set(key, item);
      return next;
    });
  }, []);
  const removeFromSelectCart = useCallback((item: SnapshotContent) => {
    setReportCodeCart((prev) => {
      const next = new Map(prev);
      next.delete(getSnapshotContentKey(item));
      return next;
    });
  }, []);
  const clearSelectCart = useCallback(() => setReportCodeCart(new Map()), []);
  const [isSelectCartDrawerOpen, setIsSelectCartDrawerOpen] = useState(false);

  const reportCodeSelectItems = useMemo(
    () => snapshotView?.snapshot?.contents ?? [],
    [snapshotView],
  );

  const isSnapshotPending =
    activeStep === SELECT_CREATIONS_STEP &&
    !!snapshotViewId &&
    !isSnapshotTimedOut &&
    (isSnapshotQueryLoading || snapshotView?.status === 'Pending');

  const snapshotLoadError = useMemo(() => {
    if (
      snapshotQueryError ||
      snapshotView?.status === 'Error' ||
      snapshotView?.status === 'Expired'
    )
      return translate('Error.ReportCodeLoadError');
    if (isSnapshotTimedOut) return translate('Error.ReportCodeTimeoutError');
    return null;
  }, [isSnapshotTimedOut, snapshotQueryError, snapshotView?.status, translate]);

  const [addDetails, setAddDetails] = useState<AddDetailsResult | null>(null);

  const submissionData = useMemo(
    () => ({
      accountId: account?.id ?? '',
      userId: user?.id ?? '',
      snapshotId: snapshotView?.snapshot?.id ?? '',
      description: requestName,
      takedownRequests: buildTakedownRequests(selectCartItems, addDetails, rootPlaceId),
    }),
    [
      account?.id,
      user?.id,
      snapshotView?.snapshot?.id,
      requestName,
      selectCartItems,
      addDetails,
      rootPlaceId,
    ],
  );

  const handleReviewDelete = useCallback(
    (index: number) => {
      const item = selectCartItems[index];
      if (item) removeFromSelectCart(item);
    },
    [selectCartItems, removeFromSelectCart],
  );

  const handleClickBack = useCallback(() => {
    setActiveStep((prev) => {
      if (prev > 0) {
        window.scrollTo(0, 0);
        return prev - 1;
      }
      router.back();
      return prev;
    });
  }, [router]);

  const handleClickNext = useCallback(() => {
    setActiveStep((prev) => {
      if (prev < LAST_STEP) {
        window.scrollTo(0, 0);
        return prev + 1;
      }
      return prev;
    });
  }, []);

  const handleAddReportCodeNext = useCallback(
    (viewId: string) => {
      setSnapshotViewId(viewId);
      handleClickNext();
    },
    [handleClickNext],
  );

  const handleAddDetailsNext = useCallback(
    (result: AddDetailsResult) => {
      setAddDetails(result);
      handleClickNext();
    },
    [handleClickNext],
  );
  const handleSnapshotErrorBack = useCallback(() => {
    setSnapshotViewId(undefined);
    setRootPlaceId(0);
    setActiveStep(ADD_REPORT_CODE_STEP);
    window.scrollTo(0, 0);
  }, []);

  const handleReportExperienceDirectly = useCallback(
    (placeId: number) => {
      setRootPlaceId(placeId);
      handleClickNext();
    },
    [handleClickNext],
  );

  const handleReportSnapshotItems = useCallback(() => {
    setRootPlaceId(0);
    handleClickNext();
  }, [handleClickNext]);

  useEffect(() => {
    if (handlerIsError && !isErrorDialogOpen) {
      setIsErrorDialogOpen(true);
    }
  }, [handlerIsError, isErrorDialogOpen]);

  const redirectUrl = enableClaimsAndDisputes ? ClaimsURL : AccountsURL;

  const reset = useCallback(() => {
    handlerReset();
    router.push(redirectUrl);
  }, [handlerReset, router, redirectUrl]);

  useEffect(() => {
    if (handlerIsSuccess && !shouldToastConflict) {
      reset();
    }
  }, [handlerIsSuccess, shouldToastConflict, reset]);

  if (!isIXPFetched || !account || !user || !ready) {
    return <PageLoading />;
  }

  if (!enableInExperienceIpReporting) {
    return null;
  }

  if (enableClaimsAndDisputes && !features?.enableClaimsAndDisputes) {
    return null;
  }

  if (account && account.status && account.status !== AccountStatusEnum.Verified) {
    router.push(AccountsURL);
    return null;
  }

  if (handlerIsSuccess) {
    return shouldToastConflict ? (
      <ConflictClaimSubmittedDialog reset={reset} onClose={reset} />
    ) : null;
  }

  const HandlerErrorDialog = createClaimHandlerErrorDialog({
    open: isErrorDialogOpen,
    reset: handlerReset,
    onClose: () => {
      setIsErrorDialogOpen(false);
      handlerReset();
    },
    isLoading: handlerIsPending,
    onSubmit: () => handler(submissionData),
    shouldEditConflictClaim,
    shouldRetryCreateClaim,
    shouldEditBadRequestClaim,
    shouldToastRateLimit,
  });

  return (
    <React.Fragment>
      <Grid container direction='column' spacing={1}>
        <Grid item container direction='column' spacing={2} paddingBottom='32px'>
          <Grid item>
            <Typography variant='body1' color='secondary'>
              {enableClaimsAndDisputes
                ? translate('Description.NewClaimWithReportCode')
                : translate('Description.NewRemovalRequest')}
            </Typography>
          </Grid>
        </Grid>
        <Grid item sx={{ width: '100%' }} paddingBottom='48px'>
          <Stepper activeStep={activeStep} orientation='horizontal'>
            {STEP_LABELS.map((label) => (
              <Step key={label}>
                <StepLabel>
                  <Typography>{translate(label)}</Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Grid>
        <Grid item sx={activeStep !== ADD_REPORT_CODE_STEP ? { display: 'none' } : undefined}>
          <AddReportCodeStep onNext={handleAddReportCodeNext} onBack={handleClickBack} />
        </Grid>
        <Grid item sx={activeStep !== SELECT_CREATIONS_STEP ? { display: 'none' } : undefined}>
          <SelectCreationsStep
            filterValue={selectCreationsFilter}
            onFilterChange={setSelectCreationsFilter}
            items={reportCodeSelectItems}
            snapshotUniverseId={snapshotUniverseId}
            cartItems={selectCartItems}
            cartSize={selectCartSize}
            cartHasItem={selectCartHasItem}
            cartUpdate={selectCartUpdate}
            cartIsFull={selectCartIsFull}
            removeFromCart={removeFromSelectCart}
            clearCart={clearSelectCart}
            isDrawerOpen={isSelectCartDrawerOpen}
            onDrawerOpenChange={setIsSelectCartDrawerOpen}
            onReportItems={handleReportSnapshotItems}
            onReportExperienceDirectly={handleReportExperienceDirectly}
            onCancel={() => router.push(redirectUrl)}
            isSnapshotLoading={isSnapshotPending}
            snapshotLoadError={snapshotLoadError}
            onSnapshotErrorBack={handleSnapshotErrorBack}
          />
        </Grid>
        <Grid item sx={activeStep !== ADD_DETAILS_STEP ? { display: 'none' } : undefined}>
          <AddDetailsStep onNext={handleAddDetailsNext} onBack={handleClickBack} />
        </Grid>
        <Grid item sx={activeStep !== REVIEW_CREATIONS_STEP ? { display: 'none' } : undefined}>
          <ReviewCreationsStep
            cartItems={selectCartItems}
            rootPlaceId={rootPlaceId}
            originalContent={addDetails?.originalContent ?? null}
            description={addDetails?.description ?? ''}
            documents={addDetails?.documents ?? []}
            enableClaimsAndDisputes={enableClaimsAndDisputes}
            onDelete={handleReviewDelete}
            onNext={handleClickNext}
            onBack={handleClickBack}
          />
        </Grid>
        <Grid item sx={activeStep !== SUBMIT_REQUEST_STEP ? { display: 'none' } : undefined}>
          <LegalAgreementsContainer
            requestName={requestName}
            setRequestName={setRequestName}
            onClickBack={() => {
              handlerReset();
              handleClickBack();
            }}
            onClickNext={() => handler(submissionData)}
            isLoading={handlerIsPending && !isErrorDialogOpen}
            isClaimsEnabled={enableClaimsAndDisputes}
          />
        </Grid>
      </Grid>
      {HandlerErrorDialog}
    </React.Fragment>
  );
};

export default withTranslation(UseReportCodeContainer, [TranslationNamespace.RightsPortal]);
