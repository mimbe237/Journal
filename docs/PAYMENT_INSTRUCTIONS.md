# 💳 Informations de Paiement Manuel

> Ce document contient les informations bancaires et Mobile Money à afficher aux utilisateurs lors d'une soumission de paiement manuel.

---

## 🏦 Coordonnées Bancaires (Virement)

### Compte Principal - XAF (FCFA)

| Information | Valeur |
|------------|--------|
| **Banque** | [NOM DE LA BANQUE] |
| **Titulaire** | [NOM SOCIÉTÉ] |
| **IBAN / RIB** | [NUMÉRO RIB COMPLET] |
| **Code SWIFT/BIC** | [CODE SWIFT] |
| **Agence** | [NOM AGENCE] |

### Compte EUR (Zone Euro)

| Information | Valeur |
|------------|--------|
| **Banque** | [NOM DE LA BANQUE EUR] |
| **Titulaire** | [NOM SOCIÉTÉ] |
| **IBAN** | [IBAN] |
| **Code BIC** | [CODE BIC] |

---

## 📱 Mobile Money

### Orange Money Cameroun

| Information | Valeur |
|------------|--------|
| **Numéro** | `+237 6XX XXX XXX` |
| **Nom du compte** | [NOM TITULAIRE] |
| **Référence à mentionner** | `JOURNAL-[VOTRE_EMAIL]` |

### MTN Mobile Money Cameroun

| Information | Valeur |
|------------|--------|
| **Numéro** | `+237 6XX XXX XXX` |
| **Nom du compte** | [NOM TITULAIRE] |
| **Référence à mentionner** | `JOURNAL-[VOTRE_EMAIL]` |

---

## 📋 Instructions pour les utilisateurs

### Étapes du paiement manuel :

1. **Effectuez le paiement** via l'une des méthodes ci-dessus
2. **Mentionnez en référence** : `JOURNAL-[votre email]`
3. **Conservez la preuve** de paiement (capture d'écran, reçu)
4. **Soumettez** la preuve sur la plateforme
5. **Attendez la validation** (24-48h ouvrées)

### Informations à inclure dans la preuve :
- Date et heure du paiement
- Montant exact
- Référence de transaction
- Nom de l'émetteur

---

## ⚠️ Important

- Les paiements sont vérifiés sous **24 à 48 heures ouvrées**
- Le montant doit correspondre **exactement** au tarif de l'abonnement choisi
- La preuve de paiement doit être **lisible et complète**
- En cas de problème, contactez le support : **support@journal.com**

---

## 🔧 Intégration dans l'application

Ces informations doivent être affichées sur :
- `/subscriptions/manual` - Page de soumission manuelle
- Email de confirmation `manual-submission-received`

### Variables d'environnement à configurer :

```env
# Coordonnées bancaires
PAYMENT_BANK_NAME="Nom de la banque"
PAYMENT_BANK_ACCOUNT_NAME="Nom du titulaire"
PAYMENT_BANK_RIB="XXXXXXXXXXXXXXXXXXXXXX"
PAYMENT_BANK_SWIFT="XXXXXXXX"

# Mobile Money
PAYMENT_ORANGE_MONEY_NUMBER="+237XXXXXXXXX"
PAYMENT_MTN_MOMO_NUMBER="+237XXXXXXXXX"
PAYMENT_MOBILE_ACCOUNT_NAME="Nom du titulaire"

# Contact
SUPPORT_EMAIL="support@journal.com"
```

---

*À configurer avec les vraies informations avant mise en production.*
