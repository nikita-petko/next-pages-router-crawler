/* oxlint-disable react/react-compiler -- existing Studio webview state/effect wiring is not React Compiler compatible (https://roblox.atlassian.net/browse/DSA-5952) */
import type { CSSProperties } from 'react';
import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import {
  Icon,
  TooltipTrigger,
  Tooltip,
  IconButton,
  Button,
  PopoverTrigger,
  Popover,
  PopoverContent,
  Menu,
  MenuItem,
  MenuSeparator,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { isWebViewAvailable } from '@rbx/studio-webview';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { analyticsConfigsHistoryNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import buildExperienceAnalyticsUrlWithParams from '@modules/charts-generic/utils/analyticsUrlBuilder';
import type { PublishingMetadata } from '@modules/clients/analytics/universeConfigs';
import { CreatorConfigsPublicApiHttpError } from '@modules/clients/creatorConfigsPublicApi';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { useDebouncedFunction } from '@modules/miscellaneous/hooks/useDebouncedFunction';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { DeploymentStrategy } from '../../api/universeConfigsClientEnums';
import type { ActionInvokers } from '../../hooks/useConfigEntriesActions';
import usePublishRemainingMs, {
  publishRemainingMsToTimeStr,
} from '../../utils/usePublishRemainingMs';
import strictly from '../foundation-utils/strictly';
import {
  CreatorConfigStudioMessageBusEvent,
  useConfigsStudioMessageBusProviderContext,
} from '../message-bus/ConfigsStudioMessageBusProvider';
import type {
  StartPublishAsWorkflowRequestParams,
  StartPublishWorkflowRequestParams,
  PublishCompletedRequestParams,
  PublishFailureReason,
} from '../message-bus/ConfigsStudioMessageBusProvider';
import ConfigsStudioTab from '../types/ConfigsStudioTab';
import StudioHeaderSpecialStates from '../types/StudioHeaderSpecialStates';
import CreateButtonWithPopover from './CreateButtonWithPopover';
import TextInputForWebview from './TextInputForWebview';
import { foundationClasses } from './useStudioConfigStyles';

const SearchIconOrBox = ({
  searchKey,
  handleSearchChange: givenHandleSearchChange,
  onFilterOpenChange,
}: {
  searchKey: string;
  handleSearchChange: (key: string) => void;
  onFilterOpenChange: (isOpen: boolean) => void;
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(searchKey.length > 0);
  const [localSearchKey, setLocalSearchKey] = useState(searchKey);
  const { textInput, textInputInputContainer } = foundationClasses;

  useEffect(() => {
    onFilterOpenChange(isSearchOpen);
  }, [isSearchOpen, onFilterOpenChange]);

  const handleSearchChange = useCallback(
    (key: string) => {
      setIsSearchOpen(key.length > 0);
      givenHandleSearchChange(key);
    },
    [givenHandleSearchChange],
  );
  const [wasOpenedByClick, setWasOpenedByClick] = useState(false);

  // Focus the input when it opens via click (not when prop changes)
  useEffect(() => {
    if (isSearchOpen && wasOpenedByClick && searchInputRef.current) {
      searchInputRef.current.focus();
      setWasOpenedByClick(false);
    }
  }, [isSearchOpen, wasOpenedByClick]);

  // Handle escape key to clear search
  const onSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        setLocalSearchKey('');
        handleSearchChange('');
        setIsSearchOpen(false);
      }
    },
    [handleSearchChange],
  );

  useEffect(() => {
    setLocalSearchKey(searchKey);
  }, [searchKey]);
  const [debouncedHandleSearchChange, clearSearchDebounceTimeout] = useDebouncedFunction(
    givenHandleSearchChange,
    300,
  );
  const onSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalSearchKey(e.target.value);
      debouncedHandleSearchChange(e.target.value);
    },
    [debouncedHandleSearchChange],
  );
  const onSearchBlur = useCallback(() => {
    clearSearchDebounceTimeout();
    handleSearchChange(localSearchKey);
    if (localSearchKey.length === 0) {
      setIsSearchOpen(false);
    }
  }, [clearSearchDebounceTimeout, handleSearchChange, localSearchKey]);

  const clickSearch = useCallback(() => {
    setIsSearchOpen(true);
    setWasOpenedByClick(true);
  }, []);

  if (isSearchOpen) {
    return (
      <TextInputForWebview
        size='XSmall'
        className={textInput}
        inputContainerClassName={textInputInputContainer}
        value={localSearchKey}
        onKeyDown={onSearchKeyDown}
        onChange={onSearchChange}
        onBlur={onSearchBlur}
        leadingIconName='icon-regular-magnifying-glass'
        ref={searchInputRef}
      />
    );
  }

  return (
    <IconButton
      size='XSmall'
      variant='Standard'
      onClick={clickSearch}
      name='icon-regular-magnifying-glass'
      icon='icon-regular-magnifying-glass'
      ariaLabel='search'
    />
  );
};

