// Due to experimental nature, the globalPrivacyControl boolean does not exist in standard Navigator objects.
interface NavigatorWithGPC extends Navigator {
  globalPrivacyControl?: boolean;
}

export type GpcScenario = 'no-signal' | 'signal-honored' | 'signal-with-changes';

export interface GpcState {
  isGpcDetected: boolean;
  initialGpcState: boolean;
  hasUserMadeCookieChanges: boolean;
  scenario: GpcScenario;
}

export const detectGpcSignal = (): boolean => {
  if (typeof navigator === 'undefined') {
    return false;
  }
  return Boolean((navigator as NavigatorWithGPC).globalPrivacyControl);
};

export const determineGpcScenario = (
  isGpcDetected: boolean,
  hasUserMadeCookieChanges: boolean,
): GpcScenario => {
  if (!isGpcDetected) {
    return 'no-signal';
  }

  if (hasUserMadeCookieChanges) {
    return 'signal-with-changes';
  }

  return 'signal-honored';
};

declare global {
  interface Window {
    evidon?: {
      notice?: {
        showOptions?: () => void;
        userGpcEnabled?: boolean;
      };
    };
  }
}

export const callEvidonApi = async (shouldCallEvidon: boolean): Promise<void> => {
  if (!shouldCallEvidon) {
    return;
  }

  if (typeof window !== 'undefined' && window.evidon?.notice?.showOptions) {
    try {
      window.evidon.notice.showOptions();
    } catch (error) {
      console.error('Failed to call Evidon API:', error);
    }
  }
};

export const listenToEvidonSignals = (callback: (gpcSignal: boolean) => void): (() => void) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleEvidonEvent = () => {
    try {
      if (window.evidon?.notice?.userGpcEnabled !== undefined) {
        callback(window.evidon.notice.userGpcEnabled);
      }
    } catch (error) {
      console.error('Failed to extract GPC signal from Evidon event:', error);
    }
  };

  window.addEventListener('evidon-consent-change', handleEvidonEvent);

  return () => {
    window.removeEventListener('evidon-consent-change', handleEvidonEvent);
  };
};

export class GpcComplianceTracker {
  private initialGpcState: boolean;

  private evidonCleanup: (() => void) | null = null;

  private initialCookiePreferences: Record<string, boolean>;

  private currentCookiePreferences: Record<string, boolean>;

  constructor(initialCookiePreferences: Record<string, boolean> = {}) {
    this.initialGpcState = detectGpcSignal();
    this.initialCookiePreferences = { ...initialCookiePreferences };
    this.currentCookiePreferences = { ...initialCookiePreferences };
  }

  public updateCookiePreferences(newPreferences: Record<string, boolean>): void {
    this.currentCookiePreferences = { ...newPreferences };
  }

  private hasCookiePreferencesChanged(): boolean {
    const allKeys = Array.from(
      new Set([
        ...Object.keys(this.currentCookiePreferences),
        ...Object.keys(this.initialCookiePreferences),
      ]),
    );

    return allKeys.some(
      (key) => this.currentCookiePreferences[key] !== this.initialCookiePreferences[key],
    );
  }

  public getGpcState(): GpcState {
    const currentGpcState = detectGpcSignal();
    const hasUserMadeCookieChanges = this.hasCookiePreferencesChanged();
    const scenario = determineGpcScenario(currentGpcState, hasUserMadeCookieChanges);

    return {
      isGpcDetected: currentGpcState,
      initialGpcState: this.initialGpcState,
      hasUserMadeCookieChanges,
      scenario,
    };
  }

  public initializeEvidon(shouldCallEvidon: boolean): void {
    if (shouldCallEvidon) {
      callEvidonApi(shouldCallEvidon).catch((error) => {
        console.error('Failed to call Evidon API:', error);
      });

      this.evidonCleanup = listenToEvidonSignals(() => {});
    }
  }

  public cleanup(): void {
    if (this.evidonCleanup) {
      this.evidonCleanup();
      this.evidonCleanup = null;
    }
  }
}
