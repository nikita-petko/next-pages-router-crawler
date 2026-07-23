import { makeStyles } from '@rbx/ui';

const useFilterSidebarStyles = makeStyles()(() => {
  return {
    description: {
      // FilterSidebar.tsx
      justifyContent: 'space-between',
      flexWrap: 'nowrap',
      alignItems: 'center',
    },
    descriptionContainer: {
      display: 'flex',
      gap: 24,
      padding: '0px 20px 20px 20px',
    },
    filterBody: {
      // FilterSidebar.tsx
      display: 'flex',
      flexDirection: 'column',
      gap: 24,
      paddingBottom: 16,
    },
    filterActions: {
      // FilterSidebar.tsx
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 8,
      '& > *': {
        flex: 1,
        minWidth: 0,
      },
    },
    checkboxSection: {
      // ServerTypeSection.tsx, ServerStatusSection.tsx
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    },
    checkboxGroup: {
      // ServerTypeSection.tsx, ServerStatusSection.tsx
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    },
    dropdownContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    },
    dropdownIcon: {
      marginTop: -2,
    },
  };
});

export default useFilterSidebarStyles;
