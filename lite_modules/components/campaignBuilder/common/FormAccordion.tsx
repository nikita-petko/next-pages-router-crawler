import {
  Accordion,
  AccordionItem,
  AccordionItemContent,
  AccordionItemTrigger,
} from '@rbx/foundation-ui';
import { ReactNode, useEffect } from 'react';

import { EventName, logNativeClickEvent } from '@clients/unifiedLogger';

interface FormAccordionProps {
  banner?: ReactNode;
  children?: ReactNode;
  description?: ReactNode;
  hasError?: boolean;
  isOpen: boolean;
  onChange: (isOpen: boolean) => void;
  rightContent?: ReactNode;
  title: string;
}

const FormAccordion = ({
  banner = null,
  children,
  description,
  hasError,
  isOpen,
  onChange,
  rightContent,
  title,
}: FormAccordionProps) => {
  useEffect(() => {
    if (hasError && !isOpen) {
      onChange(true);
    }
  }, [hasError, isOpen, onChange]);

  const handleOpenChange = (open: boolean) => {
    if (hasError) {
      // if there is an error, don't allow the user to close the accordion
      return;
    }
    logNativeClickEvent(EventName.AccordionToggled, {
      open: open.toString(),
      title,
    });
    onChange(open);
  };

  return (
    // The card's content margin is 24px. We split the left margin into 16px outer padding +
    // 8px inner padding-left on each content block (title/banner/description/content) below.
    // This pulls Foundation's AccordionItemContent clip (overflow:hidden) boundary 8px left of
    // the content, so the selected OptionSelector's focus outline (6px outside the box) paints
    // inside the clip instead of being cut, with zero visual shift (everything still sits at 24px).
    <div className='stroke-standard stroke-default radius-medium margin-bottom-medium padding-y-xxlarge padding-left-large padding-right-xxlarge'>
      <Accordion>
        <AccordionItem isOpen={isOpen} onOpenChange={handleOpenChange}>
          <AccordionItemTrigger>
            {/* text-heading-small (20px/700/120%) matches the previous Typography variant="h5". */}
            <span className='text-heading-small padding-left-small'>{title}</span>
          </AccordionItemTrigger>
          {banner && <div className='padding-left-small'>{banner}</div>}
          {/* CSS-grid collapse (grid-template-rows 1fr <-> 0fr) replaces the @rbx/ui <Collapse>. The
              transition lives on each state branch (never both, so the conflicting grid-template-rows
              values don't collide); the collapsed branch delays visibility by the collapse duration so
              the text stays visible while the row shrinks, then is removed from the a11y tree. */}
          <div
            className={
              isOpen
                ? 'grid invisible [grid-template-rows:0fr] [transition:grid-template-rows_200ms_ease,visibility_0s_linear_200ms]'
                : 'grid [grid-template-rows:1fr] [transition:grid-template-rows_200ms_ease]'
            }>
            {/* text-body-medium (14px/400/140%) matches the previous Typography variant="body2". */}
            <div
              className='text-body-medium clip min-height-0 padding-top-small padding-left-small'
              data-testid='accordion-description'>
              {description}
            </div>
          </div>
          {children && (
            <AccordionItemContent>
              <div className='flex flex-col gap-xxlarge padding-left-small min-[850px]:flex-row'>
                <div className='[flex:3_1_0%]'>{children}</div>
                <div
                  className={`radius-medium [box-sizing:border-box] flex [flex:1_1_0%] flex-col [min-width:240px] [padding:32px] [width:320px]${
                    rightContent ? ' bg-surface-200' : ''
                  }`}>
                  {rightContent}
                </div>
              </div>
            </AccordionItemContent>
          )}
        </AccordionItem>
      </Accordion>
    </div>
  );
};
export default FormAccordion;
