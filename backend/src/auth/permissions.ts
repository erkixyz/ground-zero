export const Role = {
  USER: "USER",
  GLOBAL_ADMIN: "GLOBAL_ADMIN",
  ORG_ADMIN: "ORG_ADMIN",
  NOTES_ADMIN: "NOTES_ADMIN",
  CLIENTS_ADMIN: "CLIENTS_ADMIN",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const ALL_ROLES: Role[] = [
  Role.GLOBAL_ADMIN,
  Role.NOTES_ADMIN,
  Role.CLIENTS_ADMIN,
  Role.ORG_ADMIN,
  Role.USER,
];

export function hasAnyRole(userRoles: string[], ...required: string[]): boolean {
  if (userRoles.includes(Role.GLOBAL_ADMIN)) return true;
  return required.some((r) => userRoles.includes(r));
}
