import { useTranslationWrapper, translationKey } from '@modules/analytics-translations';
import {
  analyticsConfigsHistoryNavigationItem,
  buildExperienceAnalyticsUrlWithParams,
} from '@modules/charts-generic';
import { useUniverseResource } from '@modules/experience-analytics-shared';
import useDebouncedFunction from '@modules/miscellaneous/hooks/useDebouncedFunction';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
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
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
  Fragment,
  CSSProperties,
} from 'react';
import { DeploymentStrategy } from '../../api/universeConfigsClientEnums';
import CreateButtonWithPopover from './CreateButtonWithPopover';
import { foundationClasses } from './useStudioConfigStyles';
import ConfigsStudioTab from '../types/ConfigsStudioTab';
import { ActionInvokers } from '../../hooks/useConfigEntriesActions';
import strictly from '../foundation-utils/strictly';
import StudioHeaderSpecialStates from '../types/StudioHeaderSpecialStates';
import TextInputForWebview from './TextInputForWebview';

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

  const startPublishFlowImmediate = useCallback(() => {
    setIsMenuOpen(false);
    setDeploymentStrategy(DeploymentStrategy.Immediate);
    startPublishFlow(DeploymentStrategy.Immediate);
  }, [startPublishFlow]);
  const startPublishFlowGradualRollout = useCallback(() => {
    setIsMenuOpen(false);
    setDeploymentStrategy(DeploymentStrategy.GradualRollout);
    startPublishFlow(DeploymentStrategy.GradualRollout);
  }, [startPublishFlow]);

  const publishButtonLabel = useMemo(() => {
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
        throw new Error(`Invalid deployment strategy: ${exhaustiveCheck}`);
      }
    }
  }, [stagedCount, translate, deploymentStrategy]);
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
    if (!pendingPublishStrategy) return;
    publish({
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

  if (!pendingPublishStrategy) return null;
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
        onChange={(e) => setPendingPublishMessage(e.target.value)}
      />
      <div className={strictly('flex', 'gap-xsmall')}>
        <Button size='XSmall' type='button' variant='Emphasis' onClick={completePublishFlow}>
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
  isEmptyDrafts,
  searchKey,
  handleSearchChange,
  publish,
  discardStagedChanges,
  onCreateSuccess,
  onCreateClose,
}: {
  tab: ConfigsStudioTab;
  setTab: (tab: ConfigsStudioTab) => void;
  stagedCount: number;
  isEmptyDrafts: boolean;
  searchKey: string;
  handleSearchChange: (key: string) => void;
  publish: ActionInvokers['publish'];
  discardStagedChanges: () => void;
  onCreateSuccess: () => void;
  onCreateClose: () => void;
}) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const { header, headerTabButton } = foundationClasses;

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const handleFilterOpen = (isOpen: boolean) => {
    setIsFilterOpen(isOpen);
  };

  const { startPublishFlow, ...pendingPublishState } = usePendingPublishState(publish);
  const specialState = useMemo(() => {
    if (pendingPublishState.pendingPublishStrategy) return StudioHeaderSpecialStates.Publishing;
    if (isFilterOpen) return StudioHeaderSpecialStates.Filtering;
    return null;
  }, [pendingPublishState.pendingPublishStrategy, isFilterOpen]);

  const historyButton = useMemo(() => {
    return tab === ConfigsStudioTab.Published && !specialState ? <HistoryButton /> : null;
  }, [tab, specialState]);

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
    if (specialState || isEmptyDrafts || tab !== ConfigsStudioTab.Staged) return null;
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
    if (specialState === StudioHeaderSpecialStates.Filtering) return null;
    return (
      <PublishButton
        isEmptyDrafts={isEmptyDrafts}
        stagedCount={stagedCount}
        tab={tab}
        startPublishFlow={startPublishFlow}
      />
    );
  }, [isEmptyDrafts, stagedCount, tab, startPublishFlow, specialState]);

  const createButton = useMemo(() => {
    if (specialState) return null;
    return <CreateButtonWithPopover onSuccess={onCreateSuccess} onClose={onCreateClose} />;
  }, [onCreateSuccess, onCreateClose, specialState]);

  const searchIconOrBox = useMemo(() => {
    if (specialState === StudioHeaderSpecialStates.Publishing) return null;
    return (
      <SearchIconOrBox
        handleSearchChange={handleSearchChange}
        searchKey={searchKey}
        onFilterOpenChange={handleFilterOpen}
      />
    );
  }, [handleSearchChange, searchKey, specialState]);

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
        {historyButton}
        {publishButton}
        {deleteButton}
        {searchIconOrBox}
        {createButton}
      </div>
    ),
    [historyButton, publishButton, deleteButton, searchIconOrBox, createButton],
  );

  return (
    <Fragment>
      <div className={header}>
        {left}
        {right}
      </div>
      <PendingPublishInput {...pendingPublishState} />
    </Fragment>
  );
};
export default StudioHeader;
