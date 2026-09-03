import type { FunctionComponent } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { Link } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Grid, Typography } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import {
  getTotalResolvedSalesAvenues,
  hasResolvedSalesAvenue,
  isDuplicateSalesAvenueWithinType,
  MAX_COLLABORATION_SALES_AVENUES,
  type CollaborationSalesAvenues,
  type SalesAvenueSelection,
} from '../utils/salesAvenue';
import SalesAvenueResolvedListItem from './SalesAvenueResolvedListItem';
import SalesAvenueTextField, { type SalesAvenueInputStatus } from './SalesAvenueTextField';

type SalesAvenueInputStatuses = {
  developerProduct: SalesAvenueInputStatus;
  gamePass: SalesAvenueInputStatus;
};

const EMPTY_INPUT_STATUSES: SalesAvenueInputStatuses = {
  developerProduct: 'empty',
  gamePass: 'empty',
};

interface SalesAvenueSectionHeaderProps {
  label: string;
  href: string | null;
}

function SalesAvenueSectionHeader({ label, href }: SalesAvenueSectionHeaderProps) {
  if (!href) {
    return (
      <Typography variant='h6' component='h3'>
        {label}
      </Typography>
    );
  }

  return (
    <Typography variant='h6' component='h3'>
      <Link href={href} target='_blank' rel='noopener noreferrer'>
        {label}
      </Link>
    </Typography>
  );
}

interface CollaborationSalesAvenueFieldsProps {
  universeId: number | null;
  salesAvenues: CollaborationSalesAvenues;
  onChange: (salesAvenues: CollaborationSalesAvenues) => void;
  onStateChange?: (state: {
    isPending: boolean;
    isComplete: boolean;
    hasUnsubmittedInput: boolean;
  }) => void;
  showRequiredErrors?: boolean;
  showUnsubmittedErrors?: boolean;
  onUnsubmittedErrorReset?: () => void;
}

