import type { FunctionComponent } from 'react';
import { useCallback, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, Typography } from '@rbx/ui';
import {
  getTotalResolvedSalesAvenues,
  hasResolvedSalesAvenue,
  isDuplicateSalesAvenueWithinType,
  MAX_COLLABORATION_SALES_AVENUES,
  type CollaborationSalesAvenues,
  type SalesAvenueSelection,
} from '../utils/salesAvenue';
import SalesAvenueResolvedListItem from './SalesAvenueResolvedListItem';
import SalesAvenueTextField from './SalesAvenueTextField';

interface CollaborationSalesAvenueFieldsProps {
  universeId: number | null;
  salesAvenues: CollaborationSalesAvenues;
  onChange: (salesAvenues: CollaborationSalesAvenues) => void;
  onStateChange?: (state: { isPending: boolean; isComplete: boolean }) => void;
  showRequiredErrors?: boolean;
}

const CollaborationSalesAvenueFields: FunctionComponent<CollaborationSalesAvenueFieldsProps> = ({
  universeId,
  salesAvenues,
  onChange,
  onStateChange,
  showRequiredErrors = false,
}) => {
  const { translate } = useTranslation();
  const [gamePassPending, setGamePassPending] = useState(false);
  const [developerProductPending, setDeveloperProductPending] = useState(false);
  const [developerProductInputKey, setDeveloperProductInputKey] = useState(0);
  const [gamePassInputKey, setGamePassInputKey] = useState(0);
  const [developerProductDuplicateError, setDeveloperProductDuplicateError] = useState(false);
  const [gamePassDuplicateError, setGamePassDuplicateError] = useState(false);

  const totalResolved = getTotalResolvedSalesAvenues(salesAvenues);
  const inputsDisabled = totalResolved >= MAX_COLLABORATION_SALES_AVENUES;
  const showRequiredError = showRequiredErrors && !hasResolvedSalesAvenue(salesAvenues);

  const resetInputsAfterReachingCap = useCallback(() => {
    // Remount both inputs so leftover invalid/pending text cannot remain stuck in a disabled
    // field the user can no longer clear.
    setDeveloperProductInputKey((current) => current + 1);
    setGamePassInputKey((current) => current + 1);
    setDeveloperProductDuplicateError(false);
    setGamePassDuplicateError(false);
    setDeveloperProductPending(false);
    setGamePassPending(false);
    onStateChange?.({
      isPending: false,
      isComplete: true,
    });
  }, [onStateChange]);

  const notifyStateChange = useCallback(
    ({
      gamePassPending: nextGamePassPending = gamePassPending,
      developerProductPending: nextDeveloperProductPending = developerProductPending,
      salesAvenues: nextSalesAvenues = salesAvenues,
    }: {
      gamePassPending?: boolean;
      developerProductPending?: boolean;
      salesAvenues?: CollaborationSalesAvenues;
    } = {}) => {
      onStateChange?.({
        isPending: nextGamePassPending || nextDeveloperProductPending,
        isComplete: hasResolvedSalesAvenue(nextSalesAvenues),
      });
    },
    [developerProductPending, gamePassPending, onStateChange, salesAvenues],
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

      notifyStateChange({ salesAvenues: nextSalesAvenues });
      setDeveloperProductInputKey((current) => current + 1);
    },
    [notifyStateChange, onChange, resetInputsAfterReachingCap, salesAvenues],
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

      notifyStateChange({ salesAvenues: nextSalesAvenues });
      setGamePassInputKey((current) => current + 1);
    },
    [notifyStateChange, onChange, resetInputsAfterReachingCap, salesAvenues],
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

  const handleDeveloperProductPendingChange = useCallback(
    (pending: boolean) => {
      setDeveloperProductPending(pending);
      notifyStateChange({ developerProductPending: pending });
    },
    [notifyStateChange],
  );

  const handleGamePassPendingChange = useCallback(
    (pending: boolean) => {
      setGamePassPending(pending);
      notifyStateChange({ gamePassPending: pending });
    },
    [notifyStateChange],
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
          <Typography variant='body1' component='h3'>
            {translate('Label.DeveloperProduct')}
          </Typography>
        </Grid>
        <Grid item>
          <SalesAvenueTextField
            key={`sales-avenue-developer-product-input-${developerProductInputKey}`}
            id='sales-avenue-developer-product'
            data-testid='sales-avenue-developer-product-field'
            universeId={universeId}
            productType='DeveloperProduct'
            onChange={handleDeveloperProductResolved}
            onPendingChange={handleDeveloperProductPendingChange}
            disabled={inputsDisabled}
            showRequiredError={showRequiredError && !developerProductDuplicateError}
            requiredErrorMessage={translate('Error.CollaborationLicenseRevenueTargetRequired')}
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
          <Typography variant='body1' component='h3'>
            {translate('Label.GamePass')}
          </Typography>
        </Grid>
        <Grid item>
          <SalesAvenueTextField
            key={`sales-avenue-game-pass-input-${gamePassInputKey}`}
            id='sales-avenue-game-pass'
            data-testid='sales-avenue-game-pass-field'
            universeId={universeId}
            productType='GamePass'
            onChange={handleGamePassResolved}
            onPendingChange={handleGamePassPendingChange}
            disabled={inputsDisabled}
            showRequiredError={showRequiredError && !gamePassDuplicateError}
            requiredErrorMessage={translate('Error.CollaborationLicenseRevenueTargetRequired')}
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
