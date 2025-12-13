import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User, UserRole } from "@prisma/client";

import { prisma } from "@/lib/config/prisma";
import { getJwtSecret } from "@/lib/config/env";

const MIN_PASSWORD_LENGTH = 8;
const BCRYPT_SALT_ROUNDS = 12;
const JWT_TTL = "7d"; // Durée de vie du token (modifiable selon la politique produit).

export type AuthJwtPayload = {
  userId: string;
  role: UserRole;
  iat?: number;
  exp?: number;
};

// Création d'un utilisateur (inscription).
export async function registerUser(params: {
  nom: string;
  email: string;
  motDePasse: string;
  role?: UserRole;
}): Promise<User> {
  const email = params.email.trim().toLowerCase();
  const nom = params.nom.trim();
  const motDePasse = params.motDePasse;

  if (!email || !nom) {
    throw new Error("Nom et email sont obligatoires");
  }
  if (motDePasse.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères`);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("Un utilisateur existe déjà avec cet email");
  }

  const motDePasseHash = await bcrypt.hash(motDePasse, BCRYPT_SALT_ROUNDS);
  const role = params.role ?? UserRole.ABONNE;
  // TODO: sécuriser la création d'ADMIN (réservé à un flux dédié / première installation).

  const user = await prisma.user.create({
    data: {
      nom,
      email,
      motDePasseHash,
      role
    }
  });

  return user;
}

// Authentification par email/mot de passe.
export async function authenticateUser(params: {
  email: string;
  motDePasse: string;
}): Promise<{ user: User }> {
  const email = params.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new Error("Identifiants invalides");
  }

  const passwordMatch = await bcrypt.compare(params.motDePasse, user.motDePasseHash);
  if (!passwordMatch) {
    throw new Error("Identifiants invalides");
  }

  return { user };
}

// Génère un JWT contenant l'id utilisateur et son rôle.
export function generateJwtForUser(user: User): string {
  const secret = getJwtSecret();
  const payload: AuthJwtPayload = {
    userId: user.id,
    role: user.role
  };

  return jwt.sign(payload, secret, { expiresIn: JWT_TTL });
}

// Vérifie et décode un JWT. Retourne null si invalide/expiré.
export function verifyJwt(token: string): AuthJwtPayload | null {
  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret) as AuthJwtPayload;
    if (!decoded?.userId || !decoded?.role) {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
}
