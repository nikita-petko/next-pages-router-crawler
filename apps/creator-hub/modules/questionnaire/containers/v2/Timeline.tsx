import React, { FunctionComponent, useEffect, useState } from 'react';
import { withTranslation, useTranslation, useLocalization } from '@rbx/intl';
import {
  Timeline as FoundationTimeline,
  TimelineItem,
  Dialog,
  DialogContent,
  DialogBody,
  DialogTitle,
  DialogFooter,
  Button,
} from '@rbx/foundation-ui';
import DOMPurify from 'dompurify';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { ActivityEvent } from '../../interfaces/types';

// Create a separate DOMPurify instance so hooks don't affect other usages.
// Lazily initialized to avoid "window is not defined" during SSR.
let purify: ReturnType<typeof DOMPurify> | null = null;
function getPurify() {
  if (!purify) {
    purify = DOMPurify(window);
    purify.addHook('afterSanitizeAttributes', (node) => {
      if (node.tagName.toLowerCase() === 'a') {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer');
      }
    });
  }
  return purify;
}

export type { ActivityEvent };

interface TimelineProps {
  events: ActivityEvent[];
  initialSelectedEvent?: ActivityEvent | null;
  onSelectedEventChange?: (event: ActivityEvent | null) => void;
}

const Timeline: FunctionComponent<TimelineProps> = ({
  events,
  initialSelectedEvent,
  onSelectedEventChange,
}) => {
  const { translate } = useTranslation();
  const { locale } = useLocalization();
  const [selectedEvent, setSelectedEvent] = useState<ActivityEvent | null>(null);

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return isoString;
    return new Intl.DateTimeFormat(locale ?? undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  const updateSelectedEvent = (event: ActivityEvent | null) => {
    setSelectedEvent(event);
    onSelectedEventChange?.(event);
  };

  useEffect(() => {
    if (initialSelectedEvent) {
      setSelectedEvent(initialSelectedEvent);
      onSelectedEventChange?.(initialSelectedEvent);
    }
  }, [initialSelectedEvent]); // eslint-disable-line react-hooks/exhaustive-deps -- onSelectedEventChange is stable, only react to data changes

  if (!events || events.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center padding-xlarge'>
        <span className='text-body-medium content-muted'>
          {translate('Description.NoActivity')}
        </span>
      </div>
    );
  }

  return (
    <React.Fragment>
      <FoundationTimeline>
        {events.map((event) => (
          <TimelineItem
            key={event.id}
            title={event.title}
            description={formatDate(event.createTime)}
            link={
              event.details ? (
                <span
                  role='button'
                  tabIndex={0}
                  className='text-body-medium content-link cursor-pointer'
                  onClick={() => updateSelectedEvent(event)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') updateSelectedEvent(event);
                  }}>
                  View
                </span>
              ) : undefined
            }
          />
        ))}
      </FoundationTimeline>
      <Dialog
        open={selectedEvent !== null}
        onOpenChange={(open) => {
          if (!open) updateSelectedEvent(null);
        }}
        size='Large'
        isModal
        hasCloseAffordance
        closeLabel='Close'>
        <DialogContent>
          <DialogBody className='flex flex-col gap-y-xsmall scroll-y max-height-[70vh]'>
            <DialogTitle className='text-heading-small margin-none'>
              {selectedEvent?.title}
            </DialogTitle>
            <div className='flex flex-col gap-y-xxlarge'>
              <div className='flex flex-col'>
                <span className='text-title-large'>Date</span>
                <span className='text-body-large'>
                  {selectedEvent ? formatDate(selectedEvent.createTime) : ''}
                </span>
              </div>
              {selectedEvent?.details && (
                <div className='flex flex-col'>
                  <span className='text-title-large'>Details</span>
                  {/* eslint-disable react/no-danger -- HTML from IARC activity service, sanitized with DOMPurify */}
                  <div
                    className='text-body-large'
                    dangerouslySetInnerHTML={{
                      __html: getPurify().sanitize(selectedEvent.details, {
                        ALLOWED_TAGS: [
                          'b',
                          'i',
                          'u',
                          's',
                          'br',
                          'p',
                          'ol',
                          'li',
                          'strong',
                          'a',
                          'em',
                        ],
                        ALLOWED_ATTR: ['href', 'target', 'rel'],
                      }),
                    }}
                  />
                  {/* eslint-enable react/no-danger -- re-enable after sanitized HTML rendering */}
                </div>
              )}
            </div>
          </DialogBody>
          <DialogFooter className='flex gap-x-small'>
            <Button
              variant='Standard'
              size='Medium'
              className='fill basis-0'
              onClick={() => updateSelectedEvent(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </React.Fragment>
  );
};

export default withTranslation(Timeline, [
  TranslationNamespace.Navigation,
  TranslationNamespace.DeveloperQuestionnaire,
  TranslationNamespace.Error,
]);
