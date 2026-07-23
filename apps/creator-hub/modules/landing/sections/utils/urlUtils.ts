export const getCreatorUrl = (type: string, id: number) => {
  if (type === 'Group') {
    return `https://www.${process.env.robloxSiteDomain}/groups/${id}`;
  }
  if (type === 'User') {
    return `https://www.${process.env.robloxSiteDomain}/users/${id}`;
  }

  return '';
};

export default getCreatorUrl;
