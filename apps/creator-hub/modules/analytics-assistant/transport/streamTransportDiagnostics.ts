/* eslint-disable no-console -- Structured stream transport diagnostics */

// Client-side diagnostics for sandbox thinking-step streaming freezes. Logs use
// `[AnalyticsSignalRTransport:diag]`. Correlate console events with backend
// metrics/logs during investigation:
// - Metrics: https://sourcegraph.rbx.com/github.rbx.com/Roblox/creator-analytics-assistant/-/blob/services/analytics-assistant-workflows/src/common/chat_telemetry.py
// - RPUSH then SignalR notify: https://sourcegraph.rbx.com/github.rbx.com/Roblox/creator-analytics-assistant/-/blob/services/analytics-assistant-workflows/src/activities/chat/streaming/chat_stream_notifier.py
// - Loop SSE fanout: https://sourcegraph.rbx.com/github.rbx.com/Roblox/creator-analytics-assistant/-/blob/services/analytics-assistant-workflows/src/activities/chat/tools/loop_execute_code/activities/dispatch.py
//
// sequence_gap_buffered / force_finish_timeout -> chat_stream_notify_total{phase="signalr"} + chat_stream_signalr_failed
// backlog_replay -> chat_stream_notify_total{phase="rpush"} + Redis replay buffer in chat_stream_notifier

// orphan_child_dropped -> child-before-parent ordering in adaptThinkingStepParts (H3)

export type StreamTransportDiagnosticEvent =
  | 'no_active_stream'
  | 'sequence_gap_buffered'
  | 'duplicate_sequence'
  | 'force_finish_timeout'
  | 'backlog_replay';

export interface StreamTransportDiagnosticPayload {
  event: StreamTransportDiagnosticEvent;
  conversationId: string;
  expectedSequenceNumber?: number;
  arrivedSequenceNumber?: number;
  bufferedChunkCount?: number;
  backlogChunkCount?: number;
  backlogSequenceMin?: number;
  backlogSequenceMax?: number;
  sandboxParentStepPresent?: boolean;
  gapHoldMs?: number;
}

export function logStreamTransportDiagnostic(payload: StreamTransportDiagnosticPayload): void {
  console.info('[AnalyticsSignalRTransport:diag]', payload);
}
