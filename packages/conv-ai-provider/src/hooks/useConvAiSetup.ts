import * as signalR from '@microsoft/signalr';
import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  Emitter,
  MessageChunk,
  StreamChunk,
  WSNotificationBotMessageClientAction,
} from '../types';
import { ConvApiV2ActionType } from '../types';
import { convertConvAIErrorToConversationError } from '../utils/handleErrorsUtils';

export const ReconnectingTimeoutDelay = 1000 * 20;
export const FinishStreamingResponseDelay = 1000;

const useConvAiSetup = ({
  emitter,
  signalRConnectionUrl,
  signalRLogLevel,
  conversationNamespace,
}: {
  emitter: Emitter;
  signalRConnectionUrl: string;
  signalRLogLevel: signalR.LogLevel;
  conversationNamespace: string;
}) => {
  const currentRequestIdByStreamId = useRef<Record<string, string>>({});
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const [setupConnectionDone, setSetupConnectionDone] = useState<boolean>(false);
  const streamIdToExpectedSequenceNumber = useRef<Record<string, number>>({});
  const streamIdToBufferedText = useRef<Record<string, Record<number, string>>>({});

  const setupConnection = useCallback(async () => {
    if (setupConnectionDone) {
      return;
    }
    try {
      connectionRef.current = new signalR.HubConnectionBuilder()
        .withUrl(signalRConnectionUrl, {
          transport: signalR.HttpTransportType.WebSockets,
          skipNegotiation: true,
        })
        .withAutomaticReconnect()
        .configureLogging(signalRLogLevel)
        .build();

      const connection = connectionRef.current;
      let reconnectingTimeout: ReturnType<typeof setTimeout>;
      let connected = false; // Initialize the connected state

      connection.onreconnecting(() => {
        connected = false; // Set to false when reconnecting starts
        emitter.emit('connectionReconnecting');
        reconnectingTimeout = setTimeout(() => {
          if (!connected) {
            emitter.emit('connectionClose');
          }
        }, ReconnectingTimeoutDelay);
      });

      connection.onreconnected(() => {
        connected = true; // Set to true when reconnection succeeds
        if (reconnectingTimeout) {
          clearTimeout(reconnectingTimeout);
        }
        emitter.emit('connectionConnected');
      });

      connection.onclose(() => {
        connected = false; // Set to false when connection is closed
        emitter.emit('connectionClose');
      });

      await connection.start();
      connected = true; // Set to true on initial connection
      emitter.emit('connectionConnected');
      setSetupConnectionDone(true);
    } catch {
      emitter.emit('connectionClose');
    }
  }, [emitter, setupConnectionDone, signalRLogLevel, signalRConnectionUrl]);

  // setup signalr connection
  useEffect(() => {
    if (emitter) {
      setupConnection();
    }
  }, [emitter, setupConnection]);

  const processInitialMessageChunk = useCallback(
    (message: MessageChunk & { actions: WSNotificationBotMessageClientAction[] }) => {
      // BE sends a message chunk with isFinal = true when the conversation is closed.
      // This final message_chunk has empty actions and we should not emit another `startStreamingResponse` event.
      if (message.isFinal && message.actions.length === 0) {
        emitter.emit('finishStreamingResponse', message.requestId);
        return;
      }

      const { messageId, requestId, actions } = message;
      const action = actions[0];

      emitter.emit('startStreamingResponse', '', messageId, requestId, actions);
      if (action.command === ConvApiV2ActionType.DisplayRichText) {
        const { streamId } = action.arguments.text;
        currentRequestIdByStreamId.current[streamId] = requestId;
        streamIdToExpectedSequenceNumber.current[streamId] = 1;
        streamIdToBufferedText.current[streamId] = {};
      } else if (action.command === ConvApiV2ActionType.DisplayError) {
        emitter.emit(
          'errorStreamingResponse',
          convertConvAIErrorToConversationError(action.arguments.errorId),
          requestId,
        );
      }
    },
    [emitter],
  );
  const flushBufferedStream = useCallback(
    (streamId: number) => {
      let bufferedText =
        streamIdToBufferedText.current[streamId][
          streamIdToExpectedSequenceNumber.current[streamId]
        ];

      while (bufferedText) {
        emitter.emit(
          'updateStreamingResponse',
          bufferedText,
          currentRequestIdByStreamId.current[streamId],
        );
        delete streamIdToBufferedText.current[streamId][
          streamIdToExpectedSequenceNumber.current[streamId]
        ];
        streamIdToExpectedSequenceNumber.current[streamId] += 1;
        bufferedText =
          streamIdToBufferedText.current[streamId][
            streamIdToExpectedSequenceNumber.current[streamId]
          ];
      }
    },
    [emitter],
  );

  function isFinalMessage(chunk: StreamChunk) {
    return chunk.isFinal === true;
  }

  function isExpectedNextMessageInSequence(chunk: StreamChunk) {
    return chunk.SequenceNumber === streamIdToExpectedSequenceNumber.current[chunk.streamId];
  }

  const processStreamingMessageChunk = useCallback(
    (chunk: StreamChunk) => {
      const { streamId } = chunk;
      if (!isFinalMessage(chunk)) {
        if (isExpectedNextMessageInSequence(chunk)) {
          emitter.emit(
            'updateStreamingResponse',
            chunk.content,
            currentRequestIdByStreamId.current[streamId],
          );
          streamIdToExpectedSequenceNumber.current[streamId] += 1;
          flushBufferedStream(streamId);
        } else {
          streamIdToBufferedText.current[streamId][chunk.SequenceNumber] = chunk.content;
        }
      } else if (isExpectedNextMessageInSequence(chunk)) {
        emitter.emit('finishStreamingResponse', currentRequestIdByStreamId.current[streamId]);
      } else {
        // Final message is not the next expected sequence number, buffer it and set a timeout to flush it
        streamIdToBufferedText.current[streamId][chunk.SequenceNumber] = chunk.content;
        setTimeout(() => {
          flushBufferedStream(streamId);
          emitter.emit('finishStreamingResponse', currentRequestIdByStreamId.current[streamId]);
        }, FinishStreamingResponseDelay);
      }
    },
    [emitter, flushBufferedStream],
  );

  // Listen for new notifications
  const handleNotification = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- copied from creator-doc-site
    (namespace: any, detail: any) => {
      if (namespace === conversationNamespace) {
        const message = JSON.parse(detail);
        if (message.responseType === 'message_chunk') {
          processInitialMessageChunk(message);
        } else if (message.responseType === 'stream_chunk') {
          processStreamingMessageChunk(message);
        }
      }
    },
    [conversationNamespace, processInitialMessageChunk, processStreamingMessageChunk],
  );

  // NOTE (@mbae, 07/24/24): This useEffect supports back/forward cache compatibility
  useEffect(() => {
    const stopConnection = async () => {
      if (connectionRef?.current?.state === signalR.HubConnectionState.Connected) {
        await connectionRef?.current?.stop();
        emitter.emit('connectionClose');
      }
    };

    const startConnection = async () => {
      if (connectionRef?.current?.state === signalR.HubConnectionState.Disconnected) {
        await connectionRef?.current?.start();
        emitter.emit('connectionConnected');
      }
    };

    window.addEventListener('pagehide', stopConnection);
    window.addEventListener('freeze', stopConnection);
    window.addEventListener('beforeunload', stopConnection);
    window.addEventListener('offline', stopConnection);
    window.addEventListener('pageshow', startConnection);
    window.addEventListener('resume', startConnection);
    window.addEventListener('online', startConnection);

    return () => {
      window.removeEventListener('pagehide', stopConnection);
      window.removeEventListener('freeze', stopConnection);
      window.removeEventListener('beforeunload', stopConnection);
      window.removeEventListener('offline', stopConnection);
      window.removeEventListener('pageshow', startConnection);
      window.removeEventListener('resume', startConnection);
      window.removeEventListener('online', startConnection);
    };
  }, [emitter]);

  useEffect(() => {
    if (setupConnectionDone && connectionRef.current) {
      connectionRef.current.on('notification', handleNotification);
    }
  }, [setupConnectionDone, handleNotification]);
};

export default useConvAiSetup;