const CollaborationSalesAvenueFields: FunctionComponent<CollaborationSalesAvenueFieldsProps> = ({
  universeId,
  salesAvenues,
  onChange,
  onStateChange,
  showRequiredErrors = false,
  showUnsubmittedErrors = false,
  onUnsubmittedErrorReset,
}) => {
  const translation = useTranslation();
  const { translate } = translation;
  const { tPendingTranslation } = useTranslationWrapper(translation);
  const [inputStatuses, setInputStatuses] =
    useState<SalesAvenueInputStatuses>(EMPTY_INPUT_STATUSES);
  const [developerProductInputKey, setDeveloperProductInputKey] = useState(0);
  const [gamePassInputKey, setGamePassInputKey] = useState(0);
  const [developerProductDuplicateError, setDeveloperProductDuplicateError] = useState(false);
  const [gamePassDuplicateError, setGamePassDuplicateError] = useState(false);
  const totalResolved = getTotalResolvedSalesAvenues(salesAvenues);
  const inputsDisabled = totalResolved >= MAX_COLLABORATION_SALES_AVENUES;
  const developerProductPending = inputStatuses.developerProduct === 'resolving';
  const gamePassPending = inputStatuses.gamePass === 'resolving';
  const developerProductHasUnsubmittedInput = inputStatuses.developerProduct === 'dirty';
  const gamePassHasUnsubmittedInput = inputStatuses.gamePass === 'dirty';
  const showRequiredError = showRequiredErrors && !hasResolvedSalesAvenue(salesAvenues);
  const unsubmittedErrorMessage = tPendingTranslation(
    'Did you mean to add this ID?',
    'Error shown beneath a sales avenue ID field when the user tries to continue without adding the typed ID.',
    translationKey(
      'Error.UnsubmittedCollaborationLicenseRevenueTarget',
      TranslationNamespace.Licenses,
    ),
  );
  const developerProductsHref = useMemo(
    () =>
      universeId != null
        ? `${process.env.baseUrl}${dashboard.getMonetizationDeveloperProductsUrl(universeId)}`
        : null,
    [universeId],
  );
  const gamePassesHref = useMemo(
    () =>
      universeId != null
        ? `${process.env.baseUrl}${dashboard.getMonetizationPassesUrl(universeId)}`
        : null,
    [universeId],
  );

  const clearDuplicateErrors = useCallback(() => {
    setDeveloperProductDuplicateError(false);
    setGamePassDuplicateError(false);
    onUnsubmittedErrorReset?.();
  }, [onUnsubmittedErrorReset]);

  const resetInputsAfterReachingCap = useCallback(() => {
    // Remount both inputs so leftover invalid/pending text cannot remain stuck in a disabled
    // field the user can no longer clear.
    setDeveloperProductInputKey((current) => current + 1);
    setGamePassInputKey((current) => current + 1);
    setDeveloperProductDuplicateError(false);
    setGamePassDuplicateError(false);
    setInputStatuses(EMPTY_INPUT_STATUSES);
    onStateChange?.({
      isPending: false,
      isComplete: true,
      hasUnsubmittedInput: false,
    });
  }, [onStateChange]);

  const notifyStateChange = useCallback(
    ({
      statuses: nextStatuses = inputStatuses,
      salesAvenues: nextSalesAvenues = salesAvenues,
    }: {
      statuses?: SalesAvenueInputStatuses;
      salesAvenues?: CollaborationSalesAvenues;
    } = {}) => {
      onStateChange?.({
        isPending:
          nextStatuses.gamePass === 'resolving' || nextStatuses.developerProduct === 'resolving',
        isComplete: hasResolvedSalesAvenue(nextSalesAvenues),
        hasUnsubmittedInput:
          nextStatuses.gamePass === 'dirty' || nextStatuses.developerProduct === 'dirty',
      });
    },
    [inputStatuses, onStateChange, salesAvenues],
  );

  const handleDeveloperProductResolved = useCallback(
    (developerProduct: SalesAvenueSelection | undefined) => {
      setDeveloperProductDuplicateError(false);

      if (!developerProduct) {
        return;
      }

      if (isDuplicateSalesAvenueWithinType('DeveloperProduct', developerProduct.id, salesAvenues)) {
        setDeveloperProductDuplicateError(true);
        setDeveloperProductInputKey((current) => current + 1);
        return;
      }

      const nextSalesAvenues = {
        ...salesAvenues,
        developerProducts: [...salesAvenues.developerProducts, developerProduct],
      };
      onChange(nextSalesAvenues);

      if (getTotalResolvedSalesAvenues(nextSalesAvenues) >= MAX_COLLABORATION_SALES_AVENUES) {
        resetInputsAfterReachingCap();
        return;
      }

      notifyStateChange({
        statuses: { ...inputStatuses, developerProduct: 'empty' },
        salesAvenues: nextSalesAvenues,
      });
      setDeveloperProductInputKey((current) => current + 1);
    },
    [inputStatuses, notifyStateChange, onChange, resetInputsAfterReachingCap, salesAvenues],
  );

  const handleGamePassResolved = useCallback(
    (gamePass: SalesAvenueSelection | undefined) => {
      setGamePassDuplicateError(false);

      if (!gamePass) {
        return;
      }

      if (isDuplicateSalesAvenueWithinType('GamePass', gamePass.id, salesAvenues)) {
        setGamePassDuplicateError(true);
        setGamePassInputKey((current) => current + 1);
        return;
      }

      const nextSalesAvenues = {
        ...salesAvenues,
        gamePasses: [...salesAvenues.gamePasses, gamePass],
      };
      onChange(nextSalesAvenues);

      if (getTotalResolvedSalesAvenues(nextSalesAvenues) >= MAX_COLLABORATION_SALES_AVENUES) {
        resetInputsAfterReachingCap();
        return;
      }

      notifyStateChange({
        statuses: { ...inputStatuses, gamePass: 'empty' },
        salesAvenues: nextSalesAvenues,
      });
      setGamePassInputKey((current) => current + 1);
    },
    [inputStatuses, notifyStateChange, onChange, resetInputsAfterReachingCap, salesAvenues],
  );

  const handleRemoveDeveloperProduct = useCallback(
    (productId: number) => {
      const nextSalesAvenues = {
        ...salesAvenues,
        developerProducts: salesAvenues.developerProducts.filter((entry) => entry.id !== productId),
      };
      onChange(nextSalesAvenues);
      notifyStateChange({ salesAvenues: nextSalesAvenues });
    },
    [notifyStateChange, onChange, salesAvenues],
  );

  const handleRemoveGamePass = useCallback(
    (gamePassId: number) => {
      const nextSalesAvenues = {
        ...salesAvenues,
        gamePasses: salesAvenues.gamePasses.filter((entry) => entry.id !== gamePassId),
      };
      onChange(nextSalesAvenues);
      notifyStateChange({ salesAvenues: nextSalesAvenues });
    },
    [notifyStateChange, onChange, salesAvenues],
  );

  const handleDeveloperProductInputStatusChange = useCallback(
    (status: SalesAvenueInputStatus) => {
      if (status === 'dirty') {
        onUnsubmittedErrorReset?.();
      }
      const nextStatuses = { ...inputStatuses, developerProduct: status };
      setInputStatuses(nextStatuses);
      notifyStateChange({ statuses: nextStatuses });
    },
    [inputStatuses, notifyStateChange, onUnsubmittedErrorReset],
  );

  const handleGamePassInputStatusChange = useCallback(
    (status: SalesAvenueInputStatus) => {
      if (status === 'dirty') {
        onUnsubmittedErrorReset?.();
      }
      const nextStatuses = { ...inputStatuses, gamePass: status };
      setInputStatuses(nextStatuses);
      notifyStateChange({ statuses: nextStatuses });
    },
    [inputStatuses, notifyStateChange, onUnsubmittedErrorReset],
  );

  return (
    <Grid item container flexDirection='column' alignItems='left' paddingBottom={1} spacing={2}>
      <Grid item>
        <Typography variant='h6'>
          {translate('Header.CollaborationLicenseDesignateRevenueTarget')}
        </Typography>
      </Grid>
      <Grid item>
        <Typography variant='body1'>
          {translate('Description.CollaborationLicenseDesignateRevenueTarget')}
        </Typography>
      </Grid>
      <Grid item container flexDirection='column' spacing={1}>
        <Grid item>
          <SalesAvenueSectionHeader
            label={translate('Label.DeveloperProducts')}
            href={developerProductsHref}
          />
        </Grid>
        <Grid item>
          <SalesAvenueTextField
            key={`sales-avenue-developer-product-input-${developerProductInputKey}`}
            id='sales-avenue-developer-product'
            data-testid='sales-avenue-developer-product-field'
            universeId={universeId}
            productType='DeveloperProduct'
            onChange={handleDeveloperProductResolved}
            onInputStatusChange={handleDeveloperProductInputStatusChange}
            onDuplicateErrorReset={clearDuplicateErrors}
            disabled={inputsDisabled || gamePassPending}
            showRequiredError={showRequiredError && !developerProductDuplicateError}
            requiredErrorMessage={translate('Error.CollaborationLicenseRevenueTargetRequired')}
            showUnsubmittedError={showUnsubmittedErrors && developerProductHasUnsubmittedInput}
            unsubmittedErrorMessage={unsubmittedErrorMessage}
            error={developerProductDuplicateError}
            helperText={
              developerProductDuplicateError
                ? translate('Error.DuplicateCollaborationLicenseRevenueTarget')
                : undefined
            }
            fullWidth
          />
        </Grid>
        {salesAvenues.developerProducts.map((entry) => (
          <Grid item key={`developer-product-${entry.id}`}>
            <SalesAvenueResolvedListItem
              entry={entry}
              onClear={() => {
                handleRemoveDeveloperProduct(entry.id);
              }}
            />
          </Grid>
        ))}
      </Grid>
      <Grid item container flexDirection='column' spacing={1}>
        <Grid item>
          <SalesAvenueSectionHeader label={translate('Label.GamePasses')} href={gamePassesHref} />
        </Grid>
        <Grid item>
          <SalesAvenueTextField
            key={`sales-avenue-game-pass-input-${gamePassInputKey}`}
            id='sales-avenue-game-pass'
            data-testid='sales-avenue-game-pass-field'
            universeId={universeId}
            productType='GamePass'
            onChange={handleGamePassResolved}
            onInputStatusChange={handleGamePassInputStatusChange}
            onDuplicateErrorReset={clearDuplicateErrors}
            disabled={inputsDisabled || developerProductPending}
            showRequiredError={showRequiredError && !gamePassDuplicateError}
            requiredErrorMessage={translate('Error.CollaborationLicenseRevenueTargetRequired')}
            showUnsubmittedError={showUnsubmittedErrors && gamePassHasUnsubmittedInput}
            unsubmittedErrorMessage={unsubmittedErrorMessage}
            error={gamePassDuplicateError}
            helperText={
              gamePassDuplicateError
                ? translate('Error.DuplicateCollaborationLicenseRevenueTarget')
                : undefined
            }
            fullWidth
          />
        </Grid>
        {salesAvenues.gamePasses.map((entry) => (
          <Grid item key={`game-pass-${entry.id}`}>
            <SalesAvenueResolvedListItem
              entry={entry}
              onClear={() => {
                handleRemoveGamePass(entry.id);
              }}
            />
          </Grid>
        ))}
      </Grid>
    </Grid>
  );
};

export default CollaborationSalesAvenueFields;
