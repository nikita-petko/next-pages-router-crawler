import { useTranslation } from '@rbx/intl';
import { Button, Grid, makeStyles, Typography } from '@rbx/ui';
import { UniverseEdpStateType } from '@modules/clients/experienceStore';
import ExternalPurchaseInstruction from './ExternalPurchaseInstruction';
import ExternalPurchaseTestModeInstructionAlert from './ExternalPurchaseTestModeInstructionAlert';

const useStyles = makeStyles()((theme) => ({
  testModeContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    padding: '24px',
    alignSelf: 'stretch',
    borderRadius: '8px',
    background: theme.palette.surface['200'],
  },
  testInstructionsList: {
    flexDirection: 'column',
    gap: '16px',
  },
}));

type Props = {
  onTestModeButtonClick: (newState: boolean) => void;
  universeTestModeState: UniverseEdpStateType;
  submitting: boolean;
};

function ExternalPurchaseInstructionsContainer({
  onTestModeButtonClick,
  universeTestModeState,
  submitting,
}: Props) {
  const { classes } = useStyles();
  const { translate, translateHTML } = useTranslation();

  const testModeInstructionsContent = Array.from({ length: 4 }, (_, index) => ({
    title: translate(`Heading.TestModeInstruction${index + 1}`),
    text: translateHTML(`Message.TestModeInstruction${index + 1}`, [
      {
        opening: 'boldStart',
        closing: 'boldEnd',
        content: (content) => <strong>{content}</strong>,
      },
    ]),
  }));

  return (
    <Grid container item alignItems='flex-start' classes={{ root: classes.testModeContainer }}>
      <Typography variant='h6'>{translate('Heading.TestModeInstructions')}</Typography>
      <Grid container item classes={{ root: classes.testInstructionsList }}>
        <ExternalPurchaseTestModeInstructionAlert />
        {testModeInstructionsContent.map((value, index) => (
          <ExternalPurchaseInstruction
            title={value.title}
            text={value.text}
            index={index}
            key={value.title}
          />
        ))}
      </Grid>
      {universeTestModeState === 'Enabled' ? (
        <Button
          variant='contained'
          color='primary'
          disabled={submitting}
          onClick={() => onTestModeButtonClick(false)}>
          {translate('Label.DisableTestMode')}
        </Button>
      ) : (
        <Button
          variant='contained'
          color='secondary'
          disabled={submitting}
          onClick={() => onTestModeButtonClick(true)}>
          {translate('Label.EnableTestMode')}
        </Button>
      )}
    </Grid>
  );
}

export default ExternalPurchaseInstructionsContainer;
