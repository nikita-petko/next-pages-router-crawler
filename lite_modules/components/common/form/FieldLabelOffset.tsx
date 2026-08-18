import type { ReactNode } from 'react';

interface FieldLabelOffsetProps {
  children: ReactNode;
  className?: string;
}

/**
 * Offsets its children by the height of a Foundation field label so they line up
 * with a neighbouring input instead of with the label above it.
 *
 * Foundation stacks a field's label above its input, so centering a bare button or
 * run of text against the whole column floats it into the gap between the two.
 * Reusing Foundation's own label class and gap keeps the columns in step without
 * hardcoding either height, and children stay top-anchored so helper or error text
 * appearing under the field cannot drag them out of alignment.
 */
const FieldLabelOffset = ({ children, className }: FieldLabelOffsetProps) => (
  <div className={`flex flex-col gap-small ${className ?? ''}`}>
    <span aria-hidden='true' className='text-title-medium'>
      &nbsp;
    </span>
    {children}
  </div>
);

export default FieldLabelOffset;
