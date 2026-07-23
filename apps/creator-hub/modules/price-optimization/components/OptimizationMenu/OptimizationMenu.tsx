import { Fragment, useRef, useState } from 'react';
import NextLink from 'next/link';
import {
  Button,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  MoreHorizIcon,
  TDialogContext,
  Typography,
  useDialog,
} from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { ExperimentState } from '@rbx/clients/priceExperimentationApi/v1';
import { useLocalStorage } from '@rbx/react-utilities';
import { isInHoldoutState } from '../../helpers/experimentUtils';
import {
  rootDocumentationLink,
  getPriceCheckLinkFromPriceOptimization,
} from '../../constants/links';
import useGetLatestExperiment from '../../queries/useGetLatestExperiment';
import { usePricingErrorContext } from '../../providers/PricingErrorProvider';
import IntroductionModal from '../IntroductionModal/IntroductionModal';
import useOptimizationMenuStyles from './OptimizationMenu.style';
import useStopHoldout from '../../queries/useStopHoldout';
import { lastViewedHoldoutFinishedKey } from '../../constants/experimentConstants';

type TTranslationProps = Pick<ReturnType<typeof useTranslation>, 'translate' | 'translateHTML'>;

type TConfirmRestorePricesDialogProps = Pick<TDialogContext, 'close'> & {
  handleStopHoldoutConfirm: (restorePrices: boolean) => void;
} & TTranslationProps;
type TStopHoldoutDialogProps = Pick<TDialogContext, 'close' | 'configure'> & {
  handleStopHoldoutConfirm: (restorePrices: boolean) => void;
} & TTranslationProps;

const ConfirmRestorePricesDialog = ({
  close,
  handleStopHoldoutConfirm,
  translate,
}: TConfirmRestorePricesDialogProps) => {
  return (
    <Fragment>
      <DialogTitle>{translate('Heading.StopHoldout.ConfirmRestorePrices')}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          <Typography variant='body2' color='secondary'>
            {translate('Description.StopHoldout.ConfirmRestorePrices')}
          </Typography>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button variant='outlined' color='primary' onClick={close}>
          {translate('Action.Cancel')}
        </Button>
        <Button variant='contained' color='primary' onClick={() => handleStopHoldoutConfirm(true)}>
          {translate('Action.ConfirmRestorePrices')}
        </Button>
      </DialogActions>
    </Fragment>
  );
};

const StopHoldoutDialog = ({
  configure,
  close,
  handleStopHoldoutConfirm,
  translate,
  translateHTML,
}: TStopHoldoutDialogProps) => {
  const { classes } = useOptimizationMenuStyles();

  return (
    <Fragment>
      <DialogTitle>{translate('Heading.StopHoldout')}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          <Typography variant='body2' color='secondary' className={classes.dialogContentText}>
            {translateHTML('Description.StopHoldout', null, { linkBreak: <br /> })}
          </Typography>
        </DialogContentText>
      </DialogContent>
      <DialogActions className={classes.menuContainer}>
        <Button color='primary' onClick={close}>
          {translate('Action.Cancel')}
        </Button>
        <span className={classes.dialogButtonGroup}>
          <Button
            color='primary'
            variant='outlined'
            onClick={() =>
              configure(
                <ConfirmRestorePricesDialog
                  close={close}
                  handleStopHoldoutConfirm={handleStopHoldoutConfirm}
                  translate={translate}
                  translateHTML={translateHTML}
                />,
                { maxWidth: 'Medium' },
              )
            }>
            {translate('Action.StopHoldout.RestoreOriginalPrice')}
          </Button>
          <Button
            variant='contained'
            color='primary'
            onClick={() => handleStopHoldoutConfirm(false)}>
            {translate('Action.StopHoldout.ConfirmStop')}
          </Button>
        </span>
      </DialogActions>
    </Fragment>
  );
};

const OptimizationMenu = () => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { setHasError } = usePricingErrorContext();

  const { translate, translateHTML } = useTranslation();

  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // If we are modifying the experiment then stop holdout menu item should be disabled.
  const [isModifyingExperiment, setIsModifyingExperiment] = useState<boolean>(false);

  const [isIntroductionModalOpen, setIsIntroductionModalOpen] = useState(false);

  // Don't need to check loading state since button will be disabled while loading
  // Just check if universeId and currentExperiment are defined
  const { universeId, latestExperiment: currentExperiment } = useGetLatestExperiment();

  const { open: openDialog, close: closeDialog, configure: configureDialog } = useDialog();

  const { stopHoldout } = useStopHoldout();
  const setLastViewedHoldoutFinished = useLocalStorage<null | string>(
    lastViewedHoldoutFinishedKey,
    null,
  )[1];

  const handleStopHoldoutConfirm = async (restorePrices: boolean) => {
    closeDialog();
    setIsModifyingExperiment(true);
    try {
      await stopHoldout(universeId!, currentExperiment!.id, restorePrices);
      // If we're restoring prices, there will be a confirmation modal which should pop up
      // We use local storage to tell if user saw it as the state is reloading and in case the user reloads the page
      if (restorePrices) {
        setLastViewedHoldoutFinished(currentExperiment!.id);
      }
    } catch {
      setHasError(true);
    }
    setIsModifyingExperiment(false);
  };

  const handleStopHoldoutMenuItemClicked = () => {
    setIsMenuOpen(false);
    configureDialog(
      <StopHoldoutDialog
        configure={configureDialog}
        close={closeDialog}
        handleStopHoldoutConfirm={handleStopHoldoutConfirm}
        translate={translate}
        translateHTML={translateHTML}
      />,
      {
        maxWidth: 'Medium',
      },
    );
    openDialog();
  };

  const stopHoldoutDisabled =
    !universeId ||
    !currentExperiment ||
    currentExperiment.state !== ExperimentState.HoldoutRunning ||
    isModifyingExperiment;

  const stopHoldoutMenuItem = isInHoldoutState(currentExperiment?.state) ? (
    <MenuItem disabled={stopHoldoutDisabled} onClick={handleStopHoldoutMenuItemClicked}>
      {translate('Action.StopHoldout')}
    </MenuItem>
  ) : null;

  return (
    <Fragment>
      <IconButton
        aria-label='Open Options'
        color='default'
        ref={buttonRef}
        // Toggle menu open state on click
        onClick={() => setIsMenuOpen((prevValue) => !prevValue)}>
        <MoreHorizIcon color='inherit' />
      </IconButton>

      <Menu
        variant='menu'
        anchorEl={buttonRef.current}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}>
        <MenuItem
          onClick={() => {
            setIsIntroductionModalOpen(true);
            setIsMenuOpen(false);
          }}>
          {translate('Action.LearnMore')}
        </MenuItem>
        <MenuItem component={NextLink} href={getPriceCheckLinkFromPriceOptimization(universeId!)}>
          {translate('Heading.DynamicPriceCheck')}
        </MenuItem>
        <MenuItem component={NextLink} href={rootDocumentationLink}>
          {translate('Action.ReadDocumentation')}
        </MenuItem>
        {stopHoldoutMenuItem}
      </Menu>

      <IntroductionModal open={isIntroductionModalOpen} setOpen={setIsIntroductionModalOpen} />
    </Fragment>
  );
};

export default OptimizationMenu;
