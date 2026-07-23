import React, { FunctionComponent, useState, useCallback, ReactNode, useEffect } from 'react';
import {
  Typography,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Button,
  useTheme,
  Select,
  MenuItem,
  CircularProgress,
} from '@rbx/ui';
import { diffLines, Change } from 'diff';
import { Highlight, Token } from 'prism-react-renderer';
import { V2CloudProtos } from '@rbx/open-cloud';
import { Locale } from '@rbx/intl';
import useDiffViewDialogStyles from './DiffViewDialog.styles';
import useEntryValueViewPrismTheme from '../EntryValueView/useEntryValueViewPrismTheme';
import { formatTimestamp, MAX_PAGE_SIZE } from '../../common';
import { EntryList } from '../../types';
import { listEntryVersions, getEntryVersion } from '../../openCloudStandardDataStoresRequests';

// Custom hook for infinite scroll sentinel
const useInfiniteScrollSentinel = (
  hasMore: boolean,
  isLoading: boolean,
  onIntersect: () => void,
  threshold = 0.1,
) => {
  return useCallback(
    (node: HTMLLIElement | null) => {
      if (node && hasMore && !isLoading) {
        const observer = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting) {
              onIntersect();
            }
          },
          { threshold },
        );
        observer.observe(node);
        return () => observer.disconnect();
      }
      return undefined;
    },
    [hasMore, isLoading, onIntersect, threshold],
  );
};

interface DiffViewDialogProps {
  originalEntry: V2CloudProtos.IDataStoreEntry;
  currentEntry: V2CloudProtos.IDataStoreEntry;
  versionsData: EntryList;
  universeId: number;
  dataStoreName: string;
  entryScope: string;
  entryName: string;
  locale: Locale;
  closeDialog: () => void;
}

interface VersionSelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  isLoading: boolean;
  availableVersions: EntryList;
  isLoadingMoreVersions: boolean;
  sentinelRef: (node: HTMLLIElement | null) => void;
  versionSelect: string;
  versionList: string;
  locale: Locale;
}

const VersionSelector: FunctionComponent<VersionSelectorProps> = ({
  label,
  value,
  onChange,
  isLoading,
  availableVersions,
  isLoadingMoreVersions,
  sentinelRef,
  versionSelect,
  versionList,
  locale,
}) => (
  <React.Fragment>
    <Grid item XSmall={12}>
      <Typography color='secondary' variant='body2'>
        {label}:
      </Typography>
    </Grid>
    <Grid item XSmall={12}>
      <Select
        className={versionSelect}
        size='small'
        value={value}
        onChange={(e) => onChange(e.target.value as string)}
        disabled={isLoading}>
        {availableVersions.entries.map((version) => (
          <MenuItem
            className={versionList}
            key={version.revisionId}
            value={version.revisionId || ''}>
            {formatTimestamp(version.revisionCreateTime!, locale)}
          </MenuItem>
        ))}
        {availableVersions.cursor && !isLoadingMoreVersions && (
          <MenuItem // This is for an invisible entry for our infinite scroll
            ref={sentinelRef}
            disabled
            style={{
              height: '1px',
              minHeight: '1px',
              padding: 0,
              opacity: 0,
              pointerEvents: 'none',
            }}
          />
        )}
        {isLoadingMoreVersions && (
          <MenuItem disabled>
            <CircularProgress color='secondary' size={14} />
          </MenuItem>
        )}
      </Select>
    </Grid>
  </React.Fragment>
);

interface CodeBlockCardProps {
  title: string;
  content: ReactNode;
  className: string;
  valueTypography?: string;
  isLoading?: boolean;
}

const CodeBlockCard: FunctionComponent<CodeBlockCardProps> = ({
  title,
  content,
  className,
  valueTypography,
  isLoading = false,
}) => (
  <React.Fragment>
    <Grid item XSmall={12} className={valueTypography}>
      <Typography variant='h6'>{title}</Typography>
    </Grid>
    <Grid item XSmall={12}>
      <Card variant='outlined' className={className}>
        <CardContent>
          {isLoading ? <CircularProgress size={24} color='secondary' /> : content}
        </CardContent>
      </Card>
    </Grid>
  </React.Fragment>
);

interface DiffColumnProps {
  selectorProps: VersionSelectorProps;
  valueContent: ReactNode;
  metadataContent: ReactNode;
  cardContainer: string;
  metadataCardContainer: string;
  valueTypography: string;
  isLoadingVersion: boolean;
}

const DiffColumn: FunctionComponent<DiffColumnProps> = ({
  selectorProps,
  valueContent,
  metadataContent,
  cardContainer,
  metadataCardContainer,
  valueTypography,
  isLoadingVersion,
}) => (
  <Grid container item XSmall={6} spacing={1}>
    <VersionSelector {...selectorProps} />
    <CodeBlockCard
      title='Value'
      content={valueContent}
      className={cardContainer}
      valueTypography={valueTypography}
      isLoading={isLoadingVersion}
    />
    <CodeBlockCard
      title='Metadata'
      content={metadataContent}
      className={metadataCardContainer}
      valueTypography={valueTypography}
      isLoading={isLoadingVersion}
    />
  </Grid>
);

