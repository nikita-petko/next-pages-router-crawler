export enum StudioWebViewMessageBusEvent {
  changeTheme = 'internal:changeTheme',
  changeVolume = 'internal:changeVolume',
  init = 'internal:init',
  deprecatedSendAnalyticsCounterEvent = 'sendAnalyticsCounterEvent',
  deprecatedSendAnalyticsEvent = 'sendAnalyticsEvent',
  // TODO: Add the `internal` prefix to Lua side then switch over
  // sendAnalyticsCounterEvent = 'internal:sendAnalyticsCounterEvent',
  // sendAnalyticsEvent = 'internal:sendAnalyticsEvent',
}

export default StudioWebViewMessageBusEvent;
