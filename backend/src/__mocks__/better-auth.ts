const mockAuth = {
  api: { getSession: jest.fn().mockResolvedValue(null) },
  handler: jest.fn(),
  options: {},
};

const betterAuth = jest.fn().mockReturnValue(mockAuth);
const prismaAdapter = jest.fn().mockReturnValue({});
const fromNodeHeaders = jest.fn().mockReturnValue({});

module.exports = {
  betterAuth,
  prismaAdapter,
  fromNodeHeaders,
  default: betterAuth,
};
