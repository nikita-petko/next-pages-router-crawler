/* eslint-disable no-console -- Debug warnings */
import type { ChatTransport, UIMessage, UIMessageChunk } from 'ai';
import {
  FINISH_STREAMING_TIMEOUT_MS,
  MAX_STALL_RECONCILE_ATTEMPTS,
  STALL_RECONCILE_TIMEOUT_MS,
} from '../constants/signalr';
import { logStreamTransportDiagnostic } from './streamTransportDiagnostics';

type StreamController = ReadableStreamDefaultController<UIMessageChunk>;

interface ConversationStreamState {
  controller: StreamController;
  expectedSequenceNumber: number;
  bufferedChunks: Map<number, UIMessageChunk>;
  finishTimeoutId: ReturnType<typeof setTimeout> | null;
  firstBufferedAtMs: number | null;
  stallTimeoutId: ReturnType<typeof setTimeout> | null;
  stallReconcileAttempts: number;
  stallReconcileFrontier: number;
}

export interface BaseSignalRTransportConfig {
  /**
   * SignalR namespace to filter incoming messages
   */
  namespace: string;

  /**
   * The conversation ID this transport is bound to
   */
  conversationId: string;
}

/**
 * Abstract base class for SignalR-based chat transports
 *
 * Provides generic SignalR connection handling, message routing, buffering,
 * and stream management. Concrete implementations must define how to:
 * - Validate and parse SignalR message envelopes
 * - Send messages to backend APIs
 *
 * @template TEnvelope - The SignalR envelope type (e.g., SignalRMessageEnvelope)
 * @template TConfig - Configuration type extending BaseSignalRTransportConfig
 */
export abstract class BaseSignalRTransport<
  TEnvelope,
  TConfig extends BaseSignalRTransportConfig,
