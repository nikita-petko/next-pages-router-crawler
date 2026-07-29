import { useCallback, useMemo, useState } from 'react';
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
  Icon,
  Tooltip,
  TooltipTrigger,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { TicketCategory, type TicketResponse } from '@modules/clients/creatorCommunication';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { getCannedRepliesForCategory } from '../constants/cannedReplies';

interface PlayerSupportBulkReplyDialogProps {
  open: boolean;
  category: TicketCategory;
  categoryLabel: string;
  selectedCount: number;
  isPending: boolean;
  universeId: number;
  onOpenChange: (open: boolean) => void;
  onSend: (response: TicketResponse) => Promise<boolean>;
}

const PlayerSupportBulkReplyDialog = ({
  open,
  category,
  categoryLabel,
  selectedCount,
  isPending,
  universeId,
  onOpenChange,
  onSend,
}: PlayerSupportBulkReplyDialogProps) => {
  const { translate } = useTranslation();
  const [selectedReply, setSelectedReply] = useState<TicketResponse>();
  const replies = useMemo(() => getCannedRepliesForCategory(category, false), [category]);
  const displayCategoryLabel = useMemo(() => {
    if (selectedCount === 1) {
      return categoryLabel;
    }

    switch (category) {
      case TicketCategory.BugReport:
        return translate('Label.TicketCategory.BugReportPlural');
      case TicketCategory.DataRestoreRequest:
        return translate('Label.TicketCategory.DataRestoreRequestPlural');
      case TicketCategory.PurchasingIssue:
        return translate('Label.TicketCategory.PurchasingIssuePlural');
      case TicketCategory.Other:
        return translate('Label.TicketCategory.OtherPlural');
      case TicketCategory.Invalid:
        return categoryLabel;
    }

    return categoryLabel;
  }, [category, categoryLabel, selectedCount, translate]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (isPending) {
        return;
      }
      if (!nextOpen) {
        setSelectedReply(undefined);
      }
      onOpenChange(nextOpen);
    },
    [isPending, onOpenChange],
  );

  const handleSend = useCallback(async () => {
    if (!selectedReply) {
      return;
    }

    const didFullySucceed = await onSend(selectedReply);
    if (didFullySucceed) {
      setSelectedReply(undefined);
      onOpenChange(false);
    }
  }, [onOpenChange, onSend, selectedReply]);

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      isModal
      size='Medium'
      hasCloseAffordance={false}>
      <DialogContent className='width-full'>
        <DialogBody className='gap-medium flex flex-col'>
          <div className='gap-xsmall flex flex-col'>
            <DialogTitle className='text-heading-small margin-y-none'>
              {translate('Heading.PlayerSupport.SendBulkReply')}
            </DialogTitle>
            <span className='content-muted text-body-medium'>
              {translate('Label.PlayerSupport.BulkReplySelectionSummary', {
                count: String(selectedCount),
                category: displayCategoryLabel,
              })}
            </span>
          </div>
          <div className='items-center gap-xsmall flex'>
            <span className='content-emphasis text-title-medium'>
              {translate('Label.ReplySelector.SelectReply')}
            </span>
            <Tooltip
              position='top-center'
              delayDurationMs={0}
              title={translate('Action.ReplySelector.Tooltip')}>
              <TooltipTrigger asChild>
                <Icon
                  name='icon-regular-circle-question'
                  size='Small'
                  className='cursor-pointer items-center content-emphasis flex'
                />
              </TooltipTrigger>
            </Tooltip>
          </div>
          <div className='gap-small flex flex-col'>
            {replies.map((reply) => {
              const isSelected = selectedReply === reply.value;
              return (
                <button
                  key={reply.value}
                  type='button'
                  aria-pressed={isSelected}
                  disabled={isPending}
                  onClick={() => {
                    if (!isSelected) {
                      unifiedLoggerClient.logClickEvent({
                        eventName: 'playerSupport.selectBulkReply',
                        parameters: {
                          universeId: String(universeId),
                          ticketCategory: category,
                          replyType: reply.value,
                          selectedCount: String(selectedCount),
                        },
                      });
                    }
                    setSelectedReply(isSelected ? undefined : reply.value);
                  }}
                  className={`text-title-medium text-align-x-left padding-small stroke-thin radius-medium ${
                    isSelected
                      ? 'bg-action-subtle content-emphasis [border-color:var(--color-selection-start)]'
                      : 'content-emphasis stroke-default [background:transparent] hover:bg-surface-200'
                  } ${isPending ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                  {translate(reply.labelKey)}
                </button>
              );
            })}
          </div>
        </DialogBody>
        <DialogFooter className='gap-small flex flex-row'>
          <Button
            variant='Emphasis'
            size='Medium'
            className='grow-1 basis-0'
            isDisabled={!selectedReply || isPending}
            isLoading={isPending}
            onClick={() => {
              void handleSend();
            }}>
            {translate('Action.Send')}
          </Button>
          <Button
            variant='Standard'
            size='Medium'
            className='grow-1 basis-0'
            isDisabled={isPending}
            onClick={() => handleOpenChange(false)}>
            {translate('Action.Cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerSupportBulkReplyDialog;
