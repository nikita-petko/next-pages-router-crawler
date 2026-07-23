import React from 'react';
import { clsx as cx } from '@rbx/foundation-ui';
import { Flex } from '@modules/miscellaneous/common/components';
import TopHero from './TopHero';
import Metrics from './Metrics';
import WhyJoin from './WhyJoin';
import NovelGames from './NovelGames';
import Programs from './Programs';
import BottomHero from './BottomHero';
import FAQ from './FAQ';

export default function BuildContainer() {
  return (
    <div className={cx('max-width-[1500px]', 'margin-x-auto')}>
      {/* NOTE(@zwang, 02/18/26): this is to offset the 32px padding applied by default to page
          content, this page is the first "landing" page that uses the new layout */}
      <Flex className={cx('margin-x-[-32px]')} flexDirection='column' alignItems='stretch'>
        <TopHero />
        <Metrics />
        <Programs />
        <WhyJoin />
        <NovelGames />
        <BottomHero />
        <FAQ />
      </Flex>
    </div>
  );
}
