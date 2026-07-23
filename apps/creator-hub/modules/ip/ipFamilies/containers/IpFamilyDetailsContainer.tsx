import { useEffect, useState } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  Grid,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  makeStyles,
  ArchiveIcon,
  IconButton,
  Tooltip,
  EditIcon,
} from '@rbx/ui';
import { useRouter } from 'next/router';
import { IPContent, IPContentContentTypeEnum, IPContentStatusEnum } from '@rbx/clients/rightsV1';
import { PageNotFound } from '@modules/miscellaneous/error';
import NextLink from 'next/link';
import { AssetThumbnailSize, ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { Pagination } from '@modules/miscellaneous/common';
import { EmptyState, EmptyStateBorder } from '@modules/miscellaneous/common/components';
import useCursorPagination, { usePaginationProps } from '../../rights/hooks/useCursorPagination';
import { useIpLayoutContext } from '../../IpAppNavigationLayout';
import IpTableRow from '../../components/IpTableRow';
import IpFamiliesBreadcrumbs from '../components/IpFamiliesBreadcrumbs';
import ArchiveIpContentModal from '../components/ArchiveIpContentModal';
import IpContentStatusChip from '../components/IpContentStatusChip';
import {
  useArchiveIpContentMutation,
  useIpFamilyQuery,
  useListIpContentsByFamilyQuery,
} from '../hooks/ipFamily';
import { getTranslationKeyFromLocale, LanguageCode } from '../utils/languages';
import IpLoadError from '../../components/error/IpLoadError';
import useIpSnackbar from '../../hooks/useIpSnackbar';
import LinkButton from '../../components/LinkButton';
import IpContentRejectReasonModal from '../components/IpContentRejectReasonModal';
import ImageViewIpFamilyDetailsModal from '../components/ImageViewIpFamilyDetailsModal';
import IpContentDetailsDrawer from '../components/IpContentDetailsDrawer';
import canArchiveIpContent from '../common/canArchiveIpContent';
import { IP_CONTENTS_CREATE_HREF } from '../urls';
import IpFamilyStatusChip from '../components/IpFamilyStatusChip';

const useStyles = makeStyles<void, 'actionCell'>()((theme, _, classes) => ({
  row: {
    // we hide the action button on devices that supports hover
    // otherwise the button is always visible
    '@media (hover: hover)': {
      [`&:not(:hover) .${classes.actionCell}`]: {
        opacity: 0,
      },
    },
  },
  actionCell: {
    transition: 'opacity 0.2s',
    whiteSpace: 'nowrap',
  },
  linkButton: {
    paddingTop: '10px',
    fontSize: theme.typography.body2.fontSize,
  },
  imageContainer: {
    width: 40,
    height: 40,
    overflow: 'hidden',
    borderRadius: 4,
  },
  thumbnailContainer: {
    width: 40,
    height: 40,
    display: 'block',
    borderRadius: 4,
  },
  thumbnailImg: {
    width: 40,
    height: 40,
    objectFit: 'cover',
    borderRadius: 4,
  },
  imageButton: {
    display: 'flex',
    justifyContent: 'flex-start',
    width: 40,
    height: 40,
    overflow: 'hidden',
    padding: 0,
    borderRadius: 4,
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '95%',
  },
}));

interface IPContentDisplayValueProps {
  item: IPContent;
}

const IpContentDisplayValue = ({ item }: IPContentDisplayValueProps) => {
  const { classes } = useStyles();
  const { translate } = useTranslation();
  const [open, setOpen] = useState(false);

  const openModal = () => setOpen(true);
  const closeModal = () => setOpen(false);

  switch (item.contentType) {
    case IPContentContentTypeEnum.Text:
      return item.contentValue;
    case IPContentContentTypeEnum.Image: {
      if (item.contentValue === undefined) {
        return '';
      }
      const assetId = parseInt(item.contentValue, 10);
      return (
        <div className={classes.imageContainer}>
          <Button
            onClick={(event) => {
              event.stopPropagation();
              openModal();
            }}
            className={classes.imageButton}>
            <Thumbnail2d
              targetId={assetId}
              type={ThumbnailTypes.assetThumbnail}
              alt={translate('Label.IpContentThumbnail')}
              returnPolicy={ReturnPolicy.PlaceHolder}
              includeBackground={false}
              containerClass={classes.thumbnailContainer}
              imgClassName={classes.thumbnailImg}
              // eslint-disable-next-line no-underscore-dangle -- external enum
              size={AssetThumbnailSize._110x110}
            />
          </Button>
          <ImageViewIpFamilyDetailsModal open={open} onClose={closeModal} assetId={assetId} />
        </div>
      );
    }
    default:
      return '';
  }
};

export const IPContentImageSuccess = 'IPContentImageSuccess';
/**
 * Pages that shows details about an existing IP Family (or whatever it will be called).
 * It also allows for adding additional keywords and media.
 */
const IpFamilyDetailsContainer = () => {
  const { translate } = useTranslation();
  const router = useRouter();
  const { id } = router.query;
  const [itemToArchive, setItemToArchive] = useState<IPContent | null>(null);
  const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
  const [rejectedIpContent, setRejectedIpContent] = useState<IPContent | null>(null);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [selectedIpContent, setSelectedIpContent] = useState<IPContent | null>(null);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const { classes } = useStyles();
  const { enqueueErrorSnackbar } = useIpSnackbar();
  const { onPageChange, pageToken, pagination } = useCursorPagination();

  const ipFamilyReq = useIpFamilyQuery(id as string);
  const ipContentsReq = useListIpContentsByFamilyQuery({
    ipFamilyId: id as string,
    pageSize: pagination.pageSize,
    pageToken: pageToken || '',
  });
  const archiveIpContentMutation = useArchiveIpContentMutation();
  const { paginationProps: ipContentsPaginationProps } = usePaginationProps(
    ipContentsReq.data?.nextPageToken,
    pagination.pageIndex,
    onPageChange,
    ipContentsReq.isPlaceholderData,
  );

  const getIpContentTypeText = (ipContent: IPContent): string => {
    switch (ipContent.contentType) {
      case IPContentContentTypeEnum.Text:
        return translate(ipContent.isPrimary ? 'Label.PrimaryKeyword' : 'Label.SecondaryKeyword');
      case IPContentContentTypeEnum.Image:
        return translate('Label.Image');
      default:
        return '';
    }
  };

  const getLocaleText = (item: IPContent): string => {
    switch (item.contentType) {
      case IPContentContentTypeEnum.Text:
        return item.locale
          ? translate(getTranslationKeyFromLocale(item.locale as LanguageCode))
          : '';
      case IPContentContentTypeEnum.Image:
        // TODO: [CDS-894] Check copy (kzhou)
        return translate('Label.NotApplicable');
      default:
        return '';
    }
  };

  const handleArchiveItem = async () => {
    if (itemToArchive) {
      try {
        await archiveIpContentMutation.mutateAsync({ ipContentId: itemToArchive.id! });
        setItemToArchive(null);
      } catch {
        enqueueErrorSnackbar();
      }
    }
  };

  const openArchiveConfirmDialog = (item: IPContent) => {
    setItemToArchive(item);
  };

  const closeConfirmDialog = () => {
    setItemToArchive(null);
  };

  const openEditDrawer = (item: IPContent) => {
    setEditDrawerOpen(true);
    setSelectedIpContent(item);
  };

  const { setPageTitle } = useIpLayoutContext();
  useEffect(() => {
    if (ipFamilyReq.data?.name) {
      setPageTitle(<IpFamiliesBreadcrumbs pages={[{ title: ipFamilyReq.data.name }]} />);
    }
  }, [ipFamilyReq.data?.name, setPageTitle]);

  if (ipFamilyReq.error || ipContentsReq.error) {
    return <IpLoadError error={ipFamilyReq.error || ipContentsReq.error} />;
  }

  if (!ipFamilyReq.data || !ipContentsReq.data) {
    return <CircularProgress />;
  }

  const ipFamily = ipFamilyReq.data;
  const ipContent = ipContentsReq.data;

  if (!ipFamily) {
    return <PageNotFound />;
  }

  const { ipContents } = ipContent;

  return (
    <Grid container direction='column' spacing={3}>
      <Grid item className={classes.headerRow}>
        <Grid item direction='column' paddingBottom={2}>
          <Typography variant='h1' component='h1' gutterBottom>
            {ipFamily.name}
          </Typography>
          <IpFamilyStatusChip ipFamily={ipFamily} />
        </Grid>
        {ipContents.length > 0 && (
          <Grid item display='flex' gap='16px'>
            <Grid item>
              <Button
                variant='contained'
                color='secondary'
                href={IP_CONTENTS_CREATE_HREF(id as string)}
                component={NextLink}>
                <span>{translate('Action.AddIp')}</span>
              </Button>
            </Grid>
          </Grid>
        )}
      </Grid>
      {ipContents.length === 0 ? (
        <Grid item>
          <EmptyStateBorder>
            <EmptyState
              title={translate('Heading.BuildIP')}
              size='large'
              description={translate('Description.BuildIP')}>
              <Button
                component={NextLink}
                href={IP_CONTENTS_CREATE_HREF(ipFamily.id as string)}
                color='primaryBrand'
                variant='contained'>
                {translate('Action.AddIp')}
              </Button>
            </EmptyState>
          </EmptyStateBorder>
        </Grid>
      ) : (
        <Grid item>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{translate('Label.IP')}</TableCell>
                  <TableCell>{translate('Label.Status')}</TableCell>
                  <TableCell>{translate('Label.Type')}</TableCell>
                  <TableCell>{translate('Label.Locale')}</TableCell>
                  <TableCell />
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {ipContent.ipContents?.map((item) => (
                  <IpTableRow
                    key={item.id}
                    className={classes.row}
                    onActivate={() => {
                      setSelectedIpContent(item);
                      setDetailsDrawerOpen(true);
                    }}>
                    <TableCell>
                      <IpContentDisplayValue item={item} />
                    </TableCell>
                    <TableCell>
                      <Grid container alignItems='left' direction='column'>
                        <Grid item>
                          <IpContentStatusChip status={item.status} />
                        </Grid>
                        {item.status === IPContentStatusEnum.Rejected && item.statusReason && (
                          <Grid item>
                            <LinkButton
                              className={classes.linkButton}
                              onClick={(event) => {
                                setRejectedIpContent(item);
                                setReasonDialogOpen(true);
                                event.stopPropagation();
                              }}>
                              {translate('Label.ViewRejectReason')}
                            </LinkButton>
                            <IpContentRejectReasonModal
                              ipContent={rejectedIpContent}
                              reason={item.statusReason}
                              dialogOpen={reasonDialogOpen}
                              onDialogClose={() => {
                                setReasonDialogOpen(false);
                                setRejectedIpContent(null);
                              }}
                            />
                          </Grid>
                        )}
                      </Grid>
                    </TableCell>
                    <TableCell>{getIpContentTypeText(item)}</TableCell>
                    <TableCell>{getLocaleText(item)}</TableCell>
                    <TableCell className={classes.actionCell}>
                      {item.status === IPContentStatusEnum.Rejected && (
                        <Tooltip title={translate('Action.Edit')}>
                          <IconButton
                            aria-label={translate('Action.Edit')}
                            color='secondary'
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDrawer(item);
                            }}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell className={classes.actionCell}>
                      {canArchiveIpContent(item) && (
                        <Tooltip title={translate('Action.Archive')}>
                          <IconButton
                            aria-label={translate('Action.Archive')}
                            color='secondary'
                            onClick={(e) => {
                              e.stopPropagation();
                              openArchiveConfirmDialog(item);
                            }}>
                            <ArchiveIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </IpTableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Pagination {...ipContentsPaginationProps} />
          {itemToArchive && (
            <ArchiveIpContentModal
              itemToArchive={itemToArchive}
              onClose={closeConfirmDialog}
              onArchive={handleArchiveItem}
            />
          )}
          <IpContentDetailsDrawer
            ipContent={selectedIpContent}
            open={detailsDrawerOpen || editDrawerOpen}
            defaultMode={editDrawerOpen ? 'edit' : 'view'}
            onClose={() => {
              if (editDrawerOpen) {
                setEditDrawerOpen(false);
              } else {
                setDetailsDrawerOpen(false);
              }
              setSelectedIpContent(null);
            }}
          />
        </Grid>
      )}
    </Grid>
  );
};

export default withTranslation(IpFamilyDetailsContainer, [
  TranslationNamespace.Navigation,
  TranslationNamespace.AgreementsManager,
  TranslationNamespace.RightsPortal,
]);
