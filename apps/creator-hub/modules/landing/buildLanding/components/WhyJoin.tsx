import React from 'react';
import { Badge, clsx as cx } from '@rbx/foundation-ui';
import Carousel from './Carousel';
import Section from './Section';
import { discoveryImage, coachingImage, communityImage } from '../constants/assetConstants';
import styles from './WhyJoin.module.css';
import layoutStyles from './Layout.module.css';

type Advantage = {
  image: string;
  title: string;
  body: string;
  label: string;
};

const allAdvantages: Advantage[] = [
  {
    image: discoveryImage,
    label: 'Discovery',
    title: 'Reach millions at launch for select novel games',
    body: "Accelerate your game's trajectory with promotional support to reach a global audience.",
  },
  {
    image: coachingImage,
    label: 'Coaching',
    title: 'Direct access to Roblox',
    body: 'Get coaching from Roblox engineers and artists and staff. Early access to new tech. A dedicated workspace at Roblox HQ (Incubator only).',
  },
  {
    image: communityImage,
    label: 'Community',
    title: 'Join a supportive community',
    body: 'Access to a talented community of creators, top devs, alumni, and investors. Resources and events organized by Roblox.',
  },
];

export default function WhyJoin() {
  return (
    <Section
      title='Why join'
      subtitle='Turn your vision into a launch-ready game with marketing support, hands-on partners, and a direct line into the Roblox team.'
      spacingClassName={layoutStyles.whyJoinSpacing}>
      <Carousel>
        {allAdvantages.map(({ image, label, title, body }) => (
          <div
            key={label}
            className={cx(
              layoutStyles.card,
              styles.card,
              'flex flex-col bg-shift-100 gap-xlarge clip',
            )}>
            <img
              className='width-full max-width-full aspect-16-9'
              style={{ objectFit: 'cover' }}
              src={image}
              alt={label}
            />
            <div
              className={cx(
                'flex',
                'flex-col',
                'items-start',
                'padding-x-xlarge',
                'padding-top-xsmall',
                'padding-bottom-xlarge',
                'gap-small',
              )}>
              <Badge label={label} />
              <div className='flex flex-col padding-y-small gap-small'>
                <span className='text-heading-medium content-emphasis'>{title}</span>
                <span className='text-body-large content-default'>{body}</span>
              </div>
            </div>
          </div>
        ))}
      </Carousel>
    </Section>
  );
}