const PublishButton = ({
  isEmptyDrafts,
  stagedCount,
  tab,
}: {
  isEmptyDrafts: boolean;
  stagedCount: number;
  tab: ConfigsStudioTab;
}) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { fire } = useConfigsStudioMessageBusProviderContext();

  const startPublishFlowImmediate = useCallback(() => {
    setIsMenuOpen(false);
    fire(CreatorConfigStudioMessageBusEvent.OpenPublishModal, {
      strategy: DeploymentStrategy.Immediate,
      changeCount: stagedCount,
    });
  }, [fire, stagedCount]);
  const startPublishFlowGradualRollout = useCallback(() => {
    setIsMenuOpen(false);
    fire(CreatorConfigStudioMessageBusEvent.OpenPublishModal, {
      strategy: DeploymentStrategy.GradualRollout,
      changeCount: stagedCount,
    });
  }, [fire, stagedCount]);

  const publishButtonLabel = useMemo(() => {
    return translate(
      translationKey(
        'Action.Button.PublishWithoutChangeCount',
        TranslationNamespace.UniverseConfigAndExperimentation,
      ),
    );
  }, [translate]);
  return tab === ConfigsStudioTab.Staged && !isEmptyDrafts ? (
    <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <PopoverTrigger asChild disabled={isEmptyDrafts}>
        <Button size='XSmall' type='button'>
          <span className={strictly('padding-right-small')}>
            <Icon size='XSmall' name='icon-regular-chevron-small-down' />
          </span>
          {publishButtonLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent side='bottom' align='start' ariaLabel='Publish menu'>
        <Menu size='XSmall'>
          <MenuItem
            value={DeploymentStrategy.Immediate}
            onSelect={startPublishFlowImmediate}
            title={translate(
              translationKey(
                'Action.Button.PublishNow',
                TranslationNamespace.UniverseConfigAndExperimentation,
              ),
            )}
          />
          <MenuItem
            value={DeploymentStrategy.GradualRollout}
            onSelect={startPublishFlowGradualRollout}
            title={translate(
              translationKey(
                'Action.Button.PublishSlowly',
                TranslationNamespace.UniverseConfigAndExperimentation,
              ),
            )}
          />
        </Menu>
      </PopoverContent>
    </Popover>
  ) : null;
};

const CancelPublishButton = ({ publishRemainingMs }: { publishRemainingMs: number }) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const timeRemainingStr = publishRemainingMsToTimeStr(publishRemainingMs);
  const { fire } = useConfigsStudioMessageBusProviderContext();

  const cancelPublishFlow = useCallback(() => {
    fire(CreatorConfigStudioMessageBusEvent.CancelPublishModal, {});
  }, [fire]);

  return (
    <Button size='XSmall' type='button' variant='Standard' onClick={cancelPublishFlow}>
      {translate(
        translationKey(
          'Action.Button.CancelPublishWithCountdown',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
        { timeRemainingStr },
      )}
    </Button>
  );
};

