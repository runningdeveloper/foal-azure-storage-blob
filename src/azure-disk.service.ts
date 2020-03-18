// std
import { Readable } from "stream";

// 3p
import { Config, generateToken } from "@foal/core";
import { AbstractDisk, FileDoesNotExist } from "@foal/storage";
import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";

/**
 * File storage to read, write and delete files in Azure Storage Blob.
 *
 * @export
 * @class AzureDisk
 * @extends {AbstractDisk}
 */
export class AzureDisk extends AbstractDisk {
  private blobServiceClient: BlobServiceClient;

  async write(
    dirname: string,
    content: Buffer | Readable,
    options: { name?: string } | { extension?: string } = {}
  ): Promise<{ path: string }> {
    let name = this.hasName(options) ? options.name : await generateToken();

    if (this.hasExtension(options)) {
      name = `${name}.${options.extension}`;
    }

    const path = `${dirname}/${name}`;

    const blockBlobClient = await (
      await this.getContainer()
    ).getBlockBlobClient(path);
    if (content instanceof Readable) {
      throw "Unkown file type";
    } else {
      await blockBlobClient.upload(content, content.length);
    }

    return { path };
  }

  async read<C extends "buffer" | "stream">(
    path: string,
    content: C
  ): Promise<{
    file: C extends "buffer" ? Buffer : C extends "stream" ? Readable : never;
    size: number;
  }> {
    console.log("doing a read!");

    try {
      const blockBlobClient = await (
        await this.getContainer()
      ).getBlockBlobClient(path);

      const downloadBlockBlobResponse = await blockBlobClient.download(0);

      if (content === "buffer") {
        return {
          file: downloadBlockBlobResponse.readableStreamBody as any,
          size: downloadBlockBlobResponse.contentLength as number
        };
      }

      // const { ContentLength }  = await this.getS3().headObject({
      //   Bucket: this.getBucket(),
      //   Key: path,
      // }).promise();

      if (downloadBlockBlobResponse.readableStreamBody) {
        const stream = downloadBlockBlobResponse.readableStreamBody
          // Do not kill the process (and crash the server) if the stream emits an error.
          // Note: users can still add other listeners to the stream to "catch" the error.
          // Note: error streams are unlikely to occur ("headObject" may have thrown these errors previously).
          // TODO: test this line.
          .on("error", () => {});

        return {
          file: stream as any,
          size: downloadBlockBlobResponse.contentLength as number
        };
      }

      throw "Cannot read file";
    } catch (error) {
      if (error.code === "NoSuchKey" || error.code === "NotFound") {
        throw new FileDoesNotExist(path);
      }
      // TODO: test this line.
      throw error;
    }
    // throw "problem"
  }

  async delete(path: string): Promise<void> {
    const blockBlobClient = await(await this.getContainer()).getBlockBlobClient(path);

    await blockBlobClient.delete();

  }

  private getContanerName(): string {
    const container = Config.get<string>("settings.disk.azure.container", "");
    if (!container) {
      throw new Error(
        "[CONFIG] You must provide a container name with the configuration key settings.disk.azure.container."
      );
    }
    return container;
  }

  // const blobServiceClient = await BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);

  async getBlobServiceClient(): Promise<BlobServiceClient> {
    if (!this.blobServiceClient) {
      this.blobServiceClient = await BlobServiceClient.fromConnectionString(
        Config.get<string>("settings.disk.azure.connectionString")
      );
    }
    return this.blobServiceClient;
  }

  private async getContainer(): Promise<ContainerClient> {
    const blobServiceClient = await this.getBlobServiceClient();
    const containerClient = await blobServiceClient.getContainerClient(
      this.getContanerName()
    );
    if (!containerClient.exists()) {
      await containerClient.create();
    }
    return containerClient;
  }
}
