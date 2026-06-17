export interface IFileStorageProvider {
  saveFile(params: { buffer: Buffer; destinationPath: string }): Promise<void>;
  getFileStream(params: { path: string }): Promise<NodeJS.ReadableStream>;
  fileExists(params: { path: string }): Promise<boolean>;
  deleteFile(params: { path: string }): Promise<void>;
}
