import { makeStyles } from '@rbx/ui';
import React, { FunctionComponent } from 'react';
import { useTranslation } from '@rbx/intl';
import { latestConstants } from '../constants/contentConstants';
import Section from './common/Section';
import Card from './common/Card';
import { EDeveloperLandingSection, captureDeveloperLandingEvent } from '../utils/eventUtils';

const useStyles = makeStyles()((theme) => ({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gridTemplateRows: 'repeat(1, 1fr)',
    gap: 20,
    [theme.breakpoints.down('XLarge')]: {
      gridTemplateColumns: 'repeat(2, 1fr)',
      gridTemplateRows: 'repeat(2, 1fr)',
    },
    [theme.breakpoints.down('Large')]: {
      gridTemplateColumns: 'repeat(1, 1fr)',
      gridTemplateRows: 'repeat(3, 1fr)',
      maxWidth: 400,
    },
  },
}));

const Latest: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
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
