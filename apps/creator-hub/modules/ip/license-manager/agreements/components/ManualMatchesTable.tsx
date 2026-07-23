import type { ReactElement } from 'react';
import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { RequestedScanCandidateResponse } from '@rbx/client-content-licensing-api/v1';
import { AgreementCandidateStatus } from '@rbx/client-content-licensing-api/v1';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogTitle } from '@rbx/foundation-ui';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { Thumbnail2d, ThumbnailTypes, AssetThumbnailSize } from '@rbx/thumbnails';
import {
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography,
  Button,
  makeStyles,
  Skeleton,
  CircularProgress,
  Tooltip,
  AccessTimeIcon,
  InfoOutlinedIcon,
  CheckCircleOutlineIcon,
  IconButton,
  MoreVertIcon,
  Menu,
  MenuItem,
} from '@rbx/ui';
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';
import EmptyStateBorder from '@modules/miscellaneous/components/EmptyState/EmptyStateBorder';
import { formatDate } from '@modules/miscellaneous/utils/dateUtils';
import CellError from '../../../components/error/CellError';
import IpLoadError from '../../../components/error/IpLoadError';
import type { variants } from '../../../components/StatusLabel';
import StatusLabel from '../../../components/StatusLabel';
import { useIpFamilyQuery } from '../../../ipFamilies/hooks/ipFamily';
import { IP_FAMILIES_HREF } from '../../../ipFamilies/urls';
import { IPH_AGREEMENT_DETAILS_HREF } from '../../urls';
import {
  LicenseManagerClickEvent,
  LicenseManagerImpressionEvent,
  useLicenseManagerLogger,
  useLicenseManagerLoggerLogOnce,
} from '../../utils/logger';
import useDebouncedContentMaturity, {
  NO_CONTENT_MATURITY_FOUND_FOR_ID,
} from '../hooks/experienceGuidelines';
import { NO_GAME_FOUND_FOR_ID, useDebouncedGameDetails } from '../hooks/games';
import { useManualMatchesQuery } from '../hooks/useManualMatchesQuery';

const useStyles = makeStyles()((theme) => ({
  experienceColumn: {
    minWidth: 184,
    '@media (max-width: 800px)': {
      minWidth: 125,
    },
  },
  experienceCell: {
    display: 'flex',
    gap: theme.spacing(1),
    alignItems: 'center',
    '@media (max-width: 800px)': {
      flexDirection: 'column',
      alignItems: 'flex-start',
    },
  },
  thumbnailContainer: {
    width: 42,
    height: 42,
    flexShrink: 0,
    display: 'block',
    padding: 0,
  },
  authorName: {
    marginTop: theme.spacing(0.5),
  },
  loadMoreContainer: {
    textAlign: 'center',
    padding: theme.spacing(2),
  },
  buttonContainer: {
    display: 'flex',
    gap: theme.spacing(1),
  },
  actionCell: {
    transition: 'opacity 0.2s',
    whiteSpace: 'nowrap',
  },
}));

interface MatchNotApprovedModalProps {
  gameName: string;
  ipFamilyName: string;
  dialogOpen: boolean;
  onDialogClose: () => void;
}

