// Analytics event names for the anti-cheat moderation setting. Kept in the shared
// `Moderation.*` namespace so anti-cheat events sit alongside the Bans events
// (see `ModerationEvents` in ../constants/userBansConstants.tsx).
export enum AntiCheatEvents {
  SETTING_IMPRESSION_EVENT = 'Moderation.AntiCheat.Impression',
  TOGGLE_CLICK_EVENT = 'Moderation.AntiCheat.Toggle.Click',
  TOGGLE_CLICK_EVENT_ERROR = 'Moderation.AntiCheat.Toggle.Click.Error',
}
