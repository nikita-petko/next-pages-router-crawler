import type { CSSProperties, FC } from 'react';
import React, { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { IconButton, Tooltip, TooltipTrigger } from '@rbx/foundation-ui';
import { withTranslation } from '@rbx/intl';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const CONTAINER_STYLE: CSSProperties = {
  bottom: 0,
};

const BUTTON_STYLE: CSSProperties = {
  width: 32,
  height: 32,
};

const DISABLED_SHELL_STYLE: CSSProperties = {
  opacity: 0.5,
  cursor: 'not-allowed',
};

const MAX_ROWS = 4;

/** Approximate line-height per row for auto-grow cap (Large body text). */
const ROW_HEIGHT_REM = 1.5;

const SHELL_CLASS_NAME =
  'relative bg-surface-100 stroke-standard stroke-default radius-large flex flex-col gap-small overflow-hidden padding-medium';

const TEXTAREA_CLASS_NAME =
  'bg-none stroke-none outline-none content-emphasis placeholder:content-muted text-body-large width-full';

const ACTION_ROW_CLASS_NAME = 'flex items-center justify-end';

const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
  textarea.style.height = 'auto';
  const computedStyle = getComputedStyle(textarea);
  const maxHeight = parseFloat(computedStyle.maxHeight);
  const nextHeight = Math.min(textarea.scrollHeight, maxHeight);
  textarea.style.height = `${nextHeight}px`;
  textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
};

interface AIChatInputProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onStop?: () => void;
  isLoading: boolean;
  isDisabled?: boolean;
  disabledTooltip?: string;
}

const AIChatInput: FC<AIChatInputProps> = ({
  inputValue,
  onInputChange,
  onSend,
  onStop,
  isLoading,
  isDisabled = false,
  disabledTooltip,
}) => {
  const { translate } = useRAQIV2TranslationDependencies();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const textareaStyle = useMemo(
    (): CSSProperties => ({
      backgroundColor: 'transparent',
      border: 0,
      boxShadow: 'none',
      display: 'block',
      margin: 0,
      padding: 0,
      resize: 'none',
      minHeight: `${ROW_HEIGHT_REM}rem`,
      maxHeight: `${MAX_ROWS * ROW_HEIGHT_REM}rem`,
      overflowY: 'hidden',
      transition: 'height 180ms ease-out',
    }),
    [],
  );

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      adjustTextareaHeight(textarea);
    }
  }, [inputValue]);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      onInputChange(event.target.value);
    },
    [onInputChange],
  );

  const handleClick = useCallback(() => {
    if (isLoading) {
      onStop?.();
    } else {
      onSend();
    }
  }, [isLoading, onSend, onStop]);

  const isEmpty = inputValue.trim().length === 0;

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key !== 'Enter' || event.shiftKey) {
        return;
      }

      event.preventDefault();

      if (!isLoading && !isDisabled && !isEmpty) {
        onSend();
      }
    },
    [isLoading, isDisabled, isEmpty, onSend],
  );

  const sendAriaLabel = translate(
    translationKey('Action.Send', TranslationNamespace.AnalyticsAssistant),
  );
  const stopAriaLabel = translate(
    translationKey('Action.Cancel', TranslationNamespace.AnalyticsAssistant),
  );
  const placeholder = translate(
    translationKey('Placeholder.AI.AskAboutAnalyticsData', TranslationNamespace.Analytics),
  );

  const shell = (
    <div className={SHELL_CLASS_NAME} style={isDisabled ? DISABLED_SHELL_STYLE : undefined}>
      <textarea
        ref={textareaRef}
        className={TEXTAREA_CLASS_NAME}
        style={textareaStyle}
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={isDisabled}
        rows={1}
        aria-label={placeholder}
        placeholder={placeholder}
      />
      <div className={ACTION_ROW_CLASS_NAME}>
        <IconButton
          type='button'
          size='Small'
          isCircular
          className='shrink-0'
          style={BUTTON_STYLE}
          variant={isLoading ? 'Standard' : 'Emphasis'}
          icon={isLoading ? 'icon-filled-stop-small' : 'icon-filled-arrow-large-up'}
          ariaLabel={isLoading ? stopAriaLabel : sendAriaLabel}
          isDisabled={isDisabled || (!isLoading && isEmpty)}
          onClick={handleClick}
        />
      </div>
    </div>
  );

  return (
    <div
      className='sticky bg-surface-0 padding-top-medium padding-bottom-small'
      style={CONTAINER_STYLE}>
      {disabledTooltip ? (
        <Tooltip title={disabledTooltip} position='top-center'>
          <TooltipTrigger asChild>{shell}</TooltipTrigger>
        </Tooltip>
      ) : (
        shell
      )}
    </div>
  );
};

export default withTranslation(AIChatInput, [
  TranslationNamespace.Analytics,
  TranslationNamespace.AnalyticsAssistant,
]);
