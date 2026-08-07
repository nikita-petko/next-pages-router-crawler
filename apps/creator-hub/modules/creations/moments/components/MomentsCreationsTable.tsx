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
import useCreationsGridContainerStyles from '../../home/containers/CreationsGridContainer.styles';
import { MAX_MOMENT_DESCRIPTION_LENGTH } from '../constants/momentConstants';
import {
  DEFAULT_MOMENTS_TABLE_ROWS_PER_PAGE,
  MOMENTS_LIST_PAGE_SIZE,
  MOMENTS_TABLE_ROWS_PER_PAGE_OPTIONS,
} from '../constants/momentsCreationsConstants';
import { useMomentsStatusFilter } from '../hooks/useMomentsStatusFilter';
import useMomentsUploadLanguageSelectEnabled from '../hooks/useMomentsUploadLanguageSelectEnabled';
import type { MomentCreation, MomentCreationStatusFilterTab } from '../types/MomentCreation';
import { MomentCreationStatus } from '../types/MomentCreation';
import { getMomentRowKey } from '../utils/momentsIdentityUtils';
import type { MomentMetadataUpdate } from '../utils/momentsLocalDraftStorage';
import { formatMomentContentLanguage } from '../utils/momentsUploadLocaleUtils';
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
  const momentKey = getMomentRowKey(moment);
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
        id={`moment-description-${momentKey}`}
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
        data-testid={`moment-description-char-count-${momentKey}`}>
        {`${description.length}/${MAX_MOMENT_DESCRIPTION_LENGTH}`}
      </span>
    </div>
  );
};

type MomentTableRowProps = {
  moment: MomentCreation;
  editLabel: string;
  publishingDraftId: string | null;
  isPublishDisabled: boolean;
  showContentLanguageColumn: boolean;
  statusLabel: string;
  onEditMoment: (moment: MomentCreation) => void;
  onDescriptionBlur: (moment: MomentCreation, event: FocusEvent<HTMLInputElement>) => void;
  onPublishMoment?: (draftId: string) => void;
};

const MomentTableRow: FC<MomentTableRowProps> = ({
  moment,
  editLabel,
  publishingDraftId,
  isPublishDisabled,
  showContentLanguageColumn,
  statusLabel,
  onEditMoment,
  onDescriptionBlur,
  onPublishMoment,
}) => {
  const { translate } = useTranslation();
  const momentKey = getMomentRowKey(moment);
  const isDraft = moment.status === MomentCreationStatus.DRAFT;
  const isPublishing = publishingDraftId != null && publishingDraftId === momentKey;

  const handleEdit = useCallback(() => {
    onEditMoment(moment);
  }, [moment, onEditMoment]);

  const handlePublish = useCallback(() => {
    if (moment.status !== MomentCreationStatus.DRAFT) {
      return;
    }

    onPublishMoment?.(moment.draftId);
  }, [moment, onPublishMoment]);

  return (
    <TableRow isHoverable data-testid={`moment-row-${momentKey}`}>
      <TableCell>
        <MomentVideoThumbnail moment={moment} />
      </TableCell>
      <TableCell>{moment.experienceName}</TableCell>
      <TableCell>
        {moment.status === MomentCreationStatus.ACTIVE ? (
          <span data-testid={`moment-description-${momentKey}`}>{moment.description || '-'}</span>
        ) : (
          <MomentDescriptionField
            key={`moment-description-${momentKey}-${moment.modifiedAt}`}
            moment={moment}
            disabled={isPublishing}
            onBlur={onDescriptionBlur}
          />
        )}
      </TableCell>
      {showContentLanguageColumn ? (
        <TableCell>
          <span data-testid={`moment-content-language-${momentKey}`}>
            {formatMomentContentLanguage(moment.locale)}
          </span>
        </TableCell>
      ) : null}
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
          {isDraft && moment.hasLocalVideo === true && onPublishMoment ? (
            <Button
              size='Small'
              type='button'
              variant='Standard'
              isDisabled={isPublishDisabled || publishingDraftId != null}
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
  onMomentMetadataChange: (moment: MomentCreation, updates: MomentMetadataUpdate) => void;
  onPublishMoment?: (draftId: string) => void;
  publishingDraftId?: string | null;
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
  publishingDraftId = null,
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
  const showContentLanguageColumn = useMomentsUploadLanguageSelectEnabled();

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

      onMomentMetadataChange(moment, { description });
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
  const tableColumnCount = showContentLanguageColumn ? 6 : 5;

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
                {showContentLanguageColumn ? (
                  <TableHeaderCell>
                    {translate(
                      'CreateMomentModal.LanguageInput.Label' /* TranslationNamespace.Creations */,
                    )}
                  </TableHeaderCell>
                ) : null}
                <TableHeaderCell>
                  {translate('MomentsTable.Header.Status' /* TranslationNamespace.Creations */)}
                </TableHeaderCell>
                <TableHeaderCell align='end'> </TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMoments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={tableColumnCount}
                    align='center'
                    className='padding-y-xxlarge'>
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
                    key={getMomentRowKey(moment)}
                    moment={moment}
                    editLabel={editLabel}
                    publishingDraftId={publishingDraftId}
                    isPublishDisabled={isPublishDisabled}
                    showContentLanguageColumn={showContentLanguageColumn}
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
