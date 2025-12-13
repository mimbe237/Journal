import { LocalFileStorageProvider } from "./LocalFileStorageProvider";
import { S3FileStorageProvider } from "./S3FileStorageProvider";
import { IFileStorageProvider } from "./IFileStorageProvider";

let provider: IFileStorageProvider;

if (process.env.STORAGE_PROVIDER === "s3") {
  provider = new S3FileStorageProvider();
} else {
  provider = new LocalFileStorageProvider();
}

export const fileStorageProvider = provider;
