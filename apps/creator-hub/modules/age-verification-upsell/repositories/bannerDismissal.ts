/* Note (lhoward 2025-11-13):
This is the first-draft solution to store the banner dismissal state; we plan on using creator-settings in the future.
Using a "repository" pattern to abstract the storage mechanism away from the rest of the code.
This allows us to swap out localStorage to creator-settings without having to change the rest of the code.
*/

// export for testing
export const LOCAL_STORAGE_KEY = 'CreatorHub.AgeVerificationBannerSettings';

type Settings = {
  dismissedAt: Date;
};

const parseSettings = (settingsRaw: string): Settings => {
  const settingsParsed = JSON.parse(settingsRaw);

  // validate
  if (!settingsParsed?.dismissedAt) {
    throw new Error('Dismissed date must be set');
  }

  const dismissedAt = new Date(settingsParsed.dismissedAt);

  if (Number.isNaN(dismissedAt.getTime())) {
    throw new Error('Dismissed date string is not a valid date string');
  }

  if (dismissedAt.getTime() > new Date().getTime()) {
    throw new Error('Dismissed date cannot be in the future');
  }

  return { dismissedAt };
};

// Note (lhoward 2025-11-18): to keep the API the same as when we use creator-settings, this is async
export const clearDismissalState = async () => {
  localStorage.removeItem(LOCAL_STORAGE_KEY);
};

// Note (lhoward 2025-11-18): to keep the API the same as when we use creator-settings, this is async
export const getIsDismissedToday = async () => {
  const settingsRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!settingsRaw) return false;

  let dismissedAt: Date;
  try {
    const { dismissedAt: parsedDismissedAt } = parseSettings(settingsRaw);
    dismissedAt = parsedDismissedAt;
  } catch {
    // error during parse, deserialization or validation; clear the state and return false
    clearDismissalState();
    return false;
  }
  const now = new Date();

  return (
    dismissedAt.getFullYear() === now.getFullYear() &&
    dismissedAt.getMonth() === now.getMonth() &&
    dismissedAt.getDate() === now.getDate()
  );
};

// Note (lhoward 2025-11-18): to keep the API the same as when we use creator-settings, this is async
export const setIsDismissedToday = async () => {
  // we want to store as UTC, though we do comparisons with local time
  // the JS Date object should convert to our local timezone when we parse it back out
  localStorage.setItem(
    LOCAL_STORAGE_KEY,
    JSON.stringify({ dismissedAt: new Date().toISOString() }),
  );
};
