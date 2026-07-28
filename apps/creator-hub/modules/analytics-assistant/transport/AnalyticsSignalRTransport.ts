import type { UIMessage, UIMessageChunk } from 'ai';
import {
  getConversationStream,
  sendMessage,
  type ContentPart,
} from '@modules/react-query/analyticsAssistant/analyticsAssistantRequests';
import { isAskQuestionAnswerPart } from '../adapters/streamingProtocol/adaptAskQuestionPart';
import { AnalyticsChatDataPartType, type AnalyticsChatMessage } from '../types/AnalyticsChatTypes';
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
   * Extracts the last user message from the conversation history, builds its
   * content parts, and sends them to the backend, which triggers streaming via
   * SignalR.
   */
  protected async sendMessageToAPI(conversationId: string, messages: UIMessage[]): Promise<void> {
    const userMessages = messages.filter((m) => m.role === 'user');
    if (userMessages.length === 0) {
      throw new Error('No user message found in conversation');
    }

    const lastUserMessage = userMessages[userMessages.length - 1];
    // The analytics transport only ever carries AnalyticsChatMessages; narrow
    // from the SDK's generic UIMessage so the typed data-part guard applies
    // (same SDK-boundary assertion as parsePayload above).
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- runtime type is always AnalyticsChatMessage
    const content = this.buildContentParts(lastUserMessage as AnalyticsChatMessage);

    if (content.length === 0) {
      throw new Error('User message has no content to send');
    }

    // The API requires exactly one of `content` or `input`; `input` is
    // deprecated, so every turn — plain text or a clarifying-question answer —
    // is sent as `content`. Response is empty; streaming happens via SignalR.
    await sendMessage(conversationId, this.universeId, content);
  }

  /**
   * Map a user turn's parts to API content parts: text parts collapse into a
   * single text part (preserving the whole typed message), and a
   * clarifying-question answer becomes a `data-ask-question-answer` data part.
   */
  private buildContentParts(message: AnalyticsChatMessage): ContentPart[] {
    const content: ContentPart[] = [];
    // Defend against a malformed turn whose `parts` is absent at runtime.
    const parts = message.parts ?? [];

    const text = parts.flatMap((part) => (part.type === 'text' ? [part.text] : [])).join('');
    if (text) {
      content.push({ type: 'text', text });
    }

    const answerPart = parts.find(isAskQuestionAnswerPart);
    if (answerPart) {
      content.push({
        type: 'data',
        // Inner DataPart.type is the PREFIXED wire form the backend expects.
        data: {
          type: AnalyticsChatDataPartType.AskQuestionAnswer,
          id: answerPart.id,
          data: answerPart.data,
        },
      });
    }

    return content;
  }
}

export default AnalyticsSignalRTransport;
