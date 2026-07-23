import React from 'react';
import { clsx as cx } from '@rbx/foundation-ui';
import { Flex } from '@modules/miscellaneous/common/components';
import { HubMeta, buildTitle } from '@rbx/creator-hub-history';
import { heroBackgroundPoster, heroBackgroundVideoSources } from '../constants/assetConstants';
import ApplyButton from './ApplyButton';
import layoutStyles from './Layout.module.css';
import styles from './TopHero.module.css';

export default function TopHero() {
  const title = 'Build on Roblox and reach millions';
  const description =
    "We're launching two new programs to back ambitious creators building the next generation of novel games. Join and we're ready to help you build, launch, and scale.";
  return (
    <Flex className={layoutStyles.heroContainer} flexDirection='column' alignItems='stretch'>
      {/* TODO(@neoxu, 03/13/26): update the title to the correct one */}
      <HubMeta title={buildTitle(title)} description={description} />
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
          {title}
        </span>
        <span className={cx(layoutStyles.darkText, 'text-body-large max-width-[840px]')}>
          {description}
        </span>
        <ApplyButton />
      </Flex>
    </Flex>
  );
}
