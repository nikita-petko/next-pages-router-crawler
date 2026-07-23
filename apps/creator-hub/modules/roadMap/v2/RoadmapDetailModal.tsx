import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getPrettifiedNumber } from '@rbx/core';
import {
  Button,
  clsx as cx,
  Icon,
  Link,
  Media,
  SheetBody,
  SheetContent,
  SheetRoot,
  SheetTitle,
} from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import RoadmapDetailFeedback from './RoadmapDetailFeedback';
import type { RoadmapItem } from './types';
import styles from './RoadmapDetailModal.module.css';

type RoadmapDetailModalProps = {
  item: RoadmapItem | null;
  onClose: () => void;
};

function RoadmapDetailModal({ item, onClose }: RoadmapDetailModalProps) {
  const { translate } = useTranslation();

  return (
    <SheetRoot
      open={item != null}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}>
      <SheetContent
        largeScreenVariant='center'
        centerSheetSize='Large'
        largeScreenClassName={styles.detailSheet}
        closeLabel={translate('Action.Close')}>
        {item && (
          <>
            <SheetTitle className='content-emphasis padding-top-large'>{item.title}</SheetTitle>
            <SheetBody>
              <div className='flex flex-row wrap items-center gap-medium margin-bottom-small'>
                <div className='flex flex-row items-center gap-xsmall'>
                  <Icon name='icon-regular-heart' size='Small' className='content-muted' />
                  <span className='text-body-small content-muted'>
                    {getPrettifiedNumber(item.likeCount)}
                  </span>
                </div>
                {item.devStage === 'Live' && (
                  <div className='flex flex-row items-center gap-xsmall'>
                    <Icon
                      name='icon-regular-paper-airplane'
                      size='Small'
                      className='content-muted'
                    />
                    <span className='text-body-small content-muted'>{translate('Label.Live')}</span>
                  </div>
                )}
                {item.category.map((name) => (
                  <span key={name} className='text-body-small content-default'>
                    #{name.toLowerCase().replaceAll(/\s+/g, '-')}
                  </span>
                ))}
              </div>
              <div className='flex flex-row items-center justify-between gap-medium margin-bottom-small'>
                <Button variant='Emphasis' size='Small'>
                  {translate('Action.ViewDetails')}
                </Button>
                <RoadmapDetailFeedback key={item.id} itemId={item.id} />
              </div>
              <div className='flex grow flex-col items-start gap-large self-stretch bg-surface-200 radius-medium padding-y-xxlarge padding-x-large margin-bottom-small'>
                <div className={cx('text-body-medium content-default', styles.markdownContent)}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.description}</ReactMarkdown>
                </div>
                {item.media && (
                  <Media
                    src={item.media}
                    alt={item.title}
                    aspectRatio='16:9'
                    containerClassName='self-stretch radius-small clip'
                  />
                )}
                {item.links.length > 0 && (
                  <div className='flex flex-col gap-small self-stretch'>
                    <div className='flex flex-row items-center gap-xsmall'>
                      <Icon name='icon-regular-bell' size='Small' className='content-emphasis' />
                      <span className='text-caption-large content-default'>
                        {translate('Label.RecentUpdates')}
                      </span>
                    </div>
                    <div className='flex flex-col gap-xsmall self-stretch'>
                      {item.links.map((update) => (
                        <Link
                          key={`${update.url}-${update.label}`}
                          href={update.url}
                          target='_blank'
                          rel='noopener noreferrer'
                          size='Medium'
                          underline='hover'
                          isExternal={false}>
                          {update.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </SheetBody>
          </>
        )}
      </SheetContent>
    </SheetRoot>
  );
}

export default withTranslation(RoadmapDetailModal, [TranslationNamespace.RoadMap]);
