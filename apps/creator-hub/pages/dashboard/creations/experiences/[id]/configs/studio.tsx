import React from 'react';
import type { NextLayoutPage } from 'next';
import CreatorConfigsStudioPageContainer from '@modules/remote-configs/studio/CreatorConfigsStudioPageContainer';

const StudioConfigsPage: NextLayoutPage = () => {
  return <CreatorConfigsStudioPageContainer />;
};

/**
 * CAUTION: Do not use any standard getPageLayout's --
 * This page needs to not have any navigation or layout components.
 * It is used in a webview widget in Roblox Studio.
 */
StudioConfigsPage.getPageLayout = (page) => page;

export default StudioConfigsPage;