const MatchNotApprovedModal = ({
  gameName,
  ipFamilyName,
  dialogOpen,
  onDialogClose,
}: MatchNotApprovedModalProps) => {
  const { translate } = useTranslation();

  const handleDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        onDialogClose();
      }
    },
    [onDialogClose],
  );

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={handleDialogOpenChange}
      size='Medium'
      isModal
      hasCloseAffordance={false}>
      <DialogContent>
        <DialogBody className='flex flex-col gap-y-xsmall'>
          <DialogTitle className='text-heading-small margin-y-none padding-bottom-xsmall'>
            {translate('Heading.MatchNotApproved')}
          </DialogTitle>
          <span className='text-body-medium content-default margin-none padding-bottom-xsmall'>
            {translate('Description.MatchNotApproved')}
          </span>
          <span className='text-label-large content-emphasis padding-bottom-xsmall'>
            {translate('Label.Experience')}
          </span>
          <span className='text-body-medium content-default margin-none padding-bottom-xsmall'>
            {gameName}
          </span>
          <span className='text-label-large content-emphasis padding-bottom-xsmall'>
            {translate('Label.IpFamily')}
          </span>
          <span className='text-body-medium content-default margin-none'>{ipFamilyName}</span>
        </DialogBody>
        <DialogFooter>
          <Button color='secondary' variant='contained' onClick={onDialogClose} fullWidth>
            {translate('Label.OK')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface OverflowMenuProps {
  requestedMatch: RequestedScanCandidateResponse;
  gameName: string;
  ipFamilyName: string;
}

/**
 * Triple-dot overflow menu for a manual scan candidate table row
 */
const OverflowMenu = ({ requestedMatch, gameName, ipFamilyName }: OverflowMenuProps) => {
  const router = useRouter();
  const { logEvent } = useLicenseManagerLogger();
  const { translate } = useTranslation();
  const { status, agreementId } = requestedMatch;

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [isMatchNotApprovedModalOpen, setIsMatchNotApprovedModalOpen] = useState<boolean>(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleViewAgreement = () => {
    if (!agreementId) {
      return;
    }
    handleMenuClose();
    logEvent(
      LicenseManagerClickEvent.MatchesTableViewApprovedManualScanCandidateAgreementClickEvent,
      {
        candidate: requestedMatch.id ?? '',
      },
    );
    void router.push(IPH_AGREEMENT_DETAILS_HREF(agreementId));
  };

  const handleViewMatchNotApprovedModal = () => {
    handleMenuClose();
    logEvent(LicenseManagerClickEvent.MatchesTableViewRejectedManualScanCandidateReasonClickEvent, {
      candidate: requestedMatch.id ?? '',
    });
    setIsMatchNotApprovedModalOpen((open) => !open);
  };

  if (
    status === AgreementCandidateStatus.Pending ||
    (status === AgreementCandidateStatus.Approved && !agreementId)
  ) {
    return null;
  }

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
        {status === AgreementCandidateStatus.Approved && (
          <MenuItem onClick={handleViewAgreement}>{translate('Action.ViewAgreement')}</MenuItem>
        )}
        {status === AgreementCandidateStatus.Rejected && (
          <MenuItem onClick={handleViewMatchNotApprovedModal}>
            {translate('Label.ViewArchiveReason')}
          </MenuItem>
        )}
      </Menu>
      <MatchNotApprovedModal
        dialogOpen={isMatchNotApprovedModalOpen}
        onDialogClose={handleViewMatchNotApprovedModal}
        gameName={gameName}
        ipFamilyName={ipFamilyName}
      />
    </>
  );
};

const NoRequestsContent = ({
  openDialog,
  maxLimit,
}: {
  openDialog?: () => void;
  maxLimit: number;
}) => {
  const { classes } = useStyles();
  const { translate } = useTranslation();

  return (
    <EmptyStateBorder>
      <EmptyState
        title={translate('Heading.NoRequestsYet')}
        size='small'
        description={translate('Description.NoPendingRequests')}
        illustration='findPeople'>
        <div className={classes.buttonContainer}>
          <Button component={Link} href={IP_FAMILIES_HREF} color='primaryBrand' variant='contained'>
            {translate('Action.UpdateIpLibrary')}
          </Button>
          <Tooltip
            title={translate('Label.DailyLimitReached', {
              maxLimit: maxLimit.toString(),
            })}
            arrow
            placement='bottom'
            disableHoverListener={!!openDialog}
            disableFocusListener={!!openDialog}
            disableTouchListener={!!openDialog}>
            <div>
              <Button
                size='medium'
                variant='contained'
                color='secondary'
                onClick={openDialog}
                disabled={!openDialog}>
                {translate('Action.RequestMatch')}
              </Button>
            </div>
          </Tooltip>
        </div>
      </EmptyState>
    </EmptyStateBorder>
  );
};

interface content {
  icon: ReactElement | undefined;
  variant: variants | undefined;
  text: string;
}

/** Foundation Tailwind: flex text column so % skeleton widths resolve in `experienceCell` flex row. */
const experienceCellTextClassName =
  'grow-1 min-width-0 basis-0 max-[800px]:grow-0 max-[800px]:shrink-0 max-[800px]:width-full';

const statusToContent: { [key in AgreementCandidateStatus]: content } = {
  Pending: {
    icon: <AccessTimeIcon fontSize='inherit' />,
    variant: 'warning',
    text: 'Label.Pending',
  },
  Approved: {
    icon: <CheckCircleOutlineIcon fontSize='inherit' />,
    variant: 'success',
    text: 'Label.OfferSent',
  },
  Rejected: {
    icon: <InfoOutlinedIcon fontSize='inherit' />,
    variant: undefined,
    text: 'Label.Archived',
  },
};

interface MatchRowProps {
  requestedMatch: RequestedScanCandidateResponse;
}

/**
 * A row component for a single requestedMatch
 */
const MatchRow: React.FC<MatchRowProps> = ({ requestedMatch }) => {
  const { classes } = useStyles();
  const { translate } = useTranslation();
  const { locale } = useLocalization();

  const experienceId = Number(requestedMatch.candidateId);
  const gameRequest = useDebouncedGameDetails(experienceId);
  const maturityRequest = useDebouncedContentMaturity(experienceId);
  const ipFamilyRequest = useIpFamilyQuery(requestedMatch.ipFamilyId ?? undefined);

  // Skip pending checks for data that's already available from the requestedMatch prop
  const isMaturityPending = maturityRequest.isPending;

  if (gameRequest.isPending || isMaturityPending || ipFamilyRequest.isPending) {
    return (
      <TableRow>
        <TableCell className={classes.experienceColumn}>
          <div className={classes.experienceCell}>
            <Skeleton
              variant='square'
              width={42}
              height={42}
              className={classes.thumbnailContainer}
              animate
            />
            <div className={experienceCellTextClassName}>
              <Skeleton variant='text' animate width='50%' />
              <Skeleton variant='text' animate width='50%' />
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Skeleton variant='text' animate width='50%' />
        </TableCell>
        <TableCell>
          <Skeleton variant='text' animate width='50%' />
        </TableCell>
        <TableCell>
          <Skeleton variant='text' animate width='60%' />
        </TableCell>
        <TableCell>
          <Skeleton variant='text' animate width='50%' />
        </TableCell>
        <TableCell className={classes.actionCell}>
          <Skeleton variant='rectangular' animate width={40} height={40} />
        </TableCell>
      </TableRow>
    );
  }

  if (gameRequest.error) {
    return (
      <TableRow>
        <TableCell colSpan={6}>
          <CellError />
        </TableCell>
      </TableRow>
    );
  }

  if (gameRequest.data === NO_GAME_FOUND_FOR_ID) {
    return (
      <TableRow>
        <TableCell className={classes.experienceColumn}>
          <div className={classes.experienceCell}>
            {translate('Error.ExperienceNotAvailable', { id: requestedMatch.candidateId ?? '' })}
          </div>
        </TableCell>
        <TableCell>-</TableCell>
        <TableCell>-</TableCell>
        <TableCell>-</TableCell>
        <TableCell>
          {requestedMatch.createdAt
            ? formatDate(requestedMatch.createdAt, locale ?? Locale.English)
            : translate('Label.Unknown')}
        </TableCell>
        <TableCell />
      </TableRow>
    );
  }

  // Use content maturity from requestedMatch prop if available, otherwise fall back to API call
  let contentMaturity = '';
  if (maturityRequest.error || maturityRequest.data === NO_CONTENT_MATURITY_FOUND_FOR_ID) {
    contentMaturity = translate('Label.MaturityRatingNoneAvailable');
  } else {
    contentMaturity = maturityRequest.data ?? translate('Label.MaturityRatingNoneAvailable');
  }

  const creatorName = gameRequest.data?.creator?.name ?? translate('Label.Unknown');
  const gameName = gameRequest.data?.name ?? translate('Label.Unknown');
  const ipFamilyName = ipFamilyRequest.data?.name ?? translate('Label.Unknown');
  const statusKey = requestedMatch.status ?? AgreementCandidateStatus.Pending;
  const content = statusToContent[statusKey];

  return (
    <TableRow>
      <TableCell className={classes.experienceColumn}>
        <div className={classes.experienceCell}>
          <Thumbnail2d
            alt={gameName || ''}
            targetId={experienceId}
            // eslint-disable-next-line no-underscore-dangle -- Swagger generated enum has underscore
            size={AssetThumbnailSize._50x50}
            skeletonVariant='square'
            containerClass={classes.thumbnailContainer}
            type={ThumbnailTypes.gameIcon}
          />
          <div className={experienceCellTextClassName}>
            <Typography component='div' variant='body2'>
              {gameName}
            </Typography>
            <Typography
              variant='caption'
              color='secondary'
              className={classes.authorName}
              component='div'>
              {creatorName ? `@${creatorName}` : ''}
            </Typography>
          </div>
        </div>
      </TableCell>
      <TableCell>{ipFamilyName}</TableCell>
      <TableCell>{contentMaturity}</TableCell>
      <TableCell>
        <StatusLabel icon={content.icon} text={translate(content.text)} variant={content.variant} />
      </TableCell>
      <TableCell>
        {requestedMatch.updatedAt
          ? formatDate(requestedMatch.updatedAt, locale ?? Locale.English)
          : translate('Label.Unknown')}
      </TableCell>
      <TableCell className={classes.actionCell}>
        <OverflowMenu
          requestedMatch={requestedMatch}
          gameName={gameName}
          ipFamilyName={ipFamilyName}
        />
      </TableCell>
    </TableRow>
  );
};

interface ManualMatchesTableProps {
  openDialog?: () => void;
}

/**
 * Table showing manually requested matches, also know as adhoc agreement candidates, to IPH.
 */
const ManualMatchesTable: React.FC<ManualMatchesTableProps> = ({ openDialog }) => {
  const { classes } = useStyles();
  const { translate } = useTranslation();
  const { logOnce } = useLicenseManagerLoggerLogOnce();

  const manualCandidatesQuery = useManualMatchesQuery({
    pageSize: 50,
  });

  if (manualCandidatesQuery.isPending) {
    return <CircularProgress />;
  }
  if (manualCandidatesQuery.error) {
    return <IpLoadError error={manualCandidatesQuery.error} />;
  }

  const { allManualCandidates, fetchNextPage, hasNextPage, isFetchingNextPage } =
    manualCandidatesQuery;

  if (allManualCandidates.length === 0) {
    logOnce(LicenseManagerImpressionEvent.EmptyStateMatchesTableNoPendingRequests);
    return (
      <NoRequestsContent
        openDialog={openDialog}
        maxLimit={manualCandidatesQuery.maxDailyLimit ?? 0}
      />
    );
  }

  return (
    <div>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell className={classes.experienceColumn}>
                {translate('Label.Experience')}
              </TableCell>
              <TableCell>{translate('Label.IpFamily')}</TableCell>
              <TableCell>{translate('Label.ContentMaturity')}</TableCell>
              <TableCell>{translate('Label.Status')}</TableCell>
              <TableCell>{translate('Label.LastUpdated')}</TableCell>
              <TableCell /> {/* Spacer cell for overflow menu */}
            </TableRow>
          </TableHead>
          <TableBody>
            {allManualCandidates.map((requestedMatch: RequestedScanCandidateResponse) => (
              <MatchRow key={requestedMatch.id} requestedMatch={requestedMatch} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {hasNextPage && (
        <div className={classes.loadMoreContainer}>
          <Button
            onClick={() => {
              void fetchNextPage();
            }}
            disabled={isFetchingNextPage}
            variant='outlined'
            color='secondary'>
            {isFetchingNextPage ? translate('Label.Loading') : translate('Action.LoadMore')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ManualMatchesTable;
