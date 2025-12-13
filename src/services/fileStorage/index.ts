import { LocalFileStorageProvider } from "./LocalFileStorageProvider";

// Provider par défaut. TODO: le rendre configurable (S3, GCS...) via env.
export const fileStorageProvider = new LocalFileStorageProvider();
