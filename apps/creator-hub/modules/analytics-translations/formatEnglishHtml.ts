import type { ReactNode } from 'react';
import { Fragment, createElement } from 'react';
import formatEnglishWithArgs from './formatEnglishWithArgs';
import type { TUseTranslationTranslateHTMLFunction } from './types';

/**
 * Mirrors the behavior of `@rbx/intl`'s `translateHTML`
 * (see `packages/intl/src/hooks/useTranslation.ts`) but runs against a literal English string
 * instead of a key looked up in the translation resources.
 *
 * This is used by `tPendingHtmlTranslation` to render previews of unregistered translation keys
 * in dev/Chromatic without changing the visual output relative to the real translator.
 *
 * The algorithm is intentionally a port of the production one so that consumers of
 * `tPendingHtmlTranslation` see the same shape of output that they would get once their key is
 * registered.
 */

type Tags = Parameters<TUseTranslationTranslateHTMLFunction>[1];
type Args = Parameters<TUseTranslationTranslateHTMLFunction>[2];

const STRING_ARG_TEST_REGEX = /{(.+?)}/;
const STRING_ARG_SPLIT_REGEX = /({.+?})/g;

const classifyArgs = (
  args?: Args,
): { stringArgs: { [key: string]: string }; htmlArgs: { [key: string]: ReactNode } } => {
  const stringArgs: { [key: string]: string } = {};
  const htmlArgs: { [key: string]: ReactNode } = {};
  if (typeof args === 'undefined') {
    return { stringArgs, htmlArgs };
  }
  Object.entries(args).forEach(([argName, argValue]) => {
    if (typeof argValue === 'string') {
      stringArgs[argName] = argValue;
    } else {
      htmlArgs[argName] = argValue;
    }
  });
  return { stringArgs, htmlArgs };
};

const formatEnglishHtml = (english: string, tags?: Tags, args?: Args): ReactNode => {
  // If neither tags nor args are provided, behave like a plain `translate` would.
  if (typeof tags === 'undefined' && typeof args === 'undefined') {
    return english;
  }

  const { stringArgs, htmlArgs } = classifyArgs(args);
  const interpolated = formatEnglishWithArgs(english, stringArgs);

  // Split into chunks by `{...}` placeholders. A length-1 result means there were no
  // placeholders (and therefore no html args/tags) left to handle. `String.split` always
  // produces a `string[]`, so we keep this typed as such until we mix in `ReactNode` values
  // from the html args step below.
  const stringChunks: string[] = interpolated
    .split(STRING_ARG_SPLIT_REGEX)
    .filter((chunk) => !!chunk);
  if (stringChunks.length === 1) {
    return interpolated;
  }

  // Replace remaining `{argName}` placeholders with their html arg values. Once we may
  // substitute `ReactNode` values in, we widen to `ReactNode[]`.
  const chunks: ReactNode[] = [...stringChunks];
  if (Object.keys(htmlArgs).length !== 0) {
    type IndicesByArgName = { [argName: string]: number[] };
    const indicesByArgName: IndicesByArgName = stringChunks.reduce<IndicesByArgName>(
      (mapping, chunk, index) => {
        const result = STRING_ARG_TEST_REGEX.exec(chunk);
        if (result) {
          const argName = result[1];
          if (Object.hasOwn(htmlArgs, argName)) {
            const indices = mapping[argName];
            if (!indices) {
              return Object.assign(mapping, { [argName]: [index] });
            }
            indices.push(index);
          }
        }
        return mapping;
      },
      {},
    );

    Object.entries(htmlArgs).forEach(([argName, argValue]) => {
      const indices = indicesByArgName[argName];
      if (!indices) {
        return;
      }
      indices.forEach((argIndex) => {
        chunks[argIndex] = argValue;
      });
    });
  }

  if (!Array.isArray(tags) || tags.length === 0) {
    return createElement(Fragment, null, ...chunks);
  }

  // Build a lookup from `{opening}` placeholder to its matching `{closing}` and content function.
  const tagsLookupDict: {
    [key: string]: { match: string; content: (children: ReactNode) => ReactNode };
  } = tags.reduce(
    (dict, { opening, closing, content }) =>
      Object.assign(dict, { [`{${opening}}`]: { match: `{${closing}}`, content } }),
    {},
  );

  // Walk the chunks left-to-right, pushing open/close placeholders onto a stack and collapsing
  // matched pairs into rendered children. This mirrors the production algorithm and assumes that
  // tags are well-formed (each open has a matching close, no interleaving).
  const result: ReactNode[] = [];
  const matchingOpeningTags: string[] = [];
  const tagChunkStack: ReactNode[] = [];

  for (let chunk = chunks.shift(); typeof chunk !== 'undefined'; chunk = chunks.shift()) {
    // Order matters: the placeholder branch is structured as the `if` so that TypeScript
    // narrows `chunk` to `string` inside it (avoiding `chunk as string` further down).
    if (typeof chunk === 'string' && STRING_ARG_TEST_REGEX.test(chunk)) {
      if (Object.hasOwn(tagsLookupDict, chunk)) {
        matchingOpeningTags.push(chunk);
        tagChunkStack.push(chunk);
      } else {
        const currentOpeningTag = matchingOpeningTags.pop();
        if (typeof currentOpeningTag !== 'undefined') {
          const { match, content } = tagsLookupDict[currentOpeningTag];
          if (chunk !== match) {
            // Mismatched closing tag - bail out of further tag processing.
            break;
          }
          const innerChunks: ReactNode[] = [];
          let foundOpening = false;
          while (tagChunkStack.length > 0 && !foundOpening) {
            const tagChunk = tagChunkStack.pop();
            if (tagChunk === currentOpeningTag) {
              foundOpening = true;
            } else {
              innerChunks.unshift(tagChunk);
            }
          }
          const allStrings = innerChunks.every((c) => typeof c === 'string');
          const rendered = allStrings
            ? content(innerChunks)
            : content(createElement(Fragment, null, ...innerChunks));
          if (tagChunkStack.length === 0) {
            result.push(rendered);
          } else {
            tagChunkStack.push(rendered);
          }
        }
        // If there is no matching opening tag, this is malformed input - drop the closing tag
        // silently to mirror the real translator's tolerant behavior.
      }
    } else if (tagChunkStack.length === 0) {
      result.push(chunk);
    } else {
      tagChunkStack.push(chunk);
    }
  }

  return createElement(Fragment, null, ...result);
};

export default formatEnglishHtml;
