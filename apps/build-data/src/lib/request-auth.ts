export const hasBearerToken = (request: Request, secret?: string): boolean => {
  if (!secret) {
    return false;
  }

  const authorization = request.headers.get("Authorization");
  return authorization === `Bearer ${secret}`;
};
