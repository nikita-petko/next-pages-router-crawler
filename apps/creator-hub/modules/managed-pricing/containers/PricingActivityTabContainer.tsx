/* istanbul ignore file */
import { Button } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useQueryParams from '@modules/miscellaneous/hooks/useQueryParams';
import EmptyState from '@modules/miscellaneous/common/components/EmptyState/EmptyState';
import PricingEventsTable from '../pricing-activity/components/PricingEventsTable';
import MOCK_PRICING_EVENTS from '../pricing-activity/mocks';

function PricingActivityTabContainer({ universeId }: { universeId: number }) {
  const { translate } = useTranslation();

  // TODO: hook in Pricing History

  const [queryParams, setQueryParams] = useQueryParams(['empty']);
  const showEmptyState = !!queryParams.empty;

  if (showEmptyState) {
    return (
      <EmptyState
        title={translate('Heading.PriceTests')}
        description={translate('Description.PriceTestsEmptyState')}
        size='small'
        illustration='chart'>
        <Button
          variant='Emphasis'
          color='primary'
          onClick={() => setQueryParams({ empty: undefined })}>
          (Demo) Show Price Tests
        </Button>
      </EmptyState>
    );
  }

  return <PricingEventsTable universeId={universeId} events={MOCK_PRICING_EVENTS} />;
}

export default withTranslation(PricingActivityTabContainer, [
  TranslationNamespace.Table,
  TranslationNamespace.Creations,
  TranslationNamespace.ManagedPricing,
]);
