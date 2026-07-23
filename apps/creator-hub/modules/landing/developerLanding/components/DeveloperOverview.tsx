import type { FunctionComponent } from 'react';
import React from 'react';
import { Badge } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { makeStyles, useMediaQuery } from '@rbx/ui';
import { useStudio } from '@modules/miscellaneous/hooks';
import { creatorHub, studio } from '@modules/miscellaneous/urls';
import { creatorProgramsImage } from '../constants/assetConstants';
import { overviewConstants } from '../constants/contentConstants';
import { captureDeveloperLandingEvent, EDeveloperLandingSection } from '../utils/eventUtils';
import Card from './common/Card';
import LargeTileCard from './common/LargeTileCard';
import Section from './common/Section';

const useStyles = makeStyles()((theme) => ({
  grid: {
    display: 'grid',
    gap: 20,
    gridTemplateColumns: 'repeat(2, 1fr)',
    gridTemplateRows: 'auto',
    [theme.breakpoints.down('Large')]: {
      gridTemplateColumns: 'repeat(1, 1fr)',
      maxWidth: 900,
    },
  },
  root: {
    paddingTop: 80,
    [theme.breakpoints.up('Large')]: {
      paddingTop: 160,
    },
  },
  fullWidthItem: {
    gridColumn: '1 / -1',
  },
}));

const DeveloperOverview: FunctionComponent<React.PropsWithChildren> = () => {
  const {
    classes: { grid, root, fullWidthItem },
  } = useStyles();
  const { isCompatible } = useStudio();
  const { translate } = useTranslation();
  const isTileCard = useMediaQuery((theme) => theme.breakpoints.up('XLarge'));

  const promoProps = {
    title: translate('Heading.CreatorPrograms'),
    description: translate('Description.CreatorPrograms'),
    link: translate('Action.LearnMore'),
    url: `${process.env.baseUrl}/build`,
    image: creatorProgramsImage,
    alt: translate('Heading.CreatorPrograms'),
    fullWidthImage: true,
    badge: <Badge label={translate('Label.New')} />,
    onClick: () =>
      captureDeveloperLandingEvent(
        'clickCreatorPrograms',
        EDeveloperLandingSection.CreateAndScale,
        { identifier: 'creatorPrograms' },
      ),
  };

  return (
    <Section
      classes={{ root }}
      title={translate('Heading.CreateAndScale')}
      description={translate('Description.CreateAndScaleSubheader')}
      section={EDeveloperLandingSection.CreateAndScale}>
      <div className={grid}>
        <div className={fullWidthItem}>
          {isTileCard ? <LargeTileCard {...promoProps} /> : <Card {...promoProps} />}
        </div>
        {overviewConstants.map((data) => {
          const url =
            !isCompatible && (data.url === studio.getDownloadUrl() || data.url === '')
              ? creatorHub.docs.getSettingUpStudioUrl()
              : data.url;
          const cardProps = {
            ...data,
            title: translate(data.title),
            description: translate(data.description),
            link: translate(data.link),
            onClick: () =>
              captureDeveloperLandingEvent(
                'clickCreateAndScaleCard',
                EDeveloperLandingSection.CreateAndScale,
                {
                  identifier: data.identifier,
                },
              ),
            url,
          };
          return isTileCard ? (
            <LargeTileCard key={data.title} {...cardProps} />
          ) : (
            <Card key={data.title} {...cardProps} />
          );
        })}
      </div>
    </Section>
  );
};
export default DeveloperOverview;
