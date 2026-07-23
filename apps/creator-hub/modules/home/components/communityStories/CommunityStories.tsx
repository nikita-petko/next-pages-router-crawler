import { useState, useCallback, useMemo } from 'react';
import { withTranslation, useTranslation } from '@rbx/intl';
import { Divider, Button, Typography, ChatIcon, EventNoteIcon, List, makeStyles } from '@rbx/ui';
import { Flex, YoutubeVideo } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub, events } from '@modules/miscellaneous/urls';
import {
  COMMUNITY_STORIES_LIST_ID,
  youTubePlayerOptions,
  communityStoriesData,
  eventNames,
} from '../../constants/communityStoriesConstants';
import { captureHomepageEvent, EHomepageSection } from '../../utils/eventUtils';
import Section from '../common/Section';
import CommunityStoryItem from './CommunityStoryItem';

const { developerForum } = creatorHub;

const useStyles = makeStyles()((theme) => ({
  divider: {
    marginBottom: 48,
    [theme.breakpoints.down('Large')]: {
      marginBottom: 24,
    },
  },
  root: {
    gap: 24,
    flexWrap: 'wrap',
    [theme.breakpoints.down('Large')]: {
      gap: 24,
      flexDirection: 'column',
    },
  },
  textColumn: {
    flex: '1 1 320px',
    minWidth: 280,
    justifyContent: 'center',
    [theme.breakpoints.down('Large')]: {
      flex: '0 0 auto',
      justifyContent: 'flex-start',
    },
  },
  mediaColumn: {
    flex: '1 1 520px',
    minWidth: 320,
    width: '100%',
  },
  description: {
    maxWidth: 450,
    margin: '8px 0px 24px',
  },
  container: {
    gap: 8,
    width: '100%',
    [theme.breakpoints.down('Medium')]: {
      flexDirection: 'column',
    },
  },
  storyVideo: {
    ...theme.border.radius.large,
    width: 315,
    height: 560,
    [theme.breakpoints.down('Medium')]: {
      width: '100%',
    },
  },
  storyList: {
    ...theme.border.radius.large,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    maxWidth: 500,
    flexGrow: 0,
    [theme.breakpoints.down('Large')]: {
      maxWidth: 'fit-content',
      flexGrow: 1,
    },
    maxHeight: 560,
    [theme.breakpoints.down('Medium')]: {
      maxHeight: 300,
    },
    backgroundColor: theme.palette.surface[100],
    padding: 0,
    overflowY: 'scroll',
    scrollbarWidth: 'none',
    '&::-webkit-scrollbar ': {
      display: 'none',
    },
  },
  story: {
    flexGrow: 1,
    gap: 12,
    padding: 8,
  },
  storyThumbnail: {
    ...theme.border.radius.medium,
    width: 63,
    height: 109,
    border: `1px solid ${theme.palette.surface.outline}`,
    verticalAlign: 'middle',
  },
}));

function CommunityStories() {
  const { translate } = useTranslation();

  const communityStoriesWithFeatured: typeof communityStoriesData = useMemo(() => {
    const communityStoriesDataWithFeatured = [...communityStoriesData];
    const featuredIndex = Math.floor(Math.random() * communityStoriesDataWithFeatured.length);

    const [featuredStoryData] = communityStoriesDataWithFeatured.splice(featuredIndex, 1);
    communityStoriesDataWithFeatured.unshift(featuredStoryData);

    return communityStoriesDataWithFeatured;
  }, []);
  const [storyVideoId, setStoryVideoId] = useState<string>(() => {
    const [featuredCommunityStory] = communityStoriesWithFeatured;
    return featuredCommunityStory.videoId;
  });

  const showStoryVideo = useCallback((videoId: string) => {
    setStoryVideoId(videoId);
  }, []);
  const logActionClick = useCallback((eventName: string) => {
    captureHomepageEvent(eventName, EHomepageSection.CommunityStories);
  }, []);

  const {
    classes: {
      divider,
      root,
      textColumn,
      mediaColumn,
      description,
      container,
      storyVideo,
      storyList,
    },
  } = useStyles();
  return (
    <Section>
      <Divider className={divider} />
      <Flex classes={{ root }} alignItems='stretch' justifyContent='space-between'>
        <Flex classes={{ root: textColumn }} flexDirection='column' alignItems='flex-start'>
          <Typography variant='h2'>{translate('Heading.YouArePartOfCommunity')}</Typography>
          <Typography className={description} variant='body2' color='secondary'>
            {translate('Description.OurCommunity')}
          </Typography>
          <Button
            size='large'
            variant='text'
            color='primary'
            startIcon={<ChatIcon />}
            href={developerForum.getBaseUrl()}
            onClick={() => logActionClick(eventNames.joinCommunityForum)}>
            {translate('Action.JoinCommunityForum')}
          </Button>
          <Button
            size='large'
            variant='text'
            color='primary'
            startIcon={<EventNoteIcon />}
            href={events.getUrl()}
            onClick={() => logActionClick(eventNames.viewCommunityEvents)}>
            {translate('Action.ViewCommunityEvents')}
          </Button>
        </Flex>
        <Flex classes={{ root: mediaColumn }} alignItems='center'>
          <Flex classes={{ root: container }} alignItems='center'>
            <YoutubeVideo
              className={storyVideo}
              videoId={storyVideoId}
              options={youTubePlayerOptions}
            />
            <List className={storyList} id={COMMUNITY_STORIES_LIST_ID}>
              {communityStoriesWithFeatured.map((data) => (
                <CommunityStoryItem
                  key={data.id}
                  {...data}
                  selected={storyVideoId === data.videoId}
                  showStoryVideo={showStoryVideo}
                />
              ))}
            </List>
          </Flex>
        </Flex>
      </Flex>
    </Section>
  );
}

export default withTranslation(CommunityStories, [TranslationNamespace.Home]);
