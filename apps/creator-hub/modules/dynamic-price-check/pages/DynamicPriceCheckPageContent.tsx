/* istanbul ignore file */
import { StatusCodes } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Typography, Link } from '@rbx/ui';
import { PageLoading } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ErrorPage } from '@modules/miscellaneous/error';
import { useRouter } from 'next/router';
import useIsPriceOptimizationActive from '@modules/price-optimization/queries/useIsPriceOptimizationActive';
import { useUniversePermissions } from '@modules/react-query/organizations';
import { docs } from '@modules/miscellaneous/common/urls/creatorHub';
import PriceTestActiveAlert from '../components/PriceTestActiveAlert/PriceTestActiveAlert';
import PriceValidationExamples from '../components/PriceValidationExamples/PriceValidationExamples';
import PriceValidationForm from '../components/PriceValidationForm/PriceValidationForm';
import { isActiveStatus, isPollingStatus } from '../utils/priceValidationStatusUtils';
import {
  ErrorDialog,
  ErrorDialogProvider,
  useOpenErrorDialog,
} from '../context/ErrorDialogContext';
import useDynamicPriceCheckPageContentStyles from './DynamicPriceCheckPageContent.styles';
import usePriceValidationConfig from '../hooks/usePriceValidationConfig';

const dynamicPriceCheckDocLink = docs.getDynamicPriceCheckMonetizationUrl();

function DynamicPriceCheckPageContent({ universeId }: { universeId: number }) {
  const { ready: areTranslationsReady, translate, translateHTML } = useTranslation();
  const { classes } = useDynamicPriceCheckPageContentStyles();

  const { data: permissions, isLoading: isLoadingPermissions } = useUniversePermissions(universeId);

  const router = useRouter();

  // Get price validation config
  const {
    config,
    isLoading: isLoadingPriceValidationConfig,
    isError: isErrorPriceValidationConfig,
  } = usePriceValidationConfig(universeId);

  // Get latest experiment to check if price optimization is active
  const {
    isPriceOptimizationActive,
    isEligible: isEligibleForPriceOptimization,
    isLoading: isLoadingPriceOptimization,
    isError: isErrorPriceOptimization,
  } = useIsPriceOptimizationActive();

  const isLoading =
    !areTranslationsReady ||
    isLoadingPriceValidationConfig ||
    isLoadingPriceOptimization ||
    isLoadingPermissions;

  const isError = isErrorPriceValidationConfig || isErrorPriceOptimization;

  useOpenErrorDialog(isError);

  if (permissions?.monetizeExperience === false) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  if (isLoading || isError) {
    return <PageLoading />;
  }

  const isPriceValidationActive = isActiveStatus(config.status) && !isPriceOptimizationActive;
  const showReturnToPriceOptimization =
    isEligibleForPriceOptimization && router.query.from === 'price-optimization';

  return (
    <div className={classes.container}>
      <div>
        <Typography variant='body1' component='p' className={classes.textGapMedium}>
          {translate('Description.DynamicPriceCheck')}
        </Typography>
        <PriceTestActiveAlert
          alertTitleText={translate('Heading.PriceOptimizationActiveWarning')}
          alertDescriptionText={translate('Description.PriceOptimizationActiveWarning')}
          isTestActive={isPriceOptimizationActive}
        />
        <PriceTestActiveAlert
          alertTitleText={translate('Heading.PriceCheckActiveWarning')}
          alertDescriptionText={translate('Description.PriceCheckActiveWarning')}
          isTestActive={isPriceValidationActive}
        />
      </div>

      <div className={classes.bodyContent}>
        <div>
          <Typography variant='h5' component='h2' className={classes.headingGapSmall}>
            {translate('Heading.PriceCheckPurpose')}
          </Typography>
          <Typography variant='body1' component='p' className={classes.textGapMedium}>
            {translate('Description.PriceCheckPurpose')}
          </Typography>

          <Typography variant='body1' component='p'>
            {translateHTML('Message.PriceCheckDocumentation', [
              {
                opening: 'linkStart',
                closing: 'linkEnd',
                content: (chunks) => (
                  <Link href={dynamicPriceCheckDocLink} target='_blank'>
                    {chunks}
                  </Link>
                ),
              },
            ])}
          </Typography>
        </div>

        <PriceValidationExamples />

        <PriceValidationForm
          universeId={universeId}
          initialUserIds={isPriceValidationActive ? config.userIds : []}
          initialStatus={config.status}
          initialTestingType={config.testing}
          initialFixedPrice={!isPriceOptimizationActive ? config.price : null}
          initialPinnedLocation={!isPriceOptimizationActive ? config.location : null}
          showReturnToPriceOptimization={showReturnToPriceOptimization}
          disabled={isPriceOptimizationActive || isPollingStatus(config.status)}
        />
      </div>
    </div>
  );
}

const DynamicPriceCheckPageContentWithError = ({ universeId }: { universeId: number }) => (
  <ErrorDialogProvider>
    <DynamicPriceCheckPageContent universeId={universeId} />

    <ErrorDialog />
  </ErrorDialogProvider>
);

export default withTranslation(DynamicPriceCheckPageContentWithError, [
  TranslationNamespace.Controls,
  TranslationNamespace.PriceOptimization,
  TranslationNamespace.DynamicPriceCheck,
]);
