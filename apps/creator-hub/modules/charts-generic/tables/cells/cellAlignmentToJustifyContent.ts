import { TTableCellProps } from '@rbx/ui';

/**
 * Converts a table cell alignment to a justify content value.
 * @param align The alignment of the table cell.
 * @returns The justify content value.
 */
const cellAlignmentToJustifyContent = (align: TTableCellProps['align']) => {
  switch (align) {
    case 'left':
      return 'flex-start';
    case 'right':
      return 'flex-end';
    case 'justify':
      return 'space-between';
    case 'center':
    case 'inherit':
    case undefined:
      return 'center';
    default: {
      const exhaustiveCheck: never = align;
      throw new Error(`Invalid align value: ${exhaustiveCheck}`);
    }
  }
};

export default cellAlignmentToJustifyContent;
