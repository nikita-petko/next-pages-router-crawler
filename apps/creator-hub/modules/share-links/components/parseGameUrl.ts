const regex = /^(https:\/\/)?(www\.)?(sitetest\d\.)?roblox(labs)?\.com\/games\/([^/]*)/;

const parseGameUrl = (url?: string) => {
  const match = url?.match(regex);
  if (!match) {
    return undefined;
  }

  const experienceId = match[5];
  const id = parseInt(experienceId, 10);
  // NOTE (@mbae, 09/27/24): parseInt can return a valid integer even if a string isn't an integer, so we need to double check if the output of parseInt matches the input string
  if (Number.isNaN(id) || !(Number.isInteger(id) && String(id) === experienceId)) {
    return undefined;
  }

  return id;
};

export default parseGameUrl;
