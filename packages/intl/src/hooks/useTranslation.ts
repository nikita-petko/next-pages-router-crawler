import { Fragment, ReactNode, createElement, useCallback, useContext, useMemo } from 'react';
import LocalizationContext from '../LocalizationContext';
import TranslationResourceContext from '../TranslationResourceContext';

const STRING_ARG_TEST_REGEX = /{(.+?)}/;
const STRING_ARG_REPLACE_REGEX = /{(.+?)}/g;
const STRING_ARG_SPLIT_REGEX = /({.+?})/g;

const classifyArgs = (args?: {
  [key: string]: string | ReactNode;
}): { stringArgs?: { [key: string]: string }; htmlArgs?: { [key: string]: ReactNode } } =>
  typeof args !== 'undefined'
    ? Object.entries(args).reduce(
        (classifiedArgs, [argName, argValue]) => {
          if (typeof argValue === 'string') {
            Object.assign(classifiedArgs.stringArgs, { [argName]: argValue });
          } else {
            Object.assign(classifiedArgs.htmlArgs, { [argName]: argValue });
          }

          return classifiedArgs;
        },
        {
          stringArgs: {},
          htmlArgs: {},
        }
      )
    : {};

function useTranslation() {
  const localization = useContext(LocalizationContext);
  const { key: resourceKey = 'Unknown', resources, ready } = useContext(TranslationResourceContext);

  const translate = useCallback(
    (key: string, args?: { [key: string]: string }): string => {
      // check if under the required context
      if (typeof localization === 'undefined') {
        // eslint-disable-next-line no-console
        console.warn(
          'Localization context is missing, useTranslation cannot work outside of the LocalizationProvider'
        );
        return '';
      }

      const { localeInfo } = localization;

      // During the initial rendering, the translation resource might still be loading
      if (resources !== null) {
        if (Object.prototype.hasOwnProperty.call(resources, key)) {
          const translation = resources[key];

          if (translation != null) {
            return typeof args !== 'undefined' && Object.keys(args).length !== 0
              ? // if we cannot find the corresponding arg, leave it as it is
                translation.replace(
                  STRING_ARG_REPLACE_REGEX,
                  (_, argName) => args[argName] ?? `{${argName}}`
                )
              : translation;
          }

          // if the key exists but the translation is null
          // eslint-disable-next-line no-console
          console.warn(
            `[From context - ${resourceKey}] The translation of key '${key}' for locale '${localeInfo.locale}' does not exist!`
          );
        }

        // if the key doesn't exists
        // eslint-disable-next-line no-console
        console.warn(
          `[From context - ${resourceKey}] The translation key '${key}' doesn't exist for locale '${localeInfo.locale}'!`
        );
      }

      return '';
    },
    [localization, resourceKey, resources]
  );

  const translateHTML = useCallback(
    (
      key: string,
      tags?: Array<{
        opening: string;
        closing: string;
        content: (chunks: ReactNode) => ReactNode;
      }> | null,
      args?: { [key: string]: string | ReactNode }
    ): ReactNode => {
      // check if under the required context
      if (typeof localization === 'undefined') {
        // eslint-disable-next-line no-console
        console.warn(
          'Localization context is missing, useTranslation cannot work outside of the LocalizationProvider'
        );
        return '';
      }

      const { localeInfo } = localization;

      /**
       * If only the key is specified, handle it with the normal translate function
       */
      if (typeof tags === 'undefined' && typeof args === 'undefined') {
        return translate(key);
      }

      /**
       * Step 1 - Handle plain string arguments
       *
       * Classify args into plain string arguments and html arguments, and
       * handle the string arguments using the normal translate function
       */
      const { stringArgs, htmlArgs } = classifyArgs(args);
      const translation = translate(key, stringArgs);
      /**
       * Early return if the translation cannot be found
       */
      if (!translation) {
        return translation;
      }

      /**
       * Step 2 - Split translated string into chunks by arguments
       *
       * This split could possibly have empty string in the result, it could
       * happen when two arguments are next to each other, or when an argument
       * is at the start or end of the string
       */
      let translationChunks: ReactNode[] = translation.split(STRING_ARG_SPLIT_REGEX);
      /**
       * However, this fact will help us identify if a translation still has
       * arguments left in it that need to be handled, since the split result
       * of a string, that only contains an argument, will have a length of 3
       */
      if (translationChunks.length === 1) {
        return translation;
      }
      /**
       * Now let's get rid of the empty strings and it's time to deal with fancy HTML stuff
       */
      translationChunks = translationChunks.filter((chunk) => !!chunk);

      /**
       * Step 3 - Handle HTML arguments
       */
      if (typeof htmlArgs !== 'undefined' && Object.keys(htmlArgs).length !== 0) {
        /**
         * Build an index mapping for the HTML arguments left in the string
         * translationChunks is effectively still a string array as of here
         */
        type THTMLArgNameIndicesMapping = {
          [argName: string]: number[];
        };
        const htmlArgNameIndicesMapping: THTMLArgNameIndicesMapping = (
          translationChunks as string[]
        ).reduce<THTMLArgNameIndicesMapping>((mapping, arg, index) => {
          const result = STRING_ARG_TEST_REGEX.exec(arg);

          if (result) {
            /**
             * result[0] is the whole string being matched
             * result[1] is the first parenthesized substring match, which
             * will be the argument name in this case
             */
            const argName = result[1];
            if (Object.prototype.hasOwnProperty.call(htmlArgs, argName)) {
              const indices = mapping[argName];

              if (!indices) {
                return Object.assign(mapping, { [argName]: [index] });
              }

              indices.push(index);
            }
          }

          return mapping;
        }, {});

        /**
         * The rest is just simple array element replacement
         */
        Object.entries(htmlArgs).forEach(([argName, argValue]) => {
          if (Object.prototype.hasOwnProperty.call(htmlArgNameIndicesMapping, argName)) {
            const indices = htmlArgNameIndicesMapping[argName];
            for (let i = 0; i < indices.length; i += 1) {
              const argIndex = indices[i];
              translationChunks[argIndex] = argValue;
            }
          }
        });
      }

      /**
       * Simply return the chunks if no HTML tags need to be handled
       */
      if (!Array.isArray(tags) || tags.length === 0) {
        // this gets rid of the missing 'key' prop warning, trick learned from
        // https://github.com/formatjs/formatjs/blob/master/packages/react-intl/src/components/message.tsx#L108
        return createElement(Fragment, null, ...translationChunks);
      }

      /**
       * Step 4 - Handle HTML tags
       *
       * Build a look up dictionary to achieve O(1) look up on all
       * the opening tags that need to be handled with respect the
       * corresponding closing tags and content function
       */
      const tagsLookupDict: {
        [key: string]: { match: string; content: (chunks: ReactNode) => ReactNode };
      } = tags.reduce(
        (dict, { opening, closing, content }) =>
          Object.assign(dict, { [`{${opening}}`]: { match: `{${closing}}`, content } }),
        {}
      );

      const translatedHTML: ReactNode[] = [];
      /**
       * Start process HTML tags
       *
       * The algorithm is expected to successfully execute with the
       * following assumptions:
       *
       * 1. Every opening and closing tags specified are valid arguments
       *    that exist in the string and do not conflict with string or HTML
       *    arguments
       * 2. In every pair of opening and closing tags, the opening tag is
       *    always located left to the closing tag in the string
       * 3. For every two pairs of opening and closing tags, they do not
       *    interleave
       *
       * Otherwise, the behavior of the algorithm is undefined
       *
       * Basically, say the valid arguments are 1, 2, 3, 4, where 1 is
       * paired with 2 and 3 is paired with 4, then the argument positions
       * should be one of 1234, 3412, 1342 or 3124
       *
       */
      let chunk: ReactNode;
      const matchingOpeningTags: string[] = [];
      const tagChunkStack: ReactNode[] = [];
      /**
       * Remove an element from the start of the array, and end processing
       * if there is no element left;
       */
      // eslint-disable-next-line no-cond-assign
      while ((chunk = translationChunks.shift())) {
        /**
         * If the removed chunk is an argument
         */
        if (typeof chunk === 'string' && STRING_ARG_TEST_REGEX.test(chunk)) {
          /**
           * If the argument corresponds to an opening tag (i.e. it has been
           * specified as an opening tag in the tags array), push it to the
           * tag chunk stack and add it to the list of tags that is being
           * matched
           */
          if (Object.prototype.hasOwnProperty.call(tagsLookupDict, chunk)) {
            matchingOpeningTags.push(chunk);
            tagChunkStack.push(chunk);
          } else {
            /**
             * Otherwise, treat the argument as a closing tag, and see if it
             * matches with the most recent opening tag that is being matched
             *
             * The pop can be called here because effectively, this closing
             * tag MUST match the most recent opening tag that is being
             * matched, otherwise there will be something wrong with the
             * string and/or the tags/args specified
             */
            const currentOpeningTag = matchingOpeningTags.pop();
            if (typeof currentOpeningTag !== 'undefined') {
              const { match, content } = tagsLookupDict[currentOpeningTag];
              /**
               * If it matches the most recent opening tag that is being
               * matched, constructing the HTML element by calling provided
               * content function
               */
              if (chunk === match) {
                const currChunks: ReactNode[] = [];

                let tagChunk: ReactNode;
                // eslint-disable-next-line no-cond-assign
                while ((tagChunk = tagChunkStack.pop())) {
                  if (tagChunk !== currentOpeningTag) {
                    // using unshift here to get the right order
                    currChunks.unshift(tagChunk);
                  } else {
                    /**
                     * If React detects children prop is an array and also
                     * contains at least one non-primitive React element, it
                     * will perform the unique key check and cause annoying
                     * warning for cases such as having nested HTML tags inside
                     * the translation. Handling that warning here so consumers
                     * won't have to worry about it on their side
                     */
                    let htmlChunk: ReactNode = null;
                    // in this case, the chunk is either a string or a React element
                    if (currChunks.every((currChunk) => typeof currChunk === 'string')) {
                      htmlChunk = content(currChunks);
                    } else {
                      const mergedChunk = createElement(Fragment, null, ...currChunks);
                      htmlChunk = content(mergedChunk);
                    }

                    /**
                     * If there are no tag chunks left to be processed on the
                     * stack, i.e. all pairs of tags that is currently being
                     * matched must've been processed, add it to the final
                     * result array
                     */
                    if (tagChunkStack.length === 0) {
                      translatedHTML.push(htmlChunk);
                    } else {
                      /**
                       * Otherwise, there must be another pairs of tags
                       * wrapping the current one, push it to the tag chunk
                       * stack so it can be processed later
                       */
                      tagChunkStack.push(htmlChunk);
                    }
                    break;
                  }
                }

                /**
                 * If the expected opening tag cannot be found on the stack,
                 * something must be wrong
                 */
                if (typeof tagChunk === 'undefined') {
                  // eslint-disable-next-line no-console
                  console.warn(
                    `[From context - ${resourceKey}] Unexpected condition encountered inside translateHTML for key ${key} of locale ${localeInfo.locale}!`
                  );
                  break;
                }
              } else {
                /**
                 * If the closing tag does not match the current opening
                 * tag, something must be wrong
                 */
                // eslint-disable-next-line no-console
                console.warn(
                  `[From context - ${resourceKey}] Unmatched closing tag ${chunk} encountered inside translateHTML for key ${key} of locale ${localeInfo.locale}!`
                );
                break;
              }
            } else {
              /**
               * If there is no current opening tag that is being matched,
               * something must be wrong
               */
              // eslint-disable-next-line no-console
              console.warn(
                `[From context - ${resourceKey}] Unexpected condition encountered inside translateHTML for key ${key} of locale ${localeInfo.locale}!`
              );
              break;
            }
          }
        } else if (tagChunkStack.length === 0) {
          /**
           * If the tag chunk stack is empty, whatever the chunk is should
           * directly go into the final result array
           */
          translatedHTML.push(chunk);
        } else {
          /**
           * Otherwise, some tag matching is in process, push it to the tag
           * chunk stack for later processing
           */
          tagChunkStack.push(chunk);
        }
      }

      // this gets rid of the missing 'key' prop warning, trick learned from
      // https://github.com/formatjs/formatjs/blob/master/packages/react-intl/src/components/message.tsx#L108
      return createElement(Fragment, null, ...translatedHTML);
    },
    [localization, resourceKey, translate]
  );

  // Ensure the result is a stable reference in case it is used as a dependency for memoization
  return useMemo(
    () => ({
      ready,
      translate,
      translateHTML,
    }),
    [ready, translate, translateHTML]
  );
}

export default useTranslation;
