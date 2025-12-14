"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/config/prisma";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { registerUser } from "@/modules/auth/authService";
import { emailProvider } from "@/services/email";

const allowedRoles: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.SUPPORT, UserRole.FACTURATION];

function assertCanManage(currentRole: UserRole | undefined | null) {
  if (!currentRole || !allowedRoles.includes(currentRole)) {
    throw new Error("Non autorisé");
  }
}

export async function createIndividualSubscriber(formData: FormData) {
  const currentUser = await getCurrentUser();
  assertCanManage(currentUser?.role);

  const email = formData.get("email")?.toString();
  const nom = formData.get("nom")?.toString();

  if (!email) {
    throw new Error("Email requis");
  }

  const tempPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-4);

  await registerUser({
    nom: nom || "",
    email,
    motDePasse: tempPassword,
    role: UserRole.ABONNE
  });

  const loginLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/login`;

  try {
    await emailProvider.sendEmail({
      to: email,
      subject: "Votre accès abonné au Journal",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Bienvenue !</h2>
          <p>Bonjour ${nom || ""},</p>
          <p>Un compte abonné vient d'être créé pour vous.</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Vos identifiants :</strong></p>
            <p style="margin: 5px 0;">Email : ${email}</p>
            <p style="margin: 5px 0;">Mot de passe temporaire : <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px;">${tempPassword}</code></p>
          </div>
          <p>Connectez-vous puis changez votre mot de passe.</p>
          <p style="text-align: center; margin-top: 30px;">
            <a href="${loginLink}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Se connecter
            </a>
          </p>
        </div>
      `
    });
  } catch (emailError) {
    console.error("Failed to send subscriber email:", emailError);
  }

  revalidatePath("/admin/subscribers");
  return { success: true };
}

export async function createEnterpriseAccount(formData: FormData) {
  const currentUser = await getCurrentUser();
  assertCanManage(currentUser?.role);

  const nom = formData.get("nom")?.toString();
  const contactEmail = formData.get("contactEmail")?.toString();
  const contactTelephone = formData.get("contactTelephone")?.toString();
  const licencesRaw = formData.get("nombreUtilisateursInclus")?.toString();

  if (!nom || !contactEmail) {
    throw new Error("Nom et email contact requis");
  }

  const licences = licencesRaw ? Number(licencesRaw) : 5;
  if (Number.isNaN(licences) || licences <= 0) {
    throw new Error("Nombre de licences invalide");
  }

  await prisma.enterpriseAccount.create({
    data: {
      nom,
      contactEmail,
      contactTelephone: contactTelephone || null,
      nombreUtilisateursInclus: licences,
      plagesIpAutorisees: []
    }
  });

  revalidatePath("/admin/subscribers");
  revalidatePath("/admin/enterprises");
  return { success: true };
}
