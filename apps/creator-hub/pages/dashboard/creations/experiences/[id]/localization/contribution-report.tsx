import { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
// eslint-disable-next-line no-restricted-imports -- deep import; localization root barrel removed
import ContributionReportContainer from '@modules/localization/localization/container/ContributionReportContainer';
// eslint-disable-next-line no-restricted-imports -- deep import; localization root barrel removed
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
  getTranslationPersistentLayout(page, { title: 'Heading.ContributionReports' });

export default ContributionReport;
