import { useCallback, useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  makeStyles,
} from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import HighlightingCodeBlock, {
  HighlightingCodeBlockLanguage,
} from '@modules/charts-generic/components/HighlightingCodeBlock/HighlightingCodeBlock';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import generateSnippet from '../utils/generateSnippet';
import CopySnippetButton from './CopySnippetButton';
import type { CreateOrEditResult } from './CreateOrEditDialog';

const useStyles = makeStyles()((theme) => {
  return {
    snippetBlock: {
      border: `2px solid ${theme.palette.divider}`,
      padding: theme.spacing(2),
      margin: theme.spacing(2, 0, 0),
      borderRadius: '8px',
      color: '#ADF195',
    },
  };
});

type SnippetDialogProps = CreateOrEditResult & {
  open: boolean;
  onClose: () => void;
  onCopySnippet: () => void;
};
const SnippetDialog = ({ open, onClose, onCopySnippet, configKey }: SnippetDialogProps) => {
  const {
    classes: { snippetBlock },
  } = useStyles();
  const { translate } = useTranslationWrapper(useTranslation());

  const snippetText = useMemo(() => {
    if (!configKey) {
      return null;
    }
    return generateSnippet(configKey);
  }, [configKey]);

  const onCopyClicked = useCallback(() => {
    if (snippetText === null) {
      return;
    }
    onCopySnippet();
  }, [onCopySnippet, snippetText]);

  const snippet = useMemo(() => {
    if (snippetText === null) {
      return null;
    }

    return (
      <Grid item className={snippetBlock}>
        <HighlightingCodeBlock
          code={snippetText}
          codePreviewSnippet={snippetText}
          language={HighlightingCodeBlockLanguage.Lua}
          expanded
          secondaryActionButton={<CopySnippetButton onClick={onCopyClicked} />}
        />
      </Grid>
    );
  }, [onCopyClicked, snippetBlock, snippetText]);
  // TODO: pull this out into its own component

  const title = translate(
    translationKey('Dialog.Snippet.Title', TranslationNamespace.UniverseConfigAndExperimentation),
  );
  const subheader = translate(
    translationKey(
      'Dialog.Snippet.Subheader',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  const confirmText = translate(
    translationKey('Dialog.Snippet.Confirm', TranslationNamespace.UniverseConfigAndExperimentation),
  );
  return (
    <Dialog open={open} fullWidth maxWidth='Medium' onClose={onClose}>
      <DialogTitle id='snippet-dialog' data-testid='dialog-title'>
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>{subheader}</DialogContentText>
        {snippet}
      </DialogContent>
      <DialogActions>
        <Button
          size='large'
          variant='contained'
          aria-label={confirmText}
          color='primaryBrand'
          data-testid='snippet-dialog-confirm-button'
          onClick={onClose}>
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
export default SnippetDialog;
