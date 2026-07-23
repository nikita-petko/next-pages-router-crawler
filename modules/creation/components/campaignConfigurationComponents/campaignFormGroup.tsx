import { makeStyles, Typography } from '@rbx/ui';
import { ReactNode } from 'react';

import { InfoTooltip } from '@modules/management/components/infoTooltip';

export const CampaignFormGroup = ({
  children,
  headerText,
  headerTooltipText,
}: {
  children: ReactNode;
  headerText: string;
  headerTooltipText?: string;
}) => {
  const {
    classes: { configureCampaignHeader, tooltip },
  } = makeStyles()(() => ({
    configureCampaignHeader: {
      alignItems: 'center',
      columnGap: 3,
      display: 'flex',
      marginBottom: 20,
      marginTop: 20,
    },

    tooltip: {
      height: 24,
      marginLeft: 4,
      width: 24,
    },
  }))();

  return (
    <>
      <div className={configureCampaignHeader}>
        <Typography variant='h4'>{headerText}</Typography>
        {headerTooltipText ? (
          <InfoTooltip classesToAdd={{ root: tooltip }} text={headerTooltipText} />
        ) : null}
      </div>
      <div>{children}</div>
    </>
  );
};
