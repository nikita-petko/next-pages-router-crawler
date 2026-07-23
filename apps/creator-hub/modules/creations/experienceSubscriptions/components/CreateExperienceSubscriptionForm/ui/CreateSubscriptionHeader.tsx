import { useTranslation } from '@rbx/intl';
import { Grid, Link, Typography, useMediaQuery } from '@rbx/ui';
import { SUBSCRIPTION_LEARN_MORE_URL } from '@modules/miscellaneous/common/constants/linkConstants';

type TCreateSubscriptionHeaderProps = {
  createProductInfoText: string;
};

function CreateSubscriptionHeader({ createProductInfoText }: TCreateSubscriptionHeaderProps) {
  const { translate } = useTranslation();
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Medium'));

  return (
    <Grid container item>
      <Grid item XSmall={12}>
        <Typography variant={isCompactView ? 'h3' : 'h1'}>
          {translate('Heading.CreateSubscription')}
        </Typography>
      </Grid>
      <Grid item XSmall={12} XLarge={8} classes={{ root: createProductInfoText }}>
        <Typography variant='body1'>
          {translate('Message.CreateSubscriptionInfo')}
          <span>. &nbsp;</span>
          <Link href={SUBSCRIPTION_LEARN_MORE_URL} target='_blank'>
            {translate('Label.LearnMore')}
          </Link>
        </Typography>
      </Grid>
    </Grid>
  );
}

export default CreateSubscriptionHeader;
