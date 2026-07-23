import type { FunctionComponent } from 'react';
import React from 'react';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, Link, Typography } from '@rbx/ui';
import { PageLoading } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const RightsManagerU13: FunctionComponent<React.PropsWithChildren> = () => {
  const { ready, translate, translateHTML } = useTranslation();

  if (!ready) {
    return <PageLoading />;
  }

  return (
    <Grid container direction='column' height='100%'>
      <Grid item paddingBottom={3}>
        <Typography variant='h1'>{translate('Heading.RightsManager')}</Typography>
      </Grid>
      <Grid
        item
        container
        direction='column'
        justifyContent='center'
        alignItems='center'
        flexGrow={1}
        spacing={3}>
        <Grid item>
          <Typography variant='h4'>{translate('Label.U13HaveYourParentsReachOut')}</Typography>
        </Grid>
        <Grid item container width='60vh' spacing={2}>
          <Grid item textAlign='center'>
            <Typography variant='body1'>
              {translate('Description.U13AboutRightsManager')}
            </Typography>
          </Grid>
          <Grid item textAlign='center'>
            <Typography variant='body1'>
              {translateHTML('Description.U13InvoleYourParent', [
                {
                  opening: 'linkStart',
                  closing: 'linkEnd',
                  content(chunks) {
                    return (
                      <Link
                        href={`${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/production/publishing/dmca-guidelines`}
                        noWrap>
                        {chunks}
                      </Link>
                    );
                  },
                },
              ])}
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default withTranslation(RightsManagerU13, [TranslationNamespace.RightsPortal]);
