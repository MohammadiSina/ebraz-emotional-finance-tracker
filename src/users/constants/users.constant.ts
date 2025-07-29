export const USER_CONSTANT = {
  LENGTH: {
    EMAIL: { MIN: 6, MAX: 150 },
    PASSWORD: { MIN: 8, MAX: 255 },
  },

  ERROR: {
    DUPLICATE_EMAIL:
      'This email address is already registered. Please use a different email or sign in to your existing account.',
    INVALID_PASSWORD:
      'Please create a stronger password that is at least 8 characters long and includes: 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (e.g., !@#$%^&*)',
    USER_NOT_FOUND: (id?: string | number) =>
      id
        ? `We couldn't find a user account with ID: ${id}. Please verify the ID and try again.`
        : 'The requested user account could not be found. Please check your information and try again.',
    UPDATE_DENIED:
      "You don't have the necessary permissions to modify this user account. Please contact an administrator if you need assistance.",
    UPDATE_ROLE_DENIED:
      'Role changes can only be performed by administrators. If you need a role change, please contact your system administrator.',
    REMOVE_DENIED:
      "You don't have the necessary permissions to delete this user account. Please contact an administrator for assistance.",
  },

  FIELD_DESCRIPTION: {
    ID: 'Unique identifier (UUID) for the user',
    EMAIL: 'Primary email address used for account authentication',
    ROLE: "User's role based on the available roles in the system",
    PASSWORD: 'Secure authentication credential used to protect account access',
    CREATED_AT: 'Timestamp indicating when the user account was first created in the system',
    UPDATED_AT: 'Timestamp indicating when the user account was updated the last time',
  },
};

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}
