export const USER_CONSTANT = {
  LENGTH: {
    EMAIL: { MIN: 6, MAX: 150 },
    PASSWORD: { MIN: 8, MAX: 255 },
  },

  ERROR: {
    DUPLICATE_EMAIL: 'Email already taken',
    INVALID_PASSWORD:
      'password must be 8 chars at least, also include uppercase, lowercase, numbers and special characters',
    USER_NOT_FOUND: (id?: string | number) => (id ? `User with id ${id} not found` : 'User not found'),
  },

  FIELD_DESCRIPTION: {
    ID: 'Unique identifier (UUID) for the user',
    EMAIL: 'Primary email address used for account authentication',
    PASSWORD: 'Secure authentication credential used to protect account access',
    CREATED_AT: 'Timestamp indicating when the user account was first created in the system',
    UPDATED_AT: 'Timestamp indicating when the user account was updated the last time',
  },
};
