import React, { useCallback, useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  EditOutlinedIcon,
  IconButton,
  makeStyles,
  Menu,
  MenuItem,
  MoreVertIcon,
  Typography,
} from '@rbx/ui';
import {
  LicenseModerationStatus,
  LicenseVisibility,
  type LicenseResponse,
} from '@rbx/clients/contentLicensingApi/v1';
import { useTranslation } from '@rbx/intl';
import NextLink from 'next/link';
import { formatRoyaltyRate } from '@modules/licenses/utils/format';
import { useSettings } from '@modules/settings';
import { PageLoading } from '@modules/miscellaneous/common';

import { useContentLicensingCustomSettings } from '../../../common/implementations/contentLicensingCustomSettings';
import { getDauLicenseLabelFromEnum } from '../../utils/dauEnum';
import { getMaturityRatingLabel } from '../../utils/maturityRating';
import { useArchiveLicenseMutation, useSetLicenseVisibilityMutation } from '../hooks/ipListings';
import LicenseStatusValue from './LicenseStatusValue';
import LicenseVisibilityValue from '../../agreements/components/LicenseVisibilityValue';
import useIpSnackbar from '../../../hooks/useIpSnackbar';
import { LICENSE_EDIT_HREF } from '../../urls';
import { LicenseManagerClickEvent, useLicenseManagerLogger } from '../../utils/logger';
import GuidelinesAndRestrictionsSummaryModal from '../../components/GuidelinesAndRestrictionsSummaryModal';
import { getDurationRangeLabel } from '../../utils/timeLimitedLicense';

const useStyles = makeStyles<void, 'actionCell' | 'rowForcedHover'>()((theme, _, classes) => ({
  buttonText: {
    whiteSpace: 'nowrap',
  },
  row: {
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: theme.palette.states.hover,
    },
    // we hide the action button on devices that supports hover
    // AND if the row is not forced to be hovered
    // otherwise the button is always visible
    '@media (hover: hover)': {
      [`&:not(:hover):not(.${classes.rowForcedHover}) .${classes.actionCell}`]: {
        opacity: 0,
      },
    },
  },
  rowForcedHover: {
    backgroundColor: theme.palette.states.hover,
  },
  actionCell: {
    transition: 'opacity 0.2s',
    whiteSpace: 'nowrap',
  },
}));

interface LicenseDropdownMenuProps {
  license: LicenseResponse;
  onOpen: () => void;
  onClose: () => void;
  showModerationUI: boolean;
}

/**
 * Triple-dot dropdown menu for a license table row
 */
