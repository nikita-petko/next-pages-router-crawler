import type { ReactNode } from 'react';
import { useCallback, useMemo, useState, type FunctionComponent } from 'react';
import {
  Button,
  SheetActions,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetRoot,
  SheetTitle,
  TextInput,
  Toggle,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { BoldTag } from '@modules/charts-generic/utils/translateHTMLTags';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  LEADERBOARD_LEARN_MORE_URL,
  type LeaderboardConfig,
  type LeaderboardConfigEntry,
  type LeaderboardConfigItem,
} from '../../types';
import {
  convertBackendErrorToTranslationKey,
  FIELD_KEYS,
  useShowLeaderboardSaveErrorToasts,
  type LeaderboardFieldErrors,
  type LeaderboardFormFieldKey,
} from '../../utils/convertBackendErrorToTranslationKey';

type Mode = 'create' | 'edit';

type FormState = {
  leaderboardName: string;
  orderedDataStoreName: string;
  keyMappingTemplate: string;
  scope: string;
  unit: string;
  isActive: boolean;
};

const EMPTY_FORM: FormState = {
  leaderboardName: '',
  orderedDataStoreName: '',
  keyMappingTemplate: '',
  scope: '',
  unit: '',
  isActive: true,
};

type Props = {
  onClose: () => void;
  mode: Mode;
  editItem?: LeaderboardConfigItem;
  config: LeaderboardConfig | undefined;
  save: (entry: LeaderboardConfigEntry, isActive: boolean) => Promise<void>;
  onSuccess: () => void;
  isPending?: boolean;
};

const buildInitialState = (
  mode: Mode,
  editItem: LeaderboardConfigItem | undefined,
  isCurrentlyActive: boolean,
): FormState => {
  if (mode === 'edit' && editItem) {
    return {
      leaderboardName: editItem.config.leaderboard_name,
      orderedDataStoreName: editItem.config.ordered_data_store.name,
      keyMappingTemplate: editItem.config.ordered_data_store.key_mapping_template ?? '',
      scope: editItem.config.scope ?? '',
      unit: editItem.config.unit,
      isActive: isCurrentlyActive,
    };
  }
  return EMPTY_FORM;
};

// TODO: ideally creator-hub BE should own null handling.
const fallback = (value: string | undefined, defaultValue: string): string =>
  value == null || value === '' ? defaultValue : value;

const handleNullEntries = (entry: LeaderboardConfigEntry): LeaderboardConfigEntry => ({
  ...entry,
  scope: fallback(entry.scope, 'global'),
  ordered_data_store: {
    ...entry.ordered_data_store,
    key_mapping_template: fallback(
      entry.ordered_data_store.key_mapping_template,
      'Player_{UserId}',
    ),
  },
});

