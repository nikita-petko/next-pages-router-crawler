const getBEDEV2ServiceBasePath = (serviceName: string, bedev2BaseUrl: string) => {
  return `${bedev2BaseUrl}/${serviceName}`;
};

export default getBEDEV2ServiceBasePath;
