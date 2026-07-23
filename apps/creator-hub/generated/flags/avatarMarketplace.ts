import { defineFlag } from '@rbx/flags';

// oxlint-disable-next-line typescript-eslint/triple-slash-reference -- generated flags need registry augmentation in type-aware consumers
/// <reference path='./registry.d.ts' />
export const freeAvatarModuleStorePageLink = defineFlag({
    namespace: 'avatar-marketplace',
    name: 'freeAvatarModuleStorePageLink',
    defaultValue: "#",
  });
export const freeAvatarModuleDocsPageLink = defineFlag({
    namespace: 'avatar-marketplace',
    name: 'freeAvatarModuleDocsPageLink',
    defaultValue: "#",
  });
export const enableAvatarLooks = defineFlag({
    namespace: 'avatar-marketplace',
    name: 'enableAvatarLooks',
    defaultValue: false,
  });
export const enableUgcFolders = defineFlag({
    namespace: 'avatar-marketplace',
    name: 'enableUGCFolders',
    defaultValue: false,
  });
export const isAutoPublishPreferencesEnabled = defineFlag({
    namespace: 'avatar-marketplace',
    name: 'isAutoPublishPreferencesEnabled',
    defaultValue: false,
  });
