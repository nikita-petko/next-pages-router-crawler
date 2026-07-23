import type { FunctionComponent } from 'react';
import { Fragment, useState, useEffect } from 'react';
import { Button, Dialog, DialogContent, Dropdown, Menu, MenuItem } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Card, CardContent, TextField, Typography } from '@rbx/ui';
import type { RtbfTemplateRow } from '../../types';
import { RtbfConfigType, MAX_RTBF_TEMPLATES, MAX_RTBF_FIELD_LENGTH } from '../../types';
import useRtbfConfigDialogStyles from './CreateRtbfConfigDialog.styles';

type RtbfConfigDialogProps = {
  open: boolean;
  existingCount: number;
  editingRow?: RtbfTemplateRow | null;
  onClose: () => void;
  onSave: (row: RtbfTemplateRow) => void;
};

const isKeyType = (type: RtbfConfigType) =>
  type === RtbfConfigType.StandardKey || type === RtbfConfigType.OrderedKey;

const USERID_PLACEHOLDER = '{UserId}';
const DUMMY_USERID = '12345678';

type FieldErrors = {
  dataStorePattern?: string;
  dataStoreName?: string;
  keyPattern?: string;
  scopePattern?: string;
};

type ValidationMessages = {
  charLimit: string;
  enterDsPattern: string;
  enterDsName: string;
  enterKeyPattern: string;
};

type RtbfFields = {
  dataStorePattern: string;
  dataStoreName: string;
  keyPattern: string;
  scopePattern: string;
};

function isOverLimit(value: string): boolean {
  return value.trim().length > MAX_RTBF_FIELD_LENGTH;
}

function validateField(
  value: string,
  charLimitMsg: string,
  requiredMsg?: string,
): string | undefined {
  if (requiredMsg && value.trim() === '') {
    return requiredMsg;
  }
  if (isOverLimit(value)) {
    return charLimitMsg;
  }
  return undefined;
}

function validateFields(
  type: RtbfConfigType,
  fields: RtbfFields,
  msgs: ValidationMessages,
): FieldErrors {
  const errors: FieldErrors = {};

  if (type === RtbfConfigType.StandardDataStore) {
    errors.dataStorePattern = validateField(
      fields.dataStorePattern,
      msgs.charLimit,
      msgs.enterDsPattern,
    );
  } else {
    errors.dataStoreName = validateField(fields.dataStoreName, msgs.charLimit, msgs.enterDsName);
    errors.keyPattern = validateField(fields.keyPattern, msgs.charLimit, msgs.enterKeyPattern);
    errors.scopePattern = validateField(fields.scopePattern, msgs.charLimit);
  }

  return errors;
}

function hasErrors(errs: FieldErrors): boolean {
  return Object.values(errs).some(Boolean);
}

function isUserIdRequirementMet(type: RtbfConfigType, fields: RtbfFields): boolean {
  if (type === RtbfConfigType.StandardDataStore) {
    return fields.dataStorePattern.includes(USERID_PLACEHOLDER);
  }
  return (
    fields.keyPattern.includes(USERID_PLACEHOLDER) ||
    fields.scopePattern.includes(USERID_PLACEHOLDER)
  );
}

export function buildPreview(
  type: RtbfConfigType,
  dataStorePattern: string,
  dataStoreName: string,
  keyPattern: string,
  scopePattern: string,
): string {
  const replace = (s: string) => s.replaceAll(/\{UserId\}/g, DUMMY_USERID);

  if (type === RtbfConfigType.StandardDataStore) {
    if (dataStorePattern.trim() === '') {
      return '';
    }
    return replace(dataStorePattern.trim());
  }

  const ds = dataStoreName.trim();
  const kp = keyPattern.trim();
  const sp = scopePattern.trim() || 'global';
  if (!ds && !kp && !scopePattern.trim()) {
    return '';
  }
  return `${ds} / ${replace(sp)} / ${replace(kp)}`;
}

