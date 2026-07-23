import { Fragment } from 'react';
import { clsx as cx } from '@rbx/foundation-ui';
import { heroBackgroundPoster, heroBackgroundVideoSources } from '../constants/roadMapConstants';
import styles from './HeroVideoBanner.module.css';

/**
 * A single hero stat counter: a numeric `value` above its already-translated `label`. `id` is a
 * stable, translation-independent React key — keying on `label` breaks while translations load (all
 * labels are briefly empty and collide) and keying on the array index trips `no-array-index-key`.
 */
export interface HeroStat {
  id: string;
  value: number;
  label: string;
}

interface HeroVideoBannerProps {
  heading: string;
  stats: HeroStat[];
}

/**
 * Roadmap hero banner: an autoplaying, muted background video behind a left→right dark scrim, with an
 * overlaid heading and a row of stat counters. Presentational — the parent supplies translated copy
 * and derives `stats` from the feed.
 */
export default function HeroVideoBanner({ heading, stats }: HeroVideoBannerProps) {
  return (
    <div className={cx(styles.heroContainer, 'margin-bottom-large')}>
      <video
        className={styles.heroMedia}
        autoPlay
        loop
        muted
        playsInline
        aria-hidden='true'
        poster={heroBackgroundPoster}>
        {heroBackgroundVideoSources.map(({ url, type }) => (
          <source key={type} src={url} type={type} />
        ))}
      </video>
      <div className={styles.heroScrim} />
      <div className={cx(styles.heroContentContainer, 'flex flex-col justify-between')}>
        <span className={cx(styles.heroHeading, styles.darkTextEmphasis, 'text-display-large')}>
          {heading}
        </span>
        <div className={cx(styles.statRow, 'flex flex-row items-end')}>
          {stats.map((stat, index) => (
            <Fragment key={stat.id}>
              {index > 0 && <div className={styles.statDivider} aria-hidden='true' />}
              <div className='flex flex-col items-center'>
                <span
                  className={cx(styles.statValue, styles.darkTextEmphasis, 'text-display-small')}>
                  {stat.value}
                </span>
                <span className={cx(styles.statLabel, styles.darkText, 'text-body-small')}>
                  {stat.label}
                </span>
              </div>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
