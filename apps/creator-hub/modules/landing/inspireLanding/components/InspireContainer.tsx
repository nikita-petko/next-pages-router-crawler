import { clsx as cx } from '@rbx/foundation-ui';
import { withTranslation } from '@rbx/intl';
import Flex from '@modules/miscellaneous/components/Flex';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import InspireCafe from './InspireCafe';
import InspireChallenge from './InspireChallenge';
import InspireFaq from './InspireFaq';
import InspireWorkshopsRegion from './InspireWorkshopsRegion';
import Itinerary from './Itinerary';
import TopHero from './TopHero';

function InspireContainer() {
  return (
    <div className={cx('max-width-[1500px]', 'margin-x-auto')}>
      {/* Offsets the 32px padding the layout's PageContent applies, so the page goes full-bleed.
          Matches the /build landing. PageContent clips overflow-x, so this never adds a scrollbar. */}
      <Flex className={cx('margin-x-[-32px]')} flexDirection='column' alignItems='stretch'>
        <TopHero />
        <Itinerary />
        <InspireCafe />
        <InspireWorkshopsRegion />
        <InspireChallenge />
        <InspireFaq />
      </Flex>
    </div>
  );
}

export default withTranslation(InspireContainer, [TranslationNamespace.Landing]);
