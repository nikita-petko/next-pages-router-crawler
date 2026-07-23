import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import { makeStyles } from '@rbx/ui';
import { latestConstants } from '../constants/contentConstants';
import { EDeveloperLandingSection, captureDeveloperLandingEvent } from '../utils/eventUtils';
import Card from './common/Card';
import Section from './common/Section';

const useStyles = makeStyles()((theme) => ({
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gridTemplateRows: 'repeat(3, 1fr)',
    maxWidth: 400,
    gap: 20,
    [theme.breakpoints.up('Large')]: {
      gridTemplateColumns: 'repeat(3, 1fr)',
      gridTemplateRows: 'repeat(1, 1fr)',
      maxWidth: 'none',
    },
  },
}));

const Latest: FunctionComponent<React.PropsWithChildren> = () => {
  const {
    classes: { grid },
  } = useStyles();

  const { translate } = useTranslation();

  return (
    <Section
      title={translate('Heading.Latest')}
      backgroundVariant='tall'
      section={EDeveloperLandingSection.Latest}>
      <div className={grid}>
        {latestConstants.map((data) => (
          <Card
            key={data.title}
            fullWidthImage
            {...data}
            alt={data.title}
            title={translate(data.title)}
            description={translate(data.description)}
            link={translate(data.link)}
            onClick={() =>
              captureDeveloperLandingEvent('clickLatestCard', EDeveloperLandingSection.Latest, {
                identifer: data.identifier,
              })
            }
          />
        ))}
      </div>
    </Section>
  );
};
export default Latest;
