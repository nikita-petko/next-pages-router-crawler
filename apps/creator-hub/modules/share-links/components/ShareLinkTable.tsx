import React, { FunctionComponent, useCallback, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TableFooter,
  TablePagination,
  TTablePaginationProps,
  Link,
  makeStyles,
  tableCellClasses,
  FileCopyOutlinedIcon,
  EditOutlinedIcon,
  VanityLinkIcon,
  Tooltip,
  Typography,
  BarChartIcon,
} from '@rbx/ui';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { formatDate } from '@modules/miscellaneous/common/utils';
import { AffiliateLink } from '@rbx/clients/affiliateLinksApi';
import {
  analyticsUserAcquisitionNavigationItem,
  buildExperienceAnalyticsUrlWithParams,
} from '@modules/charts-generic';
import { useRouter } from 'next/router';
import useCurrentOrganization from '@modules/group/hooks/useCurrentOrganization';
import getShareLink from './getShareLink';

const useShareLinkTableStyles = makeStyles()((theme) => ({
  tableContainer: {
    overflowX: 'auto',
    whiteSpace: 'nowrap',
    [`& .${tableCellClasses.root}`]: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      width: 'fit-content',
      maxWidth: 300,
    },
  },

  shrinkingTableCell: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: 0,
    minWidth: 250,
  },
  actionColumn: {
    width: 36,
    textAlign: 'right',
    visibility: 'visible',
    '@media (hover: hover)': {
      ':not(:hover)': {
        opacity: 0,
      },
    },
  },
  actionColumnVisible: {
    opacity: 1,
  },
  hoveredRowBackground: {
    backgroundColor: theme.palette.states.hover,
  },
  icon: {
    marginLeft: 8,
  },
  iconRow: {
    display: 'flex',
    alignItems: 'center',
  },
  iconWrapper: {
    display: 'inline-flex',
  },
}));

type TShareLinkTableProps = {
  shareLinks: AffiliateLink[];
  copyLink: (url: string) => void;
  editLink: (affiliateLink: AffiliateLink) => void;
} & Pick<
  TTablePaginationProps,
  'onPageChange' | 'onRowsPerPageChange' | 'rowsPerPage' | 'count' | 'page'
>;

const ShareLinkTable: FunctionComponent<TShareLinkTableProps> = ({
  shareLinks,
  copyLink,
  editLink,
  ...paginationProps
}) => {
  const { translate } = useTranslation();
  const { locale } = useLocalization();
  const { organization, permissions, isOrganizationLoading } = useCurrentOrganization();
  const router = useRouter();
  const {
    classes: {
      tableContainer,
      shrinkingTableCell,
      actionColumn,
      actionColumnVisible,
      hoveredRowBackground,
      icon,
      iconRow,
      iconWrapper,
    },
    cx,
  } = useShareLinkTableStyles();
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  // User can view analytics if they are in a user context or group context with canViewAnalytics eligibility
  const canViewAnalytics = isOrganizationLoading
    ? undefined
    : !organization?.groupId || permissions?.canViewAnalytics === true;

  const onClickViewAcquisition = useCallback(
    (affiliateLink: AffiliateLink) => {
      if (!affiliateLink.universe?.universeId) {
        // There is no universeId, so we can't navigate to the acquisition page
        return;
      }

      const url = buildExperienceAnalyticsUrlWithParams(
        analyticsUserAcquisitionNavigationItem,
        {}, // No query params
        affiliateLink.universe?.universeId,
      );

      router.push(url);
    },
    [router],
  );

  return (
    <TableContainer classes={{ root: tableContainer }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{translate('Label.CampaignName')}</TableCell>
            <TableCell>{translate('Label.Target')}</TableCell>
            <TableCell>{translate('Label.DateCreated')}</TableCell>
            <TableCell>{translate('Label.LaunchData')}</TableCell>
            <TableCell classes={{ root: shrinkingTableCell }}>{translate('Label.Url')}</TableCell>
            <TableCell classes={{ root: actionColumn }} />
          </TableRow>
        </TableHead>
        <TableBody>
          {shareLinks.map((shareLink, index) => {
            const { campaignName, createdUtc, universe, referralCodeType } = shareLink;
            const link = getShareLink(shareLink);

            return (
              <TableRow
                key={campaignName}
                classes={{
                  root: cx({ [hoveredRowBackground]: hoveredRow === index }),
                }}
                onMouseEnter={() => setHoveredRow(index)}
                onMouseLeave={() => setHoveredRow(null)}>
                <TableCell>
                  <div className={iconRow}>
                    {campaignName}
                    {referralCodeType === 'Custom' && (
                      <Tooltip
                        title={translate('Label.VanityLinkTooltip')}
                        placement='top'
                        arrow
                        enterTouchDelay={0}
                        leaveTouchDelay={3000}>
                        <span className={iconWrapper}>
                          <VanityLinkIcon classes={{ root: icon }} fontSize='small' />
                        </span>
                      </Tooltip>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {universe?.rootPlaceId && universe?.universeName ? (
                    <Link
                      href={`https://www.${process.env.robloxSiteDomain}/games/${universe.rootPlaceId}`}
                      target='_blank'>
                      {universe.universeName}
                    </Link>
                  ) : (
                    translate('Label.EmptyExperienceLink')
                  )}
                </TableCell>
                <TableCell>{formatDate(createdUtc, locale ?? Locale.English)}</TableCell>
                <TableCell>
                  {shareLink.launchData ? (
                    decodeURI(shareLink.launchData)
                  ) : (
                    <Typography color='disabled'>{translate('Label.None')}</Typography>
                  )}
                </TableCell>
                <TableCell classes={{ root: shrinkingTableCell }}>
                  <Typography variant='codeDense'>{link}</Typography>
                </TableCell>
                <TableCell
                  classes={{
                    root: cx(actionColumn, { [actionColumnVisible]: hoveredRow === index }),
                  }}>
                  <IconButton color='default' aria-label='copy' onClick={() => copyLink(link)}>
                    <FileCopyOutlinedIcon fontSize='large' />
                  </IconButton>
                  <IconButton color='default' aria-label='edit' onClick={() => editLink(shareLink)}>
                    <EditOutlinedIcon fontSize='large' />
                  </IconButton>

                  {shareLink.universe?.universeId && canViewAnalytics === true && (
                    <Tooltip
                      title={translate('Label.ViewAcquisition')}
                      placement='top'
                      enterTouchDelay={0}
                      leaveTouchDelay={3000}>
                      <IconButton
                        color='default'
                        aria-label='view-analytics'
                        onClick={() => onClickViewAcquisition(shareLink)}>
                        <BarChartIcon fontSize='large' />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TablePagination rowsPerPageOptions={[10, 25, 50, 100]} {...paginationProps} />
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
};

export default ShareLinkTable;
