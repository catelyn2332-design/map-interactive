/** Compte Grok auquel appartient ce bac à sable — pas d’auth requise. */
export const OWNER = {
  id: "lamina-1311",
  displayName: "Lamina 1311",
  primaryEmail: "catelyn2332@gmail.com",
  grokHandle: "catelyn23331742",
  profileImageUrl: null,
} as const;

export type Owner = typeof OWNER;

export const ACCOUNT_EMAIL = OWNER.primaryEmail;