const LicenseDropdownMenu = ({
  license,
  onOpen,
  onClose,
  showModerationUI,
}: LicenseDropdownMenuProps) => {
  const { translate } = useTranslation();
  const { logEvent } = useLicenseManagerLogger();

  const archiveLicenseMutation = useArchiveLicenseMutation();
  const setLicenseVisibilityMutation = useSetLicenseVisibilityMutation();
  const { enqueueErrorSnackbar } = useIpSnackbar();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [isGuidelinesAndRestrictionsOpen, setIsGuidelinesAndRestrictionsOpen] =
    useState<boolean>(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    onOpen();
  };

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
    onClose();
  }, [onClose]);

  const handleViewGuidelinesAndRestrictions = useCallback(() => {
    setIsGuidelinesAndRestrictionsOpen(!isGuidelinesAndRestrictionsOpen);
  }, [isGuidelinesAndRestrictionsOpen]);

  const isVisibilityToggleDisabled =
    showModerationUI &&
    (license.moderationStatus === LicenseModerationStatus.Rejected ||
      license.moderationStatus === LicenseModerationStatus.Archived);

  const handleToggleVisibility = useCallback(() => {
    if (isVisibilityToggleDisabled) {
      return;
    }

    // Block private licenses that do not have their scope of license field filled out from going public.
    if (
      license.visibility === LicenseVisibility.Private &&
      (!license.contentStandardsScope || license.contentStandardsScope.trim().length === 0)
    ) {
      enqueueErrorSnackbar('Error.FailedToToggleLicenseVisibility');
      return;
    }

    const newVisibility =
      license.visibility === LicenseVisibility.Public
        ? LicenseVisibility.Private
        : LicenseVisibility.Public;

    logEvent(LicenseManagerClickEvent.IphListingsDetailsPageToggleLicenseVisibilityClickEvent, {
      licenseId: license.id!,
      visibility: newVisibility,
    });

    setLicenseVisibilityMutation.mutate(
      {
        licenseId: license.id!,
        visibility: newVisibility,
      },
      {
        onError: () => {
          enqueueErrorSnackbar();
        },
      },
    );
    handleMenuClose();
  }, [
    enqueueErrorSnackbar,
    handleMenuClose,
    isVisibilityToggleDisabled,
    license.contentStandardsScope,
    license.id,
    license.visibility,
    logEvent,
    setLicenseVisibilityMutation,
  ]);

  // TODO: [future] waiting for PM/design to figure out how this should all work (abech)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- we'll likely add this back in
  const handleArchiveLicense = useCallback(() => {
    // TODO: [future] I don't see anything in the API call that indicates archived, but
    // it seems to work in that it doesn't show up on the creator side (abech)
    archiveLicenseMutation.mutate(license.id!, {
      onError: () => {
        enqueueErrorSnackbar();
      },
    });
    handleMenuClose();
  }, [archiveLicenseMutation, enqueueErrorSnackbar, handleMenuClose, license.id]);

  return (
    <React.Fragment>
      <IconButton
        size='small'
        onClick={handleMenuOpen}
        aria-label={translate('Action.MoreOptions')}
        color='secondary'>
        <MoreVertIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <MenuItem onClick={handleViewGuidelinesAndRestrictions}>
          {translate('Action.ViewGuidelinesAndRestrictions')}
        </MenuItem>
        {!isVisibilityToggleDisabled && (
          <MenuItem onClick={handleToggleVisibility}>
            {license.visibility === LicenseVisibility.Public
              ? translate('Action.MakePrivate')
              : translate('Action.MakePublic')}
          </MenuItem>
        )}
        {/* TODO: [future] see handleArchiveLicense for comment */}
        {/* <MenuItem onClick={handleArchiveLicense}>{translate('Action.Archive')}</MenuItem> */}
      </Menu>
      <GuidelinesAndRestrictionsSummaryModal
        isOpen={isGuidelinesAndRestrictionsOpen}
        setOpen={handleViewGuidelinesAndRestrictions}
        license={license}
      />
    </React.Fragment>
  );
};

interface Props {
  licenses: LicenseResponse[];
}

/**
 * Table listing all the licenses (for an ip listing)
 */
