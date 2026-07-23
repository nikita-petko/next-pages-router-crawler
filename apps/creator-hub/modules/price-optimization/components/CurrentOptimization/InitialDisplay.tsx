import { Fragment, useEffect, useState } from 'react';
import {
  Button,
  Typography,
  Tooltip,
  ErrorOutlineOutlinedIcon,
  InfoOutlinedIcon,
  PlayArrowIcon,
  DialogContent,
  DialogTitle,
  DialogActions,
  Dialog,
} from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { Link } from '@modules/miscellaneous/common';
import { useLocalStorage } from '@rbx/react-utilities';
import PriceValidationActiveModal from '@modules/dynamic-price-check/components/PriceValidationActiveModal';
import usePriceValidationConfig from '@modules/dynamic-price-check/hooks/usePriceValidationConfig';
import { hasViewedIntroductionKey } from '../../constants/experimentConstants';
import useGetLatestExperiment from '../../queries/useGetLatestExperiment';
import useCreateExperiment from '../../queries/useCreateExperiment';
import useCurrentOptimizationStyles from './CurrentOptimization.styles';
import { productIdentifierToKey } from '../../types/product';
import useGetProducts from '../../queries/useGetProducts';
import { usePricingErrorContext } from '../../providers/PricingErrorProvider';
import TimelineModal from '../TimelineModal/TimelineModal';
import {
  rootDocumentationLink,
  getPriceCheckLinkFromPriceOptimization,
} from '../../constants/links';
import IntroductionModal from '../IntroductionModal/IntroductionModal';
import useGetExperimentationMetadata from '../../queries/useGetExperimentationMetadata';
import useGetProductTransactionVolumes from '../../queries/useGetProductTransactionVolumes';
import useGetPriceExperimentationEligibility from '../../queries/useGetPriceExperimentationEligibility';
import InfoModal from '../InfoModal/InfoModal';

interface InitialDisplayProps {
  checkedProducts: Set<string>;
}

const PromptPriceValidationModal = ({ universeId }: { universeId: number }) => {
  const { translate } = useTranslation();
  const {
    classes: { modalContentParagraphs },
  } = useCurrentOptimizationStyles();

  return (
    <Fragment>
      <DialogTitle>{translate('Heading.ConfirmPriceCheck')}</DialogTitle>
      <DialogContent className={modalContentParagraphs}>
        {translate('Message.ConfirmPriceCheck')}
      </DialogContent>
      <DialogActions>
        <Button
          size='large'
          color='primary'
          variant='contained'
          component={Link}
          href={getPriceCheckLinkFromPriceOptimization(universeId)}>
          {translate('Action.CheckPrices')}
        </Button>
      </DialogActions>
    </Fragment>
  );
};

