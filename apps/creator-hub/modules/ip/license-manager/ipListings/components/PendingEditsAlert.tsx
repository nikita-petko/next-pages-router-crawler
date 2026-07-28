import React, { useState, useCallback, useMemo } from 'react';
import type { PendingLicenseEdits } from '@rbx/client-content-licensing-api/v1';
import { useTranslation } from '@rbx/intl';
import {
  Alert,
  AlertTitle,
  AccessTimeIcon,
  makeStyles,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ExpandMoreIcon,
  Grid,
  Button,
} from '@rbx/ui';
import { CONTENT_STANDARDS_HREF } from '@modules/licenses/urls';
import downloadPdf from '@modules/licenses/utils/downloadPdf';
import Flex from '@modules/miscellaneous/components/Flex';

const useStyles = makeStyles()((theme) => ({
  alert: {
    width: '100%',
    alignItems: 'flex-start',
    '& .MuiAlert-message': {
      flex: 1,
    },
    '& .MuiAlert-icon': {
      paddingTop: '4px',
      paddingBottom: 0,
    },
  },
  accordion: {
    backgroundColor: 'transparent',
    border: 'none',
    boxShadow: 'none',
    '&:before': {
      display: 'none',
    },
  },
  accordionSummary: {
    padding: 0,
    minHeight: 'auto',
    alignItems: 'flex-start',
    '& .MuiAccordionSummary-content': {
      margin: 0,
    },
    '& .MuiAccordionSummary-expandIconWrapper': {
      marginTop: 4,
    },
    '&.Mui-expanded': {
      minHeight: 'auto',
      '& .MuiAccordionSummary-content': {
        margin: 0,
      },
    },
  },
  accordionDetails: {
    padding: 0,
  },
  fieldRow: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontWeight: 600,
    marginBottom: 8,
  },
  columnHeader: {
    display: 'block',
    color: theme.palette.content.muted,
    marginBottom: 4,
  },
  beforeValue: {
    color: theme.palette.content.muted,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  afterValue: {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  alertTitle: {
    marginBottom: 0,
  },
}));

interface CurrentLicenseValues {
  name?: string;
  description?: string;
  contentStandardsDocumentId?: string;
  contentStandardScope?: string;
}

export interface PendingEditsAlertProps {
  pendingEdits: PendingLicenseEdits;
  currentValues?: CurrentLicenseValues;
  licenseName?: string;
}

interface ChangedField {
  label: string;
  currentValue?: string | null;
  pendingValue?: string | null;
  isDocument?: boolean;
  documentId?: string | null;
  currentDocumentId?: string | null;
}

interface PendingFieldDisplayProps {
  field: ChangedField;
  licenseName?: string;
}

const EmptyGuid = '00000000-0000-0000-0000-000000000000';

const isValidDocumentId = (documentId: string | null | undefined): boolean => {
  return !!documentId && documentId !== EmptyGuid && documentId !== '';
};

const PendingFieldDisplay: React.FC<PendingFieldDisplayProps> = ({ field, licenseName }) => {
  const { translate } = useTranslation();
  const { classes } = useStyles();

  const handleDownloadPendingDocument = useCallback(async () => {
    if (!field.documentId) {
      return;
    }
    await downloadPdf(
      CONTENT_STANDARDS_HREF(field.documentId),
      translate('Label.ContentStandardsPdf', { licenseName: licenseName || '' }),
    );
  }, [field.documentId, licenseName, translate]);

  const handleDownloadCurrentDocument = useCallback(async () => {
    if (!field.currentDocumentId) {
      return;
    }
    await downloadPdf(
      CONTENT_STANDARDS_HREF(field.currentDocumentId),
      translate('Label.ContentStandardsPdf', { licenseName: licenseName || '' }),
    );
  }, [field.currentDocumentId, licenseName, translate]);

  if (field.isDocument) {
    return (
      <Grid item XSmall={12} className={classes.fieldRow}>
        <Typography variant='body2' className={classes.fieldLabel}>
          {field.label}
        </Typography>
        <Grid container spacing={2}>
          <Grid item XSmall={6}>
            <Typography variant='caption' className={classes.columnHeader}>
              {translate('Label.Before')}
            </Typography>
            {isValidDocumentId(field.currentDocumentId) ? (
              <Button
                variant='outlined'
                size='small'
                color='primary'
                onClick={handleDownloadCurrentDocument}>
                {translate('Action.DownloadCurrentDocument')}
              </Button>
            ) : (
              <Typography variant='body2' className={classes.beforeValue}>
                —
              </Typography>
            )}
          </Grid>
          <Grid item XSmall={6}>
            <Typography variant='caption' className={classes.columnHeader}>
              {translate('Label.After')}
            </Typography>
            <Button
              variant='outlined'
              size='small'
              color='primary'
              onClick={handleDownloadPendingDocument}>
              {translate('Action.DownloadPendingDocument')}
            </Button>
          </Grid>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid item XSmall={12} className={classes.fieldRow}>
      <Typography variant='body2' className={classes.fieldLabel}>
        {field.label}
      </Typography>
      <Grid container spacing={2}>
        <Grid item XSmall={6}>
          <Typography variant='caption' className={classes.columnHeader}>
            {translate('Label.Before')}
          </Typography>
          <Typography variant='body2' className={classes.beforeValue}>
            {field.currentValue || '—'}
          </Typography>
        </Grid>
        <Grid item XSmall={6}>
          <Typography variant='caption' className={classes.columnHeader}>
            {translate('Label.After')}
          </Typography>
          <Typography variant='body2' className={classes.afterValue}>
            {field.pendingValue}
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  );
};

const PendingEditsAlert: React.FC<PendingEditsAlertProps> = ({
  pendingEdits,
  currentValues,
  licenseName,
}) => {
  const { translate } = useTranslation();
  const { classes } = useStyles();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  const changedFields = useMemo(() => {
    const fields: ChangedField[] = [];

    if (pendingEdits.name && pendingEdits.name !== currentValues?.name) {
      fields.push({
        label: translate('Label.Name'),
        currentValue: currentValues?.name,
        pendingValue: pendingEdits.name,
      });
    }

    if (pendingEdits.description && pendingEdits.description !== currentValues?.description) {
      fields.push({
        label: translate('Label.Description'),
        currentValue: currentValues?.description,
        pendingValue: pendingEdits.description,
      });
    }

    if (
      pendingEdits.contentStandardScope &&
      pendingEdits.contentStandardScope !== currentValues?.contentStandardScope
    ) {
      fields.push({
        label: translate('Label.ScopeOfLicense'),
        currentValue: currentValues?.contentStandardScope,
        pendingValue: pendingEdits.contentStandardScope,
      });
    }

    if (
      pendingEdits.contentStandardsDocumentId &&
      pendingEdits.contentStandardsDocumentId !== currentValues?.contentStandardsDocumentId
    ) {
      fields.push({
        label: translate('Label.BrandGuidelinesOptional'),
        isDocument: true,
        documentId: pendingEdits.contentStandardsDocumentId,
        currentDocumentId: currentValues?.contentStandardsDocumentId,
      });
    }

    return fields;
  }, [pendingEdits, currentValues, translate]);

  const hasAnyChangedField = changedFields.length > 0;

  if (!hasAnyChangedField) {
    return null;
  }

  return (
    <Alert severity='info' variant='outlined' className={classes.alert} icon={<AccessTimeIcon />}>
      <Accordion
        expanded={isExpanded}
        onChange={handleToggle}
        className={classes.accordion}
        disableGutters>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          className={classes.accordionSummary}
          data-testid='pending-edits-accordion'>
          <Flex flexDirection='column' alignItems='flex-start' gap={4}>
            <AlertTitle className={classes.alertTitle}>
              {translate('Label.PendingReview')}
            </AlertTitle>
            <Typography variant='body2' color='primary'>
              {isExpanded
                ? translate('Action.HidePendingChanges')
                : translate('Action.ViewPendingChanges')}
            </Typography>
          </Flex>
        </AccordionSummary>
        <AccordionDetails className={classes.accordionDetails}>
          <Grid container spacing={1}>
            {changedFields.map((field) => (
              <PendingFieldDisplay key={field.label} field={field} licenseName={licenseName} />
            ))}
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Alert>
  );
};

export default PendingEditsAlert;
