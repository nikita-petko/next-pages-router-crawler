import type { AnalyticsChatMessage } from '../../types/AnalyticsChatTypes';

type AnalyticsChatMessagePart = AnalyticsChatMessage['parts'][number];

export function adaptTextParts(parts: AnalyticsChatMessagePart[]): string {
  return parts
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map((part) => part.text)
    .join('');
}
