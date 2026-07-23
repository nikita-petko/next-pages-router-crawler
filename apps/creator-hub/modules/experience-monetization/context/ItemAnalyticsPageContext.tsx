import ItemMonetizationClientProvider from './ItemMonetizationClientProvider';

const ItemAnalyticsPageContext = ({ children }: React.PropsWithChildren) => {
  return <ItemMonetizationClientProvider>{children}</ItemMonetizationClientProvider>;
};

export default ItemAnalyticsPageContext;
