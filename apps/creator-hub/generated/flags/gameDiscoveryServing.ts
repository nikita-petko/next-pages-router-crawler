import { defineFlag } from '@rbx/flags';

// oxlint-disable-next-line typescript-eslint/triple-slash-reference -- generated flags need registry augmentation in type-aware consumers
/// <reference path='./registry.d.ts' />
export const isHomeAcquisitionSignalsEnabled = defineFlag({
    namespace: 'game-discovery-serving',
    name: 'isHomeAcquisitionSignalsEnabled',
    defaultValue: true,
  });