const LeaderboardFormSheet: FunctionComponent<Props> = ({
  onClose,
  mode,
  editItem,
  config,
  save,
  onSuccess,
  isPending = false,
}) => {
  const intl = useTranslation();
  const { translate, translateHTML } = useTranslationWrapper(intl);
  const showSaveErrorToasts = useShowLeaderboardSaveErrorToasts();

  const editKey = editItem?.key;
  const isCurrentlyActive =
    editKey != null && (config?.activeLeaderboardKeys.includes(editKey) ?? false);

  const [state, setState] = useState<FormState>(() =>
    buildInitialState(mode, editItem, isCurrentlyActive),
  );
  const [serverErrors, setServerErrors] = useState<LeaderboardFieldErrors>({});

  const otherActiveLeaderboardName =
    config?.leaderboards.find(
      (entry) => entry.key !== editKey && config.activeLeaderboardKeys.includes(entry.key),
    )?.config.leaderboard_name ?? '';

  const sheetTitle = translate(
    translationKey(
      mode === 'create' ? 'Title.Create' : 'Heading.EditLeaderboard',
      TranslationNamespace.Leaderboards,
    ),
  );
  const description = translate(
    translationKey(
      'Description.ConfiguredLeaderboardsWillAppearInGame',
      TranslationNamespace.Leaderboards,
    ),
  );

  const nameLabel = translate(translationKey('Heading.Name', TranslationNamespace.Leaderboards));
  const namePlaceholder = translate(
    translationKey('Label.KillsNamePlaceholder', TranslationNamespace.Leaderboards),
  );
  const nameHelperText = translate(
    translationKey('Label.NameNotVisibleToUsers', TranslationNamespace.Leaderboards),
  );

  const odsLabel = translate(
    translationKey('Heading.OrderedDataStore', TranslationNamespace.Leaderboards),
  );
  const odsPlaceholder = translate(
    translationKey('Label.LeaderboardDataStorePlaceholder', TranslationNamespace.Leaderboards),
  );
  const odsHelperText = translate(
    translationKey('Label.ExactDataStoreName', TranslationNamespace.Leaderboards),
  );

  const keyTemplateLabel = translate(
    translationKey('Heading.ODSKeyTemplate', TranslationNamespace.Leaderboards),
  );
  const keyTemplatePlaceholder = translate(
    translationKey('Label.KeyTemplatePlaceholder', TranslationNamespace.Leaderboards),
  );
  const optionalHelperText = translate(
    translationKey('Label.Optional', TranslationNamespace.Leaderboards),
  );

  const scopeLabel = translate(translationKey('Heading.Scope', TranslationNamespace.Leaderboards));
  const scopePlaceholder = translate(
    translationKey('Label.GlobalScopePlaceholder', TranslationNamespace.Leaderboards),
  );

  const unitLabel = translate(translationKey('Heading.Unit', TranslationNamespace.Leaderboards));
  const unitPlaceholder = translate(
    translationKey('Label.UnitPlaceholder', TranslationNamespace.Leaderboards),
  );

  const activeSectionTitle = translate(
    translationKey('Label.ActiveLeaderboard', TranslationNamespace.Leaderboards),
  );
  const showOtherActiveCopy = otherActiveLeaderboardName !== '';
  const activeDescriptionRaw: ReactNode = showOtherActiveCopy
    ? translateHTML(
        translationKey(
          'Description.AlreadyHasActiveLeaderboard',
          TranslationNamespace.Leaderboards,
        ),
        [BoldTag],
        { leaderboardName: otherActiveLeaderboardName },
      )
    : translate(
        translationKey('Description.OnlyOneActiveLeaderboard', TranslationNamespace.Leaderboards),
      );

  const learnMoreLabel = translate(
    translationKey('Action.LearnMore', TranslationNamespace.Leaderboards),
  );

  const cancelLabel = intl.translate('Action.Cancel');
  const submitLabel = translate(
    translationKey(
      mode === 'create' ? 'Action.Create' : 'Action.Save',
      TranslationNamespace.Leaderboards,
    ),
  );

  const isValid =
    state.leaderboardName !== '' && state.orderedDataStoreName !== '' && state.unit !== '';

  const errorMessages = useMemo<Partial<Record<LeaderboardFormFieldKey, string>>>(() => {
    const out: Partial<Record<LeaderboardFormFieldKey, string>> = {};
    for (const field of FIELD_KEYS) {
      const entry = serverErrors[field];
      if (entry == null) {
        continue;
      }
      if (entry.translationKey != null) {
        out[field] = String(
          translate(translationKey(entry.translationKey, TranslationNamespace.Leaderboards)),
        );
      } else if (entry.rawMessage != null) {
        out[field] = entry.rawMessage;
      }
    }
    return out;
  }, [serverErrors, translate]);

  const handleSubmit = async () => {
    if (!isValid || isPending) {
      return;
    }
    const entry = handleNullEntries({
      leaderboard_name: state.leaderboardName,
      unit: state.unit,
      ordered_data_store: {
        name: state.orderedDataStoreName,
        ...(state.keyMappingTemplate !== '' && { key_mapping_template: state.keyMappingTemplate }),
      },
      ...(state.scope !== '' && { scope: state.scope }),
    });
    try {
      await save(entry, state.isActive);
      setServerErrors({});
      onSuccess();
    } catch (err) {
      const { fieldErrors, unmappedErrors } = convertBackendErrorToTranslationKey(err);
      setServerErrors(fieldErrors);
      if (unmappedErrors.length > 0) {
        showSaveErrorToasts(unmappedErrors);
      }
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const setStringField = <K extends LeaderboardFormFieldKey>(key: K, value: string) => {
    setState((prev) => ({ ...prev, [key]: value }));
    if (serverErrors[key]) {
      setServerErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const setActiveField = useCallback((next: boolean) => {
    setState((prev) => ({ ...prev, isActive: next }));
  }, []);

  return (
    <SheetRoot
      open
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}>
      <SheetContent closeLabel={cancelLabel}>
        <SheetTitle>{sheetTitle}</SheetTitle>
        <SheetBody className='flex flex-col gap-y-large padding-bottom-xlarge'>
          <SheetDescription>
            <p className='text-body-medium content-muted margin-none'>{description}</p>
          </SheetDescription>

          <TextInput
            size='Medium'
            label={String(nameLabel)}
            placeholder={String(namePlaceholder)}
            helperText={String(nameHelperText)}
            error={errorMessages.leaderboardName}
            value={state.leaderboardName}
            onChange={(e) => setStringField('leaderboardName', e.target.value)}
            data-autofocus-priority='1'
          />

          <TextInput
            size='Medium'
            label={String(odsLabel)}
            placeholder={String(odsPlaceholder)}
            helperText={String(odsHelperText)}
            error={errorMessages.orderedDataStoreName}
            value={state.orderedDataStoreName}
            onChange={(e) => setStringField('orderedDataStoreName', e.target.value)}
          />

          <TextInput
            size='Medium'
            label={String(keyTemplateLabel)}
            placeholder={String(keyTemplatePlaceholder)}
            helperText={String(optionalHelperText)}
            error={errorMessages.keyMappingTemplate}
            value={state.keyMappingTemplate}
            onChange={(e) => setStringField('keyMappingTemplate', e.target.value)}
          />

          <TextInput
            size='Medium'
            label={String(scopeLabel)}
            placeholder={String(scopePlaceholder)}
            helperText={String(optionalHelperText)}
            error={errorMessages.scope}
            value={state.scope}
            onChange={(e) => setStringField('scope', e.target.value)}
          />

          <TextInput
            size='Medium'
            label={String(unitLabel)}
            placeholder={String(unitPlaceholder)}
            // NBSP (not a plain space) so the support-text line box doesn't collapse — reserves space for inline error.
            helperText={'\u00A0'}
            error={errorMessages.unit}
            value={state.unit}
            onChange={(e) => setStringField('unit', e.target.value)}
          />

          <div className='flex items-start gap-small padding-top-medium'>
            <Toggle
              size='Small'
              placement='Start'
              aria-label={String(activeSectionTitle)}
              isChecked={state.isActive}
              onCheckedChange={setActiveField}
            />
            <div className='flex flex-col gap-xsmall'>
              <span className='text-label-medium content-emphasis'>
                {String(activeSectionTitle)}
              </span>
              <p className='text-body-small content-muted margin-none'>
                {activeDescriptionRaw}{' '}
                <a
                  href={LEADERBOARD_LEARN_MORE_URL}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='underline [color:inherit]'>
                  {String(learnMoreLabel)}
                </a>
              </p>
            </div>
          </div>
        </SheetBody>
        <SheetActions className='flex gap-small'>
          <Button
            variant='Emphasis'
            className='fill basis-0'
            isDisabled={!isValid || isPending}
            onClick={handleSubmit}>
            {submitLabel}
          </Button>
          <Button
            variant='Standard'
            className='fill basis-0'
            isDisabled={isPending}
            onClick={handleCancel}>
            {cancelLabel}
          </Button>
        </SheetActions>
      </SheetContent>
    </SheetRoot>
  );
};

export default LeaderboardFormSheet;
