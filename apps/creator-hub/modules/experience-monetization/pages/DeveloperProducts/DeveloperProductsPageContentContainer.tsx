import ItemAnalyticsPageContext from '../../context/ItemAnalyticsPageContext';
import DeveloperProductsPageContent from './DeveloperProductsPageContent';

const DeveloperProductsPageContentContainer = ({ universeId }: { universeId: number }) => {
  return (
    <ItemAnalyticsPageContext>
      <DeveloperProductsPageContent universeId={universeId} />
    </ItemAnalyticsPageContext>
  );
};

export default DeveloperProductsPageContentContainer;
