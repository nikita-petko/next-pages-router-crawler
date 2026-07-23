// oxlint-disable typescript/no-non-null-assertion
import { useState } from 'react';
import { ExperimentState } from '@rbx/client-price-experimentation-api/v1';
import { useTranslation } from '@rbx/intl';
import { Button, Dialog, DialogTemplate, Typography } from '@rbx/ui';
import { Link } from '@modules/monetization-shared/link';
import { rootDocumentationLink } from '../../constants/links';
import { usePricingErrorContext } from '../../providers/PricingErrorProvider';
import { useCancelExperiment } from '../../queries/useCancelExperiment';
import { useGetLatestExperiment } from '../../queries/useGetLatestExperiment';
import useCurrentOptimizationStyles from './CurrentOptimization.styles';

const InProgressDisplay = () => {
  const { translate, translateHTML } = useTranslation();
  const { classes } = useCurrentOptimizationStyles();
  // Don't need to check loading states for useGetLatestExperiment
  // since this component is only rendered when fully loaded
  const { universeId, latestExperiment: currentExperiment } = useGetLatestExperiment();

  const { cancelExperiment } = useCancelExperiment();

  const { setHasError } = usePricingErrorContext();

  // If we are modifying the experiment then cancel experiment button should be disabled
  const [isModifyingExperiment, setIsModifyingExperiment] = useState<boolean>(false);
  const [isCancelExperimentDialogOpen, setIsCancelExperimentDialogOpen] = useState<boolean>(false);

  const cancelExperimentDisabled =
    !universeId ||
    !currentExperiment ||
    currentExperiment.state !== ExperimentState.Running ||
    isModifyingExperiment;

  const handleStopOptimizationConfirm = async () => {
    setIsModifyingExperiment(true);
    try {
      await cancelExperiment({ universeId: universeId!, experimentId: currentExperiment!.id });
    } catch {
      setHasError(true);
    }
    setIsModifyingExperiment(false);
  };

  return (
    <div className={classes.container}>
      <div>
        <Typography variant='h3' component='h3' className={classes.headingGapSmall}>
          {translate('Heading.ProductList')}
        </Typography>
        <Typography variant='body1' component='p' className={classes.textBox}>
          {translateHTML('Description.ActiveTest', [
            {
              opening: 'linkStart',
              closing: 'linkEnd',
              content: (chunks) => (
                <Link href={rootDocumentationLink} target='_blank'>
                  {chunks}
                </Link>
              ),
            },
          ])}
        </Typography>
      </div>
      <Button
        onClick={() => setIsCancelExperimentDialogOpen(true)}
        disabled={cancelExperimentDisabled}
        className={classes.actionButton}
        color='destructive'
        variant='outlined'>
        {translate('Action.StopTest')}
      </Button>

      <Dialog
        open={isCancelExperimentDialogOpen}
        onClose={() => setIsCancelExperimentDialogOpen(false)}>
        <DialogTemplate
          onCancel={() => setIsCancelExperimentDialogOpen(false)}
          onConfirm={handleStopOptimizationConfirm}
          color='destructive'
          title={translate('Heading.StopTest')}
          content={
            <Typography variant='body1' color='secondary'>
              {translate('Message.StopTest')}
            </Typography>
          }
          cancelText={translate('Action.Cancel')}
          confirmText={translate('Action.ConfirmStopTest')}
        />
      </Dialog>
    </div>
  );
};

export default InProgressDisplay;
