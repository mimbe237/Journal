"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { emailProvider } from "@/services/email";
import { registerUser } from "@/modules/auth/authService";

export async function createUser(formData: FormData) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
    throw new Error("Non autorisé");
  }

  const email = formData.get("email")?.toString();
  const nom = formData.get("nom")?.toString();
  const role = formData.get("role")?.toString() as UserRole;

  if (!email || !role) {
    throw new Error("Email et Rôle requis");
  }

  // Générer un mot de passe temporaire (10 chars min)
  const tempPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-4);

  // Utiliser le service d'auth existant pour créer l'utilisateur (hashing, validation, etc.)
  // Note: registerUser vérifie si l'email existe déjà
  await registerUser({
    nom: nom || "",
    email,
    motDePasse: tempPassword,
    role
  });

  const loginLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/login`;

  try {
    await emailProvider.sendEmail({
      to: email,
      subject: "Vos identifiants pour la plateforme Journal",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Bienvenue dans l'équipe !</h2>
          <p>Bonjour ${nom || "cher collaborateur"},</p>
          <p>Un compte <strong>${role}</strong> a été créé pour vous.</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Vos identifiants de connexion :</strong></p>
            <p style="margin: 5px 0;">Email : ${email}</p>
            <p style="margin: 5px 0;">Mot de passe temporaire : <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px;">${tempPassword}</code></p>
          </div>
          <p>Veuillez vous connecter dès que possible.</p>
          <p style="text-align: center; margin-top: 30px;">
            <a href="${loginLink}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Accéder à la plateforme
            </a>
          </p>
        </div>
      `
    });
  } catch (emailError) {
    console.error("Failed to send invitation email:", emailError);
    // On ne bloque pas la création si l'email échoue, mais on pourrait retourner un warning
  }

  revalidatePath("/admin/users");
  return { success: true };
}
