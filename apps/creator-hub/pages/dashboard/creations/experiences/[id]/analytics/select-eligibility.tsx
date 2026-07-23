import { useMemo, type FC } from 'react';
import type { NextLayoutPage } from 'next';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { StatusCodes } from '@rbx/core';
import { getCreationsPageLayout, SelectEligibilityPage } from '@modules/creations';
import { useSettings } from '@modules/settings';
import { ErrorPage, PageNotFound } from '@modules/miscellaneous/error';
import PageLoading from '@modules/miscellaneous/common/components/PageLoading';
import coreContentClient from '@modules/clients/coreContent';
import { useTranslation } from '@rbx/intl';
import { Grid, Typography } from '@rbx/ui';

const SelectEligibilityTitle: FC = () => {
  const { settings } = useSettings();
  const { translate } = useTranslation();

  if (!settings.enableCoreContentStatusLabelLink) return null;

  return (
    <Grid display='flex' direction='column' gap='4px'>
      <Typography variant='h1'>{translate('Title.SelectEligibility')}</Typography>
      <Typography>{translate('Description.SelectEligibilitySubtitle')}</Typography>
    </Grid>
  );
};

const SelectPage: NextLayoutPage = () => {
  const { settings, isFetched } = useSettings();
  const router = useRouter();
  const universeId = router.query.id as string;

  const {
    data: eligibilityData,
    isFetched: isEligibilityFetched,
    isError,
  } = useQuery({
    queryKey: ['coreContentBatchGetUniversePublishEligibility', universeId],
    queryFn: () =>
      coreContentClient.coreContentBatchGetUniversePublishEligibility({
        coreContentBatchGetUniversePublishEligibilityRequest: {
          universeIds: [parseInt(universeId, 10)],
        },
      }),
    enabled: !!universeId,
  });
  const canGetSelectEligibilityData = useMemo(() => {
    if (!(eligibilityData && universeId)) {
      return false;
    }
    return (
      eligibilityData.universeEligibilities[universeId]?.indicator !== null &&
      eligibilityData.universeEligibilities[universeId]?.indicator !== undefined
    );
  }, [eligibilityData, universeId]);

  if (!isFetched || !isEligibilityFetched) {
    return <PageLoading />;
  }

  if (!settings.enableCoreContentStatusLabelLink) {
    return <PageNotFound />;
  }

  if (isError || !canGetSelectEligibilityData) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  return <SelectEligibilityPage />;
};

SelectPage.getPageLayout = (page) =>
  getCreationsPageLayout(page, { title: <SelectEligibilityTitle /> });

export default SelectPage;
