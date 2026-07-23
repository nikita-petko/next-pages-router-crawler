const containsIfDefined = (value: string | null | undefined, keyword: string | null) => {
  if (!keyword) {
    return true;
  }
  if (!value) {
    return false;
  }
  return value.toLocaleLowerCase().includes(keyword.toLocaleLowerCase());
};

const getUserIdJson = (userId: string | null) => (userId != null ? `"user_id":"${userId}"` : null);

const filterEventJson = (
  eventsJson: string | null | undefined,
  keywordFilterValue: string | null,
  userIdFilterValue: string | null,
) => {
  return (
    containsIfDefined(eventsJson, keywordFilterValue) &&
    containsIfDefined(eventsJson, getUserIdJson(userIdFilterValue))
  );
};

export default filterEventJson;
