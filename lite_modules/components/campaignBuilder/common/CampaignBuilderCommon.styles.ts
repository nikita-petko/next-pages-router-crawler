import { makeStyles } from '@rbx/ui';

const useCampaignBuilderCommonStyles = makeStyles()((theme) => ({
  advancedTargetingContainer: {
    alignItems: 'center',
    display: 'flex',
    gap: theme.spacing(1),
    paddingTop: theme.spacing(3),
  },
  cardBanner: {
    // accordion description has paddingTop: theme.spacing(1)
    marginBottom: theme.spacing(2),
    marginTop: theme.spacing(3),
    width: '100%',
  },
  cardTitleSecondaryText: {
    marginLeft: '8px',
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
    color: theme.palette.content.muted,
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
