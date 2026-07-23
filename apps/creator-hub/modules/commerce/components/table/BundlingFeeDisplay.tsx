import React, { useState } from 'react';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  CommerceProductBundlingFeeModel,
  CommerceProductBundlingFeeStatus,
} from '@rbx/clients/commerceApi';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Grid,
  Tooltip,
  MoreVertIcon,
  InfoOutlinedIcon,
} from '@rbx/ui';
import { CommerceTranslationKeys } from '../../constants';
import useFormatters from '../../hooks/useFormatters';

interface BundlingFeeDisplay {
  bundlingFee: CommerceProductBundlingFeeModel | null | undefined;
  onAcceptBundlingFee: () => void;
}

const BundlingFeeDisplay: React.FC<BundlingFeeDisplay> = ({ bundlingFee, onAcceptBundlingFee }) => {
  const { translate } = useTranslation();
  const { formatPercentage } = useFormatters();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  if (
    bundlingFee === null ||
    bundlingFee === undefined ||
    bundlingFee?.bundlingFeeAmount === null ||
    bundlingFee?.bundlingFeeAmount === undefined
  ) {
    return null;
  }

  // In Review
  if (bundlingFee?.status === CommerceProductBundlingFeeStatus.NUMBER_2) {
    return (
      <Grid container alignItems='center' gap={1}>
        <Typography>{translate(CommerceTranslationKeys.InReview)}</Typography>
        {bundlingFee.note && (
          <Tooltip title={bundlingFee.note}>
            <InfoOutlinedIcon fontSize='small' color='action' />
          </Tooltip>
        )}
      </Grid>
    );
  }

  // Accepted
  if (bundlingFee?.status === CommerceProductBundlingFeeStatus.NUMBER_3) {
    return <Typography>{formatPercentage(bundlingFee.bundlingFeeAmount)}</Typography>;
  }

  // Pending Acceptance
  if (bundlingFee?.status === CommerceProductBundlingFeeStatus.NUMBER_1) {
    return (
      <Grid container alignItems='center' justifyContent='flex-end' gap={1}>
        <Typography>{formatPercentage(bundlingFee.bundlingFeeAmount)}</Typography>
        {bundlingFee.note && (
          <Tooltip title={bundlingFee.note}>
            <InfoOutlinedIcon fontSize='small' color='action' />
          </Tooltip>
        )}
        <IconButton
          size='small'
          color='secondary'
          onClick={(e) => setAnchorEl(e.currentTarget)}
          aria-label={translate('Action.More')}>
          <MoreVertIcon />
        </IconButton>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
          <MenuItem
            onClick={() => {
              onAcceptBundlingFee();
              setAnchorEl(null);
            }}>
            {translate('Action.Accept')}
          </MenuItem>
        </Menu>
      </Grid>
    );
  }

  return null;
};

export default withTranslation(BundlingFeeDisplay, [TranslationNamespace.Commerce]);
