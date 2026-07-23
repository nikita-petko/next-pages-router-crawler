/* oxlint-disable react/react-compiler -- existing Studio webview state/effect wiring is not React Compiler compatible (https://roblox.atlassian.net/browse/DSA-5952) */
import type { CSSProperties } from 'react';
import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useFlag } from '@rbx/flags';
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
import {
  isCreatorConfigPublishAsEnabled as isCreatorConfigPublishAsEnabledFlag,
  isCreatorConfigStudioPublishTimerEnabled as isCreatorConfigStudioPublishTimerEnabledFlag,
  isCreatorConfigStudioPublishWorkflowEnabled as isCreatorConfigStudioPublishWorkflowEnabledFlag,
} from '@generated/flags/creatorAnalytics';
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
import useConfigDescriptionField from '../../hooks/useConfigDescriptionField';
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

const HistoryButton = () => {
  const { id: universeId } = useUniverseResource();
  const { translate } = useTranslationWrapper(useTranslation());
  const historyPageUrl = useMemo(() => {
    return buildExperienceAnalyticsUrlWithParams(
      analyticsConfigsHistoryNavigationItem,
      {},
      universeId,
    );
  }, [universeId]);

  return (
    <Button
      size='XSmall'
      type='button'
      variant='Standard'
      as='a'
      href={historyPageUrl}
      target='_blank'>
      <div className='flex items-center gap-xsmall'>
        <Icon name='icon-regular-arrow-up-right-from-square' size='XSmall' />
        {translate(
          translationKey(
            'Label.Button.History',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        )}
      </div>
    </Button>
  );
};

type ValidDeploymentStrategy = Exclude<DeploymentStrategy, typeof DeploymentStrategy.Invalid>;

const PublishButton = ({
  isEmptyDrafts,
  stagedCount,
  tab,
  startPublishFlow,
}: {
  isEmptyDrafts: boolean;
  stagedCount: number;
  tab: ConfigsStudioTab;
  startPublishFlow: (strategy: ValidDeploymentStrategy) => void;
}) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const [deploymentStrategy, setDeploymentStrategy] = useState<ValidDeploymentStrategy>(
    DeploymentStrategy.Immediate,
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { fire } = useConfigsStudioMessageBusProviderContext();

  const {
    ready: isCreatorConfigStudioPublishWorkflowReady,
    value: isCreatorConfigStudioPublishWorkflowEnabledValue,
  } = useFlag(isCreatorConfigStudioPublishWorkflowEnabledFlag);
  const isCreatorConfigStudioPublishWorkflowEnabled =
    isCreatorConfigStudioPublishWorkflowReady && isCreatorConfigStudioPublishWorkflowEnabledValue;

  const startPublishFlowImmediate = useCallback(() => {
    setIsMenuOpen(false);
    setDeploymentStrategy(DeploymentStrategy.Immediate);
    if (isCreatorConfigStudioPublishWorkflowEnabled) {
      fire(CreatorConfigStudioMessageBusEvent.OpenPublishModal, {
        strategy: DeploymentStrategy.Immediate,
        changeCount: stagedCount,
      });
    } else {
      startPublishFlow(DeploymentStrategy.Immediate);
    }
  }, [startPublishFlow, fire, stagedCount, isCreatorConfigStudioPublishWorkflowEnabled]);
  const startPublishFlowGradualRollout = useCallback(() => {
    setIsMenuOpen(false);
    setDeploymentStrategy(DeploymentStrategy.GradualRollout);
    if (isCreatorConfigStudioPublishWorkflowEnabled) {
      fire(CreatorConfigStudioMessageBusEvent.OpenPublishModal, {
        strategy: DeploymentStrategy.GradualRollout,
        changeCount: stagedCount,
      });
    } else {
      startPublishFlow(DeploymentStrategy.GradualRollout);
    }
  }, [startPublishFlow, fire, stagedCount, isCreatorConfigStudioPublishWorkflowEnabled]);

  const publishButtonLabel = useMemo(() => {
    if (isCreatorConfigStudioPublishWorkflowEnabled) {
      return translate(
        translationKey(
          'Action.Button.PublishWithoutChangeCount',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
      );
    }
    switch (deploymentStrategy) {
      case DeploymentStrategy.Immediate:
        return translate(
          translationKey(
            'Action.Button.PublishNowWithChangeCount',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
          { changeCount: `${stagedCount}` },
        );
      case DeploymentStrategy.GradualRollout:
        return translate(
          translationKey(
            'Action.Button.PublishSlowlyWithChangeCount',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
          { changeCount: `${stagedCount}` },
        );
      default: {
        const exhaustiveCheck: never = deploymentStrategy;
        throw new Error(`Invalid deployment strategy: ${String(exhaustiveCheck)}`);
      }
    }
  }, [stagedCount, translate, deploymentStrategy, isCreatorConfigStudioPublishWorkflowEnabled]);
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

type PendingPublishState = {
  pendingPublishStrategy: DeploymentStrategy | null;
  pendingPublishMessage: string | null;
  setPendingPublishMessage: (message: string) => void;
  startPublishFlow: (strategy: DeploymentStrategy) => void;
  clearPublishFlow: () => void;
  completePublishFlow: () => void;
};

const usePendingPublishState = (publish: ActionInvokers['publish']): PendingPublishState => {
  const [pendingPublishStrategy, setPendingPublishStrategy] = useState<DeploymentStrategy | null>(
    null,
  );
  const [pendingPublishMessage, setPendingPublishMessage] = useState<string | null>(null);
  const startPublishFlow = useCallback((strategy: DeploymentStrategy) => {
    setPendingPublishStrategy(strategy);
    setPendingPublishMessage(null);
  }, []);
  const clearPublishFlow = useCallback(() => {
    setPendingPublishStrategy(null);
    setPendingPublishMessage(null);
  }, []);
  const completePublishFlow = useCallback(() => {
    if (!pendingPublishStrategy) {
      return;
    }
    void publish({
      message: pendingPublishMessage ?? '',
      deploymentStrategy: pendingPublishStrategy,
    });
    clearPublishFlow();
  }, [publish, pendingPublishMessage, pendingPublishStrategy, clearPublishFlow]);

  return {
    pendingPublishStrategy,
    pendingPublishMessage,
    setPendingPublishMessage,
    startPublishFlow,
    clearPublishFlow,
    completePublishFlow,
  };
};

const PendingPublishInput = ({
  pendingPublishStrategy,
  pendingPublishMessage,
  setPendingPublishMessage,
  completePublishFlow,
  clearPublishFlow,
}: Omit<PendingPublishState, 'startPublishFlow'>) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const { textInput, textInputInputContainer } = foundationClasses;
  const { isError: hasMessageError, helperText: messageHelperText } = useConfigDescriptionField(
    pendingPublishMessage ?? '',
  );

  if (!pendingPublishStrategy) {
    return null;
  }
  return (
    <div
      className={strictly(
        'flex',
        'flex-col',
        'gap-y-xsmall',
        'padding-x-large',
        'padding-y-small',
        'bg-shift-400',
      )}>
      <TextInputForWebview
        size='XSmall'
        className={textInput}
        inputContainerClassName={textInputInputContainer}
        value={pendingPublishMessage ?? ''}
        placeholder={translate(
          translationKey(
            'Dialog.Publish.Label.Message',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        )}
        hasError={hasMessageError}
        error={hasMessageError ? messageHelperText : undefined}
        onChange={(e) => setPendingPublishMessage(e.target.value)}
      />
      <div className={strictly('flex', 'gap-xsmall')}>
        <Button
          size='XSmall'
          type='button'
          variant='Emphasis'
          isDisabled={hasMessageError}
          onClick={completePublishFlow}>
          {translate(
            translationKey(
              'Dialog.Publish.Button.Confirm',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          )}
        </Button>
        <Button size='XSmall' type='button' variant='Standard' onClick={clearPublishFlow}>
          {translate(
            translationKey(
              'Dialog.Publish.Button.Cancel',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          )}
        </Button>
      </div>
    </div>
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

  const { startPublishFlow, ...pendingPublishState } = usePendingPublishState(publish);
  const { setListener, removeListener, isWebView, fire } =
    useConfigsStudioMessageBusProviderContext();

  const {
    ready: isCreatorConfigStudioPublishWorkflowReady,
    value: isCreatorConfigStudioPublishWorkflowEnabledValue,
  } = useFlag(isCreatorConfigStudioPublishWorkflowEnabledFlag);
  const {
    ready: isCreatorConfigStudioPublishTimerReady,
    value: isCreatorConfigStudioPublishTimerEnabledValue,
  } = useFlag(isCreatorConfigStudioPublishTimerEnabledFlag);
  const { ready: isCreatorConfigPublishAsReady, value: isCreatorConfigPublishAsEnabledValue } =
    useFlag(isCreatorConfigPublishAsEnabledFlag);
  const isCreatorConfigStudioPublishWorkflowEnabled =
    isCreatorConfigStudioPublishWorkflowReady && isCreatorConfigStudioPublishWorkflowEnabledValue;
  const isCreatorConfigStudioPublishTimerEnabled =
    isCreatorConfigStudioPublishTimerReady && isCreatorConfigStudioPublishTimerEnabledValue;
  const isCreatorConfigPublishAsEnabled =
    isCreatorConfigPublishAsReady && isCreatorConfigPublishAsEnabledValue;

  const publishRemainingMs = usePublishRemainingMs(
    isCreatorConfigStudioPublishTimerEnabled ? publishingMetadata : undefined,
    isCreatorConfigStudioPublishTimerEnabled ? refresh : undefined,
  );
  const isPublishTimerRunning =
    isCreatorConfigStudioPublishTimerEnabled && !!publishingMetadata && publishRemainingMs > 0;

  useEffect(() => {
    if (!isCreatorConfigStudioPublishWorkflowEnabled) {
      return undefined;
    }
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
  }, [
    publish,
    isWebView,
    removeListener,
    setListener,
    setTab,
    isCreatorConfigStudioPublishWorkflowEnabled,
  ]);

  useEffect(() => {
    if (!isCreatorConfigPublishAsEnabled) {
      return undefined;
    }
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
  }, [fire, publishAs, isWebView, removeListener, setListener, isCreatorConfigPublishAsEnabled]);

  useEffect(() => {
    if (!isCreatorConfigStudioPublishTimerEnabled) {
      return undefined;
    }
    if (!isWebView || !isWebViewAvailable()) {
      return undefined;
    }

    const listener = setListener(CreatorConfigStudioMessageBusEvent.CancelPublishWorkflow, () =>
      cancelPublish(),
    );

    return () => {
      removeListener(CreatorConfigStudioMessageBusEvent.CancelPublishWorkflow, listener);
    };
  }, [
    cancelPublish,
    isCreatorConfigStudioPublishTimerEnabled,
    isWebView,
    removeListener,
    setListener,
  ]);

  const specialState = useMemo(() => {
    if (pendingPublishState.pendingPublishStrategy) {
      return StudioHeaderSpecialStates.Publishing;
    }
    if (isFilterOpen) {
      return StudioHeaderSpecialStates.Filtering;
    }
    return null;
  }, [pendingPublishState.pendingPublishStrategy, isFilterOpen]);

  const historyButton = useMemo(() => {
    if (isCreatorConfigPublishAsEnabled) {
      return null;
    }
    return tab === ConfigsStudioTab.Published && !specialState ? <HistoryButton /> : null;
  }, [tab, specialState, isCreatorConfigPublishAsEnabled]);

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
    return (
      <PublishButton
        isEmptyDrafts={isEmptyDrafts}
        stagedCount={stagedCount}
        tab={tab}
        startPublishFlow={startPublishFlow}
      />
    );
  }, [isEmptyDrafts, stagedCount, tab, startPublishFlow, specialState]);

  const cancelPublishButton = useMemo(() => {
    if (!isCreatorConfigStudioPublishTimerEnabled) {
      return null;
    }
    if (specialState === StudioHeaderSpecialStates.Filtering) {
      return null;
    }
    return <CancelPublishButton publishRemainingMs={publishRemainingMs} />;
  }, [isCreatorConfigStudioPublishTimerEnabled, specialState, publishRemainingMs]);

  const createButton = useMemo(() => {
    if (specialState) {
      return null;
    }
    return <CreateButtonWithPopover onSuccess={onCreateSuccess} onClose={onCreateClose} />;
  }, [onCreateSuccess, onCreateClose, specialState]);

  const searchIconOrBox = useMemo(() => {
    if (specialState === StudioHeaderSpecialStates.Publishing) {
      return null;
    }
    return (
      <SearchIconOrBox
        handleSearchChange={handleSearchChange}
        searchKey={searchKey}
        onFilterOpenChange={handleFilterOpen}
      />
    );
  }, [handleSearchChange, searchKey, specialState]);

  const moreOptionsButton = useMemo(() => {
    if (!isCreatorConfigPublishAsEnabled) {
      return null;
    }
    if (tab === ConfigsStudioTab.Staged) {
      return null;
    }
    return <MoreOptionsButton publishedCount={publishedCount} />;
  }, [publishedCount, isCreatorConfigPublishAsEnabled, tab]);

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
        {isCreatorConfigStudioPublishTimerEnabled && isPublishTimerRunning
          ? cancelPublishButton
          : publishButton}
        {historyButton}
        {deleteButton}
        {searchIconOrBox}
        {createButton}
        {moreOptionsButton}
      </div>
    ),
    [
      isCreatorConfigStudioPublishTimerEnabled,
      isPublishTimerRunning,
      historyButton,
      publishButton,
      cancelPublishButton,
      deleteButton,
      searchIconOrBox,
      createButton,
      moreOptionsButton,
    ],
  );

  return (
    <>
      <div className={header}>
        {left}
        {right}
      </div>
      <PendingPublishInput {...pendingPublishState} />
    </>
  );
};
export default StudioHeader;
