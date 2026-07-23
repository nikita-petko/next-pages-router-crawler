import { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { Card, CardActionArea, CardMedia, makeStyles } from '@rbx/ui';
import { useConversionTracker } from '@modules/miscellaneous/hooks';
import type { TOpportunityData } from '../../constants/opportunitiesConstants';
import { EHomepageSection } from '../../utils/eventUtils';

type OpportunityCardProps = TOpportunityData;

const useStyles = makeStyles()(() => ({
  card: {
    width: 330,
  },
  media: {
    height: 180,
  },
}));

export default function OpportunityCard({
  id,
  titleKey,
  descriptionKey,
  imageSrc,
  imgAlt,
  href,
}: OpportunityCardProps) {
  const { translate } = useTranslation();
  const {
    classes: { card, media },
  } = useStyles();

  const additionalParams = useMemo(
    () => ({
      page: 'homepage',
      section: EHomepageSection.Opportunities,
      card: id,
    }),
    [id],
  );
  const { ref: cardRef, onConvert } = useConversionTracker<HTMLDivElement>('homeOpportunityCard', {
    additionalParams,
  });

  return (
    <Card ref={cardRef} className={`flex flex-col overflow-hidden bg-surface-100 ${card}`}>
      <CardActionArea
        className='flex flex-col justify-start height-full'
        component='a'
        href={href}
        onClick={() => onConvert('clickOpportunity')}>
        <CardMedia
          className={`width-full shrink-0 ${media}`}
          component='img'
          image={imageSrc}
          alt={imgAlt}
        />
        <div className='flex flex-col gap-small flex-1 padding-xlarge'>
          <span className='text-title-large'>{translate(titleKey)}</span>
          <span className='text-body-medium content-default'>{translate(descriptionKey)}</span>
        </div>
      </CardActionArea>
    </Card>
  );
}
