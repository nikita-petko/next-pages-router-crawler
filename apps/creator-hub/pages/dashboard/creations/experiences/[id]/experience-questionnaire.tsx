import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';
import ExperienceQuestionnaireContainer from '@modules/experience-questionnaire/containers/ExperienceQuestionnaireContainer';

const ExperienceQuestionnaire: NextLayoutPage = () => {
  return (
    <Authenticated>
      <ExperienceQuestionnaireContainer />
    </Authenticated>
  );
};

ExperienceQuestionnaire.getPageLayout = (page) => getCreationsPageLayout(page);
ExperienceQuestionnaire.loggerConfig = { rosId: RosTeams.ContentSuitability };

export default ExperienceQuestionnaire;
