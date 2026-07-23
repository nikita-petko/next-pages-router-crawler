import React from 'react';
import { useTranslation } from '@rbx/intl';
import { CloseIcon, Divider, Grid, IconButton, makeStyles, Typography } from '@rbx/ui';
import Link from 'next/link';
import useScrollStyles from '../../hooks/useScrollStyles';
import useProductUrls from '../../utils/useProductUrls';

const useStyles = makeStyles()((theme) => ({
  container: {
    padding: '24px 22px 12px 28px',
    height: '100%',
    width: 293,
    minWidth: 0,
    borderLeft: `1px ${theme.palette.components.divider} solid`,
    borderRight: `1px ${theme.palette.components.divider} solid`,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  itemBase: {
    display: 'flex',
    color: 'inherit',
    textDecoration: 'none',
    minHeight: 40,
    alignItems: 'center',
    padding: '0px 12px',
    borderRadius: 8,
    gap: 4,
  },
  itemLink: {
    '&:hover': {
      backgroundColor: theme.palette.states.selected,
    },
  },
  subItem: {
    paddingLeft: '24px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '4px',
  },
}));

type TLearnRailProps = {
  close: VoidFunction;
};

const LearnRail: React.FunctionComponent<TLearnRailProps> = ({ close }) => {
  const { translate } = useTranslation();
  const { Documentation } = useProductUrls();
  const {
    cx,
    classes: { container, header, section, itemBase, itemLink, subItem },
  } = useStyles();
  const {
    classes: { scroll },
  } = useScrollStyles();

  const createList = [
    { key: 'Title.Create', href: null },
    { key: 'Title.Experiences', href: Documentation.createExperiences },
    { key: 'Title.Avatar', href: Documentation.createAvatar },
    { key: 'Title.Assets', href: Documentation.createAssets },
    { key: 'Title.SamplesAndProjects', href: Documentation.createSamples },
  ];

  const apisAndToolsList = [
    { key: 'Title.APIsAndTools', href: null },
    { key: 'Label.EngineReference', href: Documentation.engine },
    { key: 'Label.OpenCloudReference', href: Documentation.cloud },
    { key: 'Title.Studio', href: Documentation.studio },
    { key: 'Title.Analytics', href: Documentation.scaleAnalytics },
    { key: 'Title.Monetization', href: Documentation.monetize },
  ];

  const newToRobloxList = [
    { key: 'Title.NewToRoblox', href: null },
    { key: 'Title.GetStarted', href: Documentation.newToRobloxGetStarted },
    { key: 'Title.Tutorials', href: Documentation.newToRobloxTutorials },
  ];

  const communityList = [
    { key: 'Heading.Community', href: null },
    { key: 'Title.CreatorPrograms', href: Documentation.communityCreatorPrograms },
    { key: 'Title.ForEducators', href: Documentation.communityEducators },
    { key: 'Heading.GuidelinesAndPolicies', href: Documentation.communityGuidelinesAndPolicies },
  ];

  const sections = [
    { key: 'create', list: createList },
    { key: 'scale', list: apisAndToolsList },
    { key: 'newToRoblox', list: newToRobloxList },
    { key: 'community', list: communityList },
  ];

  return (
    <Grid classes={{ root: cx(container, scroll) }}>
      <Grid classes={{ root: header }}>
        <Typography variant='h3'>{translate('Heading.Learn')}</Typography>
        <IconButton aria-label='close' onClick={close} color='secondary'>
          <CloseIcon />
        </IconButton>
      </Grid>
      <Divider />
      <Grid classes={{ root: section }}>
        <Link href={Documentation.home} className={cx(itemBase, itemLink)} onClick={close}>
          <Typography variant='smallLabel2'>{translate('Heading.Home')}</Typography>
        </Link>
      </Grid>
      {sections.map(({ key, list }) => (
        <Grid key={key} classes={{ root: section }}>
          {list.map(({ key: listKey, href }, index) =>
            href ? (
              <Link
                key={listKey}
                href={href}
                className={cx(itemBase, itemLink, { [subItem]: index !== 0 })}
                onClick={close}>
                <Typography variant={index === 0 ? 'smallLabel2' : 'smallLabel1'}>
                  {translate(listKey)}
                </Typography>
              </Link>
            ) : (
              <div key={listKey} className={cx(itemBase, { [subItem]: index !== 0 })}>
                <Typography variant={index === 0 ? 'smallLabel2' : 'smallLabel1'}>
                  {translate(listKey)}
                </Typography>
              </div>
            ),
          )}
        </Grid>
      ))}
    </Grid>
  );
};

export default LearnRail;
