import { Link, Typography } from '@rbx/ui';
import React, { type ReactElement, Fragment, useCallback } from 'react';
import useMarkdownParserStyles from './useMarkdownParser.styles';

enum MarkdownTypes {
  Invalid = 0,
  Href = 1,
  HeaderFour = 2,
  List = 3,
  Text = 4,
  Table = 5,
  OrderedList = 6,
}

type ParseTextOptions = {
  includeLineBreaks?: boolean;
};

function useMarkdownParser() {
  const {
    classes: { headerFour, unorderedList, orderedList },
  } = useMarkdownParserStyles();
  let keyValue = 0;
  const key = () => {
    keyValue += 1;
    return keyValue;
  };

  function getLineType(text: string): MarkdownTypes {
    if (text.startsWith('[')) {
      return MarkdownTypes.Href;
    }
    if (text.startsWith('####')) {
      return MarkdownTypes.HeaderFour;
    }
    if (text.startsWith('* ')) {
      return MarkdownTypes.List;
    }
    if (/^\d+\.\s/.test(text)) {
      return MarkdownTypes.OrderedList;
    }
    if (text.startsWith('|')) {
      return MarkdownTypes.Table;
    }

    return MarkdownTypes.Text;
  }

  function boldText(text: string) {
    return <b key={key()}>{text}</b>;
  }

  // NOTE(@mbae, 02/24/26): Temporarily gate links to what's whitelisted as we assess security implications
  function isAllowedLinkDomain(href: string): boolean {
    try {
      const { hostname } = new URL(href);
      return hostname === 'roblox.com' || hostname.endsWith('.roblox.com');
    } catch {
      return false;
    }
  }

  function parseInlineLinks(text: string): React.ReactNode[] {
    const parts: React.ReactNode[] = [];
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let lastIndex = 0;
    let match = linkRegex.exec(text);
    while (match !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      if (isAllowedLinkDomain(match[2])) {
        parts.push(
          <Link href={match[2]} target='_blank' underline='always' key={key()}>
            {match[1]}
          </Link>,
        );
      } else {
        parts.push(match[1]);
      }
      lastIndex = match.index + match[0].length;
      match = linkRegex.exec(text);
    }
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    return parts;
  }

  function parseTypography(text: string, isTableHeader?: boolean) {
    const splitText = text.split(`**`);
    return (
      <Typography
        variant={isTableHeader ? 'largeLabel2' : 'body1'}
        component='span'
        color='secondary'
        key={key()}>
        {splitText.map((textSegment, i, originalArray) => {
          if (i % 2 === 0) {
            return <Fragment key={key()}>{parseInlineLinks(textSegment)}</Fragment>;
          }
          if (i % 2 === 1 && originalArray.length % 2 === 1) {
            return boldText(textSegment);
          }
          if (i % 2 === 1 && originalArray.length % 2 === 0 && i < originalArray.length - 2) {
            return boldText(textSegment);
          }
          if (originalArray.length % 2 === 0 && i >= originalArray.length - 2) {
            // If there is an uneven amount of ** in the string, the last two segments will always been plain text.
            return <Fragment key={key()}>{parseInlineLinks(textSegment)}</Fragment>;
          }
          return <Fragment key={key()}>{parseInlineLinks(textSegment)}</Fragment>;
        })}
      </Typography>
    );
  }

  function parseLink(text: string) {
    const splitTextAndLink = text.slice(1, -1).split(`](`);
    const link = splitTextAndLink[1];
    const linkText = splitTextAndLink[0];

    return (
      <Typography variant='body1' component='span' key={key()}>
        <Link href={link} target='_blank' underline='always'>
          {linkText}
        </Link>
      </Typography>
    );
  }

  function parseHeaderFour(text: string) {
    const trimmedText = text.replace(/(####\s*)/, '');

    return (
      <Typography variant='subtitle2' key={key()}>
        {trimmedText}
      </Typography>
    );
  }

  function parseList(text: string) {
    const trimmedText = text.replace(/(\*\s*)/, '');

    return <li key={key()}>{parseTypography(trimmedText)}</li>;
  }

  function parseOrderedListItem(text: string) {
    const trimmedText = text.replace(/^\d+\.\s*/, '');

    return <li key={key()}>{parseTypography(trimmedText)}</li>;
  }

  function parseTableRow(text: string): string[] {
    // Remove leading and trailing pipes, then split by pipe
    const trimmed = text.trim().replace(/^\||\|$/g, '');
    return trimmed.split('|').map((cell) => cell.trim());
  }

  function isTableSeparator(text: string): boolean {
    return /^\|[\s\-:|]+\|$/.test(text.trim());
  }

  function parseTable(tableLines: string[]) {
    if (tableLines.length === 0) return null;

    const contentRows = tableLines.filter((line) => !isTableSeparator(line));

    if (contentRows.length === 0) return null;

    const headerCells = parseTableRow(contentRows[0]);
    const bodyRows = contentRows.slice(1);

    return (
      <table
        key={key()}
        className='margin-top-[8px] margin-bottom-[8px] width-full'
        style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {headerCells.map((cell) => (
              <th
                className='stroke-standard stroke-default text-align-x-left padding-small'
                key={key()}>
                {parseTypography(cell, true)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bodyRows.map((row) => {
            const cells = parseTableRow(row);
            return (
              <tr key={key()}>
                {cells.map((cell) => (
                  <td
                    key={key()}
                    className='stroke-standard stroke-default text-align-x-left padding-small'>
                    {parseTypography(cell)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  function cleanInputIntoLines(text: string) {
    const lines = text.split('\n');
    lines.filter((line) => line.length > 0);

    const trimmedLines = lines.map((line) => line.trim());

    return trimmedLines;
  }

  function renderComponentFromType(text: string, type: MarkdownTypes) {
    switch (type) {
      case MarkdownTypes.Href:
        return parseLink(text);
      case MarkdownTypes.List:
        return parseList(text);
      case MarkdownTypes.OrderedList:
        return parseOrderedListItem(text);
      case MarkdownTypes.HeaderFour:
        return parseHeaderFour(text);
      case MarkdownTypes.Text:
        return parseTypography(text);
      case MarkdownTypes.Table:
        // Table rows are accumulated and rendered together
        return <Fragment key={key()}>{text}</Fragment>;
      case MarkdownTypes.Invalid:
      default:
        throw new Error(`Unexpected markdown type: ${type.toString()}`);
    }
  }

  function isList(type: MarkdownTypes) {
    return type === MarkdownTypes.List || type === MarkdownTypes.OrderedList;
  }

  function isOrderedList(type: MarkdownTypes) {
    return type === MarkdownTypes.OrderedList;
  }

  function isTable(type: MarkdownTypes) {
    return type === MarkdownTypes.Table;
  }

  function isHeader(type: MarkdownTypes) {
    return type === MarkdownTypes.HeaderFour;
  }

  function isLastItem<T>(index: number, array: Array<T>) {
    return index === array.length - 1;
  }

  const parseText = useCallback((text: string, options?: ParseTextOptions): ReactElement => {
    const includeLineBreaks = options?.includeLineBreaks ?? true;
    if (text.trim().length === 0) {
      return <Fragment>{null}</Fragment>;
    }
    const textLines = cleanInputIntoLines(text);
    const components: React.ReactElement[] = [];
    let activeListComponents: React.ReactElement[] = [];
    let isActiveList = false;
    let isActiveOrderedList = false;
    let activeTableLines: string[] = [];
    let isActiveTable = false;

    function flushActiveList() {
      if (activeListComponents.length === 0) return;
      const listComponent = isActiveOrderedList ? (
        <ol className={orderedList} key={key()}>
          {activeListComponents.map((listComp) => listComp)}
        </ol>
      ) : (
        <ul className={unorderedList} key={key()}>
          {activeListComponents.map((listComp) => listComp)}
        </ul>
      );
      components.push(listComponent);
      activeListComponents = [];
      isActiveList = false;
      isActiveOrderedList = false;
    }

    function nextNonEmptyLineType(fromIndex: number): MarkdownTypes | null {
      for (let j = fromIndex + 1; j < textLines.length; j += 1) {
        if (textLines[j].length > 0) {
          return getLineType(textLines[j]);
        }
      }
      return null;
    }

    let pendingListBreaks = 0;

    function flushPendingListBreaks() {
      for (let b = 0; b < pendingListBreaks; b += 1) {
        activeListComponents.push(<br key={key()} />);
      }
      pendingListBreaks = 0;
    }

    function flushActiveListFull() {
      flushActiveList();
      pendingListBreaks = 0;
    }

    textLines.forEach((line, i) => {
      if (line.length === 0 && isActiveTable) {
        return;
      }
      if (line.length === 0 && isActiveList) {
        pendingListBreaks += 1;
        return;
      }

      const lineType = getLineType(line);
      // eslint-disable-next-line testing-library/render-result-naming-convention -- false positive not a test file
      const textLineComponent = renderComponentFromType(line, lineType);

      if (isTable(lineType)) {
        if (!isActiveTable) {
          isActiveTable = true;
        }
        activeTableLines.push(line);

        if (isTable(lineType) && isLastItem(i, textLines)) {
          isActiveTable = false;

          const tableComponent = parseTable(activeTableLines);
          if (tableComponent) {
            components.push(tableComponent);
          }
          activeTableLines = [];
        }
      } else if (!isTable(lineType) && isActiveTable) {
        isActiveTable = false;

        const tableComponent = parseTable(activeTableLines);
        if (tableComponent) {
          components.push(tableComponent);
        }
        activeTableLines = [];

        // Process the current non-table line
        if (isList(lineType)) {
          if (!isActiveList) {
            isActiveList = true;
            isActiveOrderedList = isOrderedList(lineType);
          }
          flushPendingListBreaks();
          activeListComponents.push(textLineComponent);
        } else if (isHeader(lineType)) {
          components.push(<div className={headerFour}>{textLineComponent}</div>);
        } else {
          components.push(textLineComponent);
          const nextType = nextNonEmptyLineType(i);
          if (
            includeLineBreaks &&
            nextType !== null &&
            !isList(nextType) &&
            !isTable(nextType) &&
            !isHeader(nextType)
          ) {
            components.push(<br />);
          }
        }
      } else if (isList(lineType)) {
        if (!isActiveList) {
          isActiveList = true;
          isActiveOrderedList = isOrderedList(lineType);
        }
        flushPendingListBreaks();
        activeListComponents.push(textLineComponent);

        if (isLastItem(i, textLines)) {
          flushActiveListFull();
        }
      } else if (!isList(lineType) && isActiveList) {
        flushActiveListFull();
        components.push(textLineComponent);
      } else if (isHeader(lineType)) {
        components.push(<div className={headerFour}>{textLineComponent}</div>);
      } else {
        components.push(textLineComponent);
        const nextType = nextNonEmptyLineType(i);
        if (
          includeLineBreaks &&
          nextType !== null &&
          !isList(nextType) &&
          !isTable(nextType) &&
          !isHeader(nextType)
        ) {
          components.push(<br />);
        }
      }
    });

    if (isActiveList) {
      flushActiveListFull();
    }

    if (isActiveTable && activeTableLines.length > 0) {
      const tableComponent = parseTable(activeTableLines);
      if (tableComponent) {
        components.push(tableComponent);
      }
    }

    return (
      <React.Fragment>
        {components.map((component, index) => (
          // eslint-disable-next-line react/no-array-index-key -- TODO(@zwang, 09/04/25): left to owner to decide
          <span key={index}>{component}</span>
        ))}
      </React.Fragment>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO(@zwang, 09/04/25): left to owner to decide
  }, []);

  return {
    parseText,
  };
}

export default useMarkdownParser;