const RtbfConfigDialog: FunctionComponent<RtbfConfigDialogProps> = ({
  open,
  existingCount,
  editingRow,
  onClose,
  onSave,
}) => {
  const {
    classes: {
      dialogContent,
      heading,
      fieldSpacing,
      fieldLabel,
      previewCard,
      previewCardContent,
      previewText,
      userIdError,
      buttonRow,
    },
  } = useRtbfConfigDialogStyles();
  const { translate } = useTranslation();
  const isEditing = editingRow != null;

  const [selectedType, setSelectedType] = useState<RtbfConfigType>(
    RtbfConfigType.StandardDataStore,
  );
  const [dataStorePattern, setDataStorePattern] = useState('');
  const [dataStoreName, setDataStoreName] = useState('');
  const [keyPattern, setKeyPattern] = useState('');
  const [scopePattern, setScopePattern] = useState('');
  const [submitErrors, setSubmitErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (open && editingRow) {
      setSelectedType(editingRow.configType);
      setDataStorePattern(editingRow.dataStorePattern);
      setDataStoreName(editingRow.dataStoreName);
      setKeyPattern(editingRow.keyPattern);
      setScopePattern(editingRow.scopePattern === 'global' ? '' : editingRow.scopePattern);
      setSubmitErrors({});
    } else if (open && !editingRow) {
      setSelectedType(RtbfConfigType.StandardDataStore);
      setDataStorePattern('');
      setDataStoreName('');
      setKeyPattern('');
      setScopePattern('');
      setSubmitErrors({});
    }
  }, [open, editingRow]);

  const msgs: ValidationMessages = {
    charLimit: translate('Error.RtbfCharLimit'),
    enterDsPattern: translate('Error.RtbfEnterDsPattern'),
    enterDsName: translate('Error.RtbfEnterDsName'),
    enterKeyPattern: translate('Error.RtbfEnterKeyPattern'),
  };

  const fields = { dataStorePattern, dataStoreName, keyPattern, scopePattern };
  const userIdSatisfied = isUserIdRequirementMet(selectedType, fields);
  const userIdRequirementMsg =
    selectedType === RtbfConfigType.StandardDataStore
      ? translate('Error.RtbfUserIdRequiredForDsSchema')
      : translate('Error.RtbfUserIdRequiredForKeySchema');

  const liveErrors: FieldErrors = {};
  if (isOverLimit(dataStorePattern)) {
    liveErrors.dataStorePattern = msgs.charLimit;
  }
  if (isOverLimit(dataStoreName)) {
    liveErrors.dataStoreName = msgs.charLimit;
  }
  if (isOverLimit(keyPattern)) {
    liveErrors.keyPattern = msgs.charLimit;
  }
  if (isOverLimit(scopePattern)) {
    liveErrors.scopePattern = msgs.charLimit;
  }

  const displayErrors: FieldErrors = { ...submitErrors, ...liveErrors };
  const hasAnyDisplayError = hasErrors(displayErrors);

  const handleSave = () => {
    const errs = validateFields(selectedType, fields, msgs);
    setSubmitErrors(errs);
    if (hasErrors(errs)) {
      return;
    }

    const type = selectedType;
    const row: RtbfTemplateRow = {
      id: editingRow?.id ?? `tmpl-${Date.now()}`,
      configType: type,
      dataStoreName: type === RtbfConfigType.StandardDataStore ? '' : dataStoreName.trim(),
      keyPattern: type === RtbfConfigType.StandardDataStore ? '' : keyPattern.trim(),
      scopePattern: isKeyType(type) ? scopePattern.trim() || 'global' : '',
      dataStorePattern: type === RtbfConfigType.StandardDataStore ? dataStorePattern.trim() : '',
    };

    onSave(row);
    onClose();
  };

  const handleTypeChange = (value: string) => {
    setSelectedType(value as RtbfConfigType);
    setSubmitErrors({});
  };

  const isDataStoreType = selectedType === RtbfConfigType.StandardDataStore;
  const atLimit = !isEditing && existingCount >= MAX_RTBF_TEMPLATES;
  const isSaveDisabled =
    atLimit || !userIdSatisfied || hasErrors(validateFields(selectedType, fields, msgs));

  const preview = buildPreview(
    selectedType,
    dataStorePattern,
    dataStoreName,
    keyPattern,
    scopePattern,
  );

  const typeLabels: Record<RtbfConfigType, string> = {
    [RtbfConfigType.StandardDataStore]: translate('Label.RtbfStandardDataStore'),
    [RtbfConfigType.StandardKey]: translate('Label.RtbfStandardKey'),
    [RtbfConfigType.OrderedKey]: translate('Label.RtbfOrderedKey'),
  };

  const typeOptions = Object.values(RtbfConfigType).map((type) => ({
    value: type,
    label: typeLabels[type],
  }));

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}
      size='Large'
      isModal
      hasCloseAffordance={false}>
      <DialogContent>
        <div className={dialogContent}>
          <Typography variant='h5' className={heading}>
            {isEditing
              ? translate('Heading.RtbfEditTemplate')
              : translate('Heading.RtbfCreateTemplate')}
          </Typography>

          {atLimit && (
            <Typography variant='body1' color='error'>
              {translate('Message.RtbfMaxTemplates')}
            </Typography>
          )}

          <Dropdown
            className={fieldSpacing}
            size='Large'
            placeholder={translate('Label.RtbfType')}
            value={selectedType}
            onValueChange={handleTypeChange}>
            <Menu>
              {typeOptions.map((option) => (
                <MenuItem key={option.value} value={option.value} title={option.label} />
              ))}
            </Menu>
          </Dropdown>

          {isDataStoreType && (
            <TextField
              id='rtbf-data-store-pattern'
              label={translate('Label.RtbfDsPattern')}
              size='medium'
              placeholder='Creations_{UserId}'
              value={dataStorePattern}
              error={!!displayErrors.dataStorePattern}
              helperText={displayErrors.dataStorePattern || translate('Label.RtbfKeyPatternHint')}
              fullWidth
              onChange={(e) => {
                setDataStorePattern(e.target.value);
                setSubmitErrors((prev) => ({ ...prev, dataStorePattern: undefined }));
              }}
            />
          )}

          {!isDataStoreType && (
            <>
              <TextField
                id='rtbf-data-store-name'
                label={translate('Label.RtbfDataStore')}
                className={fieldSpacing}
                size='medium'
                placeholder='PlayerData'
                value={dataStoreName}
                error={!!displayErrors.dataStoreName}
                helperText={displayErrors.dataStoreName}
                fullWidth
                onChange={(e) => {
                  setDataStoreName(e.target.value);
                  setSubmitErrors((prev) => ({ ...prev, dataStoreName: undefined }));
                }}
              />

              <TextField
                id='rtbf-key-pattern'
                label={translate('Label.RtbfKeyPattern')}
                className={fieldSpacing}
                size='medium'
                placeholder='Player_{UserId}'
                value={keyPattern}
                error={!!displayErrors.keyPattern}
                helperText={displayErrors.keyPattern || translate('Label.RtbfKeyPatternHint')}
                fullWidth
                onChange={(e) => {
                  setKeyPattern(e.target.value);
                  setSubmitErrors((prev) => ({ ...prev, keyPattern: undefined }));
                }}
              />

              <TextField
                id='rtbf-scope-pattern'
                label={translate('Label.RtbfScope')}
                size='medium'
                placeholder='global'
                value={scopePattern}
                error={!!displayErrors.scopePattern}
                helperText={displayErrors.scopePattern || translate('Label.RtbfScopeHint')}
                fullWidth
                onChange={(e) => {
                  setScopePattern(e.target.value);
                  setSubmitErrors((prev) => ({ ...prev, scopePattern: undefined }));
                }}
              />
            </>
          )}

          <Card variant='outlined' className={previewCard}>
            <CardContent className={previewCardContent}>
              <Typography variant='subtitle2' className={fieldLabel}>
                {translate('Label.RtbfPreview')}
              </Typography>
              {preview && !hasAnyDisplayError && (
                <Typography variant='body2' color='secondary' className={previewText}>
                  {preview}
                </Typography>
              )}
            </CardContent>
          </Card>

          <Typography
            variant='body2'
            color='error'
            className={userIdError}
            style={{ visibility: preview && !userIdSatisfied ? 'visible' : 'hidden' }}>
            {userIdRequirementMsg}
          </Typography>

          <div className={buttonRow}>
            <Button variant='Standard' size='Medium' onClick={onClose}>
              {translate('Action.Cancel')}
            </Button>
            <Button
              variant='Emphasis'
              size='Medium'
              isDisabled={isSaveDisabled}
              onClick={handleSave}>
              {isEditing ? translate('Action.Save') : translate('Action.Create')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RtbfConfigDialog;
