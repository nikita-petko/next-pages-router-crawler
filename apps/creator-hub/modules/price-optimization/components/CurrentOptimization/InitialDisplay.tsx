// oxlint-disable react/react-compiler
import { useEffect, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { useLocalStorage } from '@rbx/react-utilities';
import { Button, Typography, PlayArrowIcon } from '@rbx/ui';
import { Link } from '@modules/monetization-shared/link';
import { Tooltip } from '@modules/monetization-shared/tooltip';
import { hasViewedIntroductionKey } from '../../constants/experimentConstants';
import { rootDocumentationLink } from '../../constants/links';
import { useGetExperimentationMetadata } from '../../queries/useGetExperimentationMetadata';
import { useGetPriceExperimentationEligibility } from '../../queries/useGetPriceExperimentationEligibility';
import InfoModal from '../InfoModal/InfoModal';
import IntroductionModal from '../IntroductionModal/IntroductionModal';
import useCurrentOptimizationStyles from './CurrentOptimization.styles';

// NOTE(@jeminpark): this is currently undergoing deprecation via transition to Managed Pricing.

const InitialDisplay = () => {
  const { translate, translateHTML } = useTranslation();

  const { classes } = useCurrentOptimizationStyles();

  const { experimentProductsRequirements, isLoading: isLoadingExperimentationMetadata } =
    useGetExperimentationMetadata();
  const {
    transactionVolumeLast30Days: universeTransactionVolumeLast30Days,
    isLoading: isLoadingPriceExperimentationEligibility,
  } = useGetPriceExperimentationEligibility();

  // TODO: Generalize this with proper dialog state management e.g., `useDialog` from MUI
  // - will need to refactor for translations context and styling
  const [isIntroductionModalOpen, setIsIntroductionModalOpen] = useState(false);
  const [isNotEnoughUniverseTransactionsModalOpen, setIsNotEnoughUniverseTransactionsModalOpen] =
    useState(false);

  const [hasViewedIntroduction, setHasViewedIntroduction] = useLocalStorage(
    hasViewedIntroductionKey,
    false,
  );

  const hasEnoughUniverseTransactions =
    universeTransactionVolumeLast30Days >=
    experimentProductsRequirements.minTransactionVolumeLast30Days;

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
        <Tooltip
          hasBeak
          position='top-center'
          title={translate('Label.PriceTestsTemporarilyUnavailable')}
          addTriggerSlot>
          <Button variant='contained' className={classes.actionButton} disabled>
            {translate('Action.StartTest')}
          </Button>
        </Tooltip>

        <Button
          variant='outlined'
          className={classes.actionButton}
          color='secondary'
          startIcon={<PlayArrowIcon />}
          onClick={() => setIsIntroductionModalOpen(true)}>
          {translate('Action.WatchVideo')}
        </Button>
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

      <IntroductionModal open={isIntroductionModalOpen} setOpen={setIsIntroductionModalOpen} />
    </div>
  );
};

export default InitialDisplay;
