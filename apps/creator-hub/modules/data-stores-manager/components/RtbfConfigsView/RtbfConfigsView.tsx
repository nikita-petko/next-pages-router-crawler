import type { FunctionComponent } from 'react';
import { useState, useEffect } from 'react';
import { StatusCodes } from '@rbx/core';
import { Badge, Button } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  CircularProgress,
  IconButton,
  EditOutlinedIcon,
  DeleteOutlinedIcon,
} from '@rbx/ui';
import { CreatorConfigsPublicApiHttpError } from '@modules/clients/creatorConfigsPublicApi';
import { ErrorPage } from '@modules/miscellaneous/error';
import { fetchRtbfConfig, saveRtbfConfig } from '../../rtbfConfigApi';
import type { RtbfTemplateRow } from '../../types';
import { RtbfConfigType, MAX_RTBF_TEMPLATES, RTBF_TEMPLATES_PER_PAGE } from '../../types';
import useToast from '../../utils/useToast';
import RtbfConfigDialog, { buildPreview } from '../CreateRtbfConfigDialog/CreateRtbfConfigDialog';
import useRtbfConfigsViewStyles from './RtbfConfigsView.styles';

type RtbfConfigsViewProps = {
  universeId: number;
};

const ROWS_PER_PAGE_OPTIONS: ReadonlyArray<number> = [
  RTBF_TEMPLATES_PER_PAGE,
  25,
  50,
  MAX_RTBF_TEMPLATES,
];

type ValidationErrorBody = {
  validationErrors?: ReadonlyArray<{ code?: string }>;
};

function isValidationErrorBody(value: unknown): value is ValidationErrorBody {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const errors = (value as { validationErrors?: unknown }).validationErrors;
  if (errors === undefined) {
    return true;
  }
  return (
    Array.isArray(errors) && errors.every((entry) => typeof entry === 'object' && entry !== null)
  );
}

function isDuplicateTemplateError(error: CreatorConfigsPublicApiHttpError): boolean {
  try {
    const parsed: unknown = JSON.parse(error.bodyText);
    if (!isValidationErrorBody(parsed)) {
      return false;
    }
    return parsed.validationErrors?.some((e) => e.code === 'DuplicateListItem') === true;
  } catch {
    return false;
  }
}

function getPatternDisplay(row: RtbfTemplateRow): string {
  if (row.configType === RtbfConfigType.StandardDataStore) {
    return row.dataStorePattern;
  }
  const scope = row.scopePattern || 'global';
  return `${row.dataStoreName} / ${scope} / ${row.keyPattern}`;
}

function getPreviewDisplay(row: RtbfTemplateRow): string {
  return buildPreview(
    row.configType,
    row.dataStorePattern,
    row.dataStoreName,
    row.keyPattern,
    row.scopePattern,
  );
}

