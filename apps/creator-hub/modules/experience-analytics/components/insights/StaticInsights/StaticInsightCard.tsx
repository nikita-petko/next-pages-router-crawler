import React, { FC, ComponentProps, ComponentType } from 'react';
import {
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Grid,
  Avatar,
  AutorenewIcon,
  RocketLaunchIcon,
  ShareIcon,
  makeStyles,
} from '@rbx/ui';
import { Flex } from '@modules/miscellaneous/common/components';
import { useRAQIV2TranslationDependencies } from '@modules/experience-analytics-shared';
import { StaticInsightType } from '@modules/clients/analytics';
import { TranslationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import InsightAction from './actions/InsightAction';

const useInsightCardStyles = makeStyles()((theme) => ({
  card: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: theme.palette.surface[200],
  },
  cardContent: {
    height: '100%',
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  header: {
    paddingTop: 8,
    paddingBottom: 12,
    alignItems: 'center',
  },
  actionContainer: {
    width: '100%',
    paddingTop: 12,
  },
}));

const insightIcons: Record<
  StaticInsightType,
  ComponentType<ComponentProps<typeof AutorenewIcon>>
> = {
  [StaticInsightType.OnboardInviteUsers]: ShareIcon,
  [StaticInsightType.OnboardRegularUpdates]: RocketLaunchIcon,
  [StaticInsightType.OnboardImproveCoreLoop]: AutorenewIcon,
};

const namespace = TranslationNamespace.Insights;
export const takeActionKey: TranslationKey = { key: 'Action.TakeAction', namespace };

const StaticInsightTypeStrings: Record<
  StaticInsightType,
  {
    headerKey: TranslationKey;
    descriptionKey: TranslationKey;
    actionKey: TranslationKey;
  }
> = {
  [StaticInsightType.OnboardRegularUpdates]: {
    headerKey: { key: 'Header.OnboardRegularUpdates', namespace },
    descriptionKey: { key: 'Description.OnboardRegularUpdates', namespace },
    actionKey: { key: 'Action.OpenStudio', namespace },
  },
  [StaticInsightType.OnboardImproveCoreLoop]: {
    headerKey: { key: 'Header.OnboardImproveCoreLoop', namespace },
    descriptionKey: { key: 'Description.OnboardImproveCoreLoop', namespace },
    actionKey: { key: 'Action.LearnMore', namespace },
  },
  [StaticInsightType.OnboardInviteUsers]: {
    headerKey: { key: 'Header.OnboardInviteUsers', namespace },
    descriptionKey: { key: 'Description.OnboardInviteUsers', namespace },
    actionKey: { key: 'Action.CopyLink', namespace },
  },
};

type StaticInsightCardProps = {
  insightType: StaticInsightType;
};

const StaticInsightCard: FC<StaticInsightCardProps> = ({ insightType }) => {
  const { translateHTML } = useRAQIV2TranslationDependencies();
  const Icon = insightIcons[insightType];
  const {
    classes: { card, cardContent, header, actionContainer },
  } = useInsightCardStyles();

  const { headerKey, descriptionKey, actionKey } = StaticInsightTypeStrings[insightType];
  const headerText = translateHTML(headerKey);
  const descriptionText = translateHTML(descriptionKey);
  const actionText = translateHTML(actionKey);

  return (
    <Card className={card}>
      <CardActionArea disableRipple sx={{ padding: '16px', height: '100%' }}>
        <CardContent className={cardContent}>
          <Flex flexDirection='column' justifyContent='flex-start' alignItems='flex-start'>
            <Grid container item direction='column' XSmall={12}>
              <Grid className={header} item container spacing={1}>
                <Grid item>
                  <Avatar alt={insightType}>
                    <Icon fontSize='small' />
                  </Avatar>
                </Grid>
                <Grid item>
                  <Typography variant='h6' color='primary'>
                    {headerText}
                  </Typography>
                </Grid>
              </Grid>
              <Grid item>
                <Typography variant='body1' color='primary'>
                  {descriptionText}
                </Typography>
              </Grid>
            </Grid>
          </Flex>
          <div className={actionContainer}>
            <InsightAction insightType={insightType} actionText={actionText} />
          </div>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default StaticInsightCard;