> implements ChatTransport<UIMessage> {
  protected namespace: string;

  protected conversationId: string;

  protected activeStream: ConversationStreamState | null = null;

  /**
   * Assistant messageId captured from the live `start` chunk. Lets reconcile
   * target the right message on fresh live sends, not just page-load resume.
   */
  protected liveMessageId: string | null = null;

  private reconciling = false;

  constructor(config: TConfig) {
    this.namespace = config.namespace;
    this.conversationId = config.conversationId;
  }

  /**
   * Type guard to validate the raw SignalR message
   *
   * @param message - Unknown message object from SignalR
   * @returns True if message matches the expected envelope structure
   */
  protected abstract isValidEnvelope(message: unknown): message is TEnvelope;

  /**
   * Extract required metadata from the envelope for routing and buffering
   *
   * @param envelope - Validated SignalR envelope
   * @returns Metadata needed for stream management
   */
  protected abstract extractEnvelopeMetadata(envelope: TEnvelope): {
    conversationId: string;
    sequenceNumber: number;
    isFinal: boolean;
  };

  /**
   * Parse the envelope payload into a UIMessageChunk or '[DONE]' marker
   *
   * @param envelope - Validated SignalR envelope
   * @returns Parsed chunk or done marker
   * @throws Error if payload format is invalid
   */
  protected abstract parsePayload(envelope: TEnvelope): UIMessageChunk | '[DONE]';

  /**
   * Send message to the backend HTTP API (triggers streaming response via SignalR)
   *
   * Note: This sends an HTTP request to initiate message processing. The actual response
   * chunks stream back asynchronously via SignalR and are handled by handleSignalRMessage().
   *
   * @param conversationId - The conversation ID (equals chatId from Vercel AI SDK)
   * @param messages - Full message history from Vercel AI SDK
   * @throws Error if API call fails
   */
  protected abstract sendMessageToAPI(conversationId: string, messages: UIMessage[]): Promise<void>;

  /**
   * Load buffered envelopes for stream resume/reconcile (HTTP replay).
   *
   * @param options.after - Return only chunks after this sequence number.
   *   Omit to replay the full backlog from the start.
   * @param options.messageId - Target assistant message; defaults to the
   *   subclass's resume id (e.g. the in-progress message captured on page load).
   * Default: none.
   */
  protected async loadBacklogChunks(
    // eslint-disable-next-line no-unused-vars -- Default no-op; subclasses read these options to scope the HTTP replay backlog
    _options?: {
      after?: number;
      messageId?: string;
    },
  ): Promise<TEnvelope[]> {
    return [];
  }

  /**
   * Handle incoming SignalR message
   * Called by useSignalR's notification callback
   * Matches TSignalRCallback signature: (namespace: string, detail: string) => void
   *
   * @param namespace - Notification namespace
   * @param detail - Raw JSON string from SignalR
   */
  public handleSignalRMessage(namespace: string, detail: string): void {
    if (namespace !== this.namespace) {
      return;
    }

    let message: unknown;
    try {
      message = JSON.parse(detail);
    } catch (error) {
      console.error('[BaseSignalRTransport] Failed to parse SignalR message:', error);
      return;
    }

    if (!this.isValidEnvelope(message)) {
      console.error('[BaseSignalRTransport] Invalid envelope format:', message);
      return;
    }

    this.ingestEnvelope(message);
  }

  protected ingestEnvelope(envelope: TEnvelope): void {
    const { conversationId, sequenceNumber, isFinal } = this.extractEnvelopeMetadata(envelope);

    if (conversationId !== this.conversationId) {
      return;
    }

    if (!this.activeStream) {
      logStreamTransportDiagnostic({
        event: 'no_active_stream',
        conversationId,
      });
      console.error(
        `[BaseSignalRTransport] No active stream for conversationId: ${conversationId}`,
      );
      return;
    }

    let chunk: UIMessageChunk | '[DONE]';
    try {
      chunk = this.parsePayload(envelope);
    } catch (error) {
      console.error('[BaseSignalRTransport] Failed to parse payload:', error);
      this.activeStream.controller.error(error);
      this.cleanup();
      return;
    }

    if (chunk === '[DONE]') {
      this.finishStream();
      return;
    }

    if (chunk.type === 'start' && chunk.messageId !== undefined) {
      this.liveMessageId = chunk.messageId;
    }

    if (sequenceNumber === this.activeStream.expectedSequenceNumber) {
      this.activeStream.controller.enqueue(chunk);
      this.activeStream.expectedSequenceNumber += 1;
      this.flushBuffer();
      if (this.activeStream.bufferedChunks.size === 0) {
        this.activeStream.firstBufferedAtMs = null;
      }
    } else if (sequenceNumber > this.activeStream.expectedSequenceNumber) {
      this.activeStream.firstBufferedAtMs ??= Date.now();
      this.activeStream.bufferedChunks.set(sequenceNumber, chunk);
      logStreamTransportDiagnostic({
        event: 'sequence_gap_buffered',
        conversationId,
        expectedSequenceNumber: this.activeStream.expectedSequenceNumber,
        arrivedSequenceNumber: sequenceNumber,
        bufferedChunkCount: this.activeStream.bufferedChunks.size,
      });
      this.armStallTimer();
    } else {
      logStreamTransportDiagnostic({
        event: 'duplicate_sequence',
        conversationId,
        expectedSequenceNumber: this.activeStream.expectedSequenceNumber,
        arrivedSequenceNumber: sequenceNumber,
      });
      console.warn(
        `[BaseSignalRTransport] Received duplicate message (seq ${sequenceNumber}, waiting for ${this.activeStream.expectedSequenceNumber})`,
      );
    }

    if (isFinal) {
      if (this.activeStream.finishTimeoutId) {
        clearTimeout(this.activeStream.finishTimeoutId);
      }

      if (sequenceNumber !== this.activeStream.expectedSequenceNumber) {
        this.activeStream.finishTimeoutId = setTimeout(() => {
          logStreamTransportDiagnostic({
            event: 'force_finish_timeout',
            conversationId,
            expectedSequenceNumber: this.activeStream?.expectedSequenceNumber,
            bufferedChunkCount: this.activeStream?.bufferedChunks.size,
            gapHoldMs:
              this.activeStream?.firstBufferedAtMs != null
                ? Date.now() - this.activeStream.firstBufferedAtMs
                : undefined,
          });
          console.warn(
            `[BaseSignalRTransport] Force finishing stream after timeout for ${conversationId}`,
          );
          this.flushBuffer();
          this.finishStream();
        }, FINISH_STREAMING_TIMEOUT_MS);
      } else {
        this.finishStream();
      }
    }
  }

  /**
   * Cleanup stream resources without closing (for cancellation)
   */
  public cleanup(): void {
    if (this.activeStream?.finishTimeoutId) {
      clearTimeout(this.activeStream.finishTimeoutId);
    }
    this.clearStallTimer();
    this.activeStream = null;
  }

  /**
   * Whether a turn is currently streaming into an open controller. Recovery uses
   * this to choose in-place reconcile (true) vs. re-opening the stream (false).
   */
  public hasActiveStream(): boolean {
    return this.activeStream !== null;
  }

  /**
   * In-place recovery for a still-live turn. After a connection failure
   * recovers, live chunks emitted during the outage were never delivered;
   * replay the HTTP backlog after the last delivered chunk and feed it through
   * the existing reorder/dedupe path into the SAME controller. The SDK is
   * oblivious; already-seen chunks are dropped, gaps fill, and live continues.
   */
  public async reconcileActiveStream(): Promise<void> {
    const stream = this.activeStream;
    if (!stream || this.reconciling) {
      return;
    }

    this.reconciling = true;
    try {
      const lastDelivered = stream.expectedSequenceNumber - 1;
      const after = lastDelivered >= 0 ? lastDelivered : undefined;
      const messageId = this.liveMessageId ?? undefined;

      const envelopes = await this.loadBacklogChunks({ after, messageId });

      // The stream may have been finished or replaced by a fresh turn while the
      // backlog request was in flight. Ingesting now would inject this turn's
      // backlog into the wrong (or a torn-down) stream, so bail out.
      if (this.activeStream !== stream) {
        return;
      }

      envelopes.forEach((envelope) => {
        if (this.isValidEnvelope(envelope)) {
          this.ingestEnvelope(envelope);
        }
      });
      this.onSequenceAdvanced();
    } finally {
      this.reconciling = false;
    }
  }

  /**
   * Send messages to the backend and setup streaming infrastructure
   * Implementation of ChatTransport.sendMessages
   */
  async sendMessages({
    chatId,
    messages,
  }: Parameters<ChatTransport<UIMessage>['sendMessages']>[0]): Promise<
    ReadableStream<UIMessageChunk>
  > {
    const conversationId = chatId;

    if (conversationId !== this.conversationId) {
      throw new Error(
        `Transport is bound to conversation ${this.conversationId}, cannot send to ${conversationId}`,
      );
    }

    if (this.activeStream) {
      console.warn(
        `[BaseSignalRTransport] Stream already active for conversationId: ${conversationId}. Cleaning up old stream.`,
      );
      this.finishStream();
    }

    const stream = this.createActiveReadableStream();

    try {
      await this.sendMessageToAPI(conversationId, messages);
    } catch (error) {
      if (this.activeStream) {
        this.activeStream.controller.error(error);
        this.cleanup();
      }
      throw error;
    }

    return stream;
  }

  /**
   * Resume an in-flight assistant turn: create a stream, replay the Redis backlog, then
   * continue with live SignalR chunks on the same ingest path.
   */
  async reconnectToStream({
    chatId,
  }: Parameters<
    ChatTransport<UIMessage>['reconnectToStream']
  >[0]): Promise<ReadableStream<UIMessageChunk> | null> {
    if (chatId !== this.conversationId) {
      return null;
    }

    if (this.activeStream) {
      this.finishStream();
    }

    const resumeMessageId = this.liveMessageId ?? undefined;
    const stream = this.createActiveReadableStream();
    const streamState = this.activeStream;

    try {
      const envelopes = await this.loadBacklogChunks({ messageId: resumeMessageId });

      // A fresh turn (or another reconnect) may have replaced this stream while
      // the backlog request was in flight. Ingesting now would inject this
      // turn's backlog into the replacement stream, so bail out.
      if (this.activeStream !== streamState) {
        return stream;
      }

      envelopes.forEach((envelope) => {
        if (this.isValidEnvelope(envelope)) {
          this.ingestEnvelope(envelope);
        }
      });
    } catch (error) {
      // Only tear down the stream this call created; a newer turn may now own
      // this.activeStream and must not be errored by a stale backlog failure.
      if (streamState && this.activeStream === streamState) {
        streamState.controller.error(error);
        this.cleanup();
      }
      throw error;
    }

    return stream;
  }

  /**
   * Flush buffered out-of-order chunks that are now ready to be enqueued
   */
  protected flushBuffer(): void {
    if (!this.activeStream) {
      return;
    }

    const sortedKeys = Array.from(this.activeStream.bufferedChunks.keys()).sort((a, b) => a - b);

    sortedKeys.forEach((seqNum) => {
      if (this.activeStream && seqNum === this.activeStream.expectedSequenceNumber) {
        const chunk = this.activeStream.bufferedChunks.get(seqNum);
        if (chunk) {
          this.activeStream.controller.enqueue(chunk);
          this.activeStream.bufferedChunks.delete(seqNum);
          this.activeStream.expectedSequenceNumber += 1;
        }
      }
    });

    this.onSequenceAdvanced();
  }

  /**
   * Finish the stream and clean up resources
   */
  protected finishStream(): void {
    if (!this.activeStream) {
      return;
    }

    if (this.activeStream.finishTimeoutId) {
      clearTimeout(this.activeStream.finishTimeoutId);
    }
    this.clearStallTimer();

    try {
      this.activeStream.controller.close();
    } catch (error) {
      console.error('[BaseSignalRTransport] Error closing stream:', error);
    }

    this.activeStream = null;
    console.log(`[BaseSignalRTransport] Stream finished for ${this.conversationId}`);
  }

  private clearStallTimer(): void {
    if (this.activeStream?.stallTimeoutId) {
      clearTimeout(this.activeStream.stallTimeoutId);
      this.activeStream.stallTimeoutId = null;
    }
  }

  private armStallTimer(): void {
    if (!this.activeStream || this.activeStream.stallTimeoutId !== null) {
      return;
    }
    if (this.activeStream.bufferedChunks.size === 0) {
      return;
    }

    this.activeStream.stallTimeoutId = setTimeout(() => {
      if (this.activeStream) {
        this.activeStream.stallTimeoutId = null;
      }
      void this.handleStallTimeout();
    }, STALL_RECONCILE_TIMEOUT_MS);
  }

  private onSequenceAdvanced(): void {
    this.clearStallTimer();
    if (!this.activeStream) {
      return;
    }

    // Any forward movement of the contiguous frontier means the gap we were
    // reconciling for has resolved; refresh the attempt budget so a later,
    // unrelated gap gets a full set of retries even if the buffer never fully
    // drains (a continuously-trailing stream).
    if (this.activeStream.expectedSequenceNumber > this.activeStream.stallReconcileFrontier) {
      this.activeStream.stallReconcileFrontier = this.activeStream.expectedSequenceNumber;
      this.activeStream.stallReconcileAttempts = 0;
    }

    if (this.activeStream.bufferedChunks.size === 0) {
      return;
    }
    this.armStallTimer();
  }

  private async handleStallTimeout(): Promise<void> {
    const stream = this.activeStream;
    if (!stream || stream.bufferedChunks.size === 0) {
      return;
    }
    if (stream.stallReconcileAttempts >= MAX_STALL_RECONCILE_ATTEMPTS) {
      console.warn(
        `[BaseSignalRTransport] Stall reconcile max attempts reached for ${this.conversationId}`,
      );
      return;
    }

    stream.stallReconcileAttempts += 1;
    try {
      await this.reconcileActiveStream();
    } catch (error) {
      console.error('[BaseSignalRTransport] Stall reconcile failed:', error);
    }

    // Re-arm on any remaining gap, including after a failed fetch, so a
    // transient backlog error retries (bounded by MAX_STALL_RECONCILE_ATTEMPTS)
    // instead of abandoning recovery. Skip if a newer turn replaced the stream
    // while reconcile was in flight.
    if (this.activeStream === stream && stream.bufferedChunks.size) {
      this.armStallTimer();
    }
  }

  private createActiveReadableStream(): ReadableStream<UIMessageChunk> {
    return new ReadableStream<UIMessageChunk>({
      start: (controller) => {
        this.liveMessageId = null;
        this.activeStream = {
          controller,
          expectedSequenceNumber: 0,
          bufferedChunks: new Map(),
          finishTimeoutId: null,
          firstBufferedAtMs: null,
          stallTimeoutId: null,
          stallReconcileAttempts: 0,
          stallReconcileFrontier: 0,
        };
      },
      cancel: () => {
        this.cleanup();
      },
    });
  }
}
