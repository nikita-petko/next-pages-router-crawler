import type { ReactNode } from 'react';
import { clsx as cx } from '@rbx/foundation-ui';
import Flex from '@modules/miscellaneous/components/Flex';
import layoutStyles from './Layout.module.css';

type SectionProps = {
  sectionId?: string;
  title: string;
  subtitle?: string;
  spacingClassName?: string;
  contentGapClassName?: string;
  children: ReactNode;
};

export default function Section({
  sectionId,
  title,
  subtitle,
  spacingClassName,
  contentGapClassName,
  children,
}: SectionProps) {
  const heading = (
    <span className='text-heading-medium small:text-heading-large content-emphasis'>{title}</span>
  );
  const headingSection = subtitle ? (
    <Flex className='gap-small' flexDirection='column'>
      {heading}
      <span className='text-body-medium small:text-body-large content-default'>{subtitle}</span>
    </Flex>
  ) : (
    heading
  );
  return (
    <Flex
      className={cx(
        layoutStyles.container,
        layoutStyles.maxWidthContainer,
        spacingClassName,
        contentGapClassName ?? (subtitle ? 'gap-xlarge medium:gap-xxlarge' : 'gap-large'),
      )}
      flexDirection='column'
      justifyContent='center'
      alignItems='stretch'>
      {sectionId ? <div data-inspire-section={sectionId} aria-hidden='true' /> : null}
      {headingSection}
      {children}
    </Flex>
  );
}
