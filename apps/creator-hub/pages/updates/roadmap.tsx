import type { NextLayoutPage } from 'next';
import UpdatesRoutePage, { getUpdatesLayout } from '@modules/updates/pages/UpdatesRoutePage';

const UpdatesRoadmapPage: NextLayoutPage = () => <UpdatesRoutePage />;

UpdatesRoadmapPage.loggerConfig = { rosId: RosTeams.Knowledge };
UpdatesRoadmapPage.getPageLayout = getUpdatesLayout;

export default UpdatesRoadmapPage;
