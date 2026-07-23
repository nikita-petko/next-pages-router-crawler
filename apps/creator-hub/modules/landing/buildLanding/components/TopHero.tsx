import { clsx as cx } from '@rbx/foundation-ui';
import Flex from '@modules/miscellaneous/components/Flex';
import { heroBackgroundPoster, heroBackgroundVideoSources } from '../constants/assetConstants';
import ApplyButton from './ApplyButton';
import layoutStyles from './Layout.module.css';
import styles from './TopHero.module.css';

export default function TopHero() {
  return (
    <Flex className={layoutStyles.heroContainer} flexDirection='column' alignItems='stretch'>
      <video
        className={layoutStyles.heroMedia}
        autoPlay
        loop
        muted
        playsInline
        poster={heroBackgroundPoster}>
        {heroBackgroundVideoSources.map(({ url, type }) => (
          <source src={url} type={type} key={type} />
        ))}
      </video>
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
          Build on Roblox and reach millions
        </span>
        <span className={cx(layoutStyles.darkText, 'text-body-large max-width-[840px]')}>
          {`We're launching two new programs to back ambitious creators building the next generation
          of novel games to invite more 18+ players to Roblox. Join and we're ready to help you
          build, launch, and scale.`}
        </span>
        <ApplyButton />
      </Flex>
    </Flex>
  );
}
