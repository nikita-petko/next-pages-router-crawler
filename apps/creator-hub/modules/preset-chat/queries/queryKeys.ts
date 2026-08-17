export const presetChatQueryKeys = {
  all: ['presetChat'] as const,
  universeState: (universeId: number) => ['presetChat', 'universeState', universeId] as const,
};
