import * as www from './www';

export const getGameDetailsUrl = (universeId: number, rootPlaceId: number) => {
  const appsflyerBase = 'https://ro.blox.com/Ebh5';
  const params = new URLSearchParams({
    af_dp: `roblox://navigation/game_details?gameId=${universeId}`,
    af_web_dp: www.getGameDetailsUrl(rootPlaceId),
  });

  return `${appsflyerBase}?${params}`;
};

export const getEventUrl = (eventId: number | string) =>
  `https://ro.blox.com/Ebh5?pid=share&is_retargeting=true&af_dp=roblox%3A%2F%2Fnavigation%2Fevent_details%3Feventid%3D${eventId}&&af_web_dp=https%3A%2F%2Fwww.roblox.com%2Fevents%2F${eventId}`;
