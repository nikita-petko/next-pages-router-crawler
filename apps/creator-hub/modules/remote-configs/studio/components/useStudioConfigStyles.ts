import { makeStyles, TTheme } from '@rbx/ui';
import strictly, { unstrict } from '../foundation-utils/strictly';

const tabButtonActiveBackground = '#282931';

export const headerIconSize = 'small';

export const foundationClasses = {
  tableRow: strictly(
    'flex',
    'flex-row',
    'width-full',
    'padding-x-small',
    'gap-x-medium',
    'padding-y-xxsmall',
    'height-700',
  ),
  tableRowNonHeader: unstrict('hover:bg-shift-200'),
  tableContainer: strictly('width-full', 'flex-col'),

  header: strictly('flex', 'justify-between', 'padding-xsmall', 'gap-small'),
  headerTabButton: strictly(
    'padding-x-small',
    'padding-y-xsmall',
    'text-label-small',
    'cursor-pointer',
    'bg-none',
  ),
  headerText: strictly('text-title-medium', 'select-none'),

  columns: (classes: {
    keyColumnFlex: string;
    typeColumnFlex: string;
    valueColumnFlex: string;
    actionsColumnFlex: string;
  }) => {
    const shared = ['text-truncate-end', 'text-no-wrap'] as const;
    return {
      keyColumn: strictly(...shared, unstrict(classes.keyColumnFlex)),
      typeColumn: strictly(...shared, 'padding-y-xxsmall', unstrict(classes.typeColumnFlex)),
      valueColumn: strictly(...shared, unstrict(classes.valueColumnFlex)),
      actionsColumn: strictly(...shared, unstrict(classes.actionsColumnFlex)),
    };
  },
  textInput: strictly('bg-shift-200', 'radius-small'),
  textInputInputContainer: strictly('radius-small', 'stroke-standard'),

  createInputLine: strictly('flex', 'items-center', 'gap-large'),
  createDialogContent: strictly(
    'padding-small',
    'radius-large',
    'stroke-thick',
    'stroke-emphasis',
    'bg-surface-200',
    'flex',
    'flex-col',
    'gap-small',
    'min-width-250',
  ),
  createLabel: strictly('width-1000', 'text-label-small'),
  createDropdownButtonContainer: strictly(
    'width-full',
    'bg-shift-200',
    'radius-small',
    'stroke-standard',
    unstrict('focus-within:outline-focus'),
    // TODO(gperkins@20251029): Remove `stroke-standard` from the <button> inside the <Dropdown>
    //  in foundation-ui -- until then we will see a slight two-tone border
    // NOTE(gperkins@20251029): We want the same style as <TextInput> --
    //  which ends up getting both `stroke-standard` and `stroke-contrast-alpha`
    // TODO(gperkins@20251029): Why isn't stroke-contrast-alpha exported from foundation-tailwind/classes?
    unstrict('stroke-contrast-alpha'),
  ),
} as const;

const useStudioConfigStyles = makeStyles()((theme: TTheme) => ({
  monoFont: {
    fontFamily: theme.typography.code.fontFamily,
  },
  keyColumnFlex: {
    flex: 5,
  },
  typeColumnFlex: {
    flex: 2,
  },
  valueColumnFlex: {
    flex: 5,
  },
  actionsColumnFlex: {
    flex: 1,
  },
  tableBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    width: '100%',
  },
  stagedJsonCell: {
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: tabButtonActiveBackground,
    },
  },
}));
export default useStudioConfigStyles;
