const prettyPrintJson = (json: string | undefined): string | undefined => {
  if (json === undefined) {
    return json;
  }
  try {
    return JSON.stringify(JSON.parse(json), null, 2);
  } catch {
    return json;
  }
};

export default prettyPrintJson;
