enum TranslationNamespace {
  Common = 'CreatorDocumentation.Common',
  APIReference = 'CreatorDocumentation.APIReference',
  Navigation = 'CreatorDocumentation.Navigation',
  Search = 'CreatorDocumentation.Search',
}

export const REQUIRED_TRANSLATION_NAMESPACES = [
  TranslationNamespace.Common,
  TranslationNamespace.APIReference,
  TranslationNamespace.Navigation,
  TranslationNamespace.Search,
];

export default TranslationNamespace;
