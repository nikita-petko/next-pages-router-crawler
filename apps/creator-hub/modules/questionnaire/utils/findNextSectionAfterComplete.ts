import type { ValidatedAnswer, ValidatedSection } from '../interfaces/types';
import isSectionComplete from './isSectionComplete';

const findNextSectionAfterComplete = ({
  sections,
  currentIndex,
  answers,
  violatedSectionIds,
}: {
  sections: ValidatedSection[];
  currentIndex: number;
  answers: ValidatedAnswer[];
  violatedSectionIds?: Set<string>;
}): ValidatedSection | null => {
  const sectionsBelow = sections.slice(currentIndex + 1);

  if (violatedSectionIds?.size) {
    const nextViolatedBelow = sectionsBelow.find((section) => violatedSectionIds.has(section.id));
    if (nextViolatedBelow) {
      return nextViolatedBelow;
    }
  }

  const isIncomplete = (section: ValidatedSection) => !isSectionComplete(section, answers);
  const nextIncompleteBelow = sectionsBelow.find(isIncomplete);
  const nextIncomplete = nextIncompleteBelow ?? sections.slice(0, currentIndex).find(isIncomplete);

  return nextIncomplete ?? null;
};

export default findNextSectionAfterComplete;
