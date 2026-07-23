import React, { Fragment, useCallback } from 'react';
import StudioWidget from './components/StudioWidget';
import useRemoteConfigsPageBundle from '../hooks/useRemoteConfigsPageBundle';
import generateSnippet from '../utils/generateSnippet';
import { studioInputFocusStyles } from './styles/studioInputFocusStyles';

const CreatorConfigsStudioPageContent = () => {
  const {
    configEntries: publishedOverrides,
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
    updateDraft,
    refresh,
    searchKey,
    handleSearchChange,

    // isPublishing,
    // publishingMetadata,
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

  const onHistoryClick = () => {
    // eslint-disable-next-line no-alert -- temporary for storybook
    alert('onHistoryClick');
  };

  const onCopySnippet = useCallback((key: string) => {
    const snippet = generateSnippet(key);
    navigator.clipboard.writeText(snippet);
    return snippet;
  }, []);

  // studio widget has a slightly different UX for editing a config
  const editConfigEntry = useCallback(() => {}, []);
  const viewSnippet = useCallback(() => {}, []);

  const stagedCount = stagedChanges.length;
  const filteredStagedChanges = stagedChanges.filter((change) => {
    if (searchKey.length === 0) {
      return true;
    }
    return change.overrideEntry.entry.key.toLowerCase().includes(searchKey.toLowerCase());
  });

  return (
    <Fragment>
      <style>{studioInputFocusStyles}</style>
      <StudioWidget
        isEmptyDrafts={isEmptyDrafts}
        isEmptyActiveConfigs={isEmptyActiveConfigs}
        searchKey={searchKey}
        handleSearchChange={handleSearchChange}
        filteredStagedChanges={filteredStagedChanges}
        stagedCount={stagedCount}
        publishedOverrides={publishedOverrides}
        onHistory={onHistoryClick}
        publish={publish}
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
      />
    </Fragment>
  );
};

export default CreatorConfigsStudioPageContent;
