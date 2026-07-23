import { alertClasses, alertTitleClasses, makeStyles } from '@rbx/ui';

const useCampaignBuilderCommonStyles = makeStyles()((theme) => ({
  advancedTargetingContainer: {
    alignItems: 'center',
    display: 'flex',
    gap: theme.spacing(1),
    paddingTop: theme.spacing(3),
  },
  alertTitle: {
    paddingBottom: theme.spacing(1),
  },
  banner: {
    // This is to override the default styles of the Alert component
    [`& .${alertTitleClasses.root}`]: {
      lineHeight: 1.4,
    },
  },
  cardBanner: {
    [`& .${alertClasses.message}`]: {
      alignItems: 'center',
      display: 'flex',
    },
    // accordion description has paddingTop: theme.spacing(1)
    marginBottom: theme.spacing(2),
    marginTop: theme.spacing(3),
    width: '100%',
  },
  cardTitleSecondaryText: {
    marginLeft: '8px',
  },
  // Use on AlertTitle when an Alert renders its title and body inline on a single row
  inlineAlertTitle: {
    marginBottom: 0,
    paddingRight: theme.spacing(2),
  },
  inputHelperText: {
    marginLeft: 14,
    marginRight: 14,
    marginTop: 3,
  },
  linkInHelperText: {
    cursor: 'pointer',
    fontWeight: 'bold',
    textDecoration: 'underline',
  },
  mb4: {
    marginBottom: theme.spacing(4),
  },
  mt3: {
    marginTop: theme.spacing(3),
  },
  noMargin: {
    margin: 0,
  },
  resetFilterButton: {
    marginLeft: '8px',
  },
  rightContentContainer: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    gap: theme.spacing(1),
    justifyContent: 'space-between',
  },
  rightContentSubContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  },
  sectionCardBanner: {
    marginBottom: theme.spacing(2),
    marginTop: theme.spacing(2),
    width: '100.8%', // right align with buttons that have padding
  },
  sectionCardButton: {
    color: theme.palette.content.standard,
    left: '16px', // offset padding to align text
    minHeight: '0px',
    position: 'relative',
  },
  sectionCardButtonsContainer: {
    display: 'flex',
    gap: '8px',
    marginRight: '8px',
    position: 'relative',
  },
  sectionCardContainer: {
    marginBottom: theme.spacing(4),
    padding: theme.spacing(4),
  },
  sectionCardDescription: {
    marginTop: '8px',
  },
  sectionCardDescriptionContainer: {
    color: 'rgb(213, 215, 221, 1)',
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '8px',
  },
  spacedWarning: {
    display: 'block',
    marginBottom: theme.spacing(1),
    marginTop: theme.spacing(3),
  },
}));

export default useCampaignBuilderCommonStyles;