const RtbfConfigsView: FunctionComponent<RtbfConfigsViewProps> = ({ universeId }) => {
  const {
    classes: {
      loadingContainer,
      pageContainer,
      headerSection,
      descriptionRow,
      learnMoreLink,
      actionBar,
      patternText,
      emptyStateCell,
      shrinkCell,
      hoverRow,
      actionButtons,
    },
    cx,
  } = useRtbfConfigsViewStyles();
  const { translate } = useTranslation();
  const [templates, setTemplates] = useState<RtbfTemplateRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<RtbfTemplateRow | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(RTBF_TEMPLATES_PER_PAGE);
  const showToast = useToast();

  const universeIdStr = String(universeId);

  const typeLabels: Record<RtbfConfigType, string> = {
    [RtbfConfigType.StandardKey]: translate('Label.RtbfStandardKey'),
    [RtbfConfigType.StandardDataStore]: translate('Label.RtbfStandardDataStore'),
    [RtbfConfigType.OrderedKey]: translate('Label.RtbfOrderedKey'),
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setPermissionDenied(false);
      try {
        const rows = await fetchRtbfConfig(universeIdStr);
        if (!cancelled) {
          setTemplates(rows);
        }
      } catch (error) {
        if (!cancelled) {
          if (
            error instanceof CreatorConfigsPublicApiHttpError &&
            error.status === (StatusCodes.FORBIDDEN as number)
          ) {
            setPermissionDenied(true);
          } else {
            showToast(translate('Message.RtbfLoadFailed'), true);
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [universeIdStr, showToast, translate]);

  const persistTemplates = async (updated: RtbfTemplateRow[], successMessage: string) => {
    setIsSaving(true);
    try {
      await saveRtbfConfig(universeIdStr, updated);
      setTemplates(updated);
      setPage(0);
      showToast(successMessage, false);
    } catch (error) {
      if (error instanceof CreatorConfigsPublicApiHttpError) {
        if (error.status === (StatusCodes.FORBIDDEN as number)) {
          showToast(translate('Message.RtbfNoWritePermission'), true);
        } else if (isDuplicateTemplateError(error)) {
          showToast(translate('Message.RtbfDuplicateTemplate'), true);
        } else {
          showToast(translate('Message.RtbfSaveFailed'), true);
        }
      } else {
        showToast(translate('Message.RtbfSaveFailed'), true);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (templateId: string) => {
    const updated = templates.filter((t) => t.id !== templateId);
    void persistTemplates(updated, translate('Message.RtbfTemplateDeleted'));
  };

  const handleSave = (row: RtbfTemplateRow) => {
    const existingIndex = templates.findIndex((t) => t.id === row.id);
    let updated: RtbfTemplateRow[];
    if (existingIndex >= 0) {
      updated = templates.map((t) => (t.id === row.id ? row : t));
    } else {
      if (templates.length >= MAX_RTBF_TEMPLATES) {
        return;
      }
      updated = [...templates, row];
    }
    const message =
      existingIndex >= 0
        ? translate('Message.RtbfTemplateUpdated')
        : translate('Message.RtbfTemplateCreated');
    void persistTemplates(updated, message);
  };

  const handleEdit = (row: RtbfTemplateRow) => {
    setEditingRow(row);
    setIsDialogOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingRow(null);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingRow(null);
  };

  if (isLoading) {
    return (
      <div className={loadingContainer}>
        <CircularProgress size={32} />
      </div>
    );
  }

  if (permissionDenied) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  return (
    <div className={pageContainer}>
      <div className={headerSection}>
        <Typography variant='h5'>{translate('Heading.RtbfDeletion')}</Typography>
        <div className={descriptionRow}>
          <Typography variant='body1' color='secondary'>
            {translate('Description.RtbfConfig')}
          </Typography>
          <a
            href='https://create.roblox.com/docs/cloud-services/data-stores/right-to-be-forgotten'
            target='_blank'
            rel='noopener noreferrer'
            className={learnMoreLink}>
            <Typography variant='body1' color='primary' component='span'>
              {translate('Action.LearnMore')}
            </Typography>
          </a>
        </div>
      </div>

      <div className={actionBar}>
        <Button
          variant='Emphasis'
          size='Medium'
          isDisabled={templates.length >= MAX_RTBF_TEMPLATES || isSaving}
          onClick={handleOpenCreate}>
          {translate('Action.RtbfCreateTemplate')}
        </Button>
        <Typography variant='body2' color='secondary'>
          {templates.length} / {MAX_RTBF_TEMPLATES} {translate('Label.RtbfTemplates')}
        </Typography>
      </div>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell className={shrinkCell}>
                <Typography variant='caption' color='secondary'>
                  {translate('Label.RtbfType')}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant='caption' color='secondary'>
                  {translate('Label.RtbfPattern')}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant='caption' color='secondary'>
                  {translate('Label.RtbfPreview')}
                </Typography>
              </TableCell>
              <TableCell className={shrinkCell} />
            </TableRow>
          </TableHead>
          <TableBody>
            {templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align='center' className={emptyStateCell}>
                  <Typography color='secondary' variant='body1'>
                    {translate('Description.RtbfEmpty')}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              templates.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map((row) => (
                <TableRow key={row.id} hover className={cx(hoverRow)}>
                  <TableCell className={shrinkCell}>
                    <Badge label={typeLabels[row.configType]} variant='Neutral' />
                  </TableCell>
                  <TableCell>
                    <Typography variant='body1' className={patternText}>
                      {getPatternDisplay(row)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant='body2' color='secondary' className={patternText}>
                      {getPreviewDisplay(row)}
                    </Typography>
                  </TableCell>
                  <TableCell className={shrinkCell} align='right'>
                    <div className={`${actionButtons} rtbf-action-icons`}>
                      <IconButton
                        size='small'
                        color='secondary'
                        disabled={isSaving}
                        aria-label={translate('Label.RtbfEdit')}
                        onClick={() => handleEdit(row)}>
                        <EditOutlinedIcon />
                      </IconButton>
                      <IconButton
                        size='small'
                        color='secondary'
                        disabled={isSaving}
                        aria-label={translate('Label.RtbfDelete')}
                        onClick={() => handleDelete(row.id)}>
                        <DeleteOutlinedIcon />
                      </IconButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {templates.length > 0 && (
            <TableFooter>
              <TableRow>
                <TablePagination
                  component='td'
                  count={templates.length}
                  page={page}
                  rowsPerPage={rowsPerPage}
                  rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
                  onPageChange={(_, newPage) => setPage(newPage)}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                />
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </TableContainer>

      <RtbfConfigDialog
        open={isDialogOpen}
        existingCount={templates.length}
        editingRow={editingRow}
        onClose={handleDialogClose}
        onSave={handleSave}
      />
    </div>
  );
};

export default RtbfConfigsView;
