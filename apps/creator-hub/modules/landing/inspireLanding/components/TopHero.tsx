import { clsx as cx } from '@rbx/foundation-ui';
import Flex from '@modules/miscellaneous/components/Flex';
import { heroBackgroundImage } from '../constants/assetConstants';
import { INSPIRE_HERO } from '../constants/inspireConstants';
import layoutStyles from './Layout.module.css';
import styles from './TopHero.module.css';

export default function TopHero() {
  return (
    <Flex className={layoutStyles.heroContainer} flexDirection='column' alignItems='stretch'>
      <img className={layoutStyles.heroMedia} src={heroBackgroundImage} alt='' aria-hidden='true' />
      <div className={layoutStyles.heroScrim} />
      <Flex
        className={layoutStyles.heroContentContainer}
        flexDirection='column'
        justifyContent='center'
        alignItems='flex-start'>
        <span
          className={cx(
            styles.heroHeading,
            layoutStyles.darkTextEmphasis,
            'text-display-small max-width-[840px]',
          )}>
          {INSPIRE_HERO.title}
        </span>
        <span
          className={cx(
            layoutStyles.darkText,
            'text-body-medium small:text-body-large max-width-[840px]',
          )}>
          {INSPIRE_HERO.description}
        </span>
      </Flex>
    </Flex>
  );
}
