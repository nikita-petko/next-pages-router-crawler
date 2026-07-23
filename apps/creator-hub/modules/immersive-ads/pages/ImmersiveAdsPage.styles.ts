import { makeStyles } from '@rbx/ui';
import type { TTheme } from '@rbx/ui';

const verticalContainer = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  alignSelf: 'stretch',
} as const;

const horizontalContainer = {
  display: 'flex',
  alignItems: 'center',
} as const;

const useImmersiveAdsPageStyles = makeStyles()((theme) => ({
  descriptionStyle: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: 8,
    marginBottom: 12,
  },
  summaryStyle: {
    minWidth: 1200,
    paddingTop: 16,
    width: '100%',
    marginLeft: 20,
  },
  actionButtonStyle: {
    marginRight: 10,
  },
  analyticsTabDescriptionStyle: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: 8,
    marginBottom: 16,
    marginTop: 16,
  },
  subMenuContainer: {
    paddingLeft: 40,
    paddingBottom: 16,
    width: '100%',
  },
  subMenu: {
    overflowX: 'scroll',
    scrollbarWidth: 'none',
    marginTop: 16,
    marginBottom: 16,
    '&::-webkit-scrollbar ': {
      display: 'none',
    },
  },
  chartContainer: {
    paddingTop: 16,
    width: '100%',
  },
  chip: {
    marginRight: 8,
  },
  eligibilityContainer: {
    padding: 16,
  },
  eligibilityAccordionContent: {
    padding: 0,
  },
  eligibilityHeaderContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0px',
    width: '100%',
    height: '24px',
    [theme.breakpoints.down('Medium')]: {
      height: 'auto',
      minHeight: '24px',
      flexWrap: 'wrap',
      gap: '8px',
    },
  },
  eligibilityTitleContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: '0px',
    gap: '8px',
    minWidth: '285px',
    height: '24px',
    flex: 1,
    [theme.breakpoints.down('Medium')]: {
      minWidth: 'auto',
      width: '100%',
      height: 'auto',
      flexWrap: 'wrap',
    },
  },
  eligibilityTitle: {
    minWidth: '214px',
    height: '24px',
    fontFamily: 'Builder Sans',
    fontStyle: 'normal',
    fontWeight: 700,
    fontSize: '20px',
    lineHeight: '120%',
    letterSpacing: '-0.01em',
    color: theme.palette.content.standard,
    whiteSpace: 'nowrap',
    overflow: 'visible',
    [theme.breakpoints.down('Medium')]: {
      minWidth: 'auto',
      height: 'auto',
      whiteSpace: 'normal',
      wordBreak: 'break-word',
    },
  },
  eligibilityTabContainer: {
    width: 'calc(100% + 32px)',
    marginLeft: '-16px',
    marginRight: '-16px',
    paddingLeft: '16px',
    paddingRight: '16px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  eligibilityRowContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  eligibilityActionsContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  eligibilityDescriptionContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  insertAdsButtonContainer: {
    paddingTop: 20,
    paddingBottom: 32,
  },
  eligibilityIconStyle: {
    marginRight: 24,
    fontSize: 32,
  },
  eligibilityRowDividerStyle: {
    marginTop: 20,
    marginBottom: 20,
  },
  openInNewIconContainer: {
    marginLeft: 5,
  },
  rewardedAdsSuspendedAlert: {
    width: '100%',
    marginTop: 16,
    marginBottom: 16,
  },
  playWithRewardRejectedAlert: {
    marginTop: '16px',
    display: 'flex',
    alignItems: 'center',
  },
  playWithRewardRejectedAlertAction: {
    display: 'flex',
    alignItems: 'center',
  },
  placementTabContainer: {
    padding: 16,
  },
  createPlacementButtonRowContainer: {
    paddingTop: 20,
    paddingBottom: 32,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  placementNameTableCell: {
    width: '48%',
  },
  placementNameContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  placementIdContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  placementIdTableCell: {
    width: '52%',
  },
  editIconButton: {
    visibility: 'hidden',
  },
  menuIconButton: {
    visibility: 'hidden',
  },
  tableRow: {
    height: 64,
    '&:hover .editIconButtonClass': {
      visibility: 'visible',
    },
    '&:hover .menuIconButtonClass': {
      visibility: 'visible',
    },
  },
  lockIcon: {
    margin: 8,
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '200px',
  },
  errorContainer: {
    padding: '20px',
  },
  settingsContainer: {
    ...verticalContainer,
    gap: '12px',
    marginBottom: 32,
  },
  adTypeSettingsHeader: {
    ...verticalContainer,
    gap: '4px',
  },
  settingsCheckboxContainer: {
    ...verticalContainer,
    gap: '8px',
  },
  settingsCheckboxRow: {
    ...horizontalContainer,
  },
  settingsCheckBoxLabel: {
    ...horizontalContainer,
    gap: '8px',
  },
  placementTableContainer: {
    padding: '24px',
    borderRadius: '8px',
    border: '1px solid var(--Color-Stroke-Emphasis, rgba(208, 217, 251, 0.16))',
    marginBottom: '24px',
  },
  placementTableHeaderContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  placementTableTitleTextContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: '8px',
    alignItems: 'center',
  },
  placementTableTextContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  avatarContainer: {
    marginRight: '8px',
  },
  eligibilityChipBase: {
    height: 18,
    padding: '3px 8px',
    marginLeft: '-3px',
    borderRadius: '4px',
    gap: '4px',
    opacity: 1,
    fontSize: '12px',
    fontWeight: 600,
    fontFamily: 'Builder Sans',
    lineHeight: '100%',
    border: 'none !important',
    '&:hover': {},
    '&.MuiChip-root': {},
    '& .MuiChip-label': {
      padding: '0px 0px',
      lineHeight: '100%',
      whiteSpace: 'nowrap',
      overflow: 'visible',
      textOverflow: 'clip',
    },
  },
  eligibilityChipEligible: {
    minWidth: 58,
    backgroundColor: `${theme.palette.components.alert.activeFill} !important`,
    color: `${theme.palette.components.alert.activeContent} !important`,
    '&:hover': {
      backgroundColor: `${theme.palette.components.alert.activeFill} !important`,
    },
    '&.MuiChip-root': {
      backgroundColor: `${theme.palette.components.alert.activeFill} !important`,
      color: `${theme.palette.components.alert.activeContent} !important`,
    },
    '& .MuiChip-label': {
      color: `${theme.palette.components.alert.activeContent} !important`,
    },
  },
  eligibilityChipIneligible: {
    minWidth: 63,
    backgroundColor: `${theme.palette.components.alert.importantFill} !important`,
    color: `${theme.palette.components.alert.importantContent} !important`,
    '&:hover': {
      backgroundColor: `${theme.palette.components.alert.importantFill} !important`,
    },
    '&.MuiChip-root': {
      backgroundColor: `${theme.palette.components.alert.importantFill} !important`,
      color: `${theme.palette.components.alert.importantContent} !important`,
    },
    '& .MuiChip-label': {
      color: `${theme.palette.components.alert.importantContent} !important`,
    },
  },
  eligibilityChipPending: {
    minWidth: 63,
    backgroundColor: `${theme.palette.components.alert.noticeFill} !important`,
    color: `${theme.palette.components.alert.noticeContent} !important`,
    '&:hover': {
      backgroundColor: `${theme.palette.components.alert.noticeFill} !important`,
    },
    '&.MuiChip-root': {
      backgroundColor: `${theme.palette.components.alert.noticeFill} !important`,
      color: `${theme.palette.components.alert.noticeContent} !important`,
    },
    '& .MuiChip-label': {
      color: `${theme.palette.components.alert.noticeContent} !important`,
    },
  },
}));

