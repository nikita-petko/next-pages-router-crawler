import { useTranslation } from '@rbx/intl';
import { CreatorConfigsPublicApiHttpError } from '@modules/clients/creatorConfigsPublicApi';
import { toast } from '@modules/monetization-shared/snackbar/actions';

export const FIELD_KEYS = [
  'leaderboardName',
  'orderedDataStoreName',
  'keyMappingTemplate',
  'scope',
  'unit',
] as const;
export type LeaderboardFormFieldKey = (typeof FIELD_KEYS)[number];

export type LeaderboardFieldErrorEntry = {
  translationKey?: string;
  rawMessage?: string;
};

export type LeaderboardFieldErrors = Partial<
  Record<LeaderboardFormFieldKey, LeaderboardFieldErrorEntry>
>;

export type ParsedBackendError = {
  fieldErrors: LeaderboardFieldErrors;
  unmappedErrors: LeaderboardFieldErrorEntry[];
};

// Mapping is keyed on the BE `code` (a stable enum from `ValidationErrorCode`) plus the resolved
// form field.
const TRANSLATION_KEY_BY_CODE_AND_FIELD: Readonly<
  Record<string, Partial<Record<LeaderboardFormFieldKey, string>>>
> = {
  MissingRequiredField: {
    leaderboardName: 'Label.LeaderboardNameRequiredError',
    unit: 'Label.UnitRequiredError',
    orderedDataStoreName: 'Label.OrderedDataStoreNameEmptyError',
  },
  StringExceedsMaxLength: {
    leaderboardName: 'Label.LeaderBoardNameTooLongError',
    unit: 'Label.UnitTooLongError',
    orderedDataStoreName: 'Label.OrderedDataStoreNameTooLongError',
    scope: 'Label.ScopeTooLongError',
    keyMappingTemplate: 'Label.KeyTemplateTooLongError',
  },
  TextFilterRejected: {
    leaderboardName: 'Label.InappropriateNameError',
    unit: 'Label.InappropriateUnitError',
  },
  InvalidValueType: {
    keyMappingTemplate: 'Label.KeyTemplateFormatError',
  },
};

const SERVER_FIELD_NAME_TO_KEY: Readonly<Record<string, LeaderboardFormFieldKey>> = {
  leaderboard_name: 'leaderboardName',
  unit: 'unit',
  'ordered_data_store.name': 'orderedDataStoreName',
  'ordered_data_store.key_mapping_template': 'keyMappingTemplate',
  scope: 'scope',
};

// Walks dotted segments so composite paths (ordered_data_store.name) win over their trailing field.
const extractFieldKey = (key: string): LeaderboardFormFieldKey | undefined => {
  let dotIdx = key.indexOf('.');
  while (dotIdx !== -1) {
    const fieldKey = SERVER_FIELD_NAME_TO_KEY[key.slice(dotIdx + 1)];
    if (fieldKey != null) {
      return fieldKey;
    }
    dotIdx = key.indexOf('.', dotIdx + 1);
  }
  return SERVER_FIELD_NAME_TO_KEY[key];
};

export const convertBackendErrorToTranslationKey = (error: unknown): ParsedBackendError => {
  const generic: ParsedBackendError = { fieldErrors: {}, unmappedErrors: [{}] };

  if (!(error instanceof CreatorConfigsPublicApiHttpError)) {
    return generic;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(error.bodyText);
  } catch {
    return generic;
  }

  const validationErrors =
    typeof parsed === 'object' && parsed != null && 'validationErrors' in parsed
      ? parsed.validationErrors
      : undefined;
  if (!Array.isArray(validationErrors) || validationErrors.length === 0) {
    return generic;
  }

  const fieldErrors: LeaderboardFieldErrors = {};
  const unmappedErrors: LeaderboardFieldErrorEntry[] = [];

  const entries: readonly unknown[] = validationErrors;
  for (const ve of entries) {
    if (typeof ve !== 'object' || ve == null) {
      continue;
    }
    const rawMessage = 'message' in ve && typeof ve.message === 'string' ? ve.message : undefined;
    const fieldKey =
      'key' in ve && typeof ve.key === 'string' ? extractFieldKey(ve.key) : undefined;
    if (fieldKey == null) {
      unmappedErrors.push({ rawMessage });
      continue;
    }
    const code = 'code' in ve && typeof ve.code === 'string' ? ve.code : undefined;
    fieldErrors[fieldKey] = {
      translationKey:
        code != null ? TRANSLATION_KEY_BY_CODE_AND_FIELD[code]?.[fieldKey] : undefined,
      rawMessage,
    };
  }

  return { fieldErrors, unmappedErrors };
};

export const useShowLeaderboardSaveErrorToasts = () => {
  const { translate } = useTranslation();
  return (errors: LeaderboardFieldErrorEntry[]) => {
    for (const entry of errors) {
      const localized = entry.translationKey != null ? translate(entry.translationKey) : undefined;
      const title = localized ?? entry.rawMessage ?? translate('Response.SomethingWentWrong');
      toast({ title });
    }
  };
};
