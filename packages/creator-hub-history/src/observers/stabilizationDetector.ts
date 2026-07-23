/**
 * MutationObserver wrapper that detects when `<head>` metadata has settled.
 *
 * After each route change, the provider calls {@link detect}. A quiet-window
 * timer ({@link STABILIZATION_MS}) resets on every `<head>` mutation.
 * Once no mutations occur for that window — or the hard timeout
 * ({@link STABILIZATION_MAX_MS}) is reached — the callback fires with
 * the collected metadata.
 *
 * After the initial capture, a lightweight post-settle observer watches for
 * late `hub:title` changes (e.g. page-level `<HubMeta hubOnly>` components
 * that render after translations load). If the title changes within
 * {@link POST_SETTLE_WATCH_MS}, metadata is re-collected and the callback
 * fires again so the history entry is updated in-place.
 */

import {
  STABILIZATION_MS,
  STABILIZATION_MAX_MS,
  POST_SETTLE_WATCH_MS,
  HUB_META_PREFIX,
} from '../config';
import { MetadataCollector, CollectedMetadata } from '../collectors/metadataCollector';

/**
 * Watches `<head>` for mutations and fires a callback once metadata has
 * "stabilized" (no new mutations for STABILIZATION_MS), or after
 * STABILIZATION_MAX_MS as a hard fallback. Then continues watching for
 * late `hub:title` changes for POST_SETTLE_WATCH_MS.
 */
export default class StabilizationDetector {
  /** Active MutationObserver watching `<head>`, null when idle. */
  private observer: MutationObserver | null = null;

  /**
   * Quiet-window timer. Restarted on every `<head>` mutation.
   * When it fires (no mutations for STABILIZATION_MS), metadata is
   * considered stable.
   */
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Hard-timeout timer. Fires after STABILIZATION_MAX_MS regardless of
   * ongoing mutations, preventing indefinite waiting when `<head>` keeps
   * changing (e.g. a polling component that continuously updates meta tags).
   */
  private maxTimer: ReturnType<typeof setTimeout> | null = null;

  /** Post-settle observer watching for late hub:title changes. */
  private postSettleObserver: MutationObserver | null = null;

  /** Auto-cleanup timer for the post-settle observer. */
  private postSettleTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Start observing `<head>` mutations and fire `onStable` once metadata
   * has settled. Any previous detection is cleaned up first, so calling
   * `detect` on a new route change is safe without an explicit `cleanup`.
   *
   * @param collector  Reads current metadata from the DOM when stabilisation is reached.
   * @param onStable   Called once with the collected metadata, and again if
   *                   `hub:title` changes during the post-settle watch window.
   */
  detect(collector: MetadataCollector, onStable: (metadata: CollectedMetadata) => void): void {
    // Cancel any in-progress detection from a previous route change
    this.cleanup();

    if (typeof window === 'undefined') return;

    // Called when metadata is considered stable — collects and delivers it
    const settle = () => {
      this.cleanupPrimary();
      const metadata = collector.collect();
      onStable(metadata);

      this.watchForLateUpdates(collector, metadata.title, onStable);
    };

    // Start the hard timeout so we never wait longer than STABILIZATION_MAX_MS
    this.maxTimer = setTimeout(settle, STABILIZATION_MAX_MS);

    // Each mutation resets the quiet-window timer. If no mutation occurs
    // within STABILIZATION_MS the timer fires and calls settle().
    const resetStabilization = () => {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(settle, STABILIZATION_MS);
    };

    this.observer = new MutationObserver(() => {
      resetStabilization();
    });

    // Observe all changes inside <head>: added/removed nodes, text changes,
    // and attribute changes (e.g. meta content updates).
    const head = document.head ?? document.querySelector('head');
    if (head) {
      this.observer.observe(head, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
      });
    }

    // Kick off the first quiet-window timer immediately — if <head> is
    // already stable (no framework-driven mutations), we settle after
    // STABILIZATION_MS without waiting for a mutation first.
    resetStabilization();
  }

  /**
   * After the primary capture, watch for late `hub:title` meta tag changes.
   *
   * Page-level `<HubMeta hubOnly>` components (e.g. tab titles) may render
   * after the primary stabilisation window because their `withTranslation`
   * HOC needs to load translation files asynchronously. When this happens
   * on a hard refresh, the initial capture gets the breadcrumb-level title
   * ("Data Stores") instead of the full title ("Data Stores / Dashboard").
   *
   * This watcher catches that late update and re-fires the callback.
   * `addToRecentlyVisited` deduplicates by URL, so the history entry is
   * updated in-place with the corrected title.
   */
  private watchForLateUpdates(
    collector: MetadataCollector,
    initialTitle: string,
    onStable: (metadata: CollectedMetadata) => void,
  ): void {
    const head = document.head ?? document.querySelector('head');
    if (!head) return;

    this.postSettleTimer = setTimeout(() => {
      this.cleanupPostSettle();
    }, POST_SETTLE_WATCH_MS);

    const hubTitleSelector = `meta[name="${HUB_META_PREFIX}title"]`;

    this.postSettleObserver = new MutationObserver(() => {
      const hubTitleEl = document.querySelector<HTMLMetaElement>(hubTitleSelector);
      const currentTitle = hubTitleEl?.content;

      if (currentTitle && currentTitle !== initialTitle) {
        this.cleanupPostSettle();
        onStable(collector.collect());
      }
    });

    this.postSettleObserver.observe(head, {
      childList: true,
      subtree: true,
      attributes: true,
    });
  }

  /** Stop the primary observer and its timers. */
  private cleanupPrimary(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.maxTimer) {
      clearTimeout(this.maxTimer);
      this.maxTimer = null;
    }
  }

  /** Stop the post-settle observer and its timer. */
  private cleanupPostSettle(): void {
    if (this.postSettleObserver) {
      this.postSettleObserver.disconnect();
      this.postSettleObserver = null;
    }
    if (this.postSettleTimer) {
      clearTimeout(this.postSettleTimer);
      this.postSettleTimer = null;
    }
  }

  /** Stop observing and cancel all pending timers. */
  cleanup(): void {
    this.cleanupPrimary();
    this.cleanupPostSettle();
  }
}
