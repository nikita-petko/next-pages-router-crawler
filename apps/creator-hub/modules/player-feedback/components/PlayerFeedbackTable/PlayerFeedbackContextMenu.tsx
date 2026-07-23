import React, {
  Fragment,
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation, useLocalization, NativeName } from '@rbx/intl';
import {
  Dialog,
  DialogTemplate,
  IconButton,
  ListItemIcon,
  makeStyles,
  Menu,
  MenuItem,
  MoreVertIcon,
  Typography,
  useMediaQuery,
  ReportOutlinedIcon,
  TranslateOutlinedIcon,
  CircularProgress,
} from '@rbx/ui';
import { ExperienceReview } from '@rbx/clients/playerGeneratedReviewsService';
import { useReportAsssetReview } from '@modules/react-query/playerFeedback';
import { useSnackbarAlert, useIXPParameters } from '@modules/miscellaneous/hooks';
import { IXPLayers } from '@modules/clients/ixpExperiments';

type PlayerFeedbackContextMenuProps = {
  review: ExperienceReview;
  onTranslationToggle: () => void;
  isTranslating: boolean;
  showTranslation: boolean;
  isTranslated: boolean;
  setShowMenuIcon: (showMenuIcon: boolean) => void;
};
const useStyles = makeStyles()((theme) => ({
  contextMenu: {
    gap: 16,
    [theme.breakpoints.down('Medium')]: {
      '& .MuiMenu-paper': {
        width: '100%',
      },
    },
  },
}));

const PlayerFeedbackContextMenu: FunctionComponent<PlayerFeedbackContextMenuProps> = ({
  review,
  onTranslationToggle,
  isTranslating,
  showTranslation,
  isTranslated,
  setShowMenuIcon,
}) => {
  const { translate } = useTranslation();
  const { nativeName } = useLocalization();
  const showSnackbarMessage = useSnackbarAlert();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const renderMenuInModal = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  const [isConfirmDialogShown, setIsConfirmDialogShown] = useState<boolean>(false);
  const { mutate: reportReview, isPending: isReportReviewPending } = useReportAsssetReview();
  const { params: ixpParams } = useIXPParameters(IXPLayers.CreatorDashboard);

  // Separate UI logic for Chinese languagese
  const languageDisplay = useMemo(() => {
    if (
      nativeName &&
      (nativeName === NativeName.SimplifiedChinese || nativeName === NativeName.TraditionalChinese)
    ) {
      return `- ${nativeName}`;
    }
    return ` (${nativeName})`;
  }, [nativeName]);

  const handleReportReview = useCallback(() => {
    reportReview(review.id, {
      onSuccess: () => {
        showSnackbarMessage('success', translate('Message.ReportCommentSuccess'));
        setIsConfirmDialogShown(false);
      },
    });
  }, [reportReview, review.id, showSnackbarMessage, translate]);

  const onClickReportComment = useCallback(() => {
    setIsMenuOpen(false);
    setIsConfirmDialogShown(true);
  }, []);

  // Triggers when the user clicks the translate button. Calls parent function for actual translation request
  const onClickTranslateComment = useCallback(() => {
    if (showTranslation || isTranslated) {
      setIsMenuOpen(false);
    }
    onTranslationToggle();
  }, [onTranslationToggle, showTranslation, isTranslated]);

  const handleClose = useCallback(() => {
    setIsMenuOpen(false);
  }, []);
  const handleClick = useCallback(() => {
    setIsMenuOpen(true);
  }, []);

  // This is to fix desync of menu being open and three dots showing on the right side
  useEffect(() => {
    if (!isMenuOpen) {
      setShowMenuIcon(false);
    }
  }, [isMenuOpen, setShowMenuIcon]);

  const {
    classes: { contextMenu },
  } = useStyles();

  return (
    <Fragment>
      <IconButton aria-label='more' color='secondary' ref={buttonRef} onClick={handleClick}>
        <MoreVertIcon />
      </IconButton>
      <Menu
        open={isMenuOpen}
        anchorEl={renderMenuInModal ? null : buttonRef.current}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        className={contextMenu}>
        {ixpParams?.EnablePlayerFeedbackTranslationsWeb && (
          <MenuItem onClick={onClickTranslateComment} disabled={isTranslating}>
            <ListItemIcon>
              {isTranslating ? (
                <CircularProgress size={14} color='inherit' />
              ) : (
                <TranslateOutlinedIcon fontSize='small' />
              )}
            </ListItemIcon>
            {(() => {
              if (isTranslating) {
                return (
                  <Typography color='primary'>{`${translate('Action.Translating')}...`}</Typography>
                );
              }
              if (showTranslation && isTranslated) {
                return <Typography color='primary'>{translate('Action.ShowOriginal')}</Typography>;
              }
              return (
                <Typography color='primary'>{`${translate('Action.TranslateComment')} ${languageDisplay}`}</Typography>
              );
            })()}
          </MenuItem>
        )}
        <MenuItem onClick={onClickReportComment}>
          <ListItemIcon>
            <ReportOutlinedIcon color='error' />
          </ListItemIcon>
          <Typography color='error'>{translate('Action.ReportComment')}</Typography>
        </MenuItem>
      </Menu>
      <Dialog open={isConfirmDialogShown}>
        <DialogTemplate
          color='destructive'
          onConfirm={handleReportReview}
          onCancel={() => setIsConfirmDialogShown(false)}
          title={translate('Title.ReportCommentDialog')}
          content={translate('Message.ReportCommentDialogWithWarning')}
          confirmText={translate('Action.Report')}
          cancelText={translate('Action.Cancel')}
          loading={isReportReviewPending}
        />
      </Dialog>
    </Fragment>
  );
};

export default PlayerFeedbackContextMenu;
