import { LocalFileStorageProvider } from "./LocalFileStorageProvider";
import { S3FileStorageProvider } from "./S3FileStorageProvider";
import { IFileStorageProvider } from "./IFileStorageProvider";

let provider: IFileStorageProvider;
let providerInitError: Error | null = null;

try {
  if (process.env.STORAGE_PROVIDER === "s3") {
    provider = new S3FileStorageProvider();
  } else {
    provider = new LocalFileStorageProvider();
  }
} catch (error: unknown) {
  providerInitError = error instanceof Error ? error : new Error(String(error));
  console.error("[fileStorage] provider initialisation failed", providerInitError);
}

function throwInitError(): never {
  throw providerInitError ?? new Error("File storage provider not initialised");
}

const fallbackProvider: IFileStorageProvider = {
  async saveFile(_params) {
    throwInitError();
  },
  async getFileStream(_params) {
    throwInitError();
  },
  async deleteFile(_params) {
    throwInitError();
  },
  async fileExists(_params) {
    throwInitError();
  }
};

export const fileStorageProvider: IFileStorageProvider = provider ?? fallbackProvider;

export function ensureFileStorageProvider() {
  if (providerInitError) throw providerInitError;
  return fileStorageProvider;
}
