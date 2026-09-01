import type { FunctionComponent } from 'react';
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogBody,
  DialogTitle,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@rbx/foundation-ui';
import type { HelpInfo } from '@modules/clients/experienceQuestionnaire';
import useMarkdownParser from '../parser/useMarkdownParser';

export interface HelpDialogProps {
  open: boolean;
  onClose: () => void;
  helpInfo: HelpInfo;
}

const isYouTubeUrl = (url: string): boolean => /youtube\.com\/(embed|watch)|youtu\.be\//.test(url);

const toNoCookieUrl = (url: string): string => url.replace('youtube.com', 'youtube-nocookie.com');

const HelpDialog: FunctionComponent<HelpDialogProps> = ({ open, onClose, helpInfo }) => {
  const { parseText } = useMarkdownParser();
  const [activeTab, setActiveTab] = useState<string>('example-0');

  const hasExamples = helpInfo.examples && helpInfo.examples.length > 0;

  useEffect(() => {
    if (open) {
      setActiveTab('example-0');
    }
  }, [open]);

  const topLevelMedia = React.useMemo(() => {
    const media: Array<{ type: 'image' | 'video'; url: string; altText?: string }> = [];

    if (helpInfo.images) {
      helpInfo.images.forEach((img) => {
        if (img.url) {
          media.push({ type: 'image', url: img.url, altText: img.altText });
        }
      });
    }
    if (helpInfo.videos) {
      helpInfo.videos.forEach((vid) => {
        if (vid.url) {
          media.push({ type: 'video', url: vid.url, altText: vid.altText });
        }
      });
    }

    return media;
  }, [helpInfo]);

  const getExampleMedia = (example: NonNullable<HelpInfo['examples']>[number]) => {
    const media: Array<{ type: 'image' | 'video'; url: string; altText?: string }> = [];

    if (example.images) {
      example.images.forEach((img) => {
        if (img.url) {
          media.push({ type: 'image', url: img.url, altText: img.altText });
        }
      });
    }
    if (example.videos) {
      example.videos.forEach((vid) => {
        if (vid.url) {
          media.push({ type: 'video', url: vid.url, altText: vid.altText });
        }
      });
    }

    return media;
  };

  const renderMediaGrid = (
    media: Array<{ type: 'image' | 'video'; url: string; altText?: string }>,
  ) => {
    if (media.length === 0) {
      return null;
    }

    return (
      <div className='flex wrap gap-medium justify-center width-full'>
        {media.map((item) => (
          <div
            key={`${item.type}-${item.url}`}
            className='radius-medium max-width-[280px]'
            style={{
              flex: '1 1 300px',
              boxSizing: 'border-box',
            }}>
            {item.type === 'image' && (
              <img
                src={item.url}
                alt={item.altText || 'Help image'}
                className='width-full radius-medium max-height-[300px]'
                style={{
                  height: 'auto',
                  display: 'block',
                  objectFit: 'contain',
                }}
              />
            )}
            {item.type === 'video' && isYouTubeUrl(item.url) && (
              <iframe
                src={toNoCookieUrl(item.url)}
                title={item.altText || 'YouTube video'}
                className='width-full radius-medium'
                style={{ aspectRatio: '16 / 9', display: 'block', border: 'none' }}
                allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                allowFullScreen
              />
            )}
            {item.type === 'video' && !isYouTubeUrl(item.url) && (
              <video
                controls
                className='width-full radius-medium'
                style={{ height: 'auto', display: 'block', maxHeight: '300px' }}
                aria-label={item.altText || 'Help video'}>
                <source src={item.url} />
                <track kind='captions' />
              </video>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderExampleContent = (index: number) => {
    const example = helpInfo.examples?.[index];
    if (!example) {
      return null;
    }

    const exampleMedia = getExampleMedia(example);

    return (
      <div
        className='flex flex-col gap-medium'
        style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
        {example.title && <h2 className='text-title-large'>{example.title}</h2>}
        {example.text && <div className='text-body-medium'>{parseText(example.text)}</div>}
        {renderMediaGrid(exampleMedia)}
      </div>
    );
  };

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
      closeLabel='close'>
      <DialogContent
        className='flex flex-col'
        style={{
          maxHeight: '90vh',
          maxWidth: 'min(720px, 90vw)',
        }}>
        <DialogBody className='flex flex-col gap-large scroll-y min-height-[0px]'>
          <DialogTitle className='text-heading-medium margin-none'>
            {helpInfo.title || 'Help Information'}
          </DialogTitle>

          {helpInfo.text && (
            <div
              className='text-body-medium'
              style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
              {parseText(helpInfo.text)}
            </div>
          )}

          {hasExamples && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className='width-full'>
                {helpInfo.examples?.map((example, index) => {
                  const value = `example-${index}`;
                  return (
                    <TabsTrigger key={value} value={value}>
                      {example.title || `Example ${index + 1}`}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {helpInfo.examples?.map((example, index) => {
                const value = `example-${index}`;
                return (
                  <TabsContent key={value} value={value} className='padding-y-medium'>
                    {renderExampleContent(index)}
                  </TabsContent>
                );
              })}
            </Tabs>
          )}

          {renderMediaGrid(topLevelMedia)}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};

export default HelpDialog;
