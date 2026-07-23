/* eslint-disable no-console -- Debug warnings */
import { UIMessage, UIMessageChunk } from 'ai';
import { sendMessage } from '@modules/react-query/analyticsAssistant';
import { BaseSignalRTransport, BaseSignalRTransportConfig } from './BaseSignalRTransport';
import { SignalRMessageEnvelope } from './types';

export interface AnalyticsSignalRTransportConfig extends BaseSignalRTransportConfig {
  universeId: number;
}

class AnalyticsSignalRTransport extends BaseSignalRTransport<
  SignalRMessageEnvelope,
  AnalyticsSignalRTransportConfig
> {
  private universeId: number;

  constructor(config: AnalyticsSignalRTransportConfig) {
    super(config);
    this.universeId = config.universeId;
  }

  /**
   * Get the conversation ID this transport is bound to
   */
  public getConversationId(): string {
    return this.conversationId;
  }

  // eslint-disable-next-line class-methods-use-this -- Abstract method implementation
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

  // eslint-disable-next-line class-methods-use-this -- Abstract method implementation
  protected extractEnvelopeMetadata(envelope: SignalRMessageEnvelope): {
    conversationId: string;
    sequenceNumber: number;
    isFinal: boolean;
  } {
    return {
      conversationId: envelope.requestId,
      sequenceNumber: envelope.sequenceNumber,
      isFinal: envelope.isFinal,
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
  // eslint-disable-next-line class-methods-use-this -- Abstract method implementation
  protected parsePayload(envelope: SignalRMessageEnvelope): UIMessageChunk | '[DONE]' {
    const payloadStr = envelope.payload;

    if (!payloadStr.startsWith('data: ')) {
      throw new Error(`Invalid payload format (expected "data: ..."): ${payloadStr}`);
    }

    const dataStr = payloadStr.substring(6);

    if (dataStr === '[DONE]') {
      return '[DONE]';
    }

    try {
      return JSON.parse(dataStr) as UIMessageChunk;
    } catch (error) {
      throw new Error(`Failed to parse payload JSON: ${dataStr}. Error: ${error}`);
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
