import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';
import ExperienceQuestionnaireMetadataContainer from '@modules/experience-questionnaire/containers/ExperienceQuestionnaireMetadataContainer';

const ExperienceQuestionnaire: NextLayoutPage = () => {
  return (
    <Authenticated>
      <ExperienceQuestionnaireMetadataContainer />
    </Authenticated>
  );
};

ExperienceQuestionnaire.getPageLayout = (page) => getCreationsPageLayout(page);
ExperienceQuestionnaire.loggerConfig = { rosId: RosTeams.ContentSuitability };

export default ExperienceQuestionnaire;
