import fs from "fs";
import fsp from "fs/promises";
import path from "path";

import { IFileStorageProvider } from "./IFileStorageProvider";

// Stockage local (dev). Pour la prod, remplacer par un provider S3/GCS en implémentant la même interface.
export class LocalFileStorageProvider implements IFileStorageProvider {
  private root: string;

  constructor(rootDir?: string) {
    this.root = rootDir ?? process.env.PRIVATE_STORAGE_ROOT ?? path.join(process.cwd(), "storage");
  }

  private resolvePath(destinationPath: string) {
    // Empêche les traversals et force sous le dossier racine.
    const safePath = path.normalize(destinationPath).replace(/^(\.\.(\/|\\|$))+/, "");
    return path.join(this.root, safePath);
  }

  async saveFile(params: { buffer: Buffer; destinationPath: string }): Promise<void> {
    const target = this.resolvePath(params.destinationPath);
    await fsp.mkdir(path.dirname(target), { recursive: true });
    await fsp.writeFile(target, params.buffer);
  }

  async fileExists(params: { path: string }): Promise<boolean> {
    const target = this.resolvePath(params.path);
    try {
      await fsp.access(target, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  async getFileStream(params: { path: string }): Promise<NodeJS.ReadableStream> {
    const target = this.resolvePath(params.path);
    return fs.createReadStream(target);
  }
}
