-- Ajoute la colonne de modèle de titre pour les types de journaux
ALTER TABLE "journal_types"
ADD COLUMN IF NOT EXISTS "titleTemplate" VARCHAR(255);

-- Renseigne une valeur par défaut pour éviter les valeurs nulles existantes
UPDATE "journal_types"
SET "titleTemplate" = 'Edition du {{date_long}}'
WHERE "titleTemplate" IS NULL;
