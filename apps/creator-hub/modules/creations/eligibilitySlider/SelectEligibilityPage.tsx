import { FC, useMemo } from 'react';
import { Grid, Typography, Skeleton, Card, CardContent } from '@rbx/ui';
import { useQuery } from '@tanstack/react-query';
import coreContentClient from '@modules/clients/coreContent';
import { SelectStatusEnum } from '@rbx/clients/coreContentApi';
import router from 'next/router';
import { useTranslation } from '@rbx/intl';
import EligibilitySlider from './EligibilitySlider';

const SelectEligibilityPage: FC = () => {
  const { translate } = useTranslation();

  const universeId = router.query.id as string;
  const { data, isLoading, isError } = useQuery({
    queryKey: ['coreContentBatchGetUniversePublishEligibility', universeId],
    queryFn: () =>
      coreContentClient.coreContentBatchGetUniversePublishEligibility({
        coreContentBatchGetUniversePublishEligibilityRequest: {
          universeIds: [parseInt(universeId, 10)],
        },
      }),
  });

  const selectStatus = useMemo(() => {
    if (!data) {
      return SelectStatusEnum.NotApplicable;
    }
    return data.universeEligibilities[universeId].selectStatus;
  }, [data, universeId]);

  const sliderValue = useMemo(() => {
    if (!data) {
      return 0;
    }
    if (selectStatus === SelectStatusEnum.Eligible) {
      return 1;
    }
    return data.universeEligibilities[universeId].indicator;
  }, [data, selectStatus, universeId]);

  if (isLoading) {
    return <Skeleton animate width='100%' height='60px' />;
  }

  // The code for the page itself will show the error state for these two scenarios, so we don't
  // need to handle it here
  if (isError || !data) {
    return undefined;
  }

  return (
    <Grid display='flex' direction='column' gap='32px'>
      <Card>
        <CardContent>
          <Grid display='flex' direction='column' padding='12px 24px 0px 24px' gap='32px'>
            <Typography variant='h6'>
              {selectStatus === SelectStatusEnum.Eligible
                ? translate('Heading.EligibleForSelect')
                : translate('Heading.NotEligibleForSelect')}
            </Typography>
            <EligibilitySlider value={sliderValue ?? 0} selectStatus={selectStatus} />
          </Grid>
        </CardContent>
      </Card>
      <Grid display='flex' direction='column' gap='4px' maxWidth='550px'>
        <Typography variant='h1'>
          {selectStatus === SelectStatusEnum.Eligible
            ? translate('Heading.YoureEligible')
            : translate('Heading.HowToReachEligibility')}
        </Typography>
        <Typography>
          {selectStatus === SelectStatusEnum.Eligible
            ? translate('Description.EligibleForSelect')
            : translate('Description.NotEligibleForSelect')}
        </Typography>
      </Grid>
    </Grid>
  );
};

export default SelectEligibilityPage;