const DiffViewDialog: FunctionComponent<DiffViewDialogProps> = ({
  originalEntry,
  currentEntry,
  versionsData,
  universeId,
  dataStoreName,
  entryScope,
  entryName,
  locale,
  closeDialog,
}) => {
  const {
    classes: {
      dialogTitle,
      versionSelect,
      cardContainer,
      dialogContainer,
      metadataCardContainer,
      lineNumber,
      versionList,
      lineContent: lineContentClass,
      intermediateContent,
      intermediateContentAdded,
      valueTypography,
      added,
      removed,
    },
  } = useDiffViewDialogStyles();

  const theme = useTheme();
  const prismTheme = useEntryValueViewPrismTheme(theme);

  // State for managing versions and selections
  const [availableVersions, setAvailableVersions] = useState<EntryList>(versionsData);
  const [isLoadingMoreVersions, setIsLoadingMoreVersions] = useState<boolean>(false);

  // State for selected versions
  const [leftVersionId, setLeftVersionId] = useState<string>(originalEntry?.revisionId || '');
  const [rightVersionId, setRightVersionId] = useState<string>(currentEntry?.revisionId || '');

  // State for version data
  const [leftVersionData, setLeftVersionData] =
    useState<V2CloudProtos.IDataStoreEntry>(originalEntry);
  const [rightVersionData, setRightVersionData] =
    useState<V2CloudProtos.IDataStoreEntry>(currentEntry);
  const [isLoadingVersionData, setIsLoadingVersionData] = useState<boolean>(false);

  const loadEntryRevisions = useCallback(
    async (scopeName: string, entry: string, pageToken?: string) => {
      try {
        const response = await listEntryVersions(
          universeId,
          dataStoreName,
          scopeName,
          entry,
          MAX_PAGE_SIZE,
          pageToken,
        );

        if (pageToken) {
          setAvailableVersions((prev) => ({
            entries: [...prev.entries, ...response.entries],
            cursor: response.cursor,
          }));
        } else {
          setAvailableVersions({
            entries: response.entries,
            cursor: response.cursor,
          } as EntryList);
        }
      } catch {
        setAvailableVersions({ entries: [], cursor: null });
      }
    },
    [dataStoreName, universeId],
  );

  const loadMoreVersions = useCallback(async () => {
    if (isLoadingMoreVersions || !availableVersions.cursor) return;

    setIsLoadingMoreVersions(true);
    try {
      await loadEntryRevisions(entryScope, entryName, availableVersions.cursor);
    } finally {
      setIsLoadingMoreVersions(false);
    }
  }, [isLoadingMoreVersions, availableVersions.cursor, loadEntryRevisions, entryScope, entryName]);

  const sentinelRef = useInfiniteScrollSentinel(
    !!availableVersions.cursor,
    isLoadingMoreVersions,
    loadMoreVersions,
  );

  const rightSentinelRef = useInfiniteScrollSentinel(
    !!availableVersions.cursor,
    isLoadingMoreVersions,
    loadMoreVersions,
  );

  // State for diff calculation
  const [groups, setGroups] = useState<Change[]>([]);
  const [metaDataGroups, setMetaDataGroups] = useState<Change[]>([]);
  const [leftData, setLeftData] = useState<string>('');
  const [rightData, setRightData] = useState<string>('');
  const [leftMetadata, setLeftMetadata] = useState<string>('');
  const [rightMetadata, setRightMetadata] = useState<string>('');

  // Load specific version data
  const loadVersionData = useCallback(
    async (versionId: string, isLeft: boolean) => {
      try {
        const versionData = await getEntryVersion(
          universeId,
          dataStoreName,
          entryScope,
          entryName,
          versionId,
        );
        if (isLeft) {
          setLeftVersionId(versionId);
          setLeftVersionData(versionData);
        } else {
          setRightVersionId(versionId);
          setRightVersionData(versionData);
        }
      } finally {
        setIsLoadingVersionData(false);
      }
    },
    [universeId, dataStoreName, entryScope, entryName],
  );

  const clearDiffStateAndLoad = useCallback(
    (versionId: string, isLeft: boolean) => {
      setIsLoadingVersionData(true);

      setGroups([]);
      setMetaDataGroups([]);
      setLeftData('');
      setRightData('');
      setLeftMetadata('');
      setRightMetadata('');

      loadVersionData(versionId, isLeft);
    },
    [loadVersionData],
  );

  // Initialize with the original entry data on first load
  useEffect(() => {
    if (originalEntry && currentEntry && !leftVersionData && !rightVersionData) {
      setLeftVersionData(originalEntry);
      setRightVersionData(currentEntry);
    }
  }, [originalEntry, currentEntry, leftVersionData, rightVersionData]);

  useEffect(() => {
    if (isLoadingVersionData) {
      setGroups([]);
      setMetaDataGroups([]);
      setLeftData('');
      setRightData('');
      setLeftMetadata('');
      setRightMetadata('');
      return;
    }

    // Both sides must be loaded and have data before we diff
    if (leftVersionData && rightVersionData) {
      const newLeftData = JSON.stringify(leftVersionData?.value || '', null, 2);
      const newRightData = JSON.stringify(rightVersionData?.value || '', null, 2);

      const newGroups = diffLines(newLeftData, newRightData);

      const newLeftMetadata = JSON.stringify(
        {
          attributes: leftVersionData.attributes || '',
          users: leftVersionData.users || '',
        },
        null,
        2,
      );

      const newRightMetadata = JSON.stringify(
        {
          attributes: rightVersionData.attributes || '',
          users: rightVersionData.users || '',
        },
        null,
        2,
      );

      const newMetaDataGroups = diffLines(newLeftMetadata, newRightMetadata);

      // Set all new data at once to prevent partial updates
      setLeftData(newLeftData);
      setRightData(newRightData);
      setGroups(newGroups);
      setLeftMetadata(newLeftMetadata);
      setRightMetadata(newRightMetadata);
      setMetaDataGroups(newMetaDataGroups);
    } else {
      setGroups([]);
      setMetaDataGroups([]);
      setLeftData('');
      setRightData('');
      setLeftMetadata('');
      setRightMetadata('');
    }
  }, [leftVersionData, rightVersionData, isLoadingVersionData]);

  const renderDiffCodeBlock = (code: string, isComparison: boolean, diffGroups = groups) => {
    const diffHighlights = isComparison
      ? diffGroups.filter((g) => g.added)
      : diffGroups.filter((g) => g.removed);

    return (
      <div>
        <Highlight language='json' code={code} theme={prismTheme}>
          {({ style, tokens, getLineProps, getTokenProps }) => (
            <pre
              style={{
                ...style,
                opacity: 0.8,
                fontSize: '12px',
                fontFamily: 'Builder Mono',
                fontWeight: 50,
                margin: 0,
              }}>
              {tokens.map((line: Token[], i) => {
                const lineContent = line.map((t) => t.content).join('');
                let lineClass = '';

                diffHighlights.forEach((highlight) => {
                  if (highlight.value.includes(lineContent)) {
                    lineClass = isComparison ? 'added' : 'removed';
                  }
                });

                return (
                  <div
                    key={lineContent || `line-${i}`}
                    {...getLineProps({ line })}
                    style={{
                      ...getLineProps({ line }).style,
                      display: 'flex',
                      width: '100%',
                    }}>
                    <span className={lineNumber}>{i + 1}</span>
                    <span
                      className={`${intermediateContent} ${lineClass === 'added' ? intermediateContentAdded : ''}`}>
                      {(() => {
                        if (lineClass === 'added') return '+';
                        if (lineClass === 'removed') return '-';
                        return ' ';
                      })()}
                    </span>
                    <span
                      className={[
                        lineContentClass,
                        lineClass === 'added' ? added : '',
                        lineClass === 'removed' ? removed : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}>
                      {line.map((token: Token) => (
                        <span
                          key={`${token.content}-${token.types.join('-')}`}
                          {...getTokenProps({ token })}
                        />
                      ))}
                    </span>
                  </div>
                );
              })}
            </pre>
          )}
        </Highlight>
      </div>
    );
  };

  return (
    <Dialog open fullWidth maxWidth='Large' className={dialogContainer}>
      <DialogTitle className={dialogTitle}>Compare Versions</DialogTitle>
      <DialogContent>
        <Grid container XSmall={12} spacing={2}>
          <DiffColumn
            selectorProps={{
              label: 'From version',
              value: leftVersionId,
              onChange: (versionId: string) => clearDiffStateAndLoad(versionId, true),
              isLoading: isLoadingVersionData,
              availableVersions,
              isLoadingMoreVersions,
              sentinelRef,
              versionSelect,
              versionList,
              locale,
            }}
            valueContent={renderDiffCodeBlock(leftData, false)}
            metadataContent={renderDiffCodeBlock(leftMetadata, false, metaDataGroups)}
            cardContainer={cardContainer}
            metadataCardContainer={metadataCardContainer}
            valueTypography={valueTypography}
            isLoadingVersion={isLoadingVersionData}
          />
          <DiffColumn
            selectorProps={{
              label: 'To version',
              value: rightVersionId,
              onChange: (versionId: string) => clearDiffStateAndLoad(versionId, false),
              isLoading: isLoadingVersionData,
              availableVersions,
              isLoadingMoreVersions,
              sentinelRef: rightSentinelRef,
              versionSelect,
              versionList,
              locale,
            }}
            valueContent={renderDiffCodeBlock(rightData, true)}
            metadataContent={renderDiffCodeBlock(rightMetadata, true, metaDataGroups)}
            cardContainer={cardContainer}
            metadataCardContainer={metadataCardContainer}
            valueTypography={valueTypography}
            isLoadingVersion={isLoadingVersionData}
          />
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={closeDialog} variant='contained' color='primaryBrand'>
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DiffViewDialog;
