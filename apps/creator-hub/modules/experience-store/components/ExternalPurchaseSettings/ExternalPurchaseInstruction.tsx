import { Grid, makeStyles, StepIcon, Typography } from '@rbx/ui';

const useStyles = makeStyles()((theme) => ({
  instructionNumberIcon: {
    width: '24px',
    height: '24px',
    color: theme.palette.actionV2.secondary.fill,
  },
  instructionNumberText: {
    fontSize: theme.typography.chip.fontSize,
    fontWeight: theme.typography.chip.fontWeight,
    fill: theme.palette.content.standard,
  },
  instructionItem: {
    flexWrap: 'nowrap',
    gap: '8px',
  },
  instructionText: {
    color: theme.palette.content.muted,
  },
}));

type Props = {
  title: string;
  text: React.ReactNode;
  index: number;
};

function ExternalPurchaseInstruction({ title, text, index }: Props) {
  const { classes } = useStyles();
  return (
    <Grid container item direction='row' classes={{ root: classes.instructionItem }}>
      <StepIcon
        icon={index + 1}
        classes={{ root: classes.instructionNumberIcon, text: classes.instructionNumberText }}
      />
      <Grid container item direction='column'>
        <Typography variant='captionHeader'>{title}</Typography>
        <Typography variant='body2' classes={{ root: classes.instructionText }}>
          {text}
        </Typography>
      </Grid>
    </Grid>
  );
}

export default ExternalPurchaseInstruction;
