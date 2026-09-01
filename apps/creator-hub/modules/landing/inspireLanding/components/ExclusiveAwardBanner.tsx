import { clsx as cx } from '@rbx/foundation-ui';
import { exclusiveAwardArt, exclusiveAwardImage } from '../constants/assetConstants';
import { EXCLUSIVE_AWARD } from '../constants/inspireConstants';
import styles from './ExclusiveAwardBanner.module.css';
import layoutStyles from './Layout.module.css';

type ExclusiveAwardBannerProps = {
  inline?: boolean;
};

export default function ExclusiveAwardBanner({ inline = false }: ExclusiveAwardBannerProps) {
  const banner = (
    <div className={cx(styles.banner, layoutStyles.card, 'bg-surface-100 clip')}>
      <img className={styles.bannerTexture} src={exclusiveAwardImage} alt='' aria-hidden='true' />
      <div className={styles.bannerArtWrap} aria-hidden='true'>
        <img className={styles.bannerArt} src={exclusiveAwardArt} alt='' />
      </div>
      <div className={cx(styles.bannerContent, 'flex flex-col gap-small')}>
        <span className='text-heading-medium content-emphasis'>{EXCLUSIVE_AWARD.title}</span>
        <span className='text-body-medium content-default'>{EXCLUSIVE_AWARD.description}</span>
      </div>
    </div>
  );

  if (inline) {
    return banner;
  }

  return (
    <div
      className={cx(
        layoutStyles.container,
        layoutStyles.maxWidthContainer,
        layoutStyles.bannerSpacing,
      )}>
      {banner}
    </div>
  );
}
