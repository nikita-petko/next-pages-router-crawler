/* eslint-disable no-console -- Debug warnings */
import type { UIMessage, UIMessageChunk } from 'ai';
import { sendMessage } from '@modules/react-query/analyticsAssistant';
import { getConversationStream } from '@modules/react-query/analyticsAssistant/analyticsAssistantRequests';
import type { BaseSignalRTransportConfig } from './BaseSignalRTransport';
import { BaseSignalRTransport } from './BaseSignalRTransport';
import { logStreamTransportDiagnostic } from './streamTransportDiagnostics';
import type { SignalRMessageEnvelope } from './types';

// Prefix of sandbox parent thinking-step ids (`tool-{toolName}_{agenticRound}`).
// https://sourcegraph.rbx.com/github.rbx.com/Roblox/creator-analytics-assistant/-/blob/services/analytics-assistant-workflows/src/common/models/streaming_data.py?L144
const SANDBOX_PARENT_STEP_ID_PREFIX = 'tool-ExecuteCodeInSandbox_';

export interface AnalyticsSignalRTransportConfig extends BaseSignalRTransportConfig {
  universeId: number;
}

class AnalyticsSignalRTransport extends BaseSignalRTransport<
  SignalRMessageEnvelope,
  AnalyticsSignalRTransportConfig
> {
  private universeId: number;

  private inProgressMessageId: string | null = null;

  constructor(config: AnalyticsSignalRTransportConfig) {
    super(config);
    this.universeId = config.universeId;
  }

  public setInProgressMessageId(messageId: string): void {
    this.inProgressMessageId = messageId;
  }

  protected override async loadBacklogChunks({
    after,
    messageId,
  }: { after?: number; messageId?: string } = {}): Promise<SignalRMessageEnvelope[]> {
    // Prefer the message id captured from the live stream; fall back to the
    // resume id supplied on page load.
    const targetMessageId = messageId ?? this.inProgressMessageId;
    if (!targetMessageId) {
      return [];
    }

    const { chunks } = await getConversationStream(this.conversationId, targetMessageId, after);
    const sequenceNumbers = chunks
      .map((chunk) => chunk.sequenceNumber)
      .filter((sequenceNumber): sequenceNumber is number => sequenceNumber != null);
    const sandboxParentStepPresent = chunks.some(
      (chunk) =>
        typeof chunk.payload === 'string' && chunk.payload.includes(SANDBOX_PARENT_STEP_ID_PREFIX),
    );
    logStreamTransportDiagnostic({
      event: 'backlog_replay',
      conversationId: this.conversationId,
      backlogChunkCount: chunks.length,
      backlogSequenceMin: sequenceNumbers.length > 0 ? Math.min(...sequenceNumbers) : undefined,
      backlogSequenceMax: sequenceNumbers.length > 0 ? Math.max(...sequenceNumbers) : undefined,
      sandboxParentStepPresent,
    });
    return chunks;
  }

  /**
   * Get the conversation ID this transport is bound to
   */
  public getConversationId(): string {
    return this.conversationId;
  }

  protected isValidEnvelope(message: unknown): message is SignalRMessageEnvelope {
    if (typeof message !== 'object' || message === null) {
      return false;
    }

    const msg = message as Partial<SignalRMessageEnvelope>;

    return (
      typeof msg.isFinal === 'boolean' &&
      typeof msg.requestId === 'string' &&
      typeof msg.sequenceNumber === 'number' &&
      typeof msg.payload === 'string'
    );
  }

  protected extractEnvelopeMetadata(envelope: SignalRMessageEnvelope): {
    conversationId: string;
    sequenceNumber: number;
    isFinal: boolean;
  } {
    const { requestId, sequenceNumber, isFinal } = envelope;
    if (
      typeof requestId !== 'string' ||
      typeof sequenceNumber !== 'number' ||
      typeof isFinal !== 'boolean'
    ) {
      throw new TypeError('Invalid SignalR envelope metadata');
    }

    return {
      conversationId: requestId,
      sequenceNumber,
      isFinal,
    };
  }

  /**
   * Parse the string payload into a UIMessageChunk or '[DONE]' marker
   *
   * Expected format: "data: <json>" where <json> is either a UIMessageChunk or "[DONE]"
   * Examples:
   * - "data: {\"type\": \"text-delta\", \"delta\": \"Hello\", \"id\": \"123\"}"
   * - "data: [DONE]"
   */
  protected parsePayload(envelope: SignalRMessageEnvelope): UIMessageChunk | '[DONE]' {
    const payloadStr = envelope.payload;
    if (typeof payloadStr !== 'string') {
      throw new TypeError('Invalid SignalR envelope payload');
    }

    if (!payloadStr.startsWith('data: ')) {
      throw new Error(`Invalid payload format (expected "data: ..."): ${payloadStr}`);
    }

    const dataStr = payloadStr.slice(6);

    if (dataStr === '[DONE]') {
      return '[DONE]';
    }

    try {
      const parsed: unknown = JSON.parse(dataStr);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- the SSE data payload is a serialized UIMessageChunk produced by the backend stream; the shape is validated by the AI SDK consumer downstream.
      return parsed as UIMessageChunk;
    } catch (error) {
      throw new Error(`Failed to parse payload JSON: ${dataStr}. Error: ${String(error)}`, {
        cause: error,
      });
    }
  }

  /**
   * Send message to the Analytics Assistant API
   *
   * Extracts the last user message from the conversation history and
   * sends it to the backend, which triggers streaming via SignalR.
   */
  protected async sendMessageToAPI(conversationId: string, messages: UIMessage[]): Promise<void> {
    const userMessages = messages.filter((m) => m.role === 'user');
    if (userMessages.length === 0) {
      throw new Error('No user message found in conversation');
    }

    const lastUserMessage = userMessages[userMessages.length - 1];

    // Extract text from parts
    const textParts = lastUserMessage.parts?.filter((p) => p.type === 'text') || [];
    const input = textParts.map((p) => (p as { text: string }).text).join('');

    if (!input) {
      throw new Error('User message has no text content');
    }

    console.log(
      `[AnalyticsSignalRTransport] Sending message to API for conversation: ${conversationId}`,
    );

    // Call API (response is empty, streaming happens via SignalR)
    await sendMessage(conversationId, this.universeId, input);
  }
}

export default AnalyticsSignalRTransport;
/* eslint-enable no-console -- Debug warnings */
