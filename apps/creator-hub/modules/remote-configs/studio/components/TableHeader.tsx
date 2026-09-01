import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import strictly from '../foundation-utils/strictly';
import useStudioConfigStyles, { foundationClasses } from './useStudioConfigStyles';

const TableHeader = () => {
  const { classes } = useStudioConfigStyles();
  const { translate } = useTranslationWrapper(useTranslation());
  const { columns, headerText, tableRow } = foundationClasses;
  const { keyColumn, typeColumn, valueColumn, actionsColumn } = columns(classes);

  return (
    <div className={tableRow}>
      <div className={strictly(keyColumn, headerText)}>
        {translate(
          translationKey(
            'Table.Column.Title.Key',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        )}
      </div>
      <div className={strictly(typeColumn, headerText)}>
        {translate(
          translationKey(
            'Table.Column.Title.Type',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        )}
      </div>
      <div className={strictly(valueColumn, headerText)}>
        {translate(
          translationKey(
            'Table.Column.Title.Override',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        )}
      </div>
      <div className={strictly(actionsColumn, headerText)} />
    </div>
  );
};
export default TableHeader;
