import { Chip, clsx } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ARCHIVE_VIEWS, useView } from '@modules/monetization-shared/views/useView';

type Props = {
  /** Disables both chips (e.g. while a bulk action is pending). */
  disabled?: boolean;
  className?: string;
};

/**
 * Current/Archived toggle for the Game Passes list, mounted by GamePassesViewLayout.
 *
 * Owns the view selection through `?view=`, so callers never pass it in.
 */
function GamePassesViewChips({ disabled, className }: Props) {
  const { translateWithNamespace } = useTranslation();
  const { view, setView } = useView(ARCHIVE_VIEWS);

  const groupLabel = translateWithNamespace(TranslationNamespace.Passes, 'Label.PassView');
  // Heading.Current / Heading.Archived are shared with DeveloperProductsViewChips
  const currentLabel = translateWithNamespace(TranslationNamespace.Navigation, 'Heading.Current');
  const archivedLabel = translateWithNamespace(TranslationNamespace.Navigation, 'Heading.Archived');

  return (
    <div
      role='radiogroup'
      aria-label={groupLabel}
      className={clsx('flex items-center gap-small', className)}>
      <Chip
        text={currentLabel}
        size='Medium'
        isChecked={view === 'current'}
        isDisabled={disabled}
        onCheckedChange={(checked) => {
          if (checked) {
            setView('current');
          }
        }}
      />
      <Chip
        text={archivedLabel}
        size='Medium'
        isChecked={view === 'archived'}
        isDisabled={disabled}
        onCheckedChange={(checked) => {
          if (checked) {
            setView('archived');
          }
        }}
      />
    </div>
  );
}

export default GamePassesViewChips;
