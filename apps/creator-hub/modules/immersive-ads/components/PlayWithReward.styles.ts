import { makeStyles } from '@rbx/ui';

const usePlayWithRewardStyles = makeStyles()((theme) => ({
  // Copied from PriceValidationExamples.styles.ts
  codeSnippetComment: {
    color: theme.palette.content.disabled,
    fontFamily: 'monospace',
  },
  codeSnippetVariable: {
    color: theme.palette.content.alert.important,
    fontFamily: 'monospace',
  },
  codeSnippetParameter: {
    color: theme.palette.content.alert.notice,
    fontFamily: 'monospace',
  },
  codeSnippetValue: {
    color: theme.palette.content.alert.active,
    fontFamily: 'monospace',
  },
  // Custom styles
  bannerContainer: {
    marginTop: '12px',
  },
  dialogTitle: {
    padding: '32px 20px 24px 20px',
  },
  dialogStepper: {
    padding: '0px 12px',
  },
  dialogContentContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  previewContainer: {
    display: 'flex',
    height: '72px',
    alignItems: 'center',
    gap: '12px',
    alignSelf: 'stretch',
    borderRadius: '8px',
    backgroundColor: theme.palette.surface[400],
    padding: '12px',
  },
  previewContainerCentered: {
    justifyContent: 'center',
  },
  codeWrapper: {
    color: theme.palette.content.muted,
    fontFamily: 'monospace',
    fontSize: '12px',
    margin: 0,
    lineHeight: '1.6',
  },
  codeBlock: {
    backgroundColor: theme.palette.surface[300],
    padding: '12px',
    border: '1px solid var(--Components-Divider, rgba(255, 255, 255, 0.12))',
    borderRadius: '0px 0px 8px 8px',
    maxHeight: '280px',
    overflowY: 'auto' as const,
  },
  codeHeader: {
    backgroundColor: theme.palette.surface[100],
    color: theme.palette.content.muted,
    padding: '4px 12px',
    border: '1px solid var(--Components-Divider, rgba(255, 255, 255, 0.12))',
    borderRadius: '8px 8px 0px 0px',
  },
  codeHeaderContentContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  dialogActionsContainer: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  leftDialogActions: {
    display: 'flex',
    gap: '12px',
  },
  inputLabel: {
    fontSize: '12px',
    fontWeight: 400,
    lineHeight: '12px',
  },
  prewrap: {
    whiteSpace: 'pre-wrap',
  },
  copyButtonContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
}));

export default usePlayWithRewardStyles;
