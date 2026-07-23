import React from 'react';
import styles from './Layout.module.css';

type HeroBannerProps = {
  title: string;
  subtitle: string;
};

const HERO_IMAGES = [
  `${process.env.assetPathPrefix}/talent-hub/hero-bg-1.webp`,
  `${process.env.assetPathPrefix}/talent-hub/hero-bg-2.webp`,
  `${process.env.assetPathPrefix}/talent-hub/hero-bg-3.webp`,
];

const HeroBanner: React.FC<HeroBannerProps> = ({ title, subtitle }) => {
  return (
    <div className={styles.heroBanner}>
      <div className={styles.heroImageRow}>
        {HERO_IMAGES.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=''
            aria-hidden
            className={i === HERO_IMAGES.length - 1 ? styles.heroImageLast : styles.heroImage}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ))}
      </div>
      <div className={styles.heroGradientOverlay} />
      <div className={styles.heroTextContent}>
        <div className={styles.heroTitle}>{title}</div>
        <div className='text-body-medium content-muted'>{subtitle}</div>
      </div>
    </div>
  );
};

export default HeroBanner;
