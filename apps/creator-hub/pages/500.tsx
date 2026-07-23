import type { NextLayoutPage } from 'next';
import { MaintenancePage } from '@modules/miscellaneous/error';

const Error500Page: NextLayoutPage = () => <MaintenancePage />;

Error500Page.loggerConfig = { rosId: RosTeams.CreatorHubPlatform };
export default Error500Page;
