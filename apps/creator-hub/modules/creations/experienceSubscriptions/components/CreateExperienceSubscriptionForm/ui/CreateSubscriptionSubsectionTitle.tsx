import { Typography } from '@rbx/ui';
import useSubscriptionFormStyles from '../../ExperienceSubscription.styles';

type TCreateSubscriptionSubsectionTitleProps = {
  title: string;
};

function CreateSubscriptionSubsectionTitle({ title }: TCreateSubscriptionSubsectionTitleProps) {
  const { classes } = useSubscriptionFormStyles();

  return (
    <Typography variant='body1' component='div' className={classes.subSectionTitle}>
      {title}
    </Typography>
  );
}

export default CreateSubscriptionSubsectionTitle;
