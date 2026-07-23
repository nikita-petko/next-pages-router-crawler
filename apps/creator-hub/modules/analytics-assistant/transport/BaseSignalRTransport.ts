// eslint-disable-next-line eslint-comments/require-description, eslint-comments/disable-enable-pair -- Debug warnings
/* eslint-disable no-console -- Debug warnings */
import { ChatTransport, UIMessage, UIMessageChunk } from 'ai';
import { FINISH_STREAMING_TIMEOUT_MS } from '../constants/signalr';

type StreamController = ReadableStreamDefaultController<UIMessageChunk>;

interface ConversationStreamState {
  controller: StreamController;
  expectedSequenceNumber: number;
  bufferedChunks: Map<number, UIMessageChunk>;
  finishTimeoutId: ReturnType<typeof setTimeout> | null;
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
export abstract class BaseSignalRTransport<TEnvelope, TConfig extends BaseSignalRTransportConfig>
  implements ChatTransport<UIMessage>
{
  protected namespace: string;

  protected conversationId: string;

  protected activeStream: ConversationStreamState | null = null;

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

    const { conversationId, sequenceNumber, isFinal } = this.extractEnvelopeMetadata(message);

    // Silently drop messages for other conversations (multi-tab scenario)
    if (conversationId !== this.conversationId) {
      return;
    }

    if (!this.activeStream) {
      console.error(
        `[BaseSignalRTransport] No active stream for conversationId: ${conversationId}`,
      );
      return;
    }

    let chunk: UIMessageChunk | '[DONE]';
    try {
      chunk = this.parsePayload(message);
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

    // Buffer or enqueue chunk based on sequence number
    if (sequenceNumber === this.activeStream.expectedSequenceNumber) {
      this.activeStream.controller.enqueue(chunk);
      this.activeStream.expectedSequenceNumber += 1;
      this.flushBuffer();
    } else if (sequenceNumber > this.activeStream.expectedSequenceNumber) {
      this.activeStream.bufferedChunks.set(sequenceNumber, chunk);
    } else {
      console.warn(
        `[BaseSignalRTransport] Received duplicate message (seq ${sequenceNumber}, waiting for ${this.activeStream.expectedSequenceNumber})`,
      );
    }

    // Handle final message with timeout
    if (isFinal) {
      if (this.activeStream.finishTimeoutId) {
        clearTimeout(this.activeStream.finishTimeoutId);
      }

      if (sequenceNumber !== this.activeStream.expectedSequenceNumber) {
        // Final message arrived out of order - set timeout to flush remaining
        this.activeStream.finishTimeoutId = setTimeout(() => {
          console.warn(
            `[BaseSignalRTransport] Force finishing stream after timeout for ${conversationId}`,
          );
          this.flushBuffer();
          this.finishStream();
        }, FINISH_STREAMING_TIMEOUT_MS);
      } else {
        // Final message arrived in order - finish immediately after flushing
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
    this.activeStream = null;
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
    const conversationId = chatId; // In our design, chatId === conversationId

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

    const stream = new ReadableStream<UIMessageChunk>({
      start: (controller) => {
        this.activeStream = {
          controller,
          expectedSequenceNumber: 0,
          bufferedChunks: new Map(),
          finishTimeoutId: null,
        };
      },
      cancel: () => {
        this.cleanup();
      },
    });

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
   * Reconnect to an existing stream (not applicable for SignalR persistent connection)
   * Implementation of ChatTransport.reconnectToStream
   */
  // eslint-disable-next-line class-methods-use-this -- Required by ChatTransport interface
  async reconnectToStream(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Required by ChatTransport interface
    _options: Parameters<ChatTransport<UIMessage>['reconnectToStream']>[0],
  ): Promise<ReadableStream<UIMessageChunk> | null> {
    // SignalR connection is persistent, no need to "reconnect" a stream
    console.log('[BaseSignalRTransport] reconnectToStream called (no-op for SignalR)');
    return null;
  }

  /**
   * Flush buffered out-of-order chunks that are now ready to be enqueued
   */
  protected flushBuffer(): void {
    if (!this.activeStream) return;

    // Keep flushing consecutive chunks
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
  }

  /**
   * Finish the stream and clean up resources
   */
  protected finishStream(): void {
    if (!this.activeStream) return;

    if (this.activeStream.finishTimeoutId) {
      clearTimeout(this.activeStream.finishTimeoutId);
    }

    try {
      this.activeStream.controller.close();
    } catch (error) {
      console.error('[BaseSignalRTransport] Error closing stream:', error);
    }

    this.activeStream = null;
    console.log(`[BaseSignalRTransport] Stream finished for ${this.conversationId}`);
  }
}
