import type { ChangeEvent, FC, FocusEvent } from 'react';
import { useCallback, useMemo, useState } from 'react';
import {
  Button,
  clsx,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TablePagination,
  TableRow,
  TextInput,
  Tooltip,
  TooltipTrigger,
} from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentPage } from '@modules/monetization-shared/table-v1/useCurrentPage';
import { useTablePagination } from '@modules/monetization-shared/table-v1/useTablePagination';
import { MAX_MOMENT_DESCRIPTION_LENGTH } from '../constants/momentConstants';
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

type MomentDescriptionFieldProps = {
  moment: MomentCreation;
  disabled: boolean;
  onBlur: (moment: MomentCreation, event: FocusEvent<HTMLInputElement>) => void;
};

const MomentDescriptionField: FC<MomentDescriptionFieldProps> = ({ moment, disabled, onBlur }) => {
  const { translate } = useTranslation();
  const [description, setDescription] = useState(moment.description);
  const isDescriptionAtMaxLength = description.length >= MAX_MOMENT_DESCRIPTION_LENGTH;

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setDescription(event.target.value);
  }, []);

  const handleBlur = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      onBlur(moment, event);
    },
    [moment, onBlur],
  );

  return (
    <div className='flex flex-col gap-y-xsmall width-full'>
      <TextInput
        id={`moment-description-${moment.id}`}
        label={translate('MomentsTable.Header.Description' /* TranslationNamespace.Creations */)}
        value={description}
        isDisabled={disabled}
        maxLength={MAX_MOMENT_DESCRIPTION_LENGTH}
        placeholder={translate(
          'MomentsTable.Placeholders.Description' /* TranslationNamespace.Creations */,
        )}
        size='Small'
        onBlur={handleBlur}
        onChange={handleChange}
      />
      <span
        aria-live='polite'
        className={
          isDescriptionAtMaxLength
            ? 'text-body-small content-system-alert text-align-x-right'
            : 'text-body-small content-muted text-align-x-right'
        }
        data-testid={`moment-description-char-count-${moment.id}`}>
        {`${description.length}/${MAX_MOMENT_DESCRIPTION_LENGTH}`}
      </span>
    </div>
  );
};

type MomentTableRowProps = {
  moment: MomentCreation;
  editLabel: string;
  publishingMomentId: string | null;
  isPublishDisabled: boolean;
  statusLabel: string;
  onEditMoment: (moment: MomentCreation) => void;
  onDescriptionBlur: (moment: MomentCreation, event: FocusEvent<HTMLInputElement>) => void;
  onPublishMoment?: (momentId: string) => void;
};

const MomentTableRow: FC<MomentTableRowProps> = ({
  moment,
  editLabel,
  publishingMomentId,
  isPublishDisabled,
  statusLabel,
  onEditMoment,
  onDescriptionBlur,
  onPublishMoment,
}) => {
  const { translate } = useTranslation();
  const isPublishing = publishingMomentId === moment.id;

  const handleEdit = useCallback(() => {
    onEditMoment(moment);
  }, [moment, onEditMoment]);

  const handlePublish = useCallback(() => {
    onPublishMoment?.(moment.id);
  }, [moment.id, onPublishMoment]);

  return (
    <TableRow isHoverable data-testid={`moment-row-${moment.id}`}>
      <TableCell>
        <MomentVideoThumbnail moment={moment} />
      </TableCell>
      <TableCell>{moment.experienceName}</TableCell>
      <TableCell>
        {moment.status === MomentCreationStatus.ACTIVE ? (
          <span data-testid={`moment-description-${moment.id}`}>{moment.description || '-'}</span>
        ) : (
          <MomentDescriptionField
            key={`moment-description-${moment.id}-${moment.modifiedAt}`}
            moment={moment}
            disabled={isPublishing}
            onBlur={onDescriptionBlur}
          />
        )}
      </TableCell>
      <TableCell>
        <MomentStatusIndicator label={statusLabel} status={moment.status} />
      </TableCell>
      <TableCell align='end'>
        <div className='inline-flex items-center gap-xsmall'>
          <Tooltip position='top-center' title={editLabel}>
            <TooltipTrigger asChild>
              <IconButton
                ariaLabel={editLabel}
                icon='icon-regular-pencil'
                size='Small'
                type='button'
                variant='Utility'
                onClick={handleEdit}
              />
            </TooltipTrigger>
          </Tooltip>
          {moment.status === MomentCreationStatus.DRAFT &&
          'hasLocalVideo' in moment &&
          moment.hasLocalVideo === true &&
          onPublishMoment ? (
            <Button
              size='Small'
              type='button'
              variant='Standard'
              isDisabled={isPublishDisabled || publishingMomentId != null}
              onClick={handlePublish}>
              {translate('Action.Publish' /* TranslationNamespace.Creations */)}
            </Button>
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  );
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
    (moment: MomentCreation, event: FocusEvent<HTMLInputElement>) => {
      const description = event.target.value;
      if (description === moment.description) {
        return;
      }

      onMomentMetadataChange(moment.id, { description });
    },
    [onMomentMetadataChange],
  );

  const handleFoundationPageChange = useCallback(
    (nextPage: number) => {
      onPageChange(undefined, nextPage);
    },
    [onPageChange],
  );

  const editLabel = translate('Action.Edit' /* TranslationNamespace.Controls */);

  return (
    <div className={gridContainer}>
      <div
        className={clsx(createButtonContainer, 'flex flex-col gap-xlarge width-full self-stretch')}>
        <div className='flex flex-col gap-y-medium width-full'>
          <Table className='width-full' variant='Framed'>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>
                  {translate('MomentsTable.Header.Moments' /* TranslationNamespace.Creations */)}
                </TableHeaderCell>
                <TableHeaderCell>
                  {translate(
                    'MomentsTable.Header.ExperienceName' /* TranslationNamespace.Creations */,
                  )}
                </TableHeaderCell>
                <TableHeaderCell>
                  {translate(
                    'MomentsTable.Header.Description' /* TranslationNamespace.Creations */,
                  )}
                </TableHeaderCell>
                <TableHeaderCell>
                  {translate('MomentsTable.Header.Status' /* TranslationNamespace.Creations */)}
                </TableHeaderCell>
                <TableHeaderCell align='end'> </TableHeaderCell>
              </TableRow>
            </TableHeader>
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
                  <MomentTableRow
                    key={moment.id}
                    moment={moment}
                    editLabel={editLabel}
                    publishingMomentId={publishingMomentId}
                    isPublishDisabled={isPublishDisabled}
                    statusLabel={getStatusLabel(moment.status)}
                    onEditMoment={onEditMoment}
                    onDescriptionBlur={handleDescriptionBlur}
                    onPublishMoment={onPublishMoment}
                  />
                ))
              )}
            </TableBody>
          </Table>
          {filteredMoments.length > 0 ? (
            <TablePagination
              page={page}
              rowsPerPage={rowsPerPage}
              totalRows={filteredMoments.length}
              rowsPerPageOptions={MOMENTS_TABLE_ROWS_PER_PAGE_OPTIONS_MUTABLE}
              onPageChange={handleFoundationPageChange}
              onRowsPerPageChange={onRowsPerPageChange}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default withTranslation(MomentsCreationsTable, [
  TranslationNamespace.Creations,
  TranslationNamespace.Controls,
]);
