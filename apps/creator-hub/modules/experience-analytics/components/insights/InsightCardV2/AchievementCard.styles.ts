import { makeStyles } from '@rbx/ui';

const useAchievementCardStyles = makeStyles()((theme) => ({
  achievementDescription: {
    marginTop: '12px',
    marginBottom: '16px',
  },
  cardContainer: {
    background: theme.palette.surface[100],
    padding: '24px',
  },
}));

export default useAchievementCardStyles;
