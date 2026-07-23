import type { NextLayoutPage } from 'next';
import UpdatesRoutePage, { getUpdatesLayout } from '@modules/updates/pages/UpdatesRoutePage';

const UpdatesPage: NextLayoutPage = () => <UpdatesRoutePage />;

UpdatesPage.loggerConfig = { rosId: RosTeams.Knowledge };
UpdatesPage.getPageLayout = getUpdatesLayout;

export default UpdatesPage;
