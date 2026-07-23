import Authenticated from '@modules/authentication/Authenticated';
import { NextLayoutPage } from 'next';
import { getCreationsPageLayout } from '@modules/creations';
import ServerDetailsHeader from '@modules/server-management/components/ServerDetailsPage/ServerDetailsHeader';
import ServerDetailsPageContainer from '@modules/server-management/pages/ServerDetailsPageContainer';
import ServerTypeProvider from '@modules/server-management/providers/ServerTypeProvider';

const ServerDetails: NextLayoutPage = () => {
  return (
    <Authenticated>
      <ServerDetailsPageContainer />
    </Authenticated>
  );
};

ServerDetails.getPageLayout = (page) => (
  <ServerTypeProvider>
    {getCreationsPageLayout(page, {
      title: <ServerDetailsHeader />,
    })}
  </ServerTypeProvider>
);

export default ServerDetails;
