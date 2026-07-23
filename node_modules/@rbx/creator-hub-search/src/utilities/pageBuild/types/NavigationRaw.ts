// TODO: extend ENavigationType, or remove EngineAPIMember + Custom
export enum NavigationTypeRaw {
  Markdown = 'markdown',
  CloudAPI = 'cloudapi',
  CloudAPI2 = 'cloudapi2',
  CloudLegacy = 'cloudlegacy',
  CloudFeature = 'cloudfeature',
  CloudDomain = 'clouddomain',
  EngineAPI = 'engineapi',
  ReleaseNote = 'releasenote',
  EngineAPIMember = 'engineapimember',
  Custom = 'custom',
  Assistant = 'assistant',
  Courses = 'courses',
  Videos = 'videos',
  Forum = 'forum',
  Lesson = 'lesson',
}

export const NavigationTypeRawLabelMap: Record<NavigationTypeRaw, string> = {
  [NavigationTypeRaw.Markdown]: 'Label.Article',
  [NavigationTypeRaw.CloudAPI]: 'Label.CloudAPI',
  [NavigationTypeRaw.CloudAPI2]: 'Label.CloudAPI',
  [NavigationTypeRaw.CloudLegacy]: 'Label.CloudAPI',
  [NavigationTypeRaw.CloudFeature]: 'Label.CloudAPI',
  [NavigationTypeRaw.CloudDomain]: 'Label.CloudAPI',
  [NavigationTypeRaw.EngineAPI]: 'Label.EngineReference',
  [NavigationTypeRaw.ReleaseNote]: 'Heading.ReleaseNotes',
  [NavigationTypeRaw.EngineAPIMember]: 'Label.EngineReference',
  [NavigationTypeRaw.Custom]: 'Label.Article',
  [NavigationTypeRaw.Assistant]: 'Button.Assistant',
  [NavigationTypeRaw.Courses]: 'Label.Courses',
  [NavigationTypeRaw.Videos]: 'Label.Videos',
  [NavigationTypeRaw.Forum]: 'Label.DevForum',
  [NavigationTypeRaw.Lesson]: 'Label.Lesson',
};

export type Navigation = {
  navigation: NavigationItem[];
};

export type NavigationHeadItem = {
  heading: string;
};

export type NavigationVersionItem = {
  name: string;
  path: string;
  source?: string;
  default?: boolean;
};

export type NavigationNodeItem = {
  title: string;
  path?: string;
  section?: NavigationNodeItem[];
  source?: string;
  type?: NavigationTypeRaw;
  versions?: NavigationVersionItem[];
};

export type NavigationItem = NavigationNodeItem | NavigationHeadItem;
