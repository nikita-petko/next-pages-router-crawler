import {
  BaseEvent,
  PageLoadEvent,
  ClickEvent,
  HoverEvent,
  ImpressionEvent,
  WebVitalsEvent,
  ErrorEvent,
  SessionEvent,
} from '../event';
import { TSessionEventName } from '../event/SessionEvent';
import { CreatorWebEventLogger, EventLogger } from '../eventLogger';
import ConsoleEventLogger from '../eventLogger/ConsoleEventLogger';
import emitter from '../utils/emitter';
import getCurrentUrl from '../utils/getCurrentUrl';
import createNewEvent from './createNewEvent';
import { TProduct, TTag } from './types';
import SessionService, { ISessionService } from '../utils/SessionService';
import ApiVitalsEvent from '../event/ApiVitalsEvent';

export type TUnifiedLoggerConfigs = {
  eventBaseUrl: string;
  product: TProduct;
  debugMode?: boolean;
  eventLogger?: EventLogger;
  sessionProductGroup?: TProduct;
  disableSession?: boolean;
};
export type TRawBaseEvent = { eventName: string; parameters?: Record<string, string> };
export type TRawTaggableEvent = TRawBaseEvent & { tags?: TTag[] };
export type TRawImpressionEvent = TRawTaggableEvent;
export type TRawClickEvent = TRawTaggableEvent;
export type TRawHoverEvent = TRawTaggableEvent;
export type TRawWebVitalsEvent = TRawTaggableEvent;
export type TRawAPIErrorEvent = TRawTaggableEvent;
export type TRawAPILoadEvent = TRawTaggableEvent;
export type TRawErrorEvent = TRawTaggableEvent;
export type TRawSessionEvent = TRawTaggableEvent & {
  eventName: TSessionEventName;
  sessionId: string;
};
export type TRawEvent =
  | { eventType: 'pageload' }
  | ({ eventType: 'click' } & TRawClickEvent)
  | ({ eventType: 'impression' } & TRawImpressionEvent)
  | ({ eventType: 'hover' } & TRawHoverEvent)
  | ({ eventType: 'webvitals' } & TRawWebVitalsEvent)
  | ({ eventType: 'apivitals' } & TRawWebVitalsEvent)
  | ({ eventType: 'error' } & TRawErrorEvent)
  | ({ eventType: 'session' } & TRawSessionEvent);

export type TPageLoadEventCallback = (event: PageLoadEvent) => void;
type EventsMap = {
  pageload: PageLoadEvent;
  click: ClickEvent;
  impression: ImpressionEvent;
  hover: HoverEvent;
  webvitals: WebVitalsEvent;
  apivitals: ApiVitalsEvent;
  error: ErrorEvent;
  session: SessionEvent;
};

export default class UnifiedLogger {
  private eventLoggers: EventLogger[] = [];

  private debugMode = false;

  private product: TProduct;

  // session scope: products with same sessionProductGroup will share the same session
  private sessionProductGroup: TProduct;

  private sessionService: ISessionService;

  private disableSession: boolean;

  // used to skip accidental duplicated pageload event
  private lastPageLoadUrl: string | undefined;

  // used to track referrer of the pageload
  private referrer: string | undefined;

  private isAutoCollectEnabled = false;

  events = emitter<EventsMap>();

  // /**
  //  * Creates an instance of UnifiedLogger.
  //  * @param eventBaseUrl The base URL for event logging endpoints.
  //  * @param product The product identifier for which events will be logged.
  //  * @param debugMode Optional. If true, enables debug mode which may activate additional logging mechanisms.
  //  * @param eventLogger Optional. A specific EventLogger instance to use for logging events.
  //  * @param sessionProductGroup Optional. Defines a product group for session-based event tracking.
  //  *                             If not provided, the product parameter is used.
  //  * @param disableSession Optional. If true, disables session-based event tracking.
  //  */
  constructor({
    eventBaseUrl,
    product,
    debugMode,
    eventLogger,
    sessionProductGroup,
    disableSession = false,
  }: TUnifiedLoggerConfigs) {
    this.eventLoggers.push(eventLogger ?? new CreatorWebEventLogger({ eventBaseUrl }));
    this.debugMode = !!debugMode;
    this.product = product;
    this.sessionProductGroup = sessionProductGroup ?? product;
    if (this.debugMode) {
      this.eventLoggers.push(new ConsoleEventLogger());
    }
    this.disableSession = disableSession;
    this.sessionService = this.disableSession
      ? { getOrCreateSessionId: () => undefined } // dummy session service if session is disabled
      : new SessionService({
          productName: this.sessionProductGroup,
          onSessionRefresh: this.onSessionRefresh,
        });
  }

  getEventLoggers(): EventLogger[] {
    return this.eventLoggers;
  }

  // auto collect pageload events
  trackPageLoad() {
    if (this.isAutoCollectEnabled) return;
    this.isAutoCollectEnabled = true;

    // For SPA pageview detection, detect page changes by overwriting and listening to pushState
    function pushStateWithListener() {
      const orig = window.history.pushState;
      return function overridePushState(this: unknown, ...args: Parameters<typeof orig>) {
        const rv = orig.apply(this, args);
        const event = createNewEvent('pushState');
        window.dispatchEvent(event);
        return rv;
      };
    }
    window.history.pushState = pushStateWithListener();
    // For URL changes
    window.addEventListener('pushState', () => {
      setTimeout(() => {
        this.logPageLoadEvent();
      });
    });

    // For backward/forward button clicks
    window.addEventListener('popstate', () => {
      setTimeout(() => {
        this.logPageLoadEvent();
      });
    });

    // initial pageload
    this.logPageLoadEvent();
  }

