"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// std
const stream_1 = require("stream");
// 3p
const core_1 = require("@foal/core");
const storage_1 = require("@foal/storage");
const storage_blob_1 = require("@azure/storage-blob");
/**
 * File storage to read, write and delete files in Azure Storage Blob.
 *
 * @export
 * @class AzureDisk
 * @extends {AbstractDisk}
 */
class AzureDisk extends storage_1.AbstractDisk {
    async write(dirname, content, options = {}) {
        let name = this.hasName(options) ? options.name : await core_1.generateToken();
        if (this.hasExtension(options)) {
            name = `${name}.${options.extension}`;
        }
        const path = `${dirname}/${name}`;
        const blockBlobClient = await (await this.getContainer()).getBlockBlobClient(path);
        if (content instanceof stream_1.Readable) {
            throw "Unkown file type";
        }
        else {
            await blockBlobClient.upload(content, content.length);
        }
        return { path };
    }
    async read(path, content) {
        console.log("doing a read!");
        try {
            const blockBlobClient = await (await this.getContainer()).getBlockBlobClient(path);
            const downloadBlockBlobResponse = await blockBlobClient.download(0);
            if (content === "buffer") {
                return {
                    file: downloadBlockBlobResponse.readableStreamBody,
                    size: downloadBlockBlobResponse.contentLength
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
                    .on("error", () => { });
                return {
                    file: stream,
                    size: downloadBlockBlobResponse.contentLength
                };
            }
            throw "Cannot read file";
        }
        catch (error) {
            if (error.code === "NoSuchKey" || error.code === "NotFound") {
                throw new storage_1.FileDoesNotExist(path);
            }
            // TODO: test this line.
            throw error;
        }
        // throw "problem"
    }
    async delete(path) {
        const blockBlobClient = await (await this.getContainer()).getBlockBlobClient(path);
        await blockBlobClient.delete();
    }
    getContanerName() {
        const container = core_1.Config.get("settings.disk.azure.container", "");
        if (!container) {
            throw new Error("[CONFIG] You must provide a container name with the configuration key settings.disk.azure.container.");
        }
        return container;
    }
    // const blobServiceClient = await BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    async getBlobServiceClient() {
        if (!this.blobServiceClient) {
            this.blobServiceClient = await storage_blob_1.BlobServiceClient.fromConnectionString(core_1.Config.get("settings.disk.azure.connectionString"));
        }
        return this.blobServiceClient;
    }
    async getContainer() {
        const blobServiceClient = await this.getBlobServiceClient();
        const containerClient = await blobServiceClient.getContainerClient(this.getContanerName());
        if (!containerClient.exists()) {
            await containerClient.create();
        }
        return containerClient;
    }
}
exports.AzureDisk = AzureDisk;
