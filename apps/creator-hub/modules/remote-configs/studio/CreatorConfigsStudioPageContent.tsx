import { useCallback } from 'react';
import useRemoteConfigsPageBundle from '../hooks/useRemoteConfigsPageBundle';
import generateSnippet from '../utils/generateSnippet';
import StudioWidget from './components/StudioWidget';
import { studioInputFocusStyles } from './styles/studioInputFocusStyles';

const onHistoryClick = () => {
  // eslint-disable-next-line no-alert -- temporary for storybook
  alert('onHistoryClick');
};

const CreatorConfigsStudioPageContent = () => {
  const {
    configEntries: publishedOverrides,
    unsortedEntries,
    // configRequestState,

    drafts: stagedChanges,
    // draftRequestState,

    isEmptyDrafts,
    isEmptyActiveConfigs,
    cancelPublish,
    discardDraft,
    discardStagedChanges,
    forcePublish,
    deleteConfigEntry,
    publish,
    publishAs,
    updateDraft,
    refresh,
    searchKey,
    handleSearchChange,
    publishingMetadata,

    // isPublishing,
    // onCancelPublish,

    // isDraftHashRequiredButMissing,
    // isFirstLoad,
    // pagination,
    // setSort,
    // sort,
  } = useRemoteConfigsPageBundle({
    withDraftHashValidation: false,
    initialPageSize: 1000,
  });

  const onCopySnippet = useCallback((key: string) => {
    const snippet = generateSnippet(key);
    void navigator.clipboard.writeText(snippet);
    return snippet;
  }, []);

  // studio widget has a slightly different UX for editing a config
  const editConfigEntry = useCallback(() => {}, []);
  const viewSnippet = useCallback(() => {}, []);

  const stagedCount = stagedChanges.length;
  const publishedCount = unsortedEntries.length;
  const filteredStagedChanges = stagedChanges.filter((change) => {
    if (searchKey.length === 0) {
      return true;
    }
    return change.overrideEntry.entry.key.toLowerCase().includes(searchKey.toLowerCase());
  });

  return (
    <>
      <style>{studioInputFocusStyles}</style>
      <StudioWidget
        isEmptyDrafts={isEmptyDrafts}
        isEmptyActiveConfigs={isEmptyActiveConfigs}
        searchKey={searchKey}
        handleSearchChange={handleSearchChange}
        filteredStagedChanges={filteredStagedChanges}
        stagedCount={stagedCount}
        publishedCount={publishedCount}
        publishedOverrides={publishedOverrides}
        onHistory={onHistoryClick}
        publish={publish}
        publishAs={publishAs}
        cancelPublish={cancelPublish}
        discardDraft={discardDraft}
        discardStagedChanges={discardStagedChanges}
        forcePublish={forcePublish}
        deleteConfigEntry={deleteConfigEntry}
        updateDraft={updateDraft}
        copySnippet={onCopySnippet}
        editConfigEntry={editConfigEntry}
        viewSnippet={viewSnippet}
        refresh={refresh}
        publishingMetadata={publishingMetadata}
      />
    </>
  );
};

export default CreatorConfigsStudioPageContent;
