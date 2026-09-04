import type { FunctionComponent } from 'react';
import React, { useCallback } from 'react';
import SharedTranslationHistory from '../../translation/components/shared/TranslationHistory';
import type { HistoryEntry } from '../types';
import AssetImage from './AssetImage';
import useTranslationHistoryStyles from './TranslationHistory.styles';

export interface TranslationHistoryProps {
  error: Error | null;
  isLoading: boolean;
  entries: HistoryEntry[];
}

const TranslationHistory: FunctionComponent<React.PropsWithChildren<TranslationHistoryProps>> = ({
  error,
  isLoading,
  entries,
}) => {
  const {
    classes: { thumbnail },
  } = useTranslationHistoryStyles();

  const renderContent = useCallback(
    (historyEntry: HistoryEntry) =>
      historyEntry.translation.translatedAssetId != null ? (
        <AssetImage assetId={historyEntry.translation.translatedAssetId} className={thumbnail} />
      ) : null,
    [thumbnail],
  );

  return (
    <SharedTranslationHistory
      error={error}
      isLoading={isLoading}
      entries={entries}
      renderContent={renderContent}
    />
  );
};

export default TranslationHistory;
