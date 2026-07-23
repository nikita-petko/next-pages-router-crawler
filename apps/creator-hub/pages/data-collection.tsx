import type { NextLayoutPage } from 'next';
import LandingContainer from '@modules/data-collection/components/LandingContainer';

const DataCollectionPage: NextLayoutPage = () => <LandingContainer />;

DataCollectionPage.loggerConfig = { rosId: RosTeams.CreatorIdentity };
export default DataCollectionPage;
