import { type ChangeEvent, useCallback, useEffect, useState } from 'react';
import {
  Button,
  Chip,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
  IconButton,
  Snackbar,
  TextArea,
} from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { useAuthentication } from '@modules/authentication/providers';
import { createRoadmapFeedback } from '@modules/clients/roadmapFeedback';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { chipIdToVoteOption } from './creatorRoadmapVoteOptions';
import {
  logRoadmapFeedbackClose,
  logRoadmapFeedbackOpen,
  logRoadmapFeedbackSubmit,
  type RoadmapFeedbackSource,
} from './roadmapEvents';

type OpenCard = 'up' | 'down' | null;

const DEFAULT_FEEDBACK_SOURCE: RoadmapFeedbackSource = 'detail_modal';

// The gateway rejects descriptions longer than this.
const CREATOR_ROADMAP_DESCRIPTION_MAX_LENGTH = 500;

const blendToastWithPageSurface = (element: HTMLDivElement | null) => {
  if (element == null) {
    return;
  }
  element.style.setProperty('--inverse-surface-0', 'var(--color-surface-100)');
  element.style.setProperty('--inverse-content-emphasis', 'var(--color-content-emphasis)');
  element.style.setProperty('border-color', 'transparent');
};

type RoadmapDetailFeedbackProps = {
  itemId: string;
  source?: RoadmapFeedbackSource;
};

/** Thumbs up/down feedback for the roadmap detail modal. Pressing a thumb opens a card with
 *  single-select reason chips and an optional message; submitting logs analytics and closes. */