  private logEventToLogger(event: BaseEvent) {
    this.eventLoggers.forEach((eventLogger) => {
      eventLogger.logEvent(event);
    });
  }

  logEvent(event: TRawEvent) {
    switch (event.eventType) {
      case 'pageload':
        this.logPageLoadEvent();
        break;
      case 'click':
        this.logClickEvent({
          eventName: event.eventName,
          parameters: event.parameters,
          tags: event.tags,
        });
        break;
      case 'impression':
        this.logImpressionEvent({
          eventName: event.eventName,
          parameters: event.parameters,
          tags: event.tags,
        });
        break;
      case 'hover':
        this.logHoverEvent({
          eventName: event.eventName,
          parameters: event.parameters,
          tags: event.tags,
        });
        break;
      case 'webvitals':
        this.logWebVitalsEvent({
          eventName: event.eventName,
          parameters: event.parameters,
          tags: event.tags,
        });
        break;
      case 'apivitals':
        this.logApiVitalsEvent({
          eventName: event.eventName,
          parameters: event.parameters,
          tags: event.tags,
        });
        break;
      case 'session':
        this.logSessionEvent({
          eventName: event.eventName,
          sessionId: event.sessionId,
          parameters: event.parameters,
          tags: event.tags,
        });
        break;
      default:
        break;
    }
  }

  logPageLoadEvent() {
    const currentUrl = getCurrentUrl();
    // skip accidental duplicated pageload events or url hash change through pushState
    if (currentUrl === this.lastPageLoadUrl) return;
    const sessionId = this.sessionService.getOrCreateSessionId();
    const event = new PageLoadEvent({
      product: this.product,
      url: currentUrl,
      sessionId,
      referralUrl: this.referrer ?? document.referrer,
      parameters: { browserLocale: navigator.language },
    });

    this.events.emit('pageload', event);
    this.logEventToLogger(event);

    this.referrer = currentUrl;
    this.lastPageLoadUrl = currentUrl;
  }

  logClickEvent({ eventName, parameters, tags }: TRawClickEvent) {
    const currentUrl = getCurrentUrl();
    const sessionId = this.sessionService.getOrCreateSessionId();
    const event = new ClickEvent({
      product: this.product,
      url: currentUrl,
      sessionId,
      eventName,
      parameters,
      tags,
    });

    this.events.emit('click', event);
    this.logEventToLogger(event);
  }

  logImpressionEvent({ eventName, parameters, tags }: TRawImpressionEvent) {
    const currentUrl = getCurrentUrl();
    const sessionId = this.sessionService.getOrCreateSessionId();
    const event = new ImpressionEvent({
      product: this.product,
      url: currentUrl,
      sessionId,
      eventName,
      parameters,
      tags,
    });

    this.events.emit('impression', event);
    this.logEventToLogger(event);
  }

  logHoverEvent({ eventName, parameters, tags }: TRawHoverEvent) {
    const currentUrl = getCurrentUrl();
    const sessionId = this.sessionService.getOrCreateSessionId();
    const event = new HoverEvent({
      product: this.product,
      url: currentUrl,
      sessionId,
      eventName,
      parameters,
      tags,
    });

    this.events.emit('hover', event);
    this.logEventToLogger(event);
  }

  logWebVitalsEvent({ eventName, parameters, tags }: TRawWebVitalsEvent) {
    const currentUrl = getCurrentUrl();
    const sessionId = this.sessionService.getOrCreateSessionId();
    const event = new WebVitalsEvent({
      product: this.product,
      url: currentUrl,
      sessionId,
      eventName,
      parameters,
      tags,
    });

    this.events.emit('webvitals', event);
    this.logEventToLogger(event);
  }

  logApiVitalsEvent({ eventName, parameters, tags }: TRawWebVitalsEvent) {
    const currentUrl = getCurrentUrl();
    const sessionId = this.sessionService.getOrCreateSessionId();
    const event = new ApiVitalsEvent({
      product: this.product,
      url: currentUrl,
      sessionId,
      eventName,
      parameters,
      tags,
    });

    this.events.emit('webvitals', event);
    this.logEventToLogger(event);
  }

  logErrorEvent({ eventName, parameters, tags }: TRawErrorEvent) {
    const currentUrl = getCurrentUrl();
    const sessionId = this.sessionService.getOrCreateSessionId();
    const event = new ErrorEvent({
      product: this.product,
      url: currentUrl,
      sessionId,
      eventName,
      parameters,
      tags,
    });

    this.events.emit('error', event);
    this.logEventToLogger(event);
  }

  onSessionRefresh = (sessionId: string) => {
    this.logSessionEvent({
      eventName: 'sessionStart',
      sessionId,
    });
  };

  logSessionEvent({ eventName, sessionId, parameters, tags }: TRawSessionEvent) {
    const currentUrl = getCurrentUrl();
    const event = new SessionEvent({
      product: this.product,
      url: currentUrl,
      eventName,
      sessionId,
      parameters,
      tags,
    });

    this.events.emit('session', event);
    this.logEventToLogger(event);
  }

  /**
   * @deprecated use events.on('pageload', callback) instead
   */
  onPageLoadEvent(callback: TPageLoadEventCallback) {
    this.events.on('pageload', callback);
  }
}
