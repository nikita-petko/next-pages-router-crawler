import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
import { clsx } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  Button,
  EditOutlinedIcon,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
} from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentPage } from '@modules/monetization-shared/table-v1/useCurrentPage';
import { useTablePagination } from '@modules/monetization-shared/table-v1/useTablePagination';
import {
  DEFAULT_MOMENTS_TABLE_ROWS_PER_PAGE,
  MOMENTS_LIST_PAGE_SIZE,
  MOMENTS_TABLE_ROWS_PER_PAGE_OPTIONS,
} from '../constants/momentsCreationsConstants';
import useCreationsGridContainerStyles from '../containers/CreationsGridContainer.styles';
import { useMomentsStatusFilter } from '../hooks/useMomentsStatusFilter';
import type { MomentCreation, MomentCreationStatusFilterTab } from '../types/MomentCreation';
import { MomentCreationStatus } from '../types/MomentCreation';
import type { MomentMetadataUpdate } from '../utils/momentsLocalDraftStorage';
import MomentStatusIndicator from './MomentStatusIndicator';
import MomentVideoThumbnail from './MomentVideoThumbnail';

const MOMENTS_TABLE_ROWS_PER_PAGE_OPTIONS_MUTABLE = [...MOMENTS_TABLE_ROWS_PER_PAGE_OPTIONS];

const EMPTY_FILTER_MESSAGE_KEYS: Record<MomentCreationStatusFilterTab, string> = {
  [MomentCreationStatus.ACTIVE]: 'MomentsTable.NoActiveMoments',
  [MomentCreationStatus.DRAFT]: 'MomentsTable.NoDraftMoments',
};

type MomentsCreationsTableProps = {
  moments: MomentCreation[];
  onEditMoment: (moment: MomentCreation) => void;
  onMomentMetadataChange: (momentId: string, updates: MomentMetadataUpdate) => void;
  onPublishMoment?: (momentId: string) => void;
  publishingMomentId?: string | null;
  isPublishDisabled?: boolean;
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
  serverPageSize?: number;
};

