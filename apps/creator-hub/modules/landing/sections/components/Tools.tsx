import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  Grid,
  Typography,
  Button,
  RobuxIcon,
  DashboardOutlinedIcon,
  DescriptionOutlinedIcon,
  LocalMallOutlinedIcon,
  QuestionAnswerOutlinedIcon,
  SupervisedUserCircleOutlinedIcon,
  TimelineOutlinedIcon,
  TranslateOutlinedIcon,
} from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useToolsStyles from './Tools.styles';
import ToolsGridItem from './ToolsGridItem';

type ToolsProps = {
  loginUrl: string;
};

const Tools: FunctionComponent<React.PropsWithChildren<ToolsProps>> = ({ loginUrl }) => {
  const { translate } = useTranslation();
  const {
    classes: { root, descriptionContainer, description, toolsGrid, manageContentContainer },
  } = useToolsStyles();

  return (
    <Grid className={root} container>
      <Grid container justifyContent='center'>
        <Typography variant='h3' component='h3' align='center'>
          {translate('Heading.DiscoverTools')}
        </Typography>
      </Grid>
      <Grid className={descriptionContainer} container justifyContent='center'>
        <Typography className={description} color='secondary' variant='body1' align='center'>
          {translate('Description.CreatorHub')}
        </Typography>
      </Grid>
      <Grid className={toolsGrid} container>
        <ToolsGridItem
          icon={<DashboardOutlinedIcon />}
          headingTranslationKey='Heading.CreatorDashboard'
          bodyTranslationKey='Description.CreatorDashboardTool'
        />
        <ToolsGridItem
          icon={<DescriptionOutlinedIcon />}
          headingTranslationKey='Heading.DocumentationSite'
          bodyTranslationKey='Description.DocumentationTool'
        />
        <ToolsGridItem
          icon={<LocalMallOutlinedIcon />}
          headingTranslationKey='Heading.Store'
          bodyTranslationKey='Description.MarketplaceTool'
        />
        <ToolsGridItem
          icon={<SupervisedUserCircleOutlinedIcon />}
          headingTranslationKey='Heading.Talent'
          bodyTranslationKey='Description.TalentTool'
        />
        <ToolsGridItem
          icon={<TimelineOutlinedIcon />}
          headingTranslationKey='Heading.Analytics'
          bodyTranslationKey='Description.AnalyticsTool'
        />
        <ToolsGridItem
          icon={<TranslateOutlinedIcon />}
          headingTranslationKey='Heading.Translations'
          bodyTranslationKey='Description.TranslationsTool'
        />
        <ToolsGridItem
          icon={<RobuxIcon />}
          headingTranslationKey='Heading.DeveloperExchange'
          bodyTranslationKey='Description.DeveloperExchangeTool'
        />
        <ToolsGridItem
          icon={<QuestionAnswerOutlinedIcon />}
          headingTranslationKey='Heading.DevForums'
          bodyTranslationKey='Description.DevForumsTool'
        />
      </Grid>
      <Grid className={manageContentContainer} container justifyContent='center'>
        <Button variant='outlined' color='primary' size='large' href={loginUrl}>
          {translate('Action.AccessCreatorHub')}
        </Button>
      </Grid>
    </Grid>
  );
};

export default withTranslation(Tools, [TranslationNamespace.Landing]);
