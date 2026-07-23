const formatProgressionLinearGradient = (
  cellValue: number,
  color: string,
): React.CSSProperties['background'] => {
  const cellValuePercentage = cellValue * 100;
  return `linear-gradient(to right, ${color} ${cellValuePercentage}%, transparent ${cellValuePercentage}%)`;
};

export default formatProgressionLinearGradient;
