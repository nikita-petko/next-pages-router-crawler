import React, { createContext, useMemo } from 'react';

export type UpdateRewardFields = {
  id: string;
  name: string;
  description: string;
  limits: string;
  from: Date;
  to: Date;
  imageUrl: string | null;
};

export const UpdateRewardContext = createContext<
  | {
      updateReward: UpdateRewardFields | null;
      setUpdateReward: React.Dispatch<React.SetStateAction<UpdateRewardFields | null>>;
    }
  | undefined
>(undefined);

export const UpdateRewardProvider: React.FC<{
  children: React.ReactNode;
  reward: UpdateRewardFields | null;
}> = ({ children, reward }) => {
  const [updateReward, setUpdateReward] = React.useState<UpdateRewardFields | null>(reward);
  const value = useMemo(
    () => ({
      updateReward,
      setUpdateReward,
    }),
    [updateReward, setUpdateReward],
  );
  return <UpdateRewardContext.Provider value={value}>{children}</UpdateRewardContext.Provider>;
};

export const useUpdateRewardContext = () => {
  const context = React.useContext(UpdateRewardContext);
  if (context === undefined) {
    throw new Error('useUpdateRewardContext must be used within a UpdateRewardProvider');
  }
  return context;
};
