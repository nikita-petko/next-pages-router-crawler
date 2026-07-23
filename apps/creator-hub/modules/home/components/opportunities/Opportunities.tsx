import { withTranslation, useTranslation } from '@rbx/intl';
import { Carousel } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { opportunityData } from '../../constants/opportunitiesConstants';
import Section from '../common/Section';
import SectionHeader from '../common/SectionHeader';
import OpportunityCard from './OpportunityCard';

function Opportunities() {
  const { translate } = useTranslation();

  return (
    <Section>
      <SectionHeader header={translate('Heading.Opportunities')} />
      <Carousel>
        {opportunityData.map((data) => (
          <OpportunityCard key={data.id} {...data} />
        ))}
      </Carousel>
    </Section>
  );
}

export default withTranslation(Opportunities, [TranslationNamespace.Home]);
