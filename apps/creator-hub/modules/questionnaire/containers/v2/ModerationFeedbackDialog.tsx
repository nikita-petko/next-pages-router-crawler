import { FunctionComponent, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogBody,
  DialogTitle,
  DialogFooter,
  Button,
} from '@rbx/foundation-ui';
import { Table, TableHead, TableBody, TableRow, TableCell } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import type { V2Beta1Moderation } from '@rbx/clients/experienceGuidelinesService/v1';
import useCommonTableStyles from '../../utils/commonTableStyles';

export interface ModerationFeedbackDialogProps {
  open: boolean;
  onClose: () => void;
  moderation: V2Beta1Moderation;
}

const ModerationFeedbackDialog: FunctionComponent<ModerationFeedbackDialogProps> = ({
  open,
  onClose,
  moderation,
}) => {
  const { translate } = useTranslation();
  const {
    classes: { borderedTable },
  } = useCommonTableStyles();

  const feedbackRows = useMemo(() => {
    const reasoning = moderation.moderatorReasoning ?? [];
    const creatorItems = moderation.creatorUsages?.items ?? [];
    const moderatorItems = moderation.moderatorUsages?.items ?? [];
    const notPresent = translate(
      'Message.NotPresentDescriptorUsage' /* in TranslationNamespace.DeveloperQuestionnaire */,
    );

    const getUsageDisplayName = (usage: (typeof creatorItems)[number] | undefined): string => {
      if (!usage) return '—';
      if (!usage.contains) return notPresent;
      return usage.descriptorDisplayName || usage.experienceDescriptor?.displayName || '—';
    };

    return reasoning.map((r) => {
      const creatorUsage = creatorItems.find((item) => item.name === r.descriptorName);
      const moderatorUsage = moderatorItems.find((item) => item.name === r.descriptorName);

      const descriptorLabel =
        creatorUsage?.experienceDescriptor?.displayName ||
        moderatorUsage?.experienceDescriptor?.displayName ||
        r.descriptorName ||
        '';

      return {
        descriptorName: r.descriptorName ?? '',
        descriptorLabel,
        creatorDisplayName: getUsageDisplayName(creatorUsage),
        moderatorDisplayName: getUsageDisplayName(moderatorUsage),
        reasoning: r.reasoning,
      };
    });
  }, [moderation, translate]);

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      size='Large'
      isModal
      hasCloseAffordance
      closeLabel={translate('Action.Close' /* in TranslationNamespace.Controls */)}>
      <DialogContent
        className='flex flex-col'
        style={{ maxHeight: '80vh', maxWidth: 'min(720px, 90vw)' }}>
        <DialogBody className='flex flex-col gap-large scroll-y min-height-[0px]'>
          <DialogTitle className='text-heading-small margin-none'>
            {translate(
              'Title.YourModerationFeedback' /* in TranslationNamespace.DeveloperQuestionnaire */,
            )}
          </DialogTitle>
          <span className='text-body-medium content-default'>
            {translate(
              'Description.ModerationFeedbackInaccurate' /* in TranslationNamespace.DeveloperQuestionnaire */,
            )}
          </span>
          <Table className={`${borderedTable} radius-medium clip`}>
            <TableHead>
              <TableRow>
                <TableCell>
                  <span className='text-label-medium'>
                    {translate(
                      'TableHead.YourResponse' /* in TranslationNamespace.DeveloperQuestionnaire */,
                    )}
                  </span>
                </TableCell>
                <TableCell>
                  <span className='text-label-medium'>
                    {translate(
                      'TableHead.ModeratorFeedback' /* in TranslationNamespace.DeveloperQuestionnaire */,
                    )}
                  </span>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {feedbackRows.length > 0 ? (
                feedbackRows.map((row) => (
                  <TableRow key={row.descriptorName}>
                    <TableCell>
                      <div className='flex flex-col'>
                        <span className='text-label-medium'>{row.descriptorLabel}</span>
                        <span className='text-body-medium'>{row.creatorDisplayName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex flex-col'>
                        <span className='text-label-medium'>{row.descriptorLabel}</span>
                        <span className='text-body-medium'>{row.moderatorDisplayName}</span>
                        {row.reasoning && (
                          <span className='text-body-small content-default'>{row.reasoning}</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell>
                    <span className='text-body-medium'>—</span>
                  </TableCell>
                  <TableCell>
                    <span className='text-body-medium'>—</span>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DialogBody>
        <DialogFooter className='flex items-center justify-end gap-small'>
          <span className='text-body-medium content-default'>
            {translate(
              'Description.AppealOwnerOnly' /* in TranslationNamespace.DeveloperQuestionnaire */,
            )}
          </span>
          <Button
            as='a'
            href='https://www.roblox.com/report-appeals#/'
            target='_blank'
            rel='noopener'
            variant='Emphasis'
            size='Medium'>
            {translate('Action.Appeal' /* in TranslationNamespace.DeveloperQuestionnaire */)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModerationFeedbackDialog;
