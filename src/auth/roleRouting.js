export const ROLE_PORTALS = Object.freeze({
  student: { label: 'Student', destination: 'map' },
  parent: { label: 'Parent', destination: 'parent' },
  teacher: { label: 'Teacher', destination: 'teacher' },
  specialist: { label: 'Specialist', destination: 'specialist' },
  school_admin: { label: 'School Admin', destination: 'schoolAdmin' },
});

// MVP accounts have one database role. The priority keeps legacy accounts
// routable until the single-role migration has cleaned their old grants.
const ROLE_PRIORITY = ['school_admin', 'specialist', 'teacher', 'parent', 'student'];

export const PRIVILEGED_ROLES = new Set(ROLE_PRIORITY.filter((role) => role !== 'student'));

export function authorizedRole(roles = [], preferredRole) {
  if (preferredRole && roles.includes(preferredRole) && ROLE_PORTALS[preferredRole]) return preferredRole;
  return ROLE_PRIORITY.find((role) => roles.includes(role)) ?? null;
}

export function authorizedPortal(roles, preferredRole) {
  const role = authorizedRole(roles, preferredRole);
  return role ? { role, ...ROLE_PORTALS[role] } : null;
}

export const SCREEN_ROLES = Object.freeze({
  map: ['student'], soundForest: ['student'], visionValley: ['student'], storyCastle: ['student'], runeRealm: ['student'], memoryMountains: ['student'],
  parent: ['parent'], teacher: ['teacher'], schoolAdmin: ['school_admin'], specialist: ['specialist'],
});
