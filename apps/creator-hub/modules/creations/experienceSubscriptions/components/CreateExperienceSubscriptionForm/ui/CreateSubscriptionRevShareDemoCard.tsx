import { Grid } from '@rbx/ui';

type TCreateSubscriptionRevShareDemoCardProps = {
  revshareCard: string;
};

function CreateSubscriptionRevShareDemoCard({
  revshareCard,
  children,
}: React.PropsWithChildren<TCreateSubscriptionRevShareDemoCardProps>) {
  return (
    <Grid item XLarge={4} XSmall={12} Medium={6} Large={5} classes={{ root: revshareCard }}>
      {children}
    </Grid>
  );
}

export default CreateSubscriptionRevShareDemoCard;
