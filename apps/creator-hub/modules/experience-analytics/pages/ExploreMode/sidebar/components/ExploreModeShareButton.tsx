import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTranslation } from '@rbx/intl';
import { Button, Tooltip, TooltipTrigger } from '@rbx/foundation-ui';

type ExploreModeShareButtonProps = {
  label: string;
  copyText?: string;
};

const copiedFeedbackDurationMs = 1500;

const ExploreModeShareButton: FC<ExploreModeShareButtonProps> = ({ label, copyText }) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const shareTooltipLabel = tPendingTranslation(
    'Copy link to this page',
    'Tooltip text for the share action that copies the current page URL.',
    translationKey('Description.PagePermalinkTooltip', TranslationNamespace.Analytics),
  );
  const shareCopiedLabel = tPendingTranslation(
    'Copied!',
    'Tooltip text shown after the share link is copied to clipboard.',
    translationKey('Message.Copied', TranslationNamespace.Analytics),
  );

  const [isCopied, setIsCopied] = useState(false);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const copiedResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (copiedResetTimeoutRef.current) {
        clearTimeout(copiedResetTimeoutRef.current);
      }
    },
    [],
  );

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(copyText ?? window.location.href);
      setIsCopied(true);
      if (copiedResetTimeoutRef.current) {
        clearTimeout(copiedResetTimeoutRef.current);
      }
      copiedResetTimeoutRef.current = setTimeout(() => {
        setIsCopied(false);
      }, copiedFeedbackDurationMs);
    } catch {
      setIsCopied(false);
    }
  }, [copyText]);

  return (
    <Tooltip
      title={isCopied ? shareCopiedLabel : shareTooltipLabel}
      position='top-center'
      delayDurationMs={0}
      open={isCopied || isTooltipOpen}
      onOpenChange={setIsTooltipOpen}>
      <TooltipTrigger asChild>
        <Button variant='Emphasis' size='Small' onClick={handleShare}>
          {label}
        </Button>
      </TooltipTrigger>
    </Tooltip>
  );
};

export default ExploreModeShareButton;
