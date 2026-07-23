import type { NextLayoutPage } from 'next';
import ExperienceQuestionnaireMetadataContainer from '@modules/experience-questionnaire/containers/ExperienceQuestionnaireMetadataContainer';
import Authenticated from '@modules/authentication/Authenticated';
import { getCreationsPageLayout } from '@modules/creations';
import QuestionnaireTitleV2 from '@modules/questionnaire/containers/v2/QuestionnaireTitleV2';

const ExperienceQuestionnaire: NextLayoutPage = () => {
  return (
    <Authenticated>
      <ExperienceQuestionnaireMetadataContainer />
    </Authenticated>
  );
};

ExperienceQuestionnaire.getPageLayout = (page) =>
  getCreationsPageLayout(page, { title: <QuestionnaireTitleV2 /> });

export default ExperienceQuestionnaire;
