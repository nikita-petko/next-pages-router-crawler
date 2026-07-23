import { useTranslation } from '@rbx/intl';
import { Grid, Typography } from '@rbx/ui';
import useExperienceAccessFormStyles from './ExperienceAccessForm.styles';

type Props = {
  activePrivateServerCount: number | null;
  activePrivateServerSubscriptionCount: number | null;
};

const maxValueFormat = (value: number): string => (value < 0 ? `${-value}+` : `${value}`);
const maxValueOrNullFormat = (value: number | null): string =>
  value !== null ? maxValueFormat(value) : '-';

function ExperiencePrivateServerCard({
  activePrivateServerCount,
  activePrivateServerSubscriptionCount,
}: Props) {
  const {
    classes: { background, activeServer, activeSubscription },
  } = useExperienceAccessFormStyles();
  const { translate } = useTranslation();

  return (
    <Grid container direction='column' classes={{ root: background }} XLarge={4}>
      <Grid item XSmall={12} classes={{ root: activeServer }}>
        <Typography variant='largeLabel1'>
          {translate('Title.ActivePrivateServer', {
            activeServerNumber: `${maxValueOrNullFormat(activePrivateServerCount)}`,
          })}
        </Typography>
        <br />
        <Typography variant='body1' color='secondary'>
          {translate('Message.ActivePrivateServer')}
        </Typography>
      </Grid>
      <Grid item XSmall={12} classes={{ root: activeSubscription }}>
        <Typography variant='largeLabel1'>
          {translate('Title.ActivePrivateServerSubscription', {
            activeSubscription: `${maxValueOrNullFormat(activePrivateServerSubscriptionCount)}`,
          })}
        </Typography>
        <br />
        <Typography variant='body1' color='secondary'>
          {translate('Message.PrivateServerSubscriptionPriceChangeNotice')}
        </Typography>
      </Grid>
    </Grid>
  );
}

export default ExperiencePrivateServerCard;
