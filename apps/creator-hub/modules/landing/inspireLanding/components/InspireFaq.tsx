import {
  Accordion,
  AccordionItem,
  AccordionItemContent,
  AccordionItemTrigger,
  clsx as cx,
  Link,
} from '@rbx/foundation-ui';
import { FAQ_SECTION, inspireFaqItems } from '../constants/inspireConstants';
import type { FAQItem } from '../constants/inspireConstants';
import styles from './FAQ.module.css';
import layoutStyles from './Layout.module.css';

function FaqAnswer({ question, answer, answerSegments }: FAQItem) {
  if (answerSegments) {
    return (
      <span className='text-body-medium'>
        {answerSegments.map(({ text, href }) =>
          href ? (
            <Link
              key={`${question}-${href}`}
              href={href}
              target='_blank'
              rel='noopener noreferrer'
              isExternal={false}>
              {text}
            </Link>
          ) : (
            <span key={`${question}-${text}`}>{text}</span>
          ),
        )}
      </span>
    );
  }

  return <span className='text-body-medium'>{answer}</span>;
}

export default function InspireFaq() {
  return (
    <div
      className={cx(
        layoutStyles.maxWidthContainer,
        layoutStyles.faqSpacing,
        'flex',
        'flex-col',
        'gap-xlarge',
        'large:flex-row',
        'large:justify-between',
        'large:gap-[64px]',
        'padding-x-[48px]',
      )}>
      <span className='text-heading-medium small:text-heading-large content-emphasis large:text-no-wrap'>
        {FAQ_SECTION.title}
      </span>
      <Accordion size='Large' className='flex-1 max-width-[658px]'>
        {inspireFaqItems.map((item) => (
          <AccordionItem key={item.question}>
            <AccordionItemTrigger className={cx(styles.question, 'text-align-x-left gap-small')}>
              <span className='text-title-large content-default text-wrap text-truncate-none no-clip'>
                {item.question}
              </span>
            </AccordionItemTrigger>
            <AccordionItemContent className='text-wrap text-align-x-left no-clip-x'>
              <FaqAnswer {...item} />
            </AccordionItemContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
