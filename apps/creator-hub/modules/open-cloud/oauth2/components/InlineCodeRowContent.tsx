import type { ReactNode } from 'react';
import { useCallback, useState } from 'react';
import { Grid, Typography, InlineCode, IconButton, VisibilityIcon, FileCopyIcon } from '@rbx/ui';
import convertStringToAsterisks from '../utils/convertStringToAsterisks';
import copyToClipboard from '../utils/copyToClipboard';
import useInlineCodeRowContentStyles from './InlineCodeRowContent.styles';

export interface InlineCodeRowContentProps {
  label: string;
  stringContent: string;
  isContentInitiallyVisible?: boolean;
  extraButtons?: ReactNode[];
  isCopyable?: boolean;
  isVisibilityToggleable?: boolean;
  copyMessage: string;
}

const InlineCodeRowContent = ({
  label,
  stringContent,
  extraButtons,
  copyMessage,
  isCopyable = false,
  isVisibilityToggleable = false,
  isContentInitiallyVisible = true,
}: InlineCodeRowContentProps) => {
  const {
    classes: {
      rowLabel,
      dialogRowContentContainer,
      dialogRowContentInlineCode,
      dialogRowContentButtonsContainer,
      copyLabel,
      inlineCodeStyling,
      labelContainer,
      secretStyling,
    },
  } = useInlineCodeRowContentStyles();

  const [isContentVisible, setIsContentVisible] = useState<boolean>(isContentInitiallyVisible);
  const [isContentCopied, setisContentCopied] = useState<boolean>(false);

  const onChangeVisibilityHandler = useCallback(() => {
    setIsContentVisible(!isContentVisible);
  }, [isContentVisible]);

  const onCopyHandler = useCallback(() => {
    copyToClipboard(stringContent);
    setisContentCopied(true);
  }, [stringContent]);

  return (
    <Grid container className={dialogRowContentContainer} alignItems='center' direction='row'>
      <Grid className={labelContainer} item>
        <Typography className={rowLabel}>{label}</Typography>
      </Grid>
      <Grid className={dialogRowContentInlineCode} item>
        {isContentVisible ? (
          <InlineCode classes={{ root: inlineCodeStyling }}>{stringContent}</InlineCode>
        ) : (
          <InlineCode
            classes={isContentVisible ? { root: inlineCodeStyling } : { root: secretStyling }}>
            {stringContent === ''
              ? '********************************************'
              : convertStringToAsterisks(stringContent)}
          </InlineCode>
        )}
      </Grid>
      <Grid className={dialogRowContentButtonsContainer} item>
        {isVisibilityToggleable && (
          <IconButton
            aria-label='toggle visibility'
            onClick={onChangeVisibilityHandler}
            size='small'>
            <VisibilityIcon color='secondary' />
          </IconButton>
        )}
        {isCopyable && (
          <IconButton aria-label='toggle copy' onClick={onCopyHandler} size='small'>
            <FileCopyIcon color='secondary' />
          </IconButton>
        )}
        {extraButtons}
        {isContentCopied && <Typography className={copyLabel}>{copyMessage}</Typography>}
      </Grid>
    </Grid>
  );
};

export default InlineCodeRowContent;
