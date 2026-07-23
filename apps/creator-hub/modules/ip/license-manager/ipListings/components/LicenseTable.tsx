import React, { useCallback, useMemo, useState } from 'react';
import NextLink from 'next/link';
import {
  LicenseModerationStatus,
  LicenseVisibility,
  type LicenseResponse,
} from '@rbx/client-content-licensing-api/v1';
import { useTranslation } from '@rbx/intl';
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
} from '@rbx/ui';
import { formatRoyaltyRate } from '@modules/licenses/utils/format';
import { PageLoading } from '@modules/miscellaneous/components';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import { FrontendFlagName } from '@modules/toolboxService/toolboxFeatureManagement';
import { useToolboxServiceApiProvider } from '@modules/toolboxService/ToolboxServiceApiProvider';
import useIpSnackbar from '../../../hooks/useIpSnackbar';
import GuidelinesAndRestrictionsSummaryModal from '../../components/GuidelinesAndRestrictionsSummaryModal';
import { LICENSE_CREATE_HREF, LICENSE_EDIT_HREF } from '../../urls';
import { getDauLicenseLabelFromEnum } from '../../utils/dauEnum';
import {
  getLicenseTypeTableLabelKey,
  LICENSE_TYPE_TABLE_HEADER_KEY,
} from '../../utils/licenseTypeTableLabelKeys';
import { LicenseManagerClickEvent, useLicenseManagerLogger } from '../../utils/logger';
import { getMaturityRatingLabel } from '../../utils/maturityRating';
import { getDurationRangeLabel } from '../../utils/timeLimitedLicense';
import { useArchiveLicenseMutation, useSetLicenseVisibilityMutation } from '../hooks/ipListings';
import LicenseStatusValue from './LicenseStatusValue';

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
  ipListingId: string;
  onOpen: () => void;
  onClose: () => void;
}

/**
 * Triple-dot dropdown menu for a license table row
 */
const LicenseDropdownMenu = ({
  license,
  ipListingId,
  onOpen,
  onClose,
}: LicenseDropdownMenuProps) => {
  const { translate } = useTranslation();
  const { logEvent } = useLicenseManagerLogger();

  const archiveLicenseMutation = useArchiveLicenseMutation();
  const setLicenseVisibilityMutation = useSetLicenseVisibilityMutation();
  const { enqueueErrorSnackbar } = useIpSnackbar();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [isGuidelinesAndRestrictionsOpen, setIsGuidelinesAndRestrictionsOpen] =
    useState<boolean>(false);
  const licenseId = license.id;

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    onOpen();
  };

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
    onClose();
  }, [onClose]);

  const handleViewGuidelinesAndRestrictions = useCallback(() => {
    setIsGuidelinesAndRestrictionsOpen(true);
    handleMenuClose();
  }, [handleMenuClose]);

  const isVisibilityToggleDisabled =
    license.moderationStatus === LicenseModerationStatus.Rejected ||
    license.moderationStatus === LicenseModerationStatus.Archived;

  const handleToggleVisibility = useCallback(() => {
    if (isVisibilityToggleDisabled || !licenseId) {
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
      licenseId,
      visibility: newVisibility,
    });

    setLicenseVisibilityMutation.mutate(
      {
        licenseId,
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
    licenseId,
    license.visibility,
    logEvent,
    setLicenseVisibilityMutation,
  ]);

  // TODO: [future] waiting for PM/design to figure out how this should all work (abech)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- we'll likely add this back in
  const handleArchiveLicense = useCallback(() => {
    if (!licenseId) {
      return;
    }
    // TODO: [future] I don't see anything in the API call that indicates archived, but
    // it seems to work in that it doesn't show up on the creator side (abech)
    archiveLicenseMutation.mutate(licenseId, {
      onError: () => {
        enqueueErrorSnackbar();
      },
    });
    handleMenuClose();
  }, [archiveLicenseMutation, enqueueErrorSnackbar, handleMenuClose, licenseId]);

  const handleCopyLicenseClick = useCallback(() => {
    if (!licenseId) {
      return;
    }
    logEvent(LicenseManagerClickEvent.IphListingsDetailsPageCopyLicenseClickEvent, {
      licenseId,
      listingId: ipListingId,
    });
    handleMenuClose();
  }, [handleMenuClose, ipListingId, licenseId, logEvent]);

  return (
    <>
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
        {licenseId && (
          <MenuItem
            component={NextLink}
            href={LICENSE_CREATE_HREF(ipListingId, licenseId)}
            onClick={handleCopyLicenseClick}>
            {translate('Action.CopyLicense')}
          </MenuItem>
        )}
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
        setOpen={setIsGuidelinesAndRestrictionsOpen}
        license={license}
      />
    </>
  );
};

