import production from 'react/jsx-runtime';
import rehypeRaw from 'rehype-raw';
import rehypeReact from 'rehype-react';
import rehypeSanitize, { defaultSchema, type Options as SanitizeSchema } from 'rehype-sanitize';
import remarkGFM from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
// Credit: https://github.rbx.com/Roblox/creator-doc-site/tree/master/services/doc-site-ssr/app/modules/markdownProcessor
import { unified } from 'unified';
import aliasComponents from './constants/aliasComponents';

export type CustomComponentsConfig = {
  components: Record<string, React.ComponentType>;
  names: string[];
  attributes?: SanitizeSchema['attributes'];
};

type MarkdownProcessor = {
  process: (content: string) => Promise<{ result: React.ReactNode }>;
  processSync: (content: string) => { result: React.ReactNode };
};

// Helper function to convert self-closing custom component tags to paired tags.
// rehypeRaw doesn't recognize custom elements as void/self-closing.
const convertSelfClosingTags = (markdown: string, aliases: string[]): string => {
  const componentPattern = aliases.join('|');
  const selfClosingPattern = new RegExp(`<(${componentPattern})([^>]*?)\\/>`, 'gi');
  return markdown.replace(selfClosingPattern, '<$1$2></$1>');
};

const getUnclosedFence = (markdown: string): string | null => {
  const fencePattern = /^(?<indent> {0,3})(?<fence>`{3,}|~{3,})(?<info>[^\n]*)$/gm;
  let openFence: string | null = null;
  let match = fencePattern.exec(markdown);

  while (match) {
    const fence = match.groups?.fence;
    if (fence) {
      const isCloseCandidate = (match.groups?.info ?? '').trim() === '';
      if (openFence === null) {
        openFence = fence;
      } else if (
        isCloseCandidate &&
        fence[0] === openFence[0] &&
        fence.length >= openFence.length
      ) {
        openFence = null;
      }
    }
    match = fencePattern.exec(markdown);
  }

  return openFence;
};

const normalizeStreamingMarkdown = (markdown: string): string => {
  const unclosedFence = getUnclosedFence(markdown);

  if (unclosedFence === null) {
    return markdown;
  }

  return `${markdown}\n${unclosedFence}`;
};

const createSanitizeSchema = (
  aliases: string[],
  attributes?: SanitizeSchema['attributes'],
): SanitizeSchema => {
  if (aliases.length === 0) {
    return defaultSchema;
  }

  return {
    ...defaultSchema,
    tagNames: [...(defaultSchema.tagNames ?? []), ...aliases],
    attributes: { ...defaultSchema.attributes, ...attributes },
  };
};

const createUnifiedMarkdownProcessor = (
  aliases: string[],
  sanitizeSchema: SanitizeSchema,
  components: Record<string, React.ComponentType>,
): MarkdownProcessor => {
  /* oxlint-disable typescript/no-unsafe-assignment, typescript/no-unsafe-call, typescript/no-unsafe-member-access, typescript/no-unsafe-type-assertion -- unified's plugin generics do not compose cleanly through rehype-react, so confine the typed boundary to this construction helper. */
  const processor = unified()
    .use(remarkParse)
    .use(remarkGFM)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw, aliases.length > 0 ? { passThrough: aliases } : undefined)
    .use(rehypeSanitize, sanitizeSchema)
    .use(rehypeReact, { ...production, components }) as unknown as MarkdownProcessor;
  /* oxlint-enable typescript/no-unsafe-assignment, typescript/no-unsafe-call, typescript/no-unsafe-member-access, typescript/no-unsafe-type-assertion */

  return processor;
};

export const createMarkdownProcessor = (config?: CustomComponentsConfig) => {
  // Note: rehypeRaw will force the tagName to lowercase, so make sure you alias
  // a lowercase tagName even if you use PascalCase in the markdown
  const aliases = config?.names.map((name) => name.toLowerCase()) ?? [];
  const components = config ? { ...aliasComponents, ...config.components } : { ...aliasComponents };
  const sanitizeSchema = createSanitizeSchema(aliases, config?.attributes);

  const preprocess = (content: string) => {
    const withClosedFences = normalizeStreamingMarkdown(content);
    return aliases.length > 0
      ? convertSelfClosingTags(withClosedFences, aliases)
      : withClosedFences;
  };

  const processor = createUnifiedMarkdownProcessor(aliases, sanitizeSchema, components);

  return {
    process: async (content: string) => {
      return processor.process(preprocess(content));
    },
    processSync: (content: string) => processor.processSync(preprocess(content)),
  };
};

/** Plain markdown processor without custom components — safe to use from within custom components. */
export const plainProcessor = createMarkdownProcessor();
