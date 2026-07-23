// Stub file for tag types
export enum ThreadSafetyTag {
  ReadSafe = 'ReadSafe',
  Safe = 'Safe',
  Unsafe = 'Unsafe',
}

export enum ApiTag {
  Hidden = 'Hidden',
  NotReplicated = 'NotReplicated',
  ReadOnly = 'ReadOnly',
  NotScriptable = 'NotScriptable',
  NotBrowsable = 'NotBrowsable',
  NotCreatable = 'NotCreatable',
  CanYield = 'CanYield',
  Yields = 'Yields',
  NoYield = 'NoYield',
  Service = 'Service',
  PlayerReplicated = 'PlayerReplicated',
  OpenCloudSecurity = 'OpenCloudSecurity',
  PluginSecurity = 'PluginSecurity',
  CustomLuaState = 'CustomLuaState',
  Deprecated = 'Deprecated',
  Settings = 'Settings',
  UserSettings = 'UserSettings',
}

export enum SecurityTag {
  None = 'None',
  PluginSecurity = 'PluginSecurity',
  LocalUserSecurity = 'LocalUserSecurity',
  RobloxScriptSecurity = 'RobloxScriptSecurity',
  RobloxSecurity = 'RobloxSecurity',
  RobloxEngineSecurity = 'RobloxEngineSecurity',
  NotAccessibleSecurity = 'NotAccessibleSecurity',
}

export enum CloudTag {
  OutputOnly = 'OutputOnly',
  InputOnly = 'InputOnly',
  Required = 'Required',
  Immutable = 'Immutable',
  Deprecated = 'Deprecated',
  Beta = 'Beta',
  Experimental = 'Experimental',
  Stable = 'Stable',
  RecommendedAlternatives = 'RecommendedAlternatives',
}

export type EngineTag = ThreadSafetyTag | ApiTag | SecurityTag;
export type ReferenceClass = 'engine' | 'cloud';
