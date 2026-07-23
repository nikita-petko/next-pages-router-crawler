import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  clsx as cx,
  Dialog,
  DialogContent,
  DialogBody,
  DialogTitle,
  DialogFooter,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@rbx/foundation-ui';
import type { ProgramDetail } from './ProgramDetails';
import styles from './ProgramDetails.module.css';

type ProgramDetailsDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  details: Array<ProgramDetail>;
  applyUrl: string;
  applicationsClosed?: boolean;
};

export default function ProgramDetailsDialog({
  open,
  onClose,
  title,
  details,
  applyUrl,
  applicationsClosed,
}: ProgramDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState<string>(details[0]?.id ?? '');

  useEffect(() => {
    if (open) {
      setActiveTab(details[0]?.id ?? '');
    }
  }, [open, details]);

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}
      size='Large'
      isModal
      hasCloseAffordance
      closeLabel='Close'>
      <DialogContent className={styles.dialogContent}>
        <DialogBody className={cx('flex flex-col gap-medium', styles.dialogBody)}>
          <DialogTitle className='text-heading-medium margin-none'>{title} details</DialogTitle>
          <Tabs value={activeTab} onValueChange={setActiveTab} className={styles.dialogTabs}>
            <TabsList className='width-full'>
              {details.map(({ id, label }) => (
                <TabsTrigger key={id} value={id}>
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
            {details.map(({ id, details: markdown, footnote }) => (
              <TabsContent
                key={id}
                value={id}
                className={cx('padding-top-xxlarge', styles.dialogTabContent)}>
                <div className={`text-body-medium content-default ${styles.markdownContent}`}>
                  <ReactMarkdown>{markdown}</ReactMarkdown>
                </div>
                {footnote && (
                  <span className='text-caption-medium content-default padding-top-xxlarge block'>
                    {footnote}
                  </span>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </DialogBody>
        <DialogFooter className='padding-top-xxlarge'>
          {applicationsClosed ? (
            <Button variant='Emphasis' className='width-full' isDisabled>
              Applications closed
            </Button>
          ) : (
            <Button
              as='a'
              href={applyUrl}
              target='_blank'
              rel='noopener noreferrer'
              variant='Emphasis'
              className='width-full'>
              Apply
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
