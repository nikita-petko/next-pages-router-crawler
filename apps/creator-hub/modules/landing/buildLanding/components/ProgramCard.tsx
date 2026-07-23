import { useState, useCallback } from 'react';
import { Button, Icon, clsx as cx, type TIconProps } from '@rbx/foundation-ui';
import { useMediaQuery } from '@rbx/ui';
import { Flex } from '@modules/miscellaneous/components/Flex';
import type { ProgramDetail } from './ProgramDetails';
import ProgramDetailsDialog from './ProgramDetailsDialog';
import layoutStyles from './Layout.module.css';
import styles from './ProgramCard.module.css';

type ProgramContent = {
  iconName: TIconProps['name'];
  description: string;
};

export type Program = {
  title: string;
  subtitle: string;
  contents: Array<ProgramContent>;
  details: Array<ProgramDetail>;
  applyUrl: string;
  applicationsClosed?: boolean;
};

type ProgramCardProps = Program & {
  className?: string;
};

export default function ProgramCard({
  title,
  subtitle,
  contents,
  details,
  applyUrl,
  applicationsClosed,
  className,
}: ProgramCardProps) {
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('Small'));
  const [dialogOpen, setDialogOpen] = useState(false);

  const openDialog = useCallback(() => {
    setDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);

  return (
    <Flex
      key={title}
      className={cx(className, layoutStyles.card, styles.cardPadding, 'bg-shift-100', 'gap-medium')}
      flexDirection='column'>
      <Flex className='gap-small padding-bottom-small' flexDirection='column'>
        <span className='text-heading-small small:text-heading-medium content-emphasis'>
          {title}
        </span>
        <span className='text-body-medium small:text-body-large content-default'>
          {subtitle}{' '}
          <button
            type='button'
            className={cx(styles.learnMoreButton, 'content-link')}
            onClick={openDialog}>
            Learn more
          </button>
        </span>
      </Flex>
      <Flex className='gap-medium' flexDirection='column'>
        {contents.map(({ iconName: name, description }) => (
          <Flex key={name} className='gap-medium'>
            <Icon name={name} />
            <span className='text-body-medium small:text-body-large content-default'>
              {description}
            </span>
          </Flex>
        ))}
      </Flex>
      <Flex className='padding-top-large margin-top-auto'>
        {applicationsClosed ? (
          <Button variant='Emphasis' size={isMobile ? 'Small' : 'Medium'} isDisabled>
            Applications closed
          </Button>
        ) : (
          <Button
            as='a'
            href={applyUrl}
            target='_blank'
            rel='noopener noreferrer'
            variant='Emphasis'
            size={isMobile ? 'Small' : 'Medium'}>
            Apply
          </Button>
        )}
      </Flex>
      <ProgramDetailsDialog
        open={dialogOpen}
        onClose={closeDialog}
        title={title}
        details={details}
        applyUrl={applyUrl}
        applicationsClosed={applicationsClosed}
      />
    </Flex>
  );
}