function RoadmapDetailFeedback({
  itemId,
  source = DEFAULT_FEEDBACK_SOURCE,
}: RoadmapDetailFeedbackProps) {
  const { translate } = useTranslation();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const { user, login } = useAuthentication();
  const [openCard, setOpenCard] = useState<OpenCard>(null);
  const [displayedRating, setDisplayedRating] = useState<'up' | 'down'>('up');
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isSubmittedSnackbarVisible, setIsSubmittedSnackbarVisible] = useState(false);

  const thumbUpLabel = translate('Action.ThumbUp');
  const thumbDownLabel = translate('Action.ThumbDown');

  const resetForm = useCallback(() => {
    setSelectedReason(null);
    setMessage('');
  }, []);

  // Reasons differ per rating, so clear any selection/message when switching or closing the card.
  const toggleCard = useCallback(
    (rating: 'up' | 'down') => {
      // Only log the opening transition. The dialog is modal, so once open the thumbs sit behind the
      // backdrop and can't be re-clicked — every reachable close goes through handleOpenChange instead.
      const isOpening = openCard !== rating;
      resetForm();
      setDisplayedRating(rating);
      setOpenCard(isOpening ? rating : null);
      if (isOpening) {
        logRoadmapFeedbackOpen(unifiedLogger, { itemId, source });
      }
    },
    [itemId, openCard, resetForm, source, unifiedLogger],
  );
  const handleThumbUp = useCallback(() => toggleCard('up'), [toggleCard]);
  const handleThumbDown = useCallback(() => toggleCard('down'), [toggleCard]);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        setOpenCard(null);
        resetForm();
        logRoadmapFeedbackClose(unifiedLogger, { itemId, source });
      }
    },
    [itemId, resetForm, source, unifiedLogger],
  );

  const handleSelectReason = useCallback(
    (id: string) => setSelectedReason((current) => (current === id ? null : id)),
    [],
  );

  const handleMessageChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => setMessage(event.target.value),
    [],
  );

  useEffect(() => {
    if (!isSubmittedSnackbarVisible) {
      return undefined;
    }
    const dismiss = () => setIsSubmittedSnackbarVisible(false);
    // Registered after this render, so the click that opened the toast won't immediately close it.
    window.addEventListener('pointerdown', dismiss);
    return () => {
      window.removeEventListener('pointerdown', dismiss);
    };
  }, [isSubmittedSnackbarVisible]);

  const handleSend = useCallback(() => {
    if (user == null) {
      void login();
      return;
    }
    logRoadmapFeedbackSubmit(unifiedLogger, {
      itemId,
      sentiment: openCard ?? '',
      categories: selectedReason ?? '',
      hasComment: message.trim().length > 0,
    });
    void createRoadmapFeedback({
      itemId,
      voteType: openCard === 'up' ? 'Upvote' : 'Downvote',
      voteOptions: selectedReason ? [chipIdToVoteOption[selectedReason]] : [],
      description: message.trim(),
    });
    setOpenCard(null);
    resetForm();
    setIsSubmittedSnackbarVisible(true);
  }, [itemId, login, message, openCard, resetForm, selectedReason, unifiedLogger, user]);

  const upCard = {
    title: translate('Heading.WhyUseful'),
    reasons: [
      { id: 'solvesBlocker', label: translate('Label.SolvesBlocker') },
      { id: 'niceToHave', label: translate('Label.NiceToHave') },
      { id: 'savesTime', label: translate('Label.SavesTime') },
      { id: 'criticalForTeam', label: translate('Label.CriticalForMyTeam') },
      { id: 'highImpact', label: translate('Label.HighImpact') },
    ],
  };

  const downCard = {
    title: translate('Heading.WhyDownVote'),
    reasons: [
      { id: 'notMyUseCase', label: translate('Label.NotMyUseCase') },
      { id: 'lowPriority', label: translate('Label.LowPriority') },
      { id: 'takesTime', label: translate('Label.TakesTime') },
      { id: 'wrongTimeline', label: translate('Label.WrongTimeline') },
      { id: 'tooComplex', label: translate('Label.TooComplex') },
    ],
  };

  const card = displayedRating === 'down' ? downCard : upCard;
  const canSend = selectedReason !== null || message.trim().length > 0;

  return (
    <>
      <div className='flex items-center radius-circle bg-action-standard padding-x-small padding-y-xsmall'>
        <IconButton
          icon={openCard === 'up' ? 'icon-filled-thumb-up' : 'icon-regular-thumb-up'}
          ariaLabel={thumbUpLabel}
          aria-haspopup='dialog'
          variant='Utility'
          size='XSmall'
          isCircular
          className='bg-[transparent]'
          onClick={handleThumbUp}
        />
        {/* 3px (not the Figma's 7px) offsets the XSmall button centering its 16px icon in a 24px box. */}
        <div className='flex items-center [padding-inline:3px]'>
          <div aria-hidden className='[width:1px] [height:16px] bg-[var(--color-stroke-default)]' />
        </div>
        <IconButton
          icon={openCard === 'down' ? 'icon-filled-thumb-down' : 'icon-regular-thumb-down'}
          ariaLabel={thumbDownLabel}
          aria-haspopup='dialog'
          variant='Utility'
          size='XSmall'
          isCircular
          className='bg-[transparent]'
          onClick={handleThumbDown}
        />
      </div>
      <Dialog
        open={openCard !== null}
        onOpenChange={handleOpenChange}
        isModal
        size='Small'
        hasCloseAffordance
        closeLabel={translate('Action.Close')}>
        <DialogContent>
          <DialogBody>
            <div className='flex flex-col gap-medium'>
              <DialogTitle className='text-heading-small margin-y-none'>{card.title}</DialogTitle>
              <div className='flex flex-row wrap items-center gap-small'>
                {card.reasons.map((reason) => (
                  <Chip
                    key={reason.id}
                    text={reason.label}
                    variant='Standard'
                    size='Small'
                    isChecked={selectedReason === reason.id}
                    onCheckedChange={() => handleSelectReason(reason.id)}
                  />
                ))}
              </div>
              <TextArea
                label={translate('Label.TellUsMore')}
                placeholder={translate('Label.FeedbackMessagePlaceholder')}
                helperText={translate('Description.FeedbackImprovesCreatorRoadmap')}
                value={message}
                onChange={handleMessageChange}
                size='Medium'
                rows={3}
                maxLength={CREATOR_ROADMAP_DESCRIPTION_MAX_LENGTH}
                // Native <textarea> defaults to resize:both; the design is a fixed box.
                textareaClassName='[resize:none]'
              />
            </div>
          </DialogBody>
          <DialogFooter className='flex'>
            <Button
              variant='Emphasis'
              size='Large'
              className='grow'
              isDisabled={!canSend}
              onClick={handleSend}>
              {translate('Action.Send')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {isSubmittedSnackbarVisible ? (
        <Snackbar
          ref={blendToastWithPageSurface}
          title={translate('Label.FeedbackSubmitted')}
          shouldAutoDismiss={false}
        />
      ) : null}
    </>
  );
}

export default withTranslation(RoadmapDetailFeedback, [TranslationNamespace.RoadMap]);
