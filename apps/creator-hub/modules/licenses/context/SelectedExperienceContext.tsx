import { createContext } from 'react';

type SelectedExperienceContextType = {
  selectedExperienceId: number | null;
  setSelectedExperienceId: ((id: number | null) => void) | null;
};
const SelectedExperienceContext = createContext<SelectedExperienceContextType>({
  selectedExperienceId: null,
  setSelectedExperienceId: null,
});
export default SelectedExperienceContext;
