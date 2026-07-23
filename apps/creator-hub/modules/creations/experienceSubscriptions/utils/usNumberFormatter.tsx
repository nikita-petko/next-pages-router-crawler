export default function usNumberFormatter(number?: number) {
  if (number) {
    const formattedNumber = number.toLocaleString('en-US');
    return <span>{formattedNumber}</span>;
  }
  return <span>--</span>;
}
