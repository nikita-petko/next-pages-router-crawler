import React, { FunctionComponent, useEffect, useState } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, Typography, CircularProgress } from '@rbx/ui';
import { EmptyGrid } from '@modules/miscellaneous/common';
import { GetBadgeByIdResponse } from '@modules/clients';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import BadgeOverview from './BadgeOverview';
import { BadgeDetailsContextValue } from '../providers/BadgeContext';
import useCurrentBadge from '../hooks/useCurrentBadge';
import { useOverviewStyles } from '../../common';

// TODO(@lguan-cn, 2022-03-24): JIRA-742 Configuring badge logic and component to be deleted after badge migration
const BadgeOverviewContainer: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const { translate } = useTranslation();
  const badgeDetailsContext: BadgeDetailsContextValue = useCurrentBadge();
  const {
    classes: { section },
  } = useOverviewStyles();
  const [badgeDetails, setBadgeDetails] = useState<GetBadgeByIdResponse | undefined>();

  useEffect(() => {
    setBadgeDetails(badgeDetailsContext.badgeDetails);
  }, [badgeDetailsContext]);

  return (
    <section className={section}>
      <Grid container justifyContent='space-between' alignItems='center'>
        {badgeDetails === undefined || badgeDetails === null ? (
          <EmptyGrid>
            {badgeDetails === null ? (
              <Typography color='secondary' align='center'>
                {translate('Message.UnableToLoadBadge')}
              </Typography>
            ) : (
              <CircularProgress />
            )}
          </EmptyGrid>
        ) : (
          <BadgeOverview
            badgeDetails={badgeDetails}
            isThumbnailRefreshRequired={badgeDetailsContext.isBadgeRefreshRequired}
          />
        )}
      </Grid>
    </section>
  );
};

export default withTranslation(BadgeOverviewContainer, [
  TranslationNamespace.Creations,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.ConfigureItem,
]);
