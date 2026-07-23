import type { FC } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { RpnOperator } from '../../api/universeConfigsClientEnums';
import type { ValidConditionRule } from '../../api/validTypes';
import ConditionPickerDropdown from '../../components/ConditionPickerDropdown';
import type { TargetingClauseFormData } from '../../types/FormData';
import { parseRuleTokensToClauses } from '../../utils/configFormDataTransforms';

type ExperimentTargetingCopyModalProps = {
  open: boolean;
  conditionRules: ReadonlyMap<string, ValidConditionRule>;
  shouldConfirmOverwrite: boolean;
  onClose: () => void;
  onCopy: (clauses: TargetingClauseFormData[]) => void;
};

const ExperimentTargetingCopyModal: FC<ExperimentTargetingCopyModalProps> = ({
  open,
  conditionRules,
  shouldConfirmOverwrite,
  onClose,
  onCopy,
}) => {
  const { translate, tPendingTranslation } = useTranslationWrapper(useTranslation());
  const [selectedConditionName, setSelectedConditionName] = useState<string | undefined>();

  useEffect(() => {
    if (!open) {
      setSelectedConditionName(undefined);
    }
  }, [open]);

  const conditionOptions = useMemo(
    () =>
      Array.from(conditionRules.keys())
        .sort((left, right) => left.localeCompare(right))
        .map((name) => ({ name })),
    [conditionRules],
  );

  const handleCopy = () => {
    if (!selectedConditionName) {
      return;
    }
    const selectedRule = conditionRules.get(selectedConditionName);
    if (!selectedRule) {
      return;
    }
    onCopy(
      parseRuleTokensToClauses(selectedRule.tokens).map((clause) => ({
        ...clause,
        joinerToNext: RpnOperator.And,
      })),
    );
    onClose();
  };

  const closeLabel = translate(translationKey('Action.Close', TranslationNamespace.Controls));

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}
      type='Default'
      size='Large'
      isModal
      hasCloseAffordance
      closeLabel={closeLabel}>
      <DialogContent className='width-[480px]'>
        <DialogBody className='flex flex-col gap-medium padding-large'>
          <DialogTitle className='text-heading-medium margin-none padding-right-large'>
            {tPendingTranslation(
              'Copy condition from Configs',
              'Dialog title for copying a global config condition into experiment targeting filters.',
              translationKey(
                'Title.ExperimentCreation.CopyConditionFromConfigs',
                TranslationNamespace.UniverseConfigAndExperimentation,
              ),
            )}
          </DialogTitle>
          <div className='text-body-medium content-muted'>
            {tPendingTranslation(
              'These conditions come from your global configs page. They will be copied as individual filters.',
              'Dialog description explaining that config conditions are copied into experiment targeting filters.',
              translationKey(
                'Message.ExperimentCreation.CopyConditionFromConfigs',
                TranslationNamespace.UniverseConfigAndExperimentation,
              ),
            )}
          </div>
          {shouldConfirmOverwrite && (
            <div className='text-body-medium content-alert'>
              {tPendingTranslation(
                'Copying will replace the filters currently set for this experiment.',
                'Warning shown before replacing existing experiment targeting filters with a copied condition.',
                translationKey(
                  'Message.ExperimentCreation.CopyConditionReplaceWarning',
                  TranslationNamespace.UniverseConfigAndExperimentation,
                ),
              )}
            </div>
          )}
          <ConditionPickerDropdown
            conditionOptions={conditionOptions}
            value={selectedConditionName}
            onValueChange={setSelectedConditionName}
            label={tPendingTranslation(
              'Condition',
              'Label for the condition dropdown in the copy-from-configs dialog.',
              translationKey(
                'Label.ExperimentCreation.CopyCondition',
                TranslationNamespace.UniverseConfigAndExperimentation,
              ),
            )}
            placeholder={tPendingTranslation(
              'Select a condition',
              'Placeholder for selecting a condition to copy into experiment targeting.',
              translationKey(
                'Placeholder.ExperimentCreation.CopyCondition',
                TranslationNamespace.UniverseConfigAndExperimentation,
              ),
            )}
          />
        </DialogBody>
        <div className='border-t border-stroke-default'>
          <DialogFooter className='flex gap-medium width-full padding-large'>
            <Button
              type='button'
              variant='Emphasis'
              className='fill basis-0'
              isDisabled={!selectedConditionName}
              onClick={handleCopy}>
              {translate(translationKey('Action.Copy', TranslationNamespace.Controls))}
            </Button>
            <Button type='button' variant='Standard' className='fill basis-0' onClick={onClose}>
              {translate(translationKey('Action.Cancel', TranslationNamespace.Controls))}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExperimentTargetingCopyModal;
