const getIdentifier = (source: string | null, context: string | null) => {
  return `source:${source ?? ''}context:${context ?? ''}`;
};

export default getIdentifier;
