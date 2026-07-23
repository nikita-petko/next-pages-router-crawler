import React, { FC, useMemo } from 'react';
import { TextField, Button, InputAdornment, ArrowUpwardIcon, useMediaQuery } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useRAQIV2TranslationDependencies } from '@modules/experience-analytics-shared';
import { withTranslation } from '@rbx/intl';
import useAIChatInterfaceStyles from './AIChatInterface.styles';

interface AIChatInputProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onKeyPress: (event: React.KeyboardEvent) => void;
  onSend: () => void;
  onStop?: () => void;
  isLoading: boolean;
}

const AIChatInput: FC<AIChatInputProps> = ({
  inputValue,
  onInputChange,
  onKeyPress,
  onSend,
  onStop,
  isLoading,
}) => {
  const { translate } = useRAQIV2TranslationDependencies();
  const {
    classes: {
      inputContainer,
      inputWrapper,
      textField,
      mobileSendButton,
      desktopSendButton,
      stopIcon,
      inputButtonWrapper,
    },
  } = useAIChatInterfaceStyles();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Theme typing from @rbx/ui
  const isCompact = useMediaQuery((theme: any) => theme.breakpoints.down('Medium'));

  const inputAdornment = useMemo(() => {
    const disabled = !isLoading && inputValue.length === 0;
    const buttonColor = isLoading ? 'inherit' : 'primary';
    const stopLabel = 'Stop';
    const sendLabel = 'Send';

    return (
      <React.Fragment>
        {isCompact ? (
          <Button
            className={mobileSendButton}
            disabled={disabled}
            aria-label={isLoading ? stopLabel : sendLabel}
            size='medium'
            variant={isLoading ? 'text' : 'contained'}
            color={buttonColor}
            onClick={isLoading ? onStop || (() => {}) : onSend}>
            {isLoading ? (
              <div className={stopIcon} />
            ) : (
              <ArrowUpwardIcon
                color={inputValue.length === 0 ? 'disabled' : 'inherit'}
                fontSize='medium'
              />
            )}
          </Button>
        ) : (
          <Button
            className={desktopSendButton}
            disabled={disabled}
            color={buttonColor}
            size='medium'
            variant={isLoading ? 'text' : 'contained'}
            aria-label={isLoading ? stopLabel : sendLabel}
            onClick={isLoading ? onStop || (() => {}) : onSend}>
            {isLoading && <div className={stopIcon} />}
            <React.Fragment>{isLoading ? stopLabel : sendLabel}</React.Fragment>
          </Button>
        )}
      </React.Fragment>
    );
  }, [
    isLoading,
    inputValue.length,
    isCompact,
    mobileSendButton,
    onStop,
    onSend,
    desktopSendButton,
    stopIcon,
  ]);

  return (
    <div className={inputContainer}>
      <div className={inputWrapper}>
        <TextField
          className={textField}
          label={translate(
            translationKey('Placeholder.AI.AskAboutAnalyticsData', TranslationNamespace.Analytics),
          )}
          id='ai-chat-input'
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyPress={onKeyPress}
          disabled={isLoading}
          variant='outlined'
          size='medium'
          InputProps={{
            endAdornment: (
              <InputAdornment className={inputButtonWrapper} position='end'>
                {inputAdornment}
              </InputAdornment>
            ),
          }}
        />
      </div>
    </div>
  );
};

export default withTranslation(AIChatInput, [
  TranslationNamespace.Analytics,
  TranslationNamespace.AnalyticsAssistant,
]);
