const csvDelimiter = ',';
const unescapedQuotes = '""';
const escapedQuotes = '"';
const delimiters = `(\\${csvDelimiter}|\\r?\\n|\\r|^)`;
const quotedFields = `?:"([^"]*(?:""[^"]*)*)"`;
const standardFields = `([^"\\${csvDelimiter}\\r\\n]*)`;

export function CSVStringToArray(stringToParse: string) {
  const regexPattern = new RegExp(`${delimiters}(${quotedFields}|${standardFields})`, 'gi');
  let parsedData: string[][] = [[]];

  let regexMatches = regexPattern.exec(stringToParse);
  while (regexMatches) {
    // we don't care about the full string match
    const [, delimiter, quotedField, stringField] = regexMatches;

    if (delimiter.length > 0 && delimiter !== csvDelimiter) {
      // since delimiter is not a comma, it's a LF/CR char
      // start a new row
      parsedData.push([]);
    }
    let stringValue = '';
    if (quotedField) {
      // escape the quoted string
      stringValue = quotedField.replaceAll(new RegExp(unescapedQuotes, 'g'), escapedQuotes);
    } else {
      // it's a regular string
      stringValue = stringField;
    }
    parsedData[parsedData.length - 1].push(stringValue);
    regexMatches = regexPattern.exec(stringToParse);
  }

  const lastRow = parsedData.slice(-1)[0];
  // if last row is empty, remove it
  if (!lastRow || (lastRow.length === 1 && lastRow[0].trim().length === 0)) {
    parsedData = parsedData.slice(0, -1);
  }
  return parsedData;
}

export function escapeCSVField(field: string): string {
  if (!field.includes(',')) {
    return field;
  }
  const withEscapedQuotes = field.replaceAll('"', '""');
  return `"${withEscapedQuotes}"`;
}

export type CSVData = string & { _csv: CSVData };

export function compileCSV(lines: string[][]): CSVData {
  return lines
    .map((line) => {
      return line.map(escapeCSVField).join(',');
    })
    .join('\n') as CSVData;
}

export default { CSVStringToArray, escapeCSVField, compileCSV };
