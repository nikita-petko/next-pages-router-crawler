import { earlierDate, subHours } from '@modules/charts-generic/utils/dateUtils';

/**
 * DataStore storage usage samples land a few hours behind real time, so the
 * storage chart never queries past `now - 4h`: the trailing window would render
 * as a misleading drop toward zero. Matches the delay quoted to creators in
 * `Description.StorageDelayV2`.
 */
export const DATA_STORE_STORAGE_USAGE_DELAY_HOURS = 4;

type StorageUsageWindow = {
  startTime: Date;
  endTime: Date;
};

/**
 * Anchor the page's selected window to the newest landed storage data.
 *
 * Capping the end alone inverts the window whenever the selection is shorter
 * than the landing delay: Last 1 Hour asks for `[now - 1h, now]`, which caps to
 * `[now - 1h, now - 4h]` and is rejected by the query gateway with "EndTime must
 * be greater than or equal to StartTime". When capping would leave nothing to
 * query, the start moves back by the same amount so the chart still covers the
 * requested duration — the way preset ranges are re-anchored to
 * `latestAvailableTime` in `buildSnappedTimeSpec`.
 */
const getDataStoreStorageUsageWindow = (
  { startTime, endTime }: StorageUsageWindow,
  currentTime: Date,
): StorageUsageWindow => {
  const cappedEndTime = earlierDate(
    endTime,
    subHours(currentTime, DATA_STORE_STORAGE_USAGE_DELAY_HOURS),
  );
  if (startTime < cappedEndTime) {
    return { startTime, endTime: cappedEndTime };
  }

  const durationMs = Math.max(0, endTime.getTime() - startTime.getTime());
  return {
    startTime: new Date(cappedEndTime.getTime() - durationMs),
    endTime: cappedEndTime,
  };
};

export default getDataStoreStorageUsageWindow;