const MoreOptionsButton = ({ publishedCount }: { publishedCount: number }) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const { fire } = useConfigsStudioMessageBusProviderContext();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { id: universeId } = useUniverseResource();
  const historyPageUrl = useMemo(() => {
    return buildExperienceAnalyticsUrlWithParams(
      analyticsConfigsHistoryNavigationItem,
      {},
      universeId,
    );
  }, [universeId]);

  const startPublishAsFlowImmediate = useCallback(() => {
    setIsMenuOpen(false);
    fire(CreatorConfigStudioMessageBusEvent.OpenPublishAsModal, {
      strategy: DeploymentStrategy.Immediate,
      configsCount: publishedCount,
    });
  }, [fire, publishedCount]);

  const startPublishAsFlowGradualRollout = useCallback(() => {
    setIsMenuOpen(false);
    fire(CreatorConfigStudioMessageBusEvent.OpenPublishAsModal, {
      strategy: DeploymentStrategy.GradualRollout,
      configsCount: publishedCount,
    });
  }, [fire, publishedCount]);

  return (
    <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <PopoverTrigger asChild>
        <IconButton
          size='XSmall'
          variant='Standard'
          name='icon-regular-three-dots-vertical'
          icon='icon-regular-three-dots-vertical'
          ariaLabel='search'
        />
      </PopoverTrigger>
      <PopoverContent side='bottom' align='start' ariaLabel='Publish menu'>
        <Menu size='XSmall'>
          <MenuItem
            value='history-button'
            as='a'
            href={historyPageUrl}
            target='_blank'
            title={translate(
              translationKey(
                'Label.Button.History',
                TranslationNamespace.UniverseConfigAndExperimentation,
              ),
            )}
            trailing={<Icon name='icon-regular-arrow-up-right-from-square' size='XSmall' />}
          />
          <MenuSeparator />
          <MenuItem
            value={DeploymentStrategy.Immediate}
            onSelect={startPublishAsFlowImmediate}
            title={translate(
              translationKey(
                'Action.Button.PublishAsNow',
                TranslationNamespace.UniverseConfigAndExperimentation,
              ),
            )}
          />
          <MenuItem
            value={DeploymentStrategy.GradualRollout}
            onSelect={startPublishAsFlowGradualRollout}
            title={translate(
              translationKey(
                'Action.Button.PublishAsSlowly',
                TranslationNamespace.UniverseConfigAndExperimentation,
              ),
            )}
          />
        </Menu>
      </PopoverContent>
    </Popover>
  );
};

const headerLeftStyle: CSSProperties = { borderBottom: `1px solid var(--color-shift-400)` };

