import ItemAnalyticsPageContext from '../../context/ItemAnalyticsPageContext';
import AvatarItemsPageContent from './AvatarItemsPageContent';

const AvatarItemsPageContentContainer = () => {
  return (
    <ItemAnalyticsPageContext>
      <AvatarItemsPageContent />
    </ItemAnalyticsPageContext>
  );
};

export default AvatarItemsPageContentContainer;
