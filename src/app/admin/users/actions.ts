"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { emailProvider } from "@/services/email";
import { registerUser } from "@/modules/auth/authService";
import { prisma } from "@/lib/config/prisma";
import bcrypt from "bcrypt";

const staffRoles: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.SUPPORT, UserRole.FACTURATION];

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

export async function updateUserRoleWithAuth(formData: FormData) {
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    return { error: "Non authentifié" };
  }

  const userId = formData.get("userId")?.toString();
  const newRole = formData.get("newRole")?.toString() as UserRole;
  const newName = formData.get("newName")?.toString();
  const newEmail = formData.get("newEmail")?.toString();
  const newPassword = formData.get("newPassword")?.toString();
  const adminPassword = formData.get("adminPassword")?.toString();

  if (!userId || !newRole || !adminPassword) {
    return { error: "Tous les champs obligatoires sont requis" };
  }

  if (!Object.values(UserRole).includes(newRole)) {
    return { error: "Rôle invalide" };
  }

  if (newPassword && newPassword.length < 8) {
    return { error: "Le nouveau mot de passe doit contenir au moins 8 caractères" };
  }

  // 1. Verify Admin Password
  const adminUser = await prisma.user.findUnique({
    where: { id: currentUser.id }
  });

  if (!adminUser || !adminUser.motDePasseHash) {
    return { error: "Erreur d'authentification admin" };
  }

  const passwordValid = await bcrypt.compare(adminPassword, adminUser.motDePasseHash);
  if (!passwordValid) {
    return { error: "Mot de passe administrateur incorrect" };
  }

  // 2. Check Permissions
  const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN;
  
  const isTargetStaffRole = staffRoles.includes(newRole);
  if (isTargetStaffRole && !isSuperAdmin) {
    return { error: "Seul un Super Admin peut assigner des rôles staff." };
  }

  if (!isSuperAdmin) {
     return { error: "Action non autorisée" };
  }

  // 3. Protect Default Super Admin
  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) {
    return { error: "Utilisateur introuvable" };
  }

  const DEFAULT_ADMIN_EMAIL = "admin@journal.com"; 
  
  if (targetUser.email === DEFAULT_ADMIN_EMAIL) {
    if (newRole !== targetUser.role) {
      return { error: "Le rôle du Super Admin par défaut ne peut pas être modifié." };
    }
  }

  // Check if email is already taken if it's changed
  if (newEmail && newEmail !== targetUser.email) {
    const existing = await prisma.user.findUnique({ where: { email: newEmail } });
    if (existing) {
      return { error: "Cet email est déjà utilisé par un autre compte." };
    }
  }

  // 4. Perform Update
  try {
    const updateData: any = { role: newRole };
    
    if (newName !== undefined) updateData.nom = newName;
    if (newEmail !== undefined) updateData.email = newEmail;

    if (newPassword) {
      const saltRounds = 12;
      updateData.motDePasseHash = await bcrypt.hash(newPassword, saltRounds);
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData
    });
    
    revalidatePath("/admin/users");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "Erreur lors de la mise à jour" };
  }
}
