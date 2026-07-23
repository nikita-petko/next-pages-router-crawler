import { FeedbackReasonType } from '@modules/clients';

// TODO: Replace with actual translation strings
const reasonTypeToLabelMap: Record<FeedbackReasonType, string> = {
  [FeedbackReasonType.None]: 'is invalid',
  [FeedbackReasonType.Untranslated]: 'is not fully translated',
  [FeedbackReasonType.Inaccurate]: 'is inaccurate',
  [FeedbackReasonType.SpellingOrGrammar]: 'has bad grammar or spelling',
  [FeedbackReasonType.Inappropriate]: 'is inappropriate',
};

export default reasonTypeToLabelMap;
