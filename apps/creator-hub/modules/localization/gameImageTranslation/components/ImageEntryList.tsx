import type { FunctionComponent } from 'react';
import React, { useCallback } from 'react';
import { ListItemAvatar } from '@rbx/ui';
import SharedEntryList from '../../translation/components/shared/EntryList';
import type { ImageEntryBriefInfo } from '../types';
import AssetImage from './AssetImage';
import useImageEntryListStyles from './ImageEntryList.styles';

export interface ImageEntryListProps {
  entries: ImageEntryBriefInfo[];
  isUpdating: boolean;
  activeEntryKey: string | null;
  onSelect: (identifier: string) => void;
  resetPageKey: string;
}

const getImageEntryPrimaryText = (entry: ImageEntryBriefInfo) => String(entry.sourceAssetId);

// Composes the shared, generic EntryList shell with the image-specific per-row content: a
// thumbnail avatar and the source asset id as primary text.
const ImageEntryList: FunctionComponent<React.PropsWithChildren<ImageEntryListProps>> = ({
  entries,
  isUpdating,
  activeEntryKey,
  onSelect,
  resetPageKey,
}) => {
  const {
    classes: { thumbnail, avatar },
  } = useImageEntryListStyles();

  const renderItemStart = useCallback(
    (entry: ImageEntryBriefInfo) => (
      <ListItemAvatar className={avatar}>
        <AssetImage assetId={entry.sourceAssetId} className={thumbnail} />
      </ListItemAvatar>
    ),
    [avatar, thumbnail],
  );

  return (
    <SharedEntryList
      entries={entries}
      isUpdating={isUpdating}
      activeEntryKey={activeEntryKey}
      onSelect={onSelect}
      resetPageKey={resetPageKey}
      getPrimaryText={getImageEntryPrimaryText}
      renderItemStart={renderItemStart}
    />
  );
};

export default ImageEntryList;
