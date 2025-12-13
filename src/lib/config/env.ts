// Helpers d'environnement centralisés (évite les checks éparpillés).
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // On préfère throw tôt pour éviter un démarrage silencieux sans secret.
    throw new Error("JWT_SECRET manquant dans l'environnement");
  }
  return secret;
}