const InitialDisplay = ({ checkedProducts }: InitialDisplayProps) => {
  const { translate, translateHTML } = useTranslation();

  const { classes } = useCurrentOptimizationStyles();

  const { setHasError } = usePricingErrorContext();

  const { universeId } = useGetLatestExperiment();
  const { config } = usePriceValidationConfig(universeId, {
    skipPollingForDisable: true,
  });
  const { products } = useGetProducts();
  const { createAndStartExperiment, isLoading: isCreatingExperiment } = useCreateExperiment({
    onError: () => setHasError(true),
  });
  const {
    isWithinFreezePeriod,
    experimentProductsRequirements,
    isLoading: isLoadingExperimentationMetadata,
  } = useGetExperimentationMetadata();
  const { productTransactionVolumes } = useGetProductTransactionVolumes();
  const {
    robuxVolumeLast30Days: universeRobuxVolumeLast30Days,
    transactionVolumeLast30Days: universeTransactionVolumeLast30Days,
    isLoading: isLoadingPriceExperimentationEligibility,
  } = useGetPriceExperimentationEligibility();

  // TODO: Generalize this with proper dialog state management e.g., `useDialog` from MUI
  // - will need to refactor for translations context and styling
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [isIntroductionModalOpen, setIsIntroductionModalOpen] = useState(false);
  const [isPriceValidationModalOpen, setIsPriceValidationModalOpen] = useState(false);
  const [isStartPriceValidationModalOpen, setIsStartPriceValidationModalOpen] = useState(false);
  const [isMoreProductsRequiredModalOpen, setIsMoreProductsRequiredModalOpen] = useState(false);
  const [isNotEnoughUniverseTransactionsModalOpen, setIsNotEnoughUniverseTransactionsModalOpen] =
    useState(false);

  const [hasViewedIntroduction, setHasViewedIntroduction] = useLocalStorage(
    hasViewedIntroductionKey,
    false,
  );

  const isPriceValidationActive = config?.status === 'Enabling' || config?.status === 'Enabled';

  const hasEnoughUniverseTransactions =
    universeTransactionVolumeLast30Days >=
    experimentProductsRequirements.minTransactionVolumeLast30Days;

  const isStartTestDisabled =
    !hasEnoughUniverseTransactions || isCreatingExperiment || checkedProducts.size === 0;

  // Check for initial conditions to show block / intro modals as required
  useEffect(() => {
    if (isLoadingPriceExperimentationEligibility || isLoadingExperimentationMetadata) {
      return;
    }

    if (!hasEnoughUniverseTransactions) {
      setIsNotEnoughUniverseTransactionsModalOpen(true);
      return;
    }

    if (!hasViewedIntroduction) {
      // If on first load the user has not viewed introduction, show it
      setIsIntroductionModalOpen(true);
      setHasViewedIntroduction(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hasViewedIntroduction is only needed on initial for this effect
  }, [
    hasEnoughUniverseTransactions,
    isLoadingExperimentationMetadata,
    isLoadingPriceExperimentationEligibility,
  ]);

  const hasEnoughProducts = () => {
    const includedProductTransactionVolumes = productTransactionVolumes.filter((tv) =>
      checkedProducts.has(productIdentifierToKey(tv)),
    );
    const numProducts = checkedProducts.size;
    const transactionVolumeLast30Days = includedProductTransactionVolumes
      .map((tv) => tv.transactionVolumeLast30Days)
      .reduce((a, b) => a + b, 0);
    const robuxVolumeLast30Days = includedProductTransactionVolumes
      .map((tv) => tv.robuxVolumeLast30Days)
      .reduce((a, b) => a + b, 0);
    return (
      numProducts >= experimentProductsRequirements.minCount &&
      transactionVolumeLast30Days >=
        experimentProductsRequirements.minTransactionVolumeLast30Days &&
      robuxVolumeLast30Days >=
        experimentProductsRequirements.minRobuxSpendFractionLast30Days *
          universeRobuxVolumeLast30Days
    );
  };

  const handleStartTest = () => {
    if (isPriceValidationActive) {
      // User is running price check; prompt them to disable
      setIsPriceValidationModalOpen(true);
    } else if (!config?.hasPreviouslyEnabledPricePinning) {
      // User has not ran price check (price pinning); prompt them to run
      setIsStartPriceValidationModalOpen(true);
    } else if (!hasEnoughProducts()) {
      // Not enough products in the experiment
      setIsMoreProductsRequiredModalOpen(true);
    } else {
      // All checks passed, give user info and allow them to start
      setIsAcceptModalOpen(true);
    }
  };

  const onCreateExperiment = async () => {
    const productsToAdd = products.filter((product) =>
      checkedProducts.has(productIdentifierToKey(product)),
    );

    try {
      await createAndStartExperiment(universeId!, productsToAdd);
    } catch {
      // Note: this is already handled by the `onError` callback - this is just a safety net for testing
      setHasError(true);
    }
  };

  return (
    <div className={classes.container}>
      <div>
        <Typography variant='h3' component='h3' className={classes.headingGapSmall}>
          {translate('Heading.ProductList')}
        </Typography>
        <Typography variant='body1' component='p' className={classes.textBox}>
          {translateHTML('Description.ChooseProducts', [
            {
              opening: 'linkStart',
              closing: 'linkEnd',
              content: (chunks) => <Link href={rootDocumentationLink}>{chunks}</Link>,
            },
          ])}
        </Typography>
      </div>

      <div className={classes.actionContainer}>
        {isWithinFreezePeriod ? (
          <Tooltip
            arrow
            placement='top'
            title={translate('Label.PriceOptimizationStartTestButtonDisabledTooltip')}>
            <span>
              <Button variant='contained' className={classes.actionButton} disabled>
                {translate('Action.StartTest')}
              </Button>
            </span>
          </Tooltip>
        ) : (
          <Button
            variant='contained'
            className={classes.actionButton}
            disabled={isStartTestDisabled}
            onClick={handleStartTest}>
            {translate('Action.StartTest')}
          </Button>
        )}

        <Button
          variant='outlined'
          className={classes.actionButton}
          color='secondary'
          startIcon={<PlayArrowIcon />}
          onClick={() => setIsIntroductionModalOpen(true)}>
          {translate('Action.WatchVideo')}
        </Button>

        <div className={classes.priceCheckContainer}>
          <ErrorOutlineOutlinedIcon color='warning' />

          <Typography variant='body2' component='p'>
            {translateHTML('Message.UsePriceCheckTool', [
              {
                opening: 'linkStart',
                closing: 'linkEnd',
                content: (chunks) => (
                  <Link href={getPriceCheckLinkFromPriceOptimization(universeId!)}>{chunks}</Link>
                ),
              },
            ])}
          </Typography>

          <Tooltip title={translate('Description.UsePriceCheckTool')} placement='top' arrow>
            <InfoOutlinedIcon fontSize='small' color='secondary' />
          </Tooltip>
        </div>
      </div>

      <InfoModal
        title={translate('Heading.DynamicEligibilityNotEnoughUniverseTransactions')}
        description={translateHTML('Description.DynamicEligibilityNotEnoughUniverseTransactions', [
          {
            opening: 'linkStart',
            closing: 'linkEnd',
            content(chunks) {
              return (
                <Link href={rootDocumentationLink} target='_blank'>
                  {chunks}
                </Link>
              );
            },
          },
        ])}
        buttonText={translate('Action.GotIt')}
        isOpen={isNotEnoughUniverseTransactionsModalOpen}
        setOpen={setIsNotEnoughUniverseTransactionsModalOpen}
      />

      <InfoModal
        title={translate('Heading.DynamicEligibilityMoreProductsRequired')}
        description={translate('Description.DynamicEligibilityMoreProductsRequired')}
        buttonText={translate('Action.GotIt')}
        isOpen={isMoreProductsRequiredModalOpen}
        setOpen={setIsMoreProductsRequiredModalOpen}
      />

      <PriceValidationActiveModal
        isOpen={isPriceValidationModalOpen}
        onClose={() => setIsPriceValidationModalOpen(false)}
        onError={() => setHasError(true)}
        universeId={universeId}
        testing={config?.testing}
      />

      <Dialog
        open={isStartPriceValidationModalOpen}
        maxWidth='Medium'
        onClose={() => setIsStartPriceValidationModalOpen(false)}>
        <PromptPriceValidationModal universeId={universeId!} />
      </Dialog>

      <TimelineModal
        open={isAcceptModalOpen}
        setOpen={setIsAcceptModalOpen}
        onAgree={onCreateExperiment}
      />

      <IntroductionModal open={isIntroductionModalOpen} setOpen={setIsIntroductionModalOpen} />
    </div>
  );
};

export default InitialDisplay;
