import { makeStyles } from '@rbx/ui';

const usePriceValidationExamplesStyles = makeStyles()((theme) => ({
  examples: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  accordion: {
    borderColor: 'transparent',
    marginLeft: '-16px', // Account for default accordion left padding
    marginRight: '-16px', // Account for default accordion right padding
  },
  iconTransition: {
    transform: 'rotate(180deg)',
    transition: 'transform 0.2s',
  },
  accordionSummary: {
    '& .MuiAccordionSummary-content': {
      margin: '0px',
    },
  },
  codeBlock: {
    backgroundColor: theme.palette.surface[400],
    padding: '16px',
    border: '1px solid var(--Components-Divider, rgba(255, 255, 255, 0.12))',
    borderRadius: '8px',
  },
  accordionAction: {
    color: theme.palette.content.action,
  },
  comment: {
    color: theme.palette.content.disabled,
    fontFamily: 'monospace',
  },
  code: {
    color: theme.palette.content.muted,
    fontFamily: 'monospace',
  },
  variable: {
    color: theme.palette.content.alert.important,
    fontFamily: 'monospace',
  },
  parameter: {
    color: theme.palette.content.alert.notice,
    fontFamily: 'monospace',
  },
  value: {
    color: theme.palette.content.alert.active,
    fontFamily: 'monospace',
  },
  imageContainer: {
    width: '30%',
  },
  croppedImage: {
    width: '100%',
  },
  imageButton: {
    padding: '0px',
  },
  viewImageButton: {
    marginLeft: '-10px',
    fontWeight: 400,
  },
}));

export default usePriceValidationExamplesStyles;
