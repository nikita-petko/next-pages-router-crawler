import { clsx as cx } from '@rbx/foundation-ui';
import Flex from '@modules/miscellaneous/components/Flex';
import { globalImage } from '../constants/assetConstants';
import ApplyButton from './ApplyButton';
import layoutStyles from './Layout.module.css';

export default function BottomHero() {
  return (
    <Flex
      className={cx(
        layoutStyles.heroContainer,
        layoutStyles.bottomHeroContainer,
        'margin-top-large',
      )}
      flexDirection='column'
      alignItems='stretch'>
      <img className={layoutStyles.heroMedia} src={globalImage} alt='global' />
      <div className={layoutStyles.heroScrim} />
      <Flex
        className={layoutStyles.heroContentContainer}
        flexDirection='column'
        justifyContent='center'
        alignItems='center'>
        <span
          className={cx(
            layoutStyles.darkTextEmphasis,
            'text-heading-medium small:text-heading-large medium:text-display-small text-align-x-center',
          )}>
          144 million players are waiting to play your game
        </span>
        <span
          className={cx(
            layoutStyles.darkText,
            'text-body-medium small:text-body-large text-align-x-center',
          )}>
          Build with the expertise, discovery, and community you need to reach them.
        </span>
        <ApplyButton />
      </Flex>
    </Flex>
  );
}
