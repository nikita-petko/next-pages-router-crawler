// (NOTE @mbae, 02/16/24): Taken from CD. Eventually we should consolidate code that is shared between different packages and apps
const snakeToPascalCase = (input: string): string => {
  const parsedInput = input.split('-');
  return parsedInput.reduce((acc, curr) => acc + (curr[0] ?? '').toUpperCase() + curr.slice(1), '');
};

export default snakeToPascalCase;
