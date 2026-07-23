import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import CreateExperienceSubscriptionContainer from '@modules/creations/experienceSubscriptions/components/CreateExperienceSubscriptionForm/CreateExperienceSubscriptionContainer';
import getExperienceSubscriptionCreationLayout from '@modules/creations/experienceSubscriptions/utils/getExperienceSubscriptionCreationLayout';

const Create: NextLayoutPage = () => (
  <Authenticated>
    <CreateExperienceSubscriptionContainer />
  </Authenticated>
);

Create.getPageLayout = (page) => getExperienceSubscriptionCreationLayout(page);
Create.loggerConfig = { rosId: RosTeams.MonetizationProducts };

export default Create;
