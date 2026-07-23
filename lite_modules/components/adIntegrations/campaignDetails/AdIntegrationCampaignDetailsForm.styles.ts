import { makeStyles } from '@rbx/ui';

const useAdIntegrationCampaignDetailsFormStyles = makeStyles()((theme) => ({
  assetsActionRow: {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1.5),
  },
  buttonRow: {
    display: 'flex',
    gap: theme.spacing(1.5),
    marginTop: theme.spacing(3),
  },
  checkboxControlLabel: {
    margin: 0,
  },
  checkboxError: {
    margin: 0,
  },
  checkboxSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
  },
  container: {
    flex: '1 1 480px',
    maxWidth: '960px',
    minWidth: 0,
  },
  datePickerError: {
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: `${theme.palette.components.input.outlined.errorBorder} !important`,
    },
  },
  dateTimeRow: {
    '& > *': {
      flex: '1 1 auto',
    },
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(2),
  },
  fieldRow: {
    '& > *': {
      flex: '1 1 auto',
      minWidth: '280px',
    },
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(2),
  },
  fieldSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
  },
  formColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  },
  halfWidth: {
    minWidth: '276px',
    width: 'calc(50% - 8px)',
  },
  // Inline placement of the revenue share tile inside the form flow (rendered
  // under the start/end date rows, before the campaign name). Shown whenever the
  // layout container is too narrow to fit the sticky right `sidebar`; hidden once
  // there's room for the sidebar. Uses a container query (not a viewport media
  // query) because this form lives inside a nav-rail + max-width content area, so
  // the available width is much smaller than the viewport.
  inlineTile: {
    '@container campaignDetailsLayout (min-width: 1000px)': {
      display: 'none',
    },
  },
  layout: {
    alignItems: 'flex-start',
    containerName: 'campaignDetailsLayout',
    containerType: 'inline-size',
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(3),
    width: '100%',
  },
  mutedText: {
    color: theme.palette.content.muted,
    marginTop: theme.spacing(1),
  },
  rowError: {
    margin: 0,
    marginTop: theme.spacing(-1),
  },
  sectionHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(3),
  },
  // Sticky right-hand sidebar version of the revenue share tile. Only shown once
  // the layout container is wide enough to fit it beside the form; otherwise the
  // tile renders inline inside the form (see `inlineTile`). The two are mutually
  // exclusive via the same container-query threshold.
  sidebar: {
    '@container campaignDetailsLayout (min-width: 1000px)': {
      alignSelf: 'flex-start',
      display: 'block',
      flex: '0 0 440px',
      maxWidth: '100%',
      position: 'sticky',
      top: theme.spacing(3),
    },
    display: 'none',
  },
  subSection: {
    borderTop: `1px solid ${theme.palette.components.divider}`,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    marginTop: theme.spacing(1),
    paddingTop: theme.spacing(3),
  },
}));

export default useAdIntegrationCampaignDetailsFormStyles;
