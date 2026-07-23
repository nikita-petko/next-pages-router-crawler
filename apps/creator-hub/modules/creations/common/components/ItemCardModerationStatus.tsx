import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import { InfoOutlinedIcon, Typography, Skeleton, makeStyles } from '@rbx/ui';
import { BundleModerationStatus } from '@modules/clients/itemconfiguration';
import { IconButtonWithTooltip } from '@modules/miscellaneous/components';

export interface ItemCardModerationStatusProps {
  bundleModerationStatus: BundleModerationStatus | undefined;
  isLoading: boolean;
}

const useTooltipStyles = makeStyles()(() => ({
  infoTooltip: {
    marginTop: -6,
  },
}));

const ItemCardModerationStatus: FunctionComponent<
  React.PropsWithChildren<ItemCardModerationStatusProps>
> = ({ bundleModerationStatus, isLoading }) => {
  const { translate } = useTranslation();
  const {
    classes: { infoTooltip },
  } = useTooltipStyles();

  if (isLoading) {
    return (
      <Typography variant='body2' color='secondary' noWrap>
        <Skeleton width='88%' />
      </Typography>
    );
  }
  switch (bundleModerationStatus) {
    case BundleModerationStatus.NUMBER_1: {
      return (
        <Typography variant='body2' color='secondary' noWrap>
          {translate('Label.InReview')}
        </Typography>
      );
    }
    case BundleModerationStatus.NUMBER_2: {
      return (
        <Typography variant='body2' color='error' noWrap>
          {translate('Label.Rejected')}
        </Typography>
      );
    }
    case BundleModerationStatus.NUMBER_4: {
      return (
        <Typography variant='body2' color='error' noWrap>
          {translate('Label.SubmissionError')}
          <IconButtonWithTooltip
            className={infoTooltip}
            icon={<InfoOutlinedIcon />}
            tooltipMsg={translate('Tooltip.ResubmitBundle')}
          />
        </Typography>
      );
    }
    default: {
      return null;
    }
  }
};

export default ItemCardModerationStatus;
