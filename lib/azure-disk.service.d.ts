/// <reference types="node" />
import { Readable } from "stream";
import { AbstractDisk } from "@foal/storage";
import { BlobServiceClient } from "@azure/storage-blob";
/**
 * File storage to read, write and delete files in Azure Storage Blob.
 *
 * @export
 * @class AzureDisk
 * @extends {AbstractDisk}
 */
export declare class AzureDisk extends AbstractDisk {
    private blobServiceClient;
    write(dirname: string, content: Buffer | Readable, options?: {
        name?: string;
    } | {
        extension?: string;
    }): Promise<{
        path: string;
    }>;
    read<C extends "buffer" | "stream">(path: string, content: C): Promise<{
        file: C extends "buffer" ? Buffer : C extends "stream" ? Readable : never;
        size: number;
    }>;
    delete(path: string): Promise<void>;
    private getContanerName;
    getBlobServiceClient(): Promise<BlobServiceClient>;
    private getContainer;
}
