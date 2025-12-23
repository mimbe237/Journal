"use strict";
/**
 * Seed script pour les templates email par défaut
 *
 * Usage: npx ts-node prisma/seeds/seedEmailTemplates.ts
 *
 * Ce script crée :
 * - 1 layout principal (default-layout)
 * - 14 templates email par défaut
 * - Les automations associées
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
// Layout HTML par défaut
var DEFAULT_LAYOUT_MJML = "<!DOCTYPE html>\n<html lang=\"fr\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>{{subject}}</title>\n  <style>\n    body {\n      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;\n      line-height: 1.6;\n      color: #0f172a;\n      background-color: #f1f5f9;\n      margin: 0;\n      padding: 0;\n    }\n    .container {\n      max-width: 600px;\n      margin: 0 auto;\n      padding: 20px;\n    }\n    .header {\n      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);\n      color: white;\n      padding: 30px;\n      text-align: center;\n      border-radius: 12px 12px 0 0;\n    }\n    .header h1 {\n      margin: 0;\n      font-size: 24px;\n      font-weight: 700;\n    }\n    .content {\n      background: white;\n      padding: 30px;\n      border-radius: 0 0 12px 12px;\n      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);\n    }\n    .button {\n      display: inline-block;\n      background: #10b981;\n      color: white !important;\n      padding: 14px 28px;\n      border-radius: 8px;\n      text-decoration: none;\n      font-weight: 600;\n      margin: 20px 0;\n    }\n    .button:hover {\n      background: #059669;\n    }\n    .footer {\n      text-align: center;\n      padding: 20px;\n      color: #64748b;\n      font-size: 12px;\n    }\n    .footer a {\n      color: #64748b;\n    }\n  </style>\n</head>\n<body>\n  <div class=\"container\">\n    <div class=\"header\">\n      <h1>\uD83D\uDCF0 Journal</h1>\n    </div>\n    <div class=\"content\">\n      {{content}}\n    </div>\n    <div class=\"footer\">\n      <p>\u00A9 2024 Journal. Tous droits r\u00E9serv\u00E9s.</p>\n      <p>\n        <a href=\"{{app.url}}/profile/notifications\">G\u00E9rer mes notifications</a> |\n        <a href=\"{{app.url}}/faq\">FAQ</a> |\n        <a href=\"{{app.url}}/support\">Support</a>\n      </p>\n    </div>\n  </div>\n</body>\n</html>";
var TEMPLATES = [
    // 1. Welcome
    {
        slug: 'welcome',
        nom: 'Bienvenue',
        description: 'Email de bienvenue envoyé après inscription',
        category: 'TRANSACTIONAL',
        sujet: 'Bienvenue sur Journal, {{user.prenom}} ! 🎉',
        corps: "<h2>Bienvenue {{user.prenom}} ! \uD83D\uDC4B</h2>\n\n<p>Nous sommes ravis de vous accueillir sur <strong>Journal</strong>, votre plateforme de lecture d'\u00E9ditions num\u00E9riques.</p>\n\n<p>Votre compte a \u00E9t\u00E9 cr\u00E9\u00E9 avec succ\u00E8s. Voici ce que vous pouvez faire maintenant :</p>\n\n<ul>\n  <li>\uD83D\uDCD6 <strong>D\u00E9couvrir les \u00E9ditions</strong> disponibles</li>\n  <li>\uD83D\uDCB3 <strong>Souscrire \u00E0 un abonnement</strong> pour un acc\u00E8s illimit\u00E9</li>\n  <li>\uD83D\uDC64 <strong>Compl\u00E9ter votre profil</strong></li>\n</ul>\n\n<p style=\"text-align: center;\">\n  <a href=\"{{app.url}}/dashboard\" class=\"button\">Acc\u00E9der \u00E0 mon espace</a>\n</p>\n\n<p>Des questions ? Notre \u00E9quipe support est l\u00E0 pour vous aider.</p>\n\n<p>\u00C0 tr\u00E8s bient\u00F4t,<br>L'\u00E9quipe Journal</p>",
        corpsText: "Bienvenue {{user.prenom}} !\n\nNous sommes ravis de vous accueillir sur Journal, votre plateforme de lecture d'\u00E9ditions num\u00E9riques.\n\nVotre compte a \u00E9t\u00E9 cr\u00E9\u00E9 avec succ\u00E8s. Voici ce que vous pouvez faire maintenant :\n- D\u00E9couvrir les \u00E9ditions disponibles\n- Souscrire \u00E0 un abonnement pour un acc\u00E8s illimit\u00E9\n- Compl\u00E9ter votre profil\n\nAcc\u00E9der \u00E0 mon espace : {{app.url}}/dashboard\n\nDes questions ? Notre \u00E9quipe support est l\u00E0 pour vous aider.\n\n\u00C0 tr\u00E8s bient\u00F4t,\nL'\u00E9quipe Journal",
        tokens: {
            'user.prenom': 'Prénom de l\'utilisateur',
            'user.nom': 'Nom de l\'utilisateur',
            'user.email': 'Email de l\'utilisateur',
            'app.url': 'URL de l\'application'
        },
        automation: {
            triggerType: 'INSCRIPTION',
            nom: 'Bienvenue automatique',
            description: 'Envoyé automatiquement après inscription'
        }
    },
    // 2. Password Reset
    {
        slug: 'password-reset',
        nom: 'Réinitialisation mot de passe',
        description: 'Lien de réinitialisation du mot de passe',
        category: 'TRANSACTIONAL',
        sujet: 'Réinitialisation de votre mot de passe',
        corps: "<h2>R\u00E9initialisation de mot de passe</h2>\n\n<p>Bonjour {{user.prenom}},</p>\n\n<p>Vous avez demand\u00E9 \u00E0 r\u00E9initialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour d\u00E9finir un nouveau mot de passe :</p>\n\n<p style=\"text-align: center;\">\n  <a href=\"{{reset.url}}\" class=\"button\">R\u00E9initialiser mon mot de passe</a>\n</p>\n\n<p><strong>Ce lien expire dans 1 heure.</strong></p>\n\n<p>Si vous n'avez pas demand\u00E9 cette r\u00E9initialisation, ignorez simplement cet email. Votre mot de passe restera inchang\u00E9.</p>\n\n<hr style=\"border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;\">\n\n<p style=\"font-size: 12px; color: #64748b;\">\n  Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>\n  <a href=\"{{reset.url}}\" style=\"word-break: break-all;\">{{reset.url}}</a>\n</p>",
        corpsText: "R\u00E9initialisation de mot de passe\n\nBonjour {{user.prenom}},\n\nVous avez demand\u00E9 \u00E0 r\u00E9initialiser votre mot de passe. Utilisez le lien ci-dessous pour d\u00E9finir un nouveau mot de passe :\n\n{{reset.url}}\n\nCe lien expire dans 1 heure.\n\nSi vous n'avez pas demand\u00E9 cette r\u00E9initialisation, ignorez simplement cet email.",
        tokens: {
            'user.prenom': 'Prénom de l\'utilisateur',
            'user.email': 'Email de l\'utilisateur',
            'reset.url': 'URL de réinitialisation avec token',
            'reset.expiresAt': 'Date d\'expiration du lien'
        }
    },
    // 3. Email Verification
    {
        slug: 'email-verification',
        nom: 'Vérification email',
        description: 'Email de vérification d\'adresse',
        category: 'TRANSACTIONAL',
        sujet: 'Vérifiez votre adresse email',
        corps: "<h2>V\u00E9rifiez votre adresse email \u2709\uFE0F</h2>\n\n<p>Bonjour {{user.prenom}},</p>\n\n<p>Pour finaliser votre inscription et acc\u00E9der \u00E0 toutes les fonctionnalit\u00E9s, veuillez v\u00E9rifier votre adresse email en cliquant sur le bouton ci-dessous :</p>\n\n<p style=\"text-align: center;\">\n  <a href=\"{{verification.url}}\" class=\"button\">V\u00E9rifier mon email</a>\n</p>\n\n<p>Ce lien expire dans 24 heures.</p>\n\n<p>Si vous n'avez pas cr\u00E9\u00E9 de compte sur Journal, ignorez cet email.</p>",
        corpsText: "V\u00E9rifiez votre adresse email\n\nBonjour {{user.prenom}},\n\nPour finaliser votre inscription, veuillez v\u00E9rifier votre adresse email en utilisant le lien ci-dessous :\n\n{{verification.url}}\n\nCe lien expire dans 24 heures.",
        tokens: {
            'user.prenom': 'Prénom de l\'utilisateur',
            'verification.url': 'URL de vérification avec token'
        }
    },
    // 4. Subscription Confirmation
    {
        slug: 'subscription-confirmation',
        nom: 'Confirmation abonnement',
        description: 'Confirmation d\'activation d\'abonnement',
        category: 'TRANSACTIONAL',
        sujet: 'Votre abonnement {{subscription.type}} est actif ! 🎉',
        corps: "<h2>F\u00E9licitations {{user.prenom}} ! \uD83C\uDF89</h2>\n\n<p>Votre abonnement <strong>{{subscription.type}}</strong> est maintenant actif.</p>\n\n<div style=\"background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;\">\n  <p style=\"margin: 0;\"><strong>R\u00E9capitulatif :</strong></p>\n  <ul style=\"margin: 10px 0 0 0; padding-left: 20px;\">\n    <li>Type : {{subscription.type}}</li>\n    <li>D\u00E9but : {{subscription.dateDebut}}</li>\n    <li>Fin : {{subscription.dateFin}}</li>\n    <li>Montant : {{subscription.montant}} {{subscription.devise}}</li>\n  </ul>\n</div>\n\n<p>Vous avez d\u00E9sormais acc\u00E8s \u00E0 :</p>\n<ul>\n  <li>\u2705 Toutes les \u00E9ditions publi\u00E9es</li>\n  <li>\u2705 Lecture illimit\u00E9e</li>\n  <li>\u2705 T\u00E9l\u00E9chargement hors-ligne</li>\n</ul>\n\n<p style=\"text-align: center;\">\n  <a href=\"{{app.url}}/editions\" class=\"button\">D\u00E9couvrir les \u00E9ditions</a>\n</p>\n\n<p>Merci pour votre confiance !<br>L'\u00E9quipe Journal</p>",
        corpsText: "F\u00E9licitations {{user.prenom}} !\n\nVotre abonnement {{subscription.type}} est maintenant actif.\n\nR\u00E9capitulatif :\n- Type : {{subscription.type}}\n- D\u00E9but : {{subscription.dateDebut}}\n- Fin : {{subscription.dateFin}}\n- Montant : {{subscription.montant}} {{subscription.devise}}\n\nVous avez d\u00E9sormais acc\u00E8s \u00E0 toutes les \u00E9ditions.\n\nD\u00E9couvrir les \u00E9ditions : {{app.url}}/editions\n\nMerci pour votre confiance !\nL'\u00E9quipe Journal",
        tokens: {
            'user.prenom': 'Prénom',
            'subscription.type': 'MENSUEL | ANNUEL',
            'subscription.dateDebut': 'Date de début formatée',
            'subscription.dateFin': 'Date de fin formatée',
            'subscription.montant': 'Montant payé',
            'subscription.devise': 'XAF | EUR | USD'
        },
        automation: {
            triggerType: 'ABONNEMENT_ACTIF',
            nom: 'Confirmation abonnement',
            description: 'Envoyé automatiquement à l\'activation'
        }
    },
    // 5. Manual Submission Received
    {
        slug: 'manual-submission-received',
        nom: 'Soumission reçue',
        description: 'Confirmation de réception de demande manuelle',
        category: 'TRANSACTIONAL',
        sujet: 'Votre demande d\'abonnement a été reçue',
        corps: "<h2>Demande re\u00E7ue \u2713</h2>\n\n<p>Bonjour {{user.prenom}},</p>\n\n<p>Nous avons bien re\u00E7u votre demande d'abonnement avec les informations suivantes :</p>\n\n<div style=\"background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 20px 0;\">\n  <p style=\"margin: 0 0 10px 0;\"><strong>D\u00E9tails :</strong></p>\n  <ul style=\"margin: 0; padding-left: 20px;\">\n    <li>Type : {{subscription.type}}</li>\n    <li>Montant : {{subscription.montant}} {{subscription.devise}}</li>\n    <li>R\u00E9f\u00E9rence : {{submission.reference}}</li>\n  </ul>\n</div>\n\n<p>Notre \u00E9quipe va v\u00E9rifier votre preuve de paiement dans les <strong>24 \u00E0 48 heures</strong>.</p>\n\n<p>Vous recevrez un email de confirmation d\u00E8s que votre abonnement sera activ\u00E9.</p>\n\n<p style=\"text-align: center;\">\n  <a href=\"{{app.url}}/subscriptions/submissions\" class=\"button\">Suivre ma demande</a>\n</p>\n\n<p>Des questions ? Contactez notre support.</p>",
        corpsText: "Demande re\u00E7ue\n\nBonjour {{user.prenom}},\n\nNous avons bien re\u00E7u votre demande d'abonnement :\n- Type : {{subscription.type}}\n- Montant : {{subscription.montant}} {{subscription.devise}}\n- R\u00E9f\u00E9rence : {{submission.reference}}\n\nNotre \u00E9quipe va v\u00E9rifier votre preuve de paiement dans les 24 \u00E0 48 heures.\n\nSuivre ma demande : {{app.url}}/subscriptions/submissions",
        tokens: {
            'user.prenom': 'Prénom',
            'subscription.type': 'Type d\'abonnement',
            'subscription.montant': 'Montant',
            'subscription.devise': 'Devise',
            'submission.reference': 'Référence de la soumission'
        }
    },
    // 6. Manual Submission Approved
    {
        slug: 'manual-submission-approved',
        nom: 'Soumission approuvée',
        description: 'Notification d\'approbation de paiement manuel',
        category: 'TRANSACTIONAL',
        sujet: 'Votre abonnement a été validé ! ✅',
        corps: "<h2>Abonnement valid\u00E9 ! \uD83C\uDF89</h2>\n\n<p>Bonjour {{user.prenom}},</p>\n\n<p>Excellente nouvelle ! Votre demande d'abonnement a \u00E9t\u00E9 <strong style=\"color: #10b981;\">approuv\u00E9e</strong> par notre \u00E9quipe.</p>\n\n<div style=\"background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;\">\n  <p style=\"margin: 0;\"><strong>Votre abonnement est actif !</strong></p>\n  <p style=\"margin: 10px 0 0 0;\">Valide jusqu'au : <strong>{{subscription.dateFin}}</strong></p>\n</div>\n\n<p>Vous avez maintenant acc\u00E8s \u00E0 toutes les \u00E9ditions du journal.</p>\n\n<p style=\"text-align: center;\">\n  <a href=\"{{app.url}}/dashboard\" class=\"button\">Acc\u00E9der \u00E0 mon espace</a>\n</p>\n\n<p>Merci pour votre confiance !<br>L'\u00E9quipe Journal</p>",
        corpsText: "Abonnement valid\u00E9 !\n\nBonjour {{user.prenom}},\n\nExcellente nouvelle ! Votre demande d'abonnement a \u00E9t\u00E9 approuv\u00E9e.\n\nVotre abonnement est actif jusqu'au {{subscription.dateFin}}.\n\nAcc\u00E9der \u00E0 mon espace : {{app.url}}/dashboard\n\nMerci pour votre confiance !\nL'\u00E9quipe Journal",
        tokens: {
            'user.prenom': 'Prénom',
            'subscription.dateFin': 'Date de fin'
        }
    },
    // 7. Manual Submission Rejected
    {
        slug: 'manual-submission-rejected',
        nom: 'Soumission rejetée',
        description: 'Notification de rejet de paiement manuel',
        category: 'TRANSACTIONAL',
        sujet: 'Problème avec votre demande d\'abonnement',
        corps: "<h2>Demande non valid\u00E9e</h2>\n\n<p>Bonjour {{user.prenom}},</p>\n\n<p>Nous avons examin\u00E9 votre demande d'abonnement, mais malheureusement nous n'avons pas pu la valider.</p>\n\n<div style=\"background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;\">\n  <p style=\"margin: 0;\"><strong>Raison :</strong></p>\n  <p style=\"margin: 10px 0 0 0;\">{{rejection.reason}}</p>\n</div>\n\n<p><strong>Que faire maintenant ?</strong></p>\n<ul>\n  <li>V\u00E9rifiez que votre preuve de paiement est lisible et compl\u00E8te</li>\n  <li>Assurez-vous que le montant correspond au tarif de l'abonnement</li>\n  <li>Soumettez une nouvelle demande avec les corrections</li>\n</ul>\n\n<p style=\"text-align: center;\">\n  <a href=\"{{app.url}}/subscriptions/manual\" class=\"button\">Soumettre une nouvelle demande</a>\n</p>\n\n<p>Si vous pensez qu'il s'agit d'une erreur, contactez notre support.</p>",
        corpsText: "Demande non valid\u00E9e\n\nBonjour {{user.prenom}},\n\nNous avons examin\u00E9 votre demande d'abonnement, mais nous n'avons pas pu la valider.\n\nRaison : {{rejection.reason}}\n\nQue faire maintenant ?\n- V\u00E9rifiez que votre preuve de paiement est lisible et compl\u00E8te\n- Assurez-vous que le montant correspond au tarif\n- Soumettez une nouvelle demande\n\nNouvelle demande : {{app.url}}/subscriptions/manual",
        tokens: {
            'user.prenom': 'Prénom',
            'rejection.reason': 'Motif du rejet'
        }
    },
    // 8. Subscription Expiring 7 days
    {
        slug: 'subscription-expiring-7days',
        nom: 'Expiration J-7',
        description: 'Alerte 7 jours avant expiration',
        category: 'TRANSACTIONAL',
        sujet: 'Votre abonnement expire dans 7 jours',
        corps: "<h2>\u23F0 Votre abonnement expire bient\u00F4t</h2>\n\n<p>Bonjour {{user.prenom}},</p>\n\n<p>Votre abonnement au Journal arrive \u00E0 expiration dans <strong>7 jours</strong>, le <strong>{{subscription.dateFin}}</strong>.</p>\n\n<p>Pour continuer \u00E0 profiter d'un acc\u00E8s illimit\u00E9 \u00E0 toutes les \u00E9ditions, pensez \u00E0 renouveler d\u00E8s maintenant.</p>\n\n<div style=\"background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;\">\n  <p style=\"margin: 0;\"><strong>\uD83D\uDCA1 Astuce :</strong> Optez pour l'abonnement annuel et \u00E9conomisez 20% !</p>\n</div>\n\n<p style=\"text-align: center;\">\n  <a href=\"{{app.url}}/subscriptions\" class=\"button\">Renouveler mon abonnement</a>\n</p>\n\n<p>Des questions ? Notre \u00E9quipe est l\u00E0 pour vous aider.</p>",
        corpsText: "Votre abonnement expire bient\u00F4t\n\nBonjour {{user.prenom}},\n\nVotre abonnement au Journal arrive \u00E0 expiration dans 7 jours, le {{subscription.dateFin}}.\n\nPour continuer \u00E0 profiter d'un acc\u00E8s illimit\u00E9, renouvelez d\u00E8s maintenant.\n\nAstuce : Optez pour l'abonnement annuel et \u00E9conomisez 20% !\n\nRenouveler : {{app.url}}/subscriptions",
        tokens: {
            'user.prenom': 'Prénom',
            'subscription.dateFin': 'Date d\'expiration formatée'
        },
        automation: {
            triggerType: 'ABONNEMENT_EXPIRE_BIENTOT',
            nom: 'Alerte expiration J-7',
            description: 'Envoyé 7 jours avant expiration',
            delayMinutes: 0
        }
    },
    // 9. Subscription Expiring 1 day
    {
        slug: 'subscription-expiring-1day',
        nom: 'Expiration J-1',
        description: 'Alerte 1 jour avant expiration',
        category: 'TRANSACTIONAL',
        sujet: '⚠️ Dernier jour : votre abonnement expire demain',
        corps: "<h2>\u26A0\uFE0F Dernier rappel</h2>\n\n<p>Bonjour {{user.prenom}},</p>\n\n<p>C'est votre <strong>derni\u00E8re chance</strong> ! Votre abonnement expire <strong>demain</strong>, le <strong>{{subscription.dateFin}}</strong>.</p>\n\n<p>Apr\u00E8s cette date, vous n'aurez plus acc\u00E8s aux \u00E9ditions. Renouvelez maintenant pour ne rien manquer.</p>\n\n<p style=\"text-align: center;\">\n  <a href=\"{{app.url}}/subscriptions\" class=\"button\" style=\"background: #ef4444;\">Renouveler maintenant</a>\n</p>\n\n<p>Si vous avez d\u00E9j\u00E0 renouvel\u00E9, ignorez ce message.</p>",
        corpsText: "Dernier rappel\n\nBonjour {{user.prenom}},\n\nC'est votre derni\u00E8re chance ! Votre abonnement expire demain, le {{subscription.dateFin}}.\n\nApr\u00E8s cette date, vous n'aurez plus acc\u00E8s aux \u00E9ditions.\n\nRenouveler maintenant : {{app.url}}/subscriptions\n\nSi vous avez d\u00E9j\u00E0 renouvel\u00E9, ignorez ce message.",
        tokens: {
            'user.prenom': 'Prénom',
            'subscription.dateFin': 'Date d\'expiration'
        },
        automation: {
            triggerType: 'ABONNEMENT_EXPIRE_BIENTOT',
            nom: 'Alerte expiration J-1',
            description: 'Envoyé 1 jour avant expiration',
            delayMinutes: 0
        }
    },
    // 10. Subscription Expired
    {
        slug: 'subscription-expired',
        nom: 'Abonnement expiré',
        description: 'Notification d\'expiration',
        category: 'TRANSACTIONAL',
        sujet: 'Votre abonnement a expiré',
        corps: "<h2>Votre abonnement a expir\u00E9</h2>\n\n<p>Bonjour {{user.prenom}},</p>\n\n<p>Votre abonnement au Journal a expir\u00E9 le <strong>{{subscription.dateFin}}</strong>.</p>\n\n<p>Vous n'avez plus acc\u00E8s aux \u00E9ditions. Pour reprendre votre lecture, renouvelez votre abonnement.</p>\n\n<p style=\"text-align: center;\">\n  <a href=\"{{app.url}}/subscriptions\" class=\"button\">Renouveler mon abonnement</a>\n</p>\n\n<p>Nous esp\u00E9rons vous revoir bient\u00F4t !<br>L'\u00E9quipe Journal</p>",
        corpsText: "Votre abonnement a expir\u00E9\n\nBonjour {{user.prenom}},\n\nVotre abonnement au Journal a expir\u00E9 le {{subscription.dateFin}}.\n\nVous n'avez plus acc\u00E8s aux \u00E9ditions. Pour reprendre votre lecture, renouvelez votre abonnement.\n\nRenouveler : {{app.url}}/subscriptions\n\nNous esp\u00E9rons vous revoir bient\u00F4t !\nL'\u00E9quipe Journal",
        tokens: {
            'user.prenom': 'Prénom',
            'subscription.dateFin': 'Date d\'expiration'
        },
        automation: {
            triggerType: 'ABONNEMENT_EXPIRE',
            nom: 'Notification expiration',
            description: 'Envoyé le jour de l\'expiration'
        }
    },
    // 11. New Edition Available
    {
        slug: 'new-edition-available',
        nom: 'Nouvelle édition',
        description: 'Annonce de nouvelle édition',
        category: 'MARKETING',
        sujet: '📰 Nouvelle édition disponible : {{edition.titre}}',
        corps: "<h2>\uD83D\uDCF0 Nouvelle \u00E9dition !</h2>\n\n<p>Bonjour {{user.prenom}},</p>\n\n<p>Une nouvelle \u00E9dition vient d'\u00EAtre publi\u00E9e :</p>\n\n<div style=\"background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;\">\n  <h3 style=\"margin: 0 0 10px 0; color: #0f172a;\">{{edition.titre}}</h3>\n  <p style=\"margin: 0; color: #64748b;\">Publi\u00E9 le {{edition.datePublication}}</p>\n</div>\n\n<p style=\"text-align: center;\">\n  <a href=\"{{app.url}}/editions/{{edition.id}}\" class=\"button\">Lire maintenant</a>\n</p>\n\n<p>Bonne lecture !<br>L'\u00E9quipe Journal</p>",
        corpsText: "Nouvelle \u00E9dition !\n\nBonjour {{user.prenom}},\n\nUne nouvelle \u00E9dition vient d'\u00EAtre publi\u00E9e :\n\n{{edition.titre}}\nPubli\u00E9 le {{edition.datePublication}}\n\nLire maintenant : {{app.url}}/editions/{{edition.id}}\n\nBonne lecture !\nL'\u00E9quipe Journal",
        tokens: {
            'user.prenom': 'Prénom',
            'edition.id': 'ID de l\'édition',
            'edition.titre': 'Titre de l\'édition',
            'edition.datePublication': 'Date de publication'
        },
        automation: {
            triggerType: 'NOUVELLE_EDITION',
            nom: 'Notification nouvelle édition',
            description: 'Envoyé à tous les abonnés actifs'
        }
    },
    // 12. Enterprise Invitation
    {
        slug: 'enterprise-invitation',
        nom: 'Invitation entreprise',
        description: 'Invitation à rejoindre une entreprise',
        category: 'TRANSACTIONAL',
        sujet: '{{enterprise.nom}} vous invite à rejoindre Journal',
        corps: "<h2>Vous \u00EAtes invit\u00E9 ! \uD83C\uDF89</h2>\n\n<p>Bonjour,</p>\n\n<p><strong>{{inviter.nom}}</strong> de <strong>{{enterprise.nom}}</strong> vous invite \u00E0 rejoindre leur espace Journal.</p>\n\n<p>En acceptant cette invitation, vous aurez acc\u00E8s \u00E0 toutes les \u00E9ditions du journal, sans frais suppl\u00E9mentaires.</p>\n\n<p style=\"text-align: center;\">\n  <a href=\"{{invitation.url}}\" class=\"button\">Accepter l'invitation</a>\n</p>\n\n<p>Cette invitation expire le <strong>{{invitation.expiresAt}}</strong>.</p>\n\n<p>Si vous ne connaissez pas cette entreprise, ignorez cet email.</p>",
        corpsText: "Vous \u00EAtes invit\u00E9 !\n\nBonjour,\n\n{{inviter.nom}} de {{enterprise.nom}} vous invite \u00E0 rejoindre leur espace Journal.\n\nEn acceptant cette invitation, vous aurez acc\u00E8s \u00E0 toutes les \u00E9ditions du journal.\n\nAccepter l'invitation : {{invitation.url}}\n\nCette invitation expire le {{invitation.expiresAt}}.\n\nSi vous ne connaissez pas cette entreprise, ignorez cet email.",
        tokens: {
            'inviter.nom': 'Nom de la personne qui invite',
            'enterprise.nom': 'Nom de l\'entreprise',
            'invitation.url': 'URL d\'acceptation',
            'invitation.expiresAt': 'Date d\'expiration'
        },
        automation: {
            triggerType: 'INVITATION_ENTREPRISE',
            nom: 'Invitation entreprise',
            description: 'Envoyé lors d\'une invitation'
        }
    },
    // 13. Payment Received
    {
        slug: 'payment-received',
        nom: 'Paiement reçu',
        description: 'Confirmation de paiement',
        category: 'TRANSACTIONAL',
        sujet: 'Confirmation de paiement - {{payment.reference}}',
        corps: "<h2>Paiement re\u00E7u \u2713</h2>\n\n<p>Bonjour {{user.prenom}},</p>\n\n<p>Nous confirmons la r\u00E9ception de votre paiement :</p>\n\n<div style=\"background: #f0fdf4; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;\">\n  <table style=\"width: 100%; border-collapse: collapse;\">\n    <tr>\n      <td style=\"padding: 5px 0; color: #64748b;\">R\u00E9f\u00E9rence :</td>\n      <td style=\"padding: 5px 0; text-align: right; font-weight: 600;\">{{payment.reference}}</td>\n    </tr>\n    <tr>\n      <td style=\"padding: 5px 0; color: #64748b;\">Montant :</td>\n      <td style=\"padding: 5px 0; text-align: right; font-weight: 600;\">{{payment.montant}} {{payment.devise}}</td>\n    </tr>\n    <tr>\n      <td style=\"padding: 5px 0; color: #64748b;\">Date :</td>\n      <td style=\"padding: 5px 0; text-align: right;\">{{payment.date}}</td>\n    </tr>\n    <tr>\n      <td style=\"padding: 5px 0; color: #64748b;\">Moyen :</td>\n      <td style=\"padding: 5px 0; text-align: right;\">{{payment.methode}}</td>\n    </tr>\n  </table>\n</div>\n\n<p>Vous pouvez t\u00E9l\u00E9charger votre facture depuis votre espace personnel.</p>\n\n<p style=\"text-align: center;\">\n  <a href=\"{{app.url}}/profile/payments\" class=\"button\">Voir mes paiements</a>\n</p>\n\n<p>Merci !<br>L'\u00E9quipe Journal</p>",
        corpsText: "Paiement re\u00E7u\n\nBonjour {{user.prenom}},\n\nNous confirmons la r\u00E9ception de votre paiement :\n\nR\u00E9f\u00E9rence : {{payment.reference}}\nMontant : {{payment.montant}} {{payment.devise}}\nDate : {{payment.date}}\nMoyen : {{payment.methode}}\n\nVoir mes paiements : {{app.url}}/profile/payments\n\nMerci !\nL'\u00E9quipe Journal",
        tokens: {
            'user.prenom': 'Prénom',
            'payment.reference': 'Référence du paiement',
            'payment.montant': 'Montant',
            'payment.devise': 'Devise',
            'payment.date': 'Date du paiement',
            'payment.methode': 'Méthode de paiement'
        },
        automation: {
            triggerType: 'PAIEMENT_RECU',
            nom: 'Confirmation paiement',
            description: 'Envoyé après confirmation de paiement'
        }
    },
    // 14. Payment Failed
    {
        slug: 'payment-failed',
        nom: 'Paiement échoué',
        description: 'Notification d\'échec de paiement',
        category: 'TRANSACTIONAL',
        sujet: '⚠️ Problème avec votre paiement',
        corps: "<h2>\u26A0\uFE0F \u00C9chec de paiement</h2>\n\n<p>Bonjour {{user.prenom}},</p>\n\n<p>Votre paiement de <strong>{{payment.montant}} {{payment.devise}}</strong> n'a pas pu \u00EAtre trait\u00E9.</p>\n\n<div style=\"background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;\">\n  <p style=\"margin: 0;\"><strong>Raison :</strong> {{payment.errorMessage}}</p>\n</div>\n\n<p><strong>Que faire ?</strong></p>\n<ul>\n  <li>V\u00E9rifiez que votre carte ou compte Mobile Money est valide</li>\n  <li>Assurez-vous d'avoir suffisamment de fonds</li>\n  <li>R\u00E9essayez le paiement</li>\n</ul>\n\n<p style=\"text-align: center;\">\n  <a href=\"{{app.url}}/payments/checkout\" class=\"button\">R\u00E9essayer le paiement</a>\n</p>\n\n<p>Si le probl\u00E8me persiste, contactez votre banque ou notre support.</p>",
        corpsText: "\u00C9chec de paiement\n\nBonjour {{user.prenom}},\n\nVotre paiement de {{payment.montant}} {{payment.devise}} n'a pas pu \u00EAtre trait\u00E9.\n\nRaison : {{payment.errorMessage}}\n\nQue faire ?\n- V\u00E9rifiez que votre carte ou compte Mobile Money est valide\n- Assurez-vous d'avoir suffisamment de fonds\n- R\u00E9essayez le paiement\n\nR\u00E9essayer : {{app.url}}/payments/checkout\n\nSi le probl\u00E8me persiste, contactez votre banque ou notre support.",
        tokens: {
            'user.prenom': 'Prénom',
            'payment.montant': 'Montant',
            'payment.devise': 'Devise',
            'payment.errorMessage': 'Message d\'erreur'
        },
        automation: {
            triggerType: 'PAIEMENT_ECHOUE',
            nom: 'Notification échec paiement',
            description: 'Envoyé après un échec de paiement'
        }
    },
    // 15. Edition quotidienne avec emplacement pub
    {
        slug: 'edition-with-ad-slot',
        nom: 'Edition quotidienne + pub',
        description: "Envoi de l'edition avec un slot publicitaire cible",
        category: 'NOTIFICATION',
        sujet: '📰 Votre édition du jour : {{edition.titre}}',
        corps: "<h2>Votre \u00E9dition est pr\u00EAte \uD83D\uDCE5</h2>\n\n<p>Bonjour {{user.prenom}},</p>\n\n<p>L'\u00E9dition du jour est disponible. Cliquez ci-dessous pour la lire :</p>\n\n<div style=\"background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 16px 0;\">\n  <h3 style=\"margin: 0 0 6px 0; color: #0f172a;\">{{edition.titre}}</h3>\n  <p style=\"margin: 0; color: #64748b;\">Publi\u00E9 le {{edition.datePublication}}</p>\n  <p style=\"margin: 12px 0 0 0;\">\n    <a href=\"{{edition.lien}}\" class=\"button\">Lire maintenant</a>\n  </p>\n</div>\n\n<!-- Slot publicitaire : reste vide si aucune pub cibl\u00E9e -->\n{{ad.html}}\n\n<p style=\"color: #475569; font-size: 14px; margin-top: 20px;\">\n  Merci de votre fid\u00E9lit\u00E9 et bonne lecture !\n</p>",
        corpsText: "Votre \u00E9dition est pr\u00EAte\n\nBonjour {{user.prenom}},\n\nL'\u00E9dition du jour est disponible : {{edition.titre}} ({{edition.datePublication}})\nLire maintenant : {{edition.lien}}\n\nPublicit\u00E9 (si cibl\u00E9e) : {{ad.clickUrl}}\n\nMerci de votre fid\u00E9lit\u00E9.",
        tokens: {
            'user.prenom': 'Prénom de l\'utilisateur',
            'edition.titre': 'Titre de l\'édition',
            'edition.datePublication': 'Date de publication formatée',
            'edition.lien': 'Lien direct vers l\'édition',
            'ad.html': 'Snippet HTML de la bannière (ou vide)',
            'ad.mjml': 'Snippet MJML de la bannière (optionnel)',
            'ad.imageUrl': 'URL de l\'image pub',
            'ad.clickUrl': 'URL de redirection pub',
            'ad.altText': 'Texte alternatif pub',
            'ad.hasAd': 'true/false selon ciblage',
            'app.url': 'URL de l\'application'
        },
        automation: {
            triggerType: 'NOUVELLE_EDITION',
            nom: 'Edition + pub',
            description: "Envoi automatique de l'edition avec slot pub"
        }
    }
];
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var layout, _i, TEMPLATES_1, template, created;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    console.log('🌱 Seeding email templates...\n');
                    // 1. Créer le layout par défaut
                    console.log('📐 Creating default layout...');
                    return [4 /*yield*/, prisma.emailLayout.upsert({
                            where: { nom: 'default-layout' },
                            update: {
                                mjml: DEFAULT_LAYOUT_MJML,
                                description: 'Layout par défaut avec header, content et footer'
                            },
                            create: {
                                nom: 'default-layout',
                                description: 'Layout par défaut avec header, content et footer',
                                mjml: DEFAULT_LAYOUT_MJML
                            }
                        })];
                case 1:
                    layout = _c.sent();
                    console.log("  \u2713 Layout created: ".concat(layout.nom, "\n"));
                    // 2. Créer les templates
                    console.log('📧 Creating email templates...');
                    _i = 0, TEMPLATES_1 = TEMPLATES;
                    _c.label = 2;
                case 2:
                    if (!(_i < TEMPLATES_1.length)) return [3 /*break*/, 6];
                    template = TEMPLATES_1[_i];
                    return [4 /*yield*/, prisma.emailTemplate.upsert({
                            where: { slug: template.slug },
                            update: {
                                nom: template.nom,
                                description: template.description,
                                category: template.category,
                                sujet: template.sujet,
                                corps: template.corps,
                                corpsText: template.corpsText,
                                tokens: template.tokens,
                                layoutId: layout.id,
                                status: 'PUBLISHED'
                            },
                            create: {
                                slug: template.slug,
                                nom: template.nom,
                                description: template.description,
                                category: template.category,
                                sujet: template.sujet,
                                corps: template.corps,
                                corpsText: template.corpsText,
                                tokens: template.tokens,
                                layoutId: layout.id,
                                status: 'PUBLISHED'
                            }
                        })];
                case 3:
                    created = _c.sent();
                    console.log("  \u2713 ".concat(created.slug));
                    if (!template.automation) return [3 /*break*/, 5];
                    return [4 /*yield*/, prisma.emailAutomation.upsert({
                            where: {
                                id: "automation-".concat(template.slug) // Utiliser un ID stable pour upsert
                            },
                            update: {
                                nom: template.automation.nom,
                                description: template.automation.description,
                                triggerType: template.automation.triggerType,
                                templateId: created.id,
                                delayMinutes: (_a = template.automation.delayMinutes) !== null && _a !== void 0 ? _a : 0,
                                active: true
                            },
                            create: {
                                id: "automation-".concat(template.slug),
                                nom: template.automation.nom,
                                description: template.automation.description,
                                triggerType: template.automation.triggerType,
                                templateId: created.id,
                                delayMinutes: (_b = template.automation.delayMinutes) !== null && _b !== void 0 ? _b : 0,
                                active: true
                            }
                        })];
                case 4:
                    _c.sent();
                    console.log("    \u2192 Automation: ".concat(template.automation.nom));
                    _c.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 2];
                case 6:
                    console.log('\n✅ Email templates seeding completed!');
                    console.log("   - 1 layout created");
                    console.log("   - ".concat(TEMPLATES.length, " templates created"));
                    console.log("   - ".concat(TEMPLATES.filter(function (t) { return t.automation; }).length, " automations created"));
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error('❌ Error seeding email templates:', e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