const StudioHeader = ({
  tab,
  setTab,
  stagedCount,
  publishedCount,
  isEmptyDrafts,
  searchKey,
  handleSearchChange,
  publish,
  publishAs,
  discardStagedChanges,
  onCreateSuccess,
  onCreateClose,
  publishingMetadata,
  cancelPublish,
  refresh,
}: {
  tab: ConfigsStudioTab;
  setTab: (tab: ConfigsStudioTab) => void;
  stagedCount: number;
  publishedCount: number;
  isEmptyDrafts: boolean;
  searchKey: string;
  handleSearchChange: (key: string) => void;
  publish: ActionInvokers['publish'];
  publishAs: ActionInvokers['publishAs'];
  discardStagedChanges: () => void;
  onCreateSuccess: () => void;
  onCreateClose: () => void;
  publishingMetadata?: PublishingMetadata;
  cancelPublish: ActionInvokers['cancelPublish'];
  refresh: () => void;
}) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const { header, headerTabButton } = foundationClasses;

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const handleFilterOpen = (isOpen: boolean) => {
    setIsFilterOpen(isOpen);
  };

  const { setListener, removeListener, isWebView, fire } =
    useConfigsStudioMessageBusProviderContext();

  const publishRemainingMs = usePublishRemainingMs(publishingMetadata, refresh);
  const isPublishTimerRunning = !!publishingMetadata && publishRemainingMs > 0;

  useEffect(() => {
    if (!isWebView || !isWebViewAvailable()) {
      return undefined;
    }

    const listener = setListener(
      CreatorConfigStudioMessageBusEvent.StartPublishWorkflow,
      (data: StartPublishWorkflowRequestParams) => {
        if (data.strategy === DeploymentStrategy.Invalid) {
          return;
        }

        setTab(ConfigsStudioTab.Staged);
        void publish({
          message: data.message ?? '',
          deploymentStrategy: data.strategy,
        });
      },
    );

    return () => {
      removeListener(CreatorConfigStudioMessageBusEvent.StartPublishWorkflow, listener);
    };
  }, [publish, isWebView, removeListener, setListener, setTab]);

  useEffect(() => {
    if (!isWebView || !isWebViewAvailable()) {
      return undefined;
    }

    const sendReponse = (
      request: StartPublishAsWorkflowRequestParams,
      data: { success: boolean; error?: PublishFailureReason },
    ) => {
      const response: PublishCompletedRequestParams = {
        publishSessionUuid: request.publishSessionUuid,
        universeId: request.universeId,
        success: data.success,
        error: data.error,
      };
      fire(CreatorConfigStudioMessageBusEvent.PublishCompleted, response);
    };

    const listener = setListener(
      CreatorConfigStudioMessageBusEvent.StartPublishAsWorkflow,
      (request: StartPublishAsWorkflowRequestParams) => {
        if (request.strategy === DeploymentStrategy.Invalid) {
          sendReponse(request, { success: false, error: 'invalidStrategy' });
          return;
        }
        if (!request.universeId) {
          sendReponse(request, { success: false, error: 'missingUniverseId' });
          return;
        }

        publishAs({
          message: request.message ?? '',
          deploymentStrategy: request.strategy,
          universeId: request.universeId,
        })
          .then((success) => {
            sendReponse(request, { success, error: success ? undefined : 'publishFailed' });
          })
          .catch((error) => {
            let errorResponse: PublishFailureReason = 'unknown';
            if (error instanceof CreatorConfigsPublicApiHttpError) {
              if (error.bodyText.includes('MultipleDraftNotSupported')) {
                errorResponse = 'ongoingPublish';
              } else if (error.bodyText.includes('EmptyDraft')) {
                errorResponse = 'emptyDraft';
              }
            }
            sendReponse(request, { success: false, error: errorResponse });
          });
      },
    );

    return () => {
      removeListener(CreatorConfigStudioMessageBusEvent.StartPublishAsWorkflow, listener);
    };
  }, [fire, publishAs, isWebView, removeListener, setListener]);

  useEffect(() => {
    if (!isWebView || !isWebViewAvailable()) {
      return undefined;
    }

    const listener = setListener(CreatorConfigStudioMessageBusEvent.CancelPublishWorkflow, () =>
      cancelPublish(),
    );

    return () => {
      removeListener(CreatorConfigStudioMessageBusEvent.CancelPublishWorkflow, listener);
    };
  }, [cancelPublish, isWebView, removeListener, setListener]);

  const specialState = isFilterOpen ? StudioHeaderSpecialStates.Filtering : null;

  const onStagedTabClick = useCallback(() => {
    setTab(ConfigsStudioTab.Staged);
  }, [setTab]);
  const onPublishedTabClick = useCallback(() => {
    setTab(ConfigsStudioTab.Published);
  }, [setTab]);

  const stagedTabLabel =
    stagedCount > 0
      ? translate(
          translationKey(
            'Label.Tabs.StagedWithCount',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
          { stagedCount: `${stagedCount}` },
        )
      : translate(
          translationKey(
            'Label.Tabs.Staged',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        );

  const publishedTabLabel = translate(
    translationKey('Label.Tabs.Published', TranslationNamespace.UniverseConfigAndExperimentation),
  );

  const deleteButton = useMemo(() => {
    if (specialState || isEmptyDrafts || tab !== ConfigsStudioTab.Staged) {
      return null;
    }
    const deleteButtonTooltip = translate(
      translationKey(
        'Action.Button.Discard',
        TranslationNamespace.UniverseConfigAndExperimentation,
      ),
    );

    return (
      <Tooltip position='bottom-end' title={deleteButtonTooltip}>
        <TooltipTrigger asChild>
          <IconButton
            size='XSmall'
            variant='Standard'
            icon='icon-regular-trash-can'
            ariaLabel={deleteButtonTooltip}
            onClick={discardStagedChanges}
          />
        </TooltipTrigger>
      </Tooltip>
    );
  }, [tab, isEmptyDrafts, discardStagedChanges, translate, specialState]);

  const publishButton = useMemo(() => {
    if (specialState === StudioHeaderSpecialStates.Filtering) {
      return null;
    }
    return <PublishButton isEmptyDrafts={isEmptyDrafts} stagedCount={stagedCount} tab={tab} />;
  }, [isEmptyDrafts, stagedCount, tab, specialState]);

  const cancelPublishButton = useMemo(() => {
    if (specialState === StudioHeaderSpecialStates.Filtering) {
      return null;
    }
    return <CancelPublishButton publishRemainingMs={publishRemainingMs} />;
  }, [specialState, publishRemainingMs]);

  const createButton = useMemo(() => {
    if (specialState) {
      return null;
    }
    return <CreateButtonWithPopover onSuccess={onCreateSuccess} onClose={onCreateClose} />;
  }, [onCreateSuccess, onCreateClose, specialState]);

  const searchIconOrBox = useMemo(() => {
    return (
      <SearchIconOrBox
        handleSearchChange={handleSearchChange}
        searchKey={searchKey}
        onFilterOpenChange={handleFilterOpen}
      />
    );
  }, [handleSearchChange, searchKey]);

  const moreOptionsButton = useMemo(() => {
    if (tab === ConfigsStudioTab.Staged) {
      return null;
    }
    return <MoreOptionsButton publishedCount={publishedCount} />;
  }, [publishedCount, tab]);

  const left = useMemo(() => {
    const selectedTabStyle = {
      border: '0px',
      borderBottom: `1px solid var(--color-content-emphasis)`,
    };
    const unselectedTabStyle = {
      border: '0px',
      borderBottom: '1px solid transparent',
    };

    return (
      <div className={strictly('flex', 'gap-medium', 'grow')} style={headerLeftStyle}>
        <button
          type='button'
          className={headerTabButton}
          style={tab === ConfigsStudioTab.Staged ? selectedTabStyle : unselectedTabStyle}
          onClick={onStagedTabClick}>
          {stagedTabLabel}
        </button>
        <button
          type='button'
          className={headerTabButton}
          style={tab === ConfigsStudioTab.Published ? selectedTabStyle : unselectedTabStyle}
          onClick={onPublishedTabClick}>
          {publishedTabLabel}
        </button>
      </div>
    );
  }, [
    tab,
    headerTabButton,
    onStagedTabClick,
    stagedTabLabel,
    onPublishedTabClick,
    publishedTabLabel,
  ]);

  const right = useMemo(
    () => (
      <div className={strictly('flex', 'gap-xsmall')}>
        {isPublishTimerRunning ? cancelPublishButton : publishButton}
        {deleteButton}
        {searchIconOrBox}
        {createButton}
        {moreOptionsButton}
      </div>
    ),
    [
      isPublishTimerRunning,
      publishButton,
      cancelPublishButton,
      deleteButton,
      searchIconOrBox,
      createButton,
      moreOptionsButton,
    ],
  );

  return (
    <div className={header}>
      {left}
      {right}
    </div>
  );
};
export default StudioHeader;