const LicenseTable = ({ licenses }: Props) => {
  const { translate } = useTranslation();
  const { classes, cx } = useStyles();
  const { logEvent } = useLicenseManagerLogger();
  const [openMenuLicenseId, setOpenMenuLicenseId] = React.useState<string | undefined>();
  const { enableLicenseModeration } = useContentLicensingCustomSettings();
  const { settings, isFetched } = useSettings();
  const { enableIpPlatformTimeboundLicenses } = settings;

  const showModerationUI = enableLicenseModeration;

  const sortedLicenses = useMemo(() => {
    return licenses.slice().sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB.getTime() - dateA.getTime(); // Newest first
    });
  }, [licenses]);

  if (!isFetched) {
    return <PageLoading />;
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{translate('Heading.Name')}</TableCell>
            <TableCell>{translate('Heading.Status')}</TableCell>
            <TableCell>{translate('Label.RevenueShare')}</TableCell>
            <TableCell>{translate('Label.MinimumAverageL7DAU')}</TableCell>
            <TableCell>{translate('Label.MaxMaturityRating')}</TableCell>
            {enableIpPlatformTimeboundLicenses && (
              <TableCell width='15%'>{translate('Label.Duration')}</TableCell>
            )}
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedLicenses.map((license) => {
            const isEditDisabled =
              showModerationUI &&
              (license.moderationStatus === LicenseModerationStatus.Rejected ||
                license.moderationStatus === LicenseModerationStatus.Archived);

            return (
              <TableRow
                key={license.id}
                className={cx({
                  [classes.row]: true,
                  [classes.rowForcedHover]: openMenuLicenseId === license.id,
                })}>
                <TableCell>{license.name}</TableCell>
                <TableCell>
                  {showModerationUI ? (
                    <LicenseStatusValue
                      visibility={license.visibility}
                      moderationStatus={license.moderationStatus}
                      hasPendingEdits={license.hasPendingEdits}
                    />
                  ) : (
                    <Typography
                      variant='body2'
                      color={
                        license.visibility === LicenseVisibility.Public ? 'success' : undefined
                      }>
                      <LicenseVisibilityValue visibility={license.visibility} />
                    </Typography>
                  )}
                </TableCell>
                <TableCell>{formatRoyaltyRate(license.royaltyRate)}</TableCell>
                <TableCell>
                  {translate(getDauLicenseLabelFromEnum(license.dau7DayThreshold))}
                </TableCell>
                <TableCell>{translate(getMaturityRatingLabel(license.maxAgeRating))}</TableCell>
                {enableIpPlatformTimeboundLicenses && (
                  <TableCell width='15%'>
                    {getDurationRangeLabel(translate, license.licenseDuration)}
                  </TableCell>
                )}
                <TableCell className={classes.actionCell}>
                  {!isEditDisabled && (
                    <IconButton
                      component={NextLink}
                      href={LICENSE_EDIT_HREF(license.id!)}
                      color='secondary'
                      aria-label='Edit'
                      onClick={() => {
                        logEvent(
                          LicenseManagerClickEvent.IphListingsDetailsPageViewLicenseContentStandardsClickEvent,
                          {
                            licenseId: license.id!,
                          },
                        );
                      }}>
                      <EditOutlinedIcon />
                    </IconButton>
                  )}
                  <LicenseDropdownMenu
                    license={license}
                    onOpen={() => setOpenMenuLicenseId(license.id!)}
                    onClose={() => setOpenMenuLicenseId(undefined)}
                    showModerationUI={showModerationUI}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

/**
 * Simplified license table for previewing licenses in the creation flow
 */
export const PreviewLicenseTable = ({ licenses }: Props) => {
  const { translate } = useTranslation();
  const { enableLicenseModeration } = useContentLicensingCustomSettings();
  const showModerationUI = enableLicenseModeration;

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{translate('Heading.Name')}</TableCell>
            <TableCell>{translate('Heading.Status')}</TableCell>
            <TableCell>{translate('Heading.RevenueShare')}</TableCell>
            <TableCell>{translate('Heading.MinimumDAU')}</TableCell>
            <TableCell>{translate('Heading.MaxMaturityRating')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {licenses.map((license) => (
            <TableRow key={license.id}>
              <TableCell>{license.name}</TableCell>
              <TableCell>
                {showModerationUI ? (
                  <LicenseStatusValue
                    visibility={license.visibility}
                    moderationStatus={license.moderationStatus}
                    hasPendingEdits={license.hasPendingEdits}
                  />
                ) : (
                  <Typography
                    variant='body2'
                    color={license.visibility === LicenseVisibility.Public ? 'success' : undefined}>
                    <LicenseVisibilityValue visibility={license.visibility} />
                  </Typography>
                )}
              </TableCell>
              <TableCell>{formatRoyaltyRate(license.royaltyRate)}</TableCell>
              <TableCell>
                {translate(getDauLicenseLabelFromEnum(license.dau7DayThreshold))}
              </TableCell>
              <TableCell>{translate(getMaturityRatingLabel(license.maxAgeRating))}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default LicenseTable;
