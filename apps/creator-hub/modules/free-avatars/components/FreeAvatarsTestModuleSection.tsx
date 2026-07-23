import { useCallback } from 'react';
import { useFlag } from '@rbx/flags';
import { Button } from '@rbx/foundation-ui';
import { withTranslation, useTranslation } from '@rbx/intl';
import {
  freeAvatarModuleDocsPageLink,
  freeAvatarModuleStorePageLink,
} from '@generated/flags/avatarMarketplace';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

function FreeAvatarsTestModuleSection() {
  const { translate } = useTranslation();
  const { value: viewHref } = useFlag(freeAvatarModuleStorePageLink);
  const { value: learnMoreHref } = useFlag(freeAvatarModuleDocsPageLink);

  const handleView = useCallback(() => {
    window.open(viewHref ?? '#', '_blank', 'noopener,noreferrer');
  }, [viewHref]);

  const handleLearnMore = useCallback(() => {
    window.open(learnMoreHref ?? '#', '_blank', 'noopener,noreferrer');
  }, [learnMoreHref]);

  return (
    <section className='flex flex-col justify-center padding-large radius-medium stroke-standard stroke-default width-full'>
      <div className='flex items-center justify-between gap-large width-full flex-wrap'>
        <div className='flex min-width-0 max-width-[684px] flex-col gap-xsmall'>
          <div className='flex items-center gap-small flex-wrap'>
            <h3 className='text-heading-small margin-none whitespace-nowrap'>
              {translate('Heading.TestModule')}
            </h3>
            <span className='inline-flex shrink-0 items-center justify-center padding-x-medium padding-y-xsmall radius-circle bg-shift-200 text-caption-medium content-emphasis'>
              {translate('Label.Recommended')}
            </span>
          </div>
          <p className='text-body-large content-default margin-none'>
            {translate('Description.FreeAvatarTestModule')}
          </p>
        </div>
        <div className='flex shrink-0 items-center gap-medium flex-wrap'>
          <Button variant='Emphasis' size='Medium' type='button' onClick={handleView}>
            {translate('Action.View')}
          </Button>
          <Button variant='Standard' size='Medium' type='button' onClick={handleLearnMore}>
            {translate('Label.LearnMore')}
          </Button>
        </div>
      </div>
    </section>
  );
}

export default withTranslation(FreeAvatarsTestModuleSection, [TranslationNamespace.Creations]);
