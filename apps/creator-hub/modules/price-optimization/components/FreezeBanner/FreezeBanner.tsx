import { useState, useEffect } from 'react';
import { Alert, AlertTitle, CloseIcon, IconButton, Button } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { ExperimentState } from '@rbx/clients/priceExperimentationApi/v1';
import { useRouter } from 'next/router';
import { isOngoingExperiment } from '../../helpers/experimentUtils';
import useGetExperimentationMetadata from '../../queries/useGetExperimentationMetadata';
import useGetLatestExperiment from '../../queries/useGetLatestExperiment';
import { rootDocumentationLink } from '../../constants/links';

const FreezeBanner = () => {
  const { pauseDates, hasUpcomingFreezePeriod, isWithinFreezePeriod } =
    useGetExperimentationMetadata();
  const { translate } = useTranslation();
  const [showAlert, setShowAlert] = useState(false);
  const { latestExperiment } = useGetLatestExperiment({ completed: true });
  const { latestExperiment: currentExperiment } = useGetLatestExperiment();

  useEffect(() => {
    setShowAlert(hasUpcomingFreezePeriod && !isOngoingExperiment(currentExperiment?.state));
  }, [hasUpcomingFreezePeriod, currentExperiment]);

  const getTitle = () => {
    if (isWithinFreezePeriod) {
      return translate('Heading.PriceOptimizationFreezeTitle');
    }
    if (latestExperiment?.state === ExperimentState.Completed) {
      return translate('Heading.PriceOptimizationFreezeTitleBeforeBlockedAndRanPO', {
        startDate: pauseDates.startDate || '',
      });
    }
    return translate('Heading.PriceOptimizationFreezeTitleBeforeBlockedAndNoPO');
  };

  const router = useRouter();

  return (
    showAlert &&
    pauseDates.startDate &&
    pauseDates.endDate && (
      <Alert
        severity='info'
        action={
          <div>
            <Button color='inherit' size='small' onClick={() => router.push(rootDocumentationLink)}>
              {translate('Description.LearnMore')}
            </Button>
            <IconButton
              aria-label='Close'
              color='secondary'
              onClick={() => {
                setShowAlert(false);
              }}>
              <CloseIcon />
            </IconButton>
          </div>
        }>
        <AlertTitle>{getTitle()}</AlertTitle>
        <span>
          {translate('Description.PriceOptimizationFreezeBlockedDates', {
            startDate: pauseDates.startDate,
            endDate: pauseDates.endDate,
          })}
        </span>
      </Alert>
    )
  );
};

export default FreezeBanner;
