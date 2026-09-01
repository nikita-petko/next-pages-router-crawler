import { UniverseAnalyticsTabLayoutProviders } from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsTabLayout';
import ItemMonetizationClientProvider from '@modules/experience-monetization/context/ItemMonetizationClientProvider';
import GlobalIconToggle from '../components/GlobalIconToggle';
import ShopsAnalyticsContainer from './ShopsAnalyticsContainer';

function OverviewTabContainer({ universeId }: { universeId: number }) {
  return (
    <div className='flex flex-col gap-large'>
      <GlobalIconToggle universeId={universeId} />

      <UniverseAnalyticsTabLayoutProviders>
        <ItemMonetizationClientProvider>
          <ShopsAnalyticsContainer universeId={universeId} />
        </ItemMonetizationClientProvider>
      </UniverseAnalyticsTabLayoutProviders>
    </div>
  );
}

export default OverviewTabContainer;
