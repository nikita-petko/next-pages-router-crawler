import { makeStyles } from '@rbx/ui';

const useExternalPurchaseSettingsStyles = makeStyles()((theme) => ({
  pageContentContainer: {
    maxWidth: 785,
  },

  formContainer: {
    gap: '40px',
    [theme.breakpoints.down('Large')]: {
      paddingLeft: 12,
      paddingRight: 12,
    },
  },

  bottomDivider: {
    border: '1px solid',
    borderColor: theme.palette.components.divider,
    height: '0px',
    marginBottom: 40,
  },

  backToDeveloperProductsButton: {
    width: 'fit-content',
  },
  pageSectionContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    '& .link-no-bold': {
      fontWeight: 'inherit',
    },
    '& .description': {
      color: theme.palette.content.muted,
    },
    '& .testModeAccordionOpener': {
      display: 'flex',
    },
    '&:last-of-type': {
      paddingBottom: '40px',
    },
  },
  showTestModeButtonIcon: {
    marginRight: '8px',
    marginLeft: '-8px',
  },
}));

export default useExternalPurchaseSettingsStyles;
