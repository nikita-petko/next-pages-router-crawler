import { Avatar, Grid, Typography } from '@rbx/ui';
import useStepperHeadingStyles from './StepperHeading.styles';

interface StepperHeadingProps {
  step: string;
  heading: string;
}

const StepperHeading = ({ step, heading }: StepperHeadingProps) => {
  const {
    classes: { avatar },
  } = useStepperHeadingStyles();
  return (
    <Grid container alignItems='center'>
      <Avatar className={avatar} alt={step}>
        <Typography variant='captionHeader'>{step}</Typography>
      </Avatar>
      <Typography variant='h3'>{heading}</Typography>
    </Grid>
  );
};

export default StepperHeading;