interface LicenseTableProps {
  licenses: LicenseResponse[];
  ipListingId: string;
}

/**
 * Table listing all the licenses (for an ip listing)
 */
const LicenseTable = ({ licenses, ipListingId }: LicenseTableProps) => {
  const { translate } = useTranslation();
  const { classes, cx } = useStyles();
  const { logEvent } = useLicenseManagerLogger();
  const [openMenuLicenseId, setOpenMenuLicenseId] = React.useState<string | undefined>();
  const { isFetched } = useSettings();
  const { frontendFlags, loadingFrontendFlags } = useToolboxServiceApiProvider();
  const enableCollaborationLicensing =
    frontendFlags[FrontendFlagName.FrontendFlagEnableCreatorCollaborationLicensing] ?? false;

  const sortedLicenses = useMemo(() => {
    return licenses.slice().sort((a, b) => {
      const dateA = new Date(a.createdAt ?? 0);
      const dateB = new Date(b.createdAt ?? 0);
      return dateB.getTime() - dateA.getTime(); // Newest first
    });
  }, [licenses]);

  if (!isFetched || loadingFrontendFlags) {
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
            {enableCollaborationLicensing && (
              <TableCell>{translate(LICENSE_TYPE_TABLE_HEADER_KEY)}</TableCell>
            )}
            <TableCell width='15%'>{translate('Label.Duration')}</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedLicenses.map((license) => {
            const licenseId = license.id;
            if (!licenseId) {
              return null;
            }

            const isEditDisabled =
              license.moderationStatus === LicenseModerationStatus.Rejected ||
              license.moderationStatus === LicenseModerationStatus.Archived;

            return (
              <TableRow
                key={licenseId}
                className={cx({
                  [classes.row]: true,
                  [classes.rowForcedHover]: openMenuLicenseId === licenseId,
                })}>
                <TableCell>{license.name}</TableCell>
                <TableCell>
                  <LicenseStatusValue
                    visibility={license.visibility}
                    moderationStatus={license.moderationStatus}
                    hasPendingEdits={license.hasPendingEdits}
                  />
                </TableCell>
                <TableCell>{formatRoyaltyRate(license.royaltyRate)}</TableCell>
                <TableCell>
                  {translate(getDauLicenseLabelFromEnum(license.dau7DayThreshold))}
                </TableCell>
                <TableCell>{translate(getMaturityRatingLabel(license.maxAgeRating))}</TableCell>
                {enableCollaborationLicensing && (
                  <TableCell>
                    {translate(getLicenseTypeTableLabelKey(license.licenseType))}
                  </TableCell>
                )}
                <TableCell width='15%'>
                  {getDurationRangeLabel(translate, license.licenseDuration)}
                </TableCell>
                <TableCell className={classes.actionCell}>
                  {!isEditDisabled && (
                    <IconButton
                      component={NextLink}
                      href={LICENSE_EDIT_HREF(licenseId)}
                      color='secondary'
                      aria-label='Edit'
                      onClick={() => {
                        logEvent(
                          LicenseManagerClickEvent.IphListingsDetailsPageViewLicenseContentStandardsClickEvent,
                          {
                            licenseId,
                          },
                        );
                      }}>
                      <EditOutlinedIcon />
                    </IconButton>
                  )}
                  <LicenseDropdownMenu
                    license={license}
                    ipListingId={ipListingId}
                    onOpen={() => setOpenMenuLicenseId(licenseId)}
                    onClose={() => setOpenMenuLicenseId(undefined)}
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
export const PreviewLicenseTable = ({ licenses }: { licenses: LicenseResponse[] }) => {
  const { translate } = useTranslation();

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
                <LicenseStatusValue
                  visibility={license.visibility}
                  moderationStatus={license.moderationStatus}
                  hasPendingEdits={license.hasPendingEdits}
                />
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
