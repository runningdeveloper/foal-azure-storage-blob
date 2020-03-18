// std
import { strictEqual } from "assert";
import { Readable } from "stream";

// 3p
import { Config, createService } from "@foal/core";
import { FileDoesNotExist } from "@foal/storage";
import { BlobServiceClient } from "@azure/storage-blob";

// FoalTS
import { AzureDisk } from "./azure-disk.service";

// Isolate each job with a different azure container.
const containerName = `foal-test-${process.env.NODE_VERSION || 8}`;

describe("AzureDisk", () => {
  let disk: AzureDisk;
  let blobServiceClient: BlobServiceClient;

  beforeEach(() => {
    disk = createService(AzureDisk);
  });

  it("Should have tests", () => {
    strictEqual(false, true);
  });
});
