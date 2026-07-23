type TErrorType = {
  errors: {
    code: number;
    message: string;
    userFacingMessage: string;
  }[];
};

type TBedev1Error = {
  code: number;
  message: string;
};

const parseBedev1Error = async (response: Response): Promise<TBedev1Error | null> => {
  try {
    const responseBody = (await response.json()) as TErrorType;
    if (responseBody.errors.length > 0) {
      const error = responseBody.errors[0];
      if (error) {
        return { code: error.code, message: error.message };
      }
    }
    return null;
  } catch {
    return null;
  }
};

export default parseBedev1Error;
