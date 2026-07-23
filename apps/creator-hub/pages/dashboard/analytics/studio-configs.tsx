import type { NextLayoutPage } from 'next';
import CreatorConfigsStudioUnsavedPageContainer from '@modules/remote-configs/studio/CreatorConfigsStudioUnsavedPageContainer';

/**
 * See also <StudioConfigsPage> = <CreatorConfigsStudioPageContainer />.
 */
const StudioConfigsUnsavedPage: NextLayoutPage = () => {
  return <CreatorConfigsStudioUnsavedPageContainer />;
};

/**
 * CAUTION: Do not use any standard getPageLayout's --
 * This page needs to not have any navigation or layout components.
 * It is used in a webview widget in Roblox Studio.
 */
StudioConfigsUnsavedPage.getPageLayout = (page) => page;
StudioConfigsUnsavedPage.loggerConfig = { rosId: RosTeams.Analytics };

export default StudioConfigsUnsavedPage;
