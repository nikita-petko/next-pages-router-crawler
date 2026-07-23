import { DialogBody, DialogFooter, DialogTitle } from '@rbx/foundation-ui';
import type { ReactElement, ReactNode } from 'react';

interface BaseDialogProps {
  /**
   * Optional body slot for richer content (forms, scrollable lists, etc.).
   * Rendered between `dialogDescription` and `dialogFooter`. Use this when
   * the content is more than one or two sentences of prose — e.g. an
   * embedded form, a radio group, a date picker. Distinct from
   * `dialogDescription`, which is for short muted-typography copy.
   */
  dialogBody?: ReactNode;
  /**
   * Optional description shown below the title in muted body typography.
   * Wrapped in a styled container so callers don't repeat the
   * `text-body-medium content-muted` classes. This is the short prose slot
   * (one or two sentences); use `dialogBody` for richer content.
   */
  dialogDescription?: ReactNode;
  /**
   * Footer content — typically one or two `<Button>` elements. BaseDialog
   * supplies the `<DialogFooter>` wrapper and its flex layout; everything
   * inside (button variants, order, pending wiring, etc.) is caller-controlled
   * so each dialog can compose whatever action layout it needs.
   */
  dialogFooter: ReactNode;
  /** Title content. Wrapped by BaseDialog in a styled `<DialogTitle>`. */
  dialogTitle: ReactNode;
}

/**
 * Layout-only wrapper for component-mode dialogs. Centralizes the Foundation
 * primitive structure (DialogTitle inside DialogBody, then DialogFooter) and
 * the typography classes so each leaf dialog only supplies content.
 *
 * Use this for the common "title + description + actions" shape. Drop down to
 * raw `<DialogBody>/<DialogFooter>` if a dialog needs an atypical layout
 * (hero media, forms, multi-step flows, etc.).
 */
const BaseDialog = ({
  dialogBody,
  dialogDescription,
  dialogFooter,
  dialogTitle,
}: BaseDialogProps): ReactElement => (
  <>
    <DialogBody className='flex flex-col gap-y-small'>
      <DialogTitle className='text-heading-medium margin-none'>{dialogTitle}</DialogTitle>
      {dialogDescription !== undefined && (
        <div className='text-body-medium content-muted'>{dialogDescription}</div>
      )}
      {dialogBody !== undefined && <div className='flex flex-col gap-y-medium'>{dialogBody}</div>}
    </DialogBody>
    {/* Below the Foundation `large` breakpoint (< 1141px — i.e. when the outlet
        renders the dialog at Small or Medium size) each footer child grows
        equally from a zero basis so two buttons split the row 50/50 and fill
        the available width. At `large:` (desktop) the reset lets buttons fall
        back to their natural width and `justify-end` right-aligns the action
        group while preserving child order (primary stays leftmost). */}
    <DialogFooter className='flex gap-x-small [&>*]:grow [&>*]:basis-0 large:justify-end large:[&>*]:grow-0 large:[&>*]:basis-auto'>
      {dialogFooter}
    </DialogFooter>
  </>
);

export default BaseDialog;
