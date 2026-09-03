import { Grid } from '@rbx/ui';

type TCreateSubscriptionRevShareDemoCardProps = {
  revshareCard: string;
};

function CreateSubscriptionRevShareDemoCard({
  revshareCard,
  children,
}: React.PropsWithChildren<TCreateSubscriptionRevShareDemoCardProps>) {
  return (
    <Grid item XLarge={4} XSmall={12} Medium={7} Large={7} classes={{ root: revshareCard }}>
      {children}
    </Grid>
  );
}

export default CreateSubscriptionRevShareDemoCard;
