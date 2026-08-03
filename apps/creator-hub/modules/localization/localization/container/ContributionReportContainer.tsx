import { StatusCodes } from '@rbx/core';
import { withTranslation } from '@rbx/intl';
import { useAuthentication } from '@modules/authentication/providers';
import { UserRoleType } from '@modules/clients/translationRoles';
import { PageLoading } from '@modules/miscellaneous/components';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import ReportDownloader from '../../reports/components/ReportDownloader';
import ReportType from '../../reports/enums/ReportType';
import useTranslationLogic from '../../translation/hooks/useTranslationLogic';

const ContributionReportContainer = () => {
  const { canConfigure, gameDetails } = useCurrentGame();
  const { user } = useAuthentication();
  const { userRoles } = useTranslationLogic();

  if (canConfigure === false && !userRoles.includes(UserRoleType.translator)) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  return gameDetails?.id && user?.id ? (
    <section>
      <ReportDownloader
        gameId={gameDetails.id}
        reportType={ReportType.GameTranslationStatusForTranslator}
        reportTypeTargetId={user?.id}
        translatorName={user?.name}
      />
    </section>
  ) : (
    <PageLoading />
  );
};

export default withTranslation(ContributionReportContainer, [
  TranslationNamespace.GameLocalizationReports,
]);
