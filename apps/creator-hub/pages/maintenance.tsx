import type { NextLayoutPage } from 'next';
import { MaintenancePage } from '@modules/miscellaneous/error';

const Maintenance: NextLayoutPage = () => <MaintenancePage />;

Maintenance.loggerConfig = { rosId: RosTeams.CreatorHubPlatform };
export default Maintenance;
