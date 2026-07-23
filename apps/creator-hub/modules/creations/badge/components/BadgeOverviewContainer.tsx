import type { FunctionComponent } from 'react';
import React, { useEffect, useState } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, Typography, CircularProgress } from '@rbx/ui';
import type { GetBadgeByIdResponse } from '@modules/clients/badges';
import { EmptyGrid } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useOverviewStyles from '../../common/components/Overview.styles';
import useCurrentBadge from '../hooks/useCurrentBadge';
import type { BadgeDetailsContextValue } from '../providers/BadgeContext';
import BadgeOverview from './BadgeOverview';

// TODO(@lguan-cn, 2022-03-24): JIRA-742 Configuring badge logic and component to be deleted after badge migration
const BadgeOverviewContainer: FunctionComponent<React.PropsWithChildren> = () => {
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