export const getEligibilityAccordionStyles = (theme: TTheme) =>
  ({
    width: '100%',
    minHeight: '72px',
    padding: '24px',
    border: `1px solid ${theme.palette.surface.outline}`,
    borderRadius: '8px',
    boxSizing: 'border-box' as const,
    margin: 0,
    [theme.breakpoints.down('Medium')]: {
      padding: '16px',
      minHeight: 'auto',
    },
    '&.MuiAccordion-root': {
      backgroundColor: 'transparent',
      boxShadow: 'none',
      margin: 0,
      '&:before': {
        display: 'none',
      },
    },
    '&.Mui-expanded': {
      minHeight: '515px',
      margin: 0,
      [theme.breakpoints.down('Medium')]: {
        minHeight: 'auto',
      },
    },
    '& .MuiAccordionSummary-root': {
      width: '100%',
      minHeight: '24px',
      padding: '0px',
      margin: 0,
      position: 'relative' as const,
      '&.Mui-expanded': {
        minHeight: '24px',
      },
    },
    '& .MuiAccordionSummary-content': {
      margin: 0,
      '&.Mui-expanded': {
        margin: 0,
      },
    },
    '& .MuiAccordionDetails-root': {
      width: '100%',
      padding: '0px',
      paddingTop: '16px',
      margin: 0,
      '& > *': {
        width: '100% !important',
        maxWidth: '100% !important',
      },
      '& [class*="eligibilityContainer"]': {
        padding: '0px !important',
      },
    },
  }) as const;

export default useImmersiveAdsPageStyles;
