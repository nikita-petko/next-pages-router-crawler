import { useFlag } from '@rbx/flags';
import {
  questionnaireV2Allowlist,
  questionnaireV2Q1Release,
} from '@generated/flags/contentSuitability';

const useQuestionnaireV2Gate = (): { shouldUseV2: boolean; isFetched: boolean } => {
  const { ready: allowlistReady, value: isAllowlisted } = useFlag(questionnaireV2Allowlist);
  const { ready: q1Ready, value: q1Release } = useFlag(questionnaireV2Q1Release);

  const isFetched = allowlistReady && q1Ready;
  const shouldUseV2 = isFetched && (q1Release || isAllowlisted);

  return { shouldUseV2, isFetched };
};

export default useQuestionnaireV2Gate;
