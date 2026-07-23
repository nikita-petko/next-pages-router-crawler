import { UserRoleType } from '@modules/clients';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { PageLoading } from '@modules/miscellaneous/common';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { StatusCodes } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Typography } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import ReportType from '../../reports/enums/ReportType';
import ReportDownloader from '../../reports/components/ReportDownloader';
import useTranslationLogic from '../../translation/hooks/useTranslationLogic';

const ContributionReportContainer = () => {
  const { canConfigure, gameDetails } = useCurrentGame();
  const { translate } = useTranslation();
  const { user } = useAuthentication();
  const { userRoles } = useTranslationLogic();
  const {
    params: { enableIAM2 },
  } = useIXPParameters(IXPLayers.CreatorHubNavigationUser);

  if (canConfigure === false && !userRoles.includes(UserRoleType.translator)) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  return gameDetails?.id && user?.id ? (
    <section>
      {!enableIAM2 && (
        <Typography variant='h1'>{translate('Heading.ContributionReports')}</Typography>
      )}
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