const MomentsCreationsTable: FC<MomentsCreationsTableProps> = ({
  moments,
  onEditMoment,
  onMomentMetadataChange,
  onPublishMoment,
  publishingMomentId = null,
  isPublishDisabled = false,
  hasNextPage = false,
  fetchNextPage,
  serverPageSize = MOMENTS_LIST_PAGE_SIZE,
}) => {
  const { translate } = useTranslation();
  const {
    classes: { gridContainer, createButtonContainer },
  } = useCreationsGridContainerStyles();
  const { statusTab } = useMomentsStatusFilter();

  const getStatusLabel = useCallback(
    (status: MomentCreation['status']) => {
      switch (status) {
        case MomentCreationStatus.ACTIVE:
          return translate('MomentsTable.Pills.Active' /* TranslationNamespace.Creations */);
        case MomentCreationStatus.PENDING:
          return translate('MomentsTable.Pills.Pending' /* TranslationNamespace.Creations */);
        case MomentCreationStatus.DRAFT:
          return translate('MomentsTable.Pills.Draft' /* TranslationNamespace.Creations */);
        case MomentCreationStatus.MODERATED:
          return translate('MomentsTable.Pills.Moderated' /* TranslationNamespace.Creations */);
        default:
          return status;
      }
    },
    [translate],
  );

  const isActiveTab = statusTab === MomentCreationStatus.ACTIVE;

  const filteredMoments = useMemo(() => {
    if (statusTab === MomentCreationStatus.DRAFT) {
      // Drafts are local-only; pending rows are in-flight publishes still tracked locally.
      return moments.filter(
        (moment) =>
          moment.status === MomentCreationStatus.DRAFT ||
          moment.status === MomentCreationStatus.PENDING,
      );
    }

    // Server pages only contain published/active moments.
    return moments.filter((moment) => moment.status === statusTab);
  }, [moments, statusTab]);

  const { page, rowsPerPage, onPageChange, onRowsPerPageChange } = useTablePagination({
    count: filteredMoments.length,
    initialRowsPerPage: DEFAULT_MOMENTS_TABLE_ROWS_PER_PAGE,
    resetKey: statusTab,
  });

  const { currentPage: paginatedMoments } = useCurrentPage(filteredMoments, {
    page,
    rowsPerPage,
    hasNextPage: isActiveTab ? hasNextPage : false,
    fetchNextPage: isActiveTab ? fetchNextPage : undefined,
    fetchLimit: serverPageSize,
  });

  const handleDescriptionBlur = useCallback(
    (moment: MomentCreation, event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const description = event.target.value;
      if (description === moment.description) {
        return;
      }

      onMomentMetadataChange(moment.id, { description });
    },
    [onMomentMetadataChange],
  );

  const handlePublishMoment = useCallback(
    (momentId: string) => {
      onPublishMoment?.(momentId);
    },
    [onPublishMoment],
  );

  return (
    <div className={gridContainer}>
      <div
        className={clsx(createButtonContainer, 'flex flex-col gap-xlarge width-full self-stretch')}>
        <TableContainer className='width-full stroke-standard stroke-default radius-medium clip'>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  {translate('MomentsTable.Header.Moments' /* TranslationNamespace.Creations */)}
                </TableCell>
                <TableCell>
                  {translate(
                    'MomentsTable.Header.ExperienceName' /* TranslationNamespace.Creations */,
                  )}
                </TableCell>
                <TableCell>
                  {translate(
                    'MomentsTable.Header.Description' /* TranslationNamespace.Creations */,
                  )}
                </TableCell>
                <TableCell>
                  {translate('MomentsTable.Header.Status' /* TranslationNamespace.Creations */)}
                </TableCell>
                <TableCell align='right' />
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMoments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align='center' className='padding-y-xxlarge'>
                    <span
                      className='text-body-medium content-muted block padding-y-xxlarge'
                      data-testid='moments-table-empty-filter-message'>
                      {translate(
                        EMPTY_FILTER_MESSAGE_KEYS[statusTab] /* TranslationNamespace.Creations */,
                      )}
                    </span>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMoments.map((moment) => (
                  <TableRow
                    key={moment.id}
                    className='transition-colors hover:bg-shift-200'
                    data-testid={`moment-row-${moment.id}`}>
                    <TableCell>
                      <MomentVideoThumbnail moment={moment} />
                    </TableCell>
                    <TableCell>{moment.experienceName}</TableCell>
                    <TableCell>
                      {moment.status === MomentCreationStatus.ACTIVE ? (
                        <span data-testid={`moment-description-${moment.id}`}>
                          {moment.description || '-'}
                        </span>
                      ) : (
                        <TextField
                          key={`moment-description-${moment.id}-${moment.modifiedAt}`}
                          id={`moment-description-${moment.id}`}
                          label={translate(
                            'MomentsTable.Header.Description' /* TranslationNamespace.Creations */,
                          )}
                          defaultValue={moment.description}
                          disabled={publishingMomentId === moment.id}
                          fullWidth
                          placeholder={translate(
                            'MomentsTable.Placeholders.Description' /* TranslationNamespace.Creations */,
                          )}
                          size='small'
                          variant='outlined'
                          onBlur={(event) => handleDescriptionBlur(moment, event)}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <MomentStatusIndicator
                        label={getStatusLabel(moment.status)}
                        status={moment.status}
                      />
                    </TableCell>
                    <TableCell align='right'>
                      <div className='inline-flex items-center gap-xsmall'>
                        <Tooltip
                          title={translate('Action.Edit' /* TranslationNamespace.Controls */)}>
                          <IconButton
                            aria-label={translate(
                              'Action.Edit' /* TranslationNamespace.Controls */,
                            )}
                            color='secondary'
                            size='small'
                            type='button'
                            onClick={() => onEditMoment(moment)}>
                            <EditOutlinedIcon />
                          </IconButton>
                        </Tooltip>
                        {moment.status === MomentCreationStatus.DRAFT &&
                        'hasLocalVideo' in moment &&
                        moment.hasLocalVideo === true &&
                        onPublishMoment ? (
                          <Button
                            color='secondary'
                            size='small'
                            type='button'
                            variant='contained'
                            disabled={isPublishDisabled || publishingMomentId != null}
                            onClick={() => handlePublishMoment(moment.id)}>
                            {translate('Action.Publish' /* TranslationNamespace.Creations */)}
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {filteredMoments.length > 0 ? (
              <TableFooter>
                <TableRow>
                  <TablePagination
                    colSpan={5}
                    count={filteredMoments.length}
                    onPageChange={onPageChange}
                    onRowsPerPageChange={onRowsPerPageChange}
                    page={page}
                    rowsPerPage={rowsPerPage}
                    rowsPerPageOptions={MOMENTS_TABLE_ROWS_PER_PAGE_OPTIONS_MUTABLE}
                  />
                </TableRow>
              </TableFooter>
            ) : null}
          </Table>
        </TableContainer>
      </div>
    </div>
  );
};

export default withTranslation(MomentsCreationsTable, [
  TranslationNamespace.Creations,
  TranslationNamespace.Controls,
]);
