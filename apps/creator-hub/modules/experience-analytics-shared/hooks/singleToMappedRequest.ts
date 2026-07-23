const singleToMappedRequest = <IdType, ResponseType>(
  makeSingleRequest: (id: IdType) => Promise<ResponseType>,
) => {
  const makeMappedRequest = async (ids: IdType[]) => {
    const responses = await Promise.all(
      ids.map(async (id) => ({ key: id, value: await makeSingleRequest(id) })),
    );
    return responses.reduce(
      (prevMap, currentVal) => {
        prevMap.set(currentVal.key, currentVal.value);
        return prevMap;
      },
      new Map() as Map<IdType, ResponseType>,
    );
  };
  return makeMappedRequest;
};

export default singleToMappedRequest;
