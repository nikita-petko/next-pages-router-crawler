import type { FunctionComponent } from 'react';
import { useCallback, useState } from 'react';
import { StatusCodes } from '@rbx/core';
import { useFlag } from '@rbx/flags';
import {
  Alert,
  Button,
  Divider,
  IconButton,
  Link,
  Menu,
  MenuItem,
  MenuSection,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Snackbar,
} from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { CircularProgress } from '@rbx/ui';
import { presetChatEnabled } from '@generated/flags/presetChat';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { PresetChatApiError } from '@modules/clients/presetChatApi';
import { EmptyGrid } from '@modules/miscellaneous/components/EmptyGrid';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import ChatTabOptions from '../enums/ChatTabOptions';
import useCategoryManager from '../hooks/useCategoryManager';
import { useGetPresetChatState } from '../queries/useGetPresetChatState';
import { usePublish } from '../queries/usePublish';
import { useRevertToDefaults } from '../queries/useRevertToDefaults';
import { useUpsertDraft } from '../queries/useUpsertDraft';
import ChatNavigation from './ChatNavigation';
import { PublishStatusBanner } from './PublishStatusBanner';
import QuickWordsContent from './QuickWordsContent';
import QuickWordsStatusBadge from './QuickWordsStatusBadge';

const PresetChatPageContent: FunctionComponent = () => {
  const { gameDetails } = useCurrentGame();
  const { ready: flagReady, value: isPresetChatEnabled } = useFlag(presetChatEnabled);
  const { ready, tPendingTranslation } = useTranslationWrapper(useTranslation());
  const [currentTab, setCurrentTab] = useState<ChatTabOptions>(ChatTabOptions.QuickWords);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const {
    data: presetChatState,
    isLoading: isPresetChatLoading,
    error: presetChatError,
  } = useGetPresetChatState(gameDetails?.id, isPresetChatEnabled ?? false);

  const categoryManager = useCategoryManager(
    presetChatState?.categoryGroups,
    presetChatState?.overallStatus,
  );

  const {
    mutate: publish,
    isPending: isPublishPending,
    isError: isPublishError,
  } = usePublish(gameDetails?.id);
  const {
    mutate: saveDraft,
    isPending: isSavePending,
    isError: isSaveError,
  } = useUpsertDraft(gameDetails?.id);
  const { mutate: revert, isPending: isRevertPending } = useRevertToDefaults(gameDetails?.id);
  const [showSaveSnackbar, setShowSaveSnackbar] = useState(false);
  const [isSaveErrorDismissed, setIsSaveErrorDismissed] = useState(false);
  const [isPublishSuccessDismissed, setIsPublishSuccessDismissed] = useState(false);
  const [isPublishErrorDismissed, setIsPublishErrorDismissed] = useState(false);

  const handlePublish = useCallback(() => {
    setIsPublishSuccessDismissed(false);
    setIsPublishErrorDismissed(false);
    publish();
  }, [publish]);

  const handleDismissPublishSuccess = useCallback(() => {
    setIsPublishSuccessDismissed(true);
  }, []);

  const handleDismissPublishError = useCallback(() => {
    setIsPublishErrorDismissed(true);
  }, []);

  const handleSave = useCallback(() => {
    setShowSaveSnackbar(false);
    setIsSaveErrorDismissed(false);
    const categories = categoryManager.categories.map((category) => ({
      name: category.name.trim(),
      state: category.state,
      presets: category.presets
        .map((preset) => ({
          content: preset.text.replaceAll(/[^a-zA-Z\s'-]/g, '').trim(),
          state: preset.state,
        }))
        .filter((preset) => preset.content.length > 0),
    }));
    saveDraft(categories, { onSuccess: () => setShowSaveSnackbar(true) });
  }, [categoryManager.categories, saveDraft]);

  const handleDismissSaveError = useCallback(() => {
    setIsSaveErrorDismissed(true);
  }, []);

  // TODO: Add confirmation dialog before reverting — this will immediately replace the most recent creator draft with the Roblox defaults
  const handleRevert = useCallback(() => {
    revert();
    setMoreMenuOpen(false);
  }, [revert]);

  const handleSelectTab = useCallback((value: ChatTabOptions) => {
    setCurrentTab(value);
  }, []);

  if (!flagReady) {
    return (
      <EmptyGrid>
        <CircularProgress data-testid='preset-chat-loading' />
      </EmptyGrid>
    );
  }

  if (!isPresetChatEnabled) {
    return <ErrorPage errorCode={StatusCodes.NOT_FOUND} />;
  }

  if (!ready || !gameDetails?.id || isPresetChatLoading) {
    return (
      <EmptyGrid>
        <CircularProgress data-testid='preset-chat-loading' />
      </EmptyGrid>
    );
  }

  if (presetChatError && !presetChatState) {
    const status =
      presetChatError instanceof PresetChatApiError ? presetChatError.status : undefined;
    const errorCode =
      status === StatusCodes.FORBIDDEN
        ? StatusCodes.FORBIDDEN
        : status === StatusCodes.NOT_FOUND
          ? StatusCodes.NOT_FOUND
          : StatusCodes.BAD_REQUEST;
    return <ErrorPage errorCode={errorCode} />;
  }

  return (
    <>
      <section className='flex flex-col gap-xlarge'>
        <div className='flex flex-col gap-medium'>
          <h1 className='text-heading-large margin-none'>
            {tPendingTranslation(
              'Chat',
              'The label for the new Chat page under Creations > Configure.',
              translationKey('Heading.Chat', TranslationNamespace.Navigation),
            )}
          </h1>
          <ChatNavigation onSelectTab={handleSelectTab} currentTab={currentTab} />
        </div>
        {currentTab === ChatTabOptions.QuickWords && (
          <div className='flex flex-col'>
            <div className='flex items-center gap-xlarge width-full justify-between'>
              <div className='flex flex-col gap-xsmall'>
                <h2 className='text-heading-medium margin-none'>
                  {tPendingTranslation(
                    'Quick Words',
                    'The current working title for Preset Chat.',
                    translationKey('Label.QuickWords', TranslationNamespace.PresetChat),
                  )}
                </h2>
                <span className='text-body-large content-default'>
                  {tPendingTranslation(
                    'Quick Words lets players of all ages coordinate gameplay with pre-written phrases.',
                    'The sub-heading for the Quick Words page.',
                    translationKey('Description.QuickWords', TranslationNamespace.PresetChat),
                  )}{' '}
                  <Link
                    className='content-link'
                    variant='Inline'
                    href='https://create.roblox.com/docs/chat/preset-system-guidelines'
                    target='_blank'
                    isExternal={false}>
                    {tPendingTranslation(
                      'Learn more',
                      'A link to the Preset system guidelines.',
                      translationKey('Action.LearnMore', TranslationNamespace.PresetChat),
                    )}
                  </Link>
                </span>
                <div className='flex items-center gap-small padding-y-small'>
                  <span className='text-caption-large content-emphasis'>
                    {tPendingTranslation(
                      'System status:',
                      'Label for the system-wide status of Quick Words',
                      translationKey('Label.SystemStatus', TranslationNamespace.PresetChat),
                    )}
                  </span>
                  <QuickWordsStatusBadge
                    status={
                      isPublishPending ? 'PUBLISHING' : (presetChatState?.overallStatus ?? 'DRAFT')
                    }
                    isSystemStatus
                  />
                </div>
              </div>
              <div className='flex items-center gap-small'>
                <Button
                  variant='Emphasis'
                  size='Medium'
                  onClick={handlePublish}
                  isDisabled={
                    presetChatState?.overallStatus === 'PUBLISHING' ||
                    isPublishPending ||
                    isRevertPending
                  }>
                  {tPendingTranslation(
                    'Publish',
                    'Button to publish preset chat changes',
                    translationKey('Action.Publish', TranslationNamespace.PresetChat),
                  )}
                </Button>
                <Button
                  variant='Standard'
                  size='Medium'
                  onClick={handleSave}
                  isDisabled={
                    presetChatState?.overallStatus === 'PUBLISHING' ||
                    isPublishPending ||
                    isSavePending ||
                    isRevertPending
                  }>
                  {tPendingTranslation(
                    'Save',
                    'Button to save the current draft of Quick Words categories',
                    translationKey('Action.SaveDraft', TranslationNamespace.PresetChat),
                  )}
                </Button>
                <Popover open={moreMenuOpen} onOpenChange={setMoreMenuOpen}>
                  <PopoverTrigger asChild>
                    <IconButton
                      variant='Standard'
                      size='Medium'
                      icon='icon-regular-three-dots-horizontal'
                      isDisabled={
                        presetChatState?.overallStatus === 'PUBLISHING' ||
                        isPublishPending ||
                        isSavePending ||
                        isRevertPending
                      }
                      ariaLabel={tPendingTranslation(
                        'More options',
                        'Accessible label for the more options menu button',
                        translationKey('Action.MoreOptions', TranslationNamespace.PresetChat),
                      )}
                    />
                  </PopoverTrigger>
                  <PopoverContent
                    ariaLabel={tPendingTranslation(
                      'More options',
                      'Accessible label for the more options menu button',
                      translationKey('Action.MoreOptions', TranslationNamespace.PresetChat),
                    )}
                    align='end'>
                    <Menu size='Medium'>
                      <MenuSection>
                        <MenuItem
                          value='revert'
                          title={tPendingTranslation(
                            'Revert back to default',
                            'Menu item to revert Quick Words to the Roblox default values',
                            translationKey(
                              'Action.RevertToDefault',
                              TranslationNamespace.PresetChat,
                            ),
                          )}
                          onSelect={handleRevert}
                        />
                      </MenuSection>
                    </Menu>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <PublishStatusBanner
              overallStatus={
                isPublishPending ? 'PUBLISHING' : (presetChatState?.overallStatus ?? 'DRAFT')
              }
            />
            {presetChatState?.overallStatus === 'APPROVED' &&
              !isPublishPending &&
              !isPublishSuccessDismissed && (
                <Alert
                  severity='Success'
                  variant='Feedback'
                  hasCloseAffordance
                  onDismiss={handleDismissPublishSuccess}>
                  {tPendingTranslation(
                    'Your Quick Words were approved.',
                    'Success banner shown when Quick Words are approved after publishing',
                    translationKey('Success.Published', TranslationNamespace.PresetChat),
                  )}
                </Alert>
              )}
            {isPublishError && !isPublishErrorDismissed && (
              <Alert
                severity='Warning'
                variant='Feedback'
                hasCloseAffordance
                onDismiss={handleDismissPublishError}>
                {tPendingTranslation(
                  "Your Quick Words weren't published. Try again.",
                  'Warning banner shown when publishing Quick Words fails',
                  translationKey('Warning.PublishFailed', TranslationNamespace.PresetChat),
                )}
              </Alert>
            )}
            {isSaveError && !isSaveErrorDismissed && (
              <Alert
                severity='Warning'
                variant='Feedback'
                hasCloseAffordance
                onDismiss={handleDismissSaveError}>
                {tPendingTranslation(
                  "Some of your Quick Words weren't saved. Try again.",
                  'Warning banner shown when saving Quick Words draft fails',
                  translationKey('Warning.SaveFailed', TranslationNamespace.PresetChat),
                )}
              </Alert>
            )}
            <Divider className='margin-top-medium margin-bottom-small' />
            <QuickWordsContent
              categoryManager={categoryManager}
              overallStatus={presetChatState?.overallStatus}
              isPublishPending={isPublishPending}
            />
          </div>
        )}
      </section>
      {showSaveSnackbar && (
        <Snackbar
          className='min-width-fit width-fit gap-x-xxsmall'
          title={tPendingTranslation(
            'Your Quick Words were saved.',
            'Snackbar shown when Quick Words draft is saved successfully',
            translationKey('Success.Saved', TranslationNamespace.PresetChat),
          )}
          shouldAutoDismiss
          onClose={() => setShowSaveSnackbar(false)}
        />
      )}
    </>
  );
};

export default withTranslation(PresetChatPageContent, [
  TranslationNamespace.Navigation,
  TranslationNamespace.PresetChat,
]);
