import { useCallback, useMemo, type ReactNode } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Button } from '@rbx/ui';
import { DialogEventEmitterSource } from '@modules/charts-generic/components/FilterDrawer/DialogEventEmitter';
import { FilterDrawerEventEmitterProvider } from '@modules/charts-generic/context/FilterDrawerEventEmitterContext';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import MatchPanelLayout from './MatchPanelLayout';

interface MatchesFilterPanelProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * License-manager filter panel shell using {@link MatchPanelLayout}.
 * Reuses the charts-generic filter emitter so {@link MatchesFilterPanelContent}
 * can keep using FilterDrawerEnumChoice unchanged.
 */
function MatchesFilterPanel({ title, onClose: givenOnClose, children }: MatchesFilterPanelProps) {
  const { translate } = useTranslation();
  const emitter = useMemo(() => new DialogEventEmitterSource(), []);

  const onClose = useCallback(() => {
    emitter.reset();
    givenOnClose();
  }, [givenOnClose, emitter]);

  const onApply = useCallback(() => {
    emitter.apply();
    givenOnClose();
  }, [givenOnClose, emitter]);

  const onResetAll = useCallback(() => {
    emitter.clear();
  }, [emitter]);

  return (
    <FilterDrawerEventEmitterProvider emitter={emitter}>
      <MatchPanelLayout
        title={title}
        onClose={onClose}
        buttons={
          <>
            <Button
              variant='contained'
              color='primaryBrand'
              size='large'
              className='fill basis-0'
              onClick={onApply}>
              {translate('Action.Apply')}
            </Button>
            <Button
              variant='text'
              color='secondary'
              size='large'
              className='fill basis-0'
              onClick={onResetAll}>
              {translate('Action.ResetAll')}
            </Button>
          </>
        }>
        {children}
      </MatchPanelLayout>
    </FilterDrawerEventEmitterProvider>
  );
}

export default withTranslation(MatchesFilterPanel, [
  TranslationNamespace.AgreementsManager,
  TranslationNamespace.Controls,
]);
