import { makeStyles, autocompleteClasses } from '@rbx/ui';

const useExperienceAccessRegionStyles = makeStyles()((theme) => {
  const inputSpacing = 40;

  return {
    autocomplete: {
      paddingTop: 12,
      maxWidth: 300,
      width: '100%',
    },

    section: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    },

    autocompletePopper: {
      [`& + .${autocompleteClasses.popper} .${autocompleteClasses.option}[aria-selected="true"]:not(:hover)`]:
        {
          backgroundColor: 'transparent',
        },
    },

    displayText: {
      paddingLeft: 4,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      maxWidth: `calc(100% - ${inputSpacing}px)`, // Account for autocomplete input width
      flexShrink: 1,
    },

    formHelperTextWarning: {
      color: theme.palette.actionV2.notice.fill,
    },

    formHelperTextDefault: {
      color: 'inherit',
    },
  };
});

export default useExperienceAccessRegionStyles;
