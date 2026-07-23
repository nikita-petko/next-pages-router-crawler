import React, { FunctionComponent } from 'react';
import { useTranslation } from '@rbx/intl';
import { makeStyles, useMediaQuery } from '@rbx/ui';
import { useStudio } from '@modules/miscellaneous/hooks';
import { urls } from '@modules/miscellaneous/common';
import { captureDeveloperLandingEvent, EDeveloperLandingSection } from '../utils/eventUtils';
import { overviewConstants } from '../constants/contentConstants';
import LargeTileCard from './common/LargeTileCard';
import Section from './common/Section';
import Card from './common/Card';

const { studio, creatorHub } = urls;
const useStyles = makeStyles()((theme) => ({
  grid: {
    display: 'grid',
    gap: 20,
    gridTemplateColumns: 'repeat(2, 1fr)',
    gridTemplateRows: 'repeat(2, 1fr)',
    [theme.breakpoints.down('Large')]: {
      gridTemplateColumns: 'repeat(1, 1fr)',
      gridTemplateRows: 'repeat(4, 1fr)',
      maxWidth: 400,
    },
  },
  root: {
    paddingTop: 80,
    [theme.breakpoints.up('Large')]: {
      paddingTop: 160,
    },
  },
}));

const DeveloperOverview: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const {
    classes: { grid, root },
  } = useStyles();
  const { isCompatible } = useStudio();
  const { translate } = useTranslation();
  const isTileCard = useMediaQuery((theme) => theme.breakpoints.up('XLarge'));

  return (
    <Section
      classes={{ root }}
      title={translate('Heading.CreateAndScale')}
      description={translate('Description.CreateAndScaleSubheader')}
      section={EDeveloperLandingSection.CreateAndScale}>
      <div className={grid}>
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
