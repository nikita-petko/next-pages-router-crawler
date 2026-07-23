export default function calculateProgress(current: number, total: number) {
  let progressPercentage = 0;
  if (total === 0) {
    progressPercentage = 100;
  } else {
    progressPercentage = Math.floor((current / total) * 100);
  }
  return progressPercentage;
}
