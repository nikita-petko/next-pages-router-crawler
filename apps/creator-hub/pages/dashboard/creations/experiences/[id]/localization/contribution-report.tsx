import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import ContributionReportContainer from '@modules/localization/localization/container/ContributionReportContainer';
import getTranslationPersistentLayout from '@modules/localization/translation/utils/getTranslationPersistentLayout';
import GameProvider from '@modules/providers/game/GameProvider';

const ContributionReport: NextLayoutPage = () => {
  return (
    <Authenticated>
      <GameProvider>
        <ContributionReportContainer />
      </GameProvider>
    </Authenticated>
  );
};

ContributionReport.getPageLayout = (page) =>
  getTranslationPersistentLayout(page, {
    title: (
      <Translate
        namespace='CreatorDashboard.Navigation'
        translationKey='Heading.ContributionReports'
      />
    ),
  });
ContributionReport.loggerConfig = { rosId: RosTeams.Localization };

export default ContributionReport;
