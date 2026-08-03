import type { NextLayoutPage } from 'next';
import { useFlag } from '@rbx/flags';
import { isAssetDependenciesViewerEnabled } from '@generated/flags/contentAccessAndInventory';
import Authenticated from '@modules/authentication/Authenticated';
import getDeveloperItemPageLayout from '@modules/creations/developerItem/common/getDeveloperItemPageLayout';
import DependenciesContainer from '@modules/creations/developerItem/dependencies/DependenciesContainer';
import { PageLoading } from '@modules/miscellaneous/components';
import { ErrorPage } from '@modules/miscellaneous/error';

const Dependencies: NextLayoutPage = () => {
  const { ready, value: isEnabled } = useFlag(isAssetDependenciesViewerEnabled);

  if (!ready) {
    return <PageLoading />;
  }

  if (!isEnabled) {
    return <ErrorPage errorCode={404} />;
  }

  return (
    <Authenticated>
      <DependenciesContainer />
    </Authenticated>
  );
};

Dependencies.getPageLayout = (page) =>
  getDeveloperItemPageLayout(page, {
    title: 'Heading.Dependencies',
  });
Dependencies.loggerConfig = { rosId: RosTeams.CreatorMarketplace };

export default Dependencies;
