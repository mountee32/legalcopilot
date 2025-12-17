import { describe, it, expect, vi, beforeEach } from "vitest";
import { PassThrough } from "stream";

const mockClient = {
  bucketExists: vi.fn(),
  makeBucket: vi.fn(),
  setBucketPolicy: vi.fn(),
  putObject: vi.fn(),
  presignedGetObject: vi.fn(),
  presignedPutObject: vi.fn(),
  removeObject: vi.fn(),
  getObject: vi.fn(),
};

vi.mock("minio", () => ({
  Client: vi.fn(() => mockClient),
}));

function setMinioEnv() {
  process.env.MINIO_ENDPOINT = "localhost";
  process.env.MINIO_PORT = "9000";
  process.env.MINIO_USE_SSL = "false";
  process.env.MINIO_ROOT_USER = "minioadmin";
  process.env.MINIO_ROOT_PASSWORD = "minioadmin";
}

describe("lib/storage/minio", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    setMinioEnv();
  });

  it("initializes bucket when missing", async () => {
    mockClient.bucketExists.mockResolvedValueOnce(false);

    const { initializeBucket } = await import("@/lib/storage/minio");
    await initializeBucket("uploads");

    expect(mockClient.bucketExists).toHaveBeenCalledWith("uploads");
    expect(mockClient.makeBucket).toHaveBeenCalledWith("uploads", "us-east-1");
    expect(mockClient.setBucketPolicy).toHaveBeenCalled();
  });

  it("does not recreate bucket when it exists", async () => {
    mockClient.bucketExists.mockResolvedValueOnce(true);

    const { initializeBucket } = await import("@/lib/storage/minio");
    await initializeBucket("uploads");

    expect(mockClient.makeBucket).not.toHaveBeenCalled();
    expect(mockClient.setBucketPolicy).not.toHaveBeenCalled();
  });

  it("uploads file and returns URL", async () => {
    const { uploadFile } = await import("@/lib/storage/minio");
    const result = await uploadFile("uploads", "file.txt", Buffer.from("hello"), "text/plain");

    expect(mockClient.putObject).toHaveBeenCalledWith(
      "uploads",
      "file.txt",
      expect.any(Buffer),
      5,
      { "Content-Type": "text/plain" }
    );
    expect(result.url).toContain("/uploads/file.txt");
  });

  it("downloads file content as Buffer", async () => {
    const stream = new PassThrough();
    mockClient.getObject.mockResolvedValueOnce(stream);

    const { downloadFile } = await import("@/lib/storage/minio");
    const promise = downloadFile("uploads", "file.txt");

    stream.write("a");
    stream.write("b");
    stream.end("c");

    const buf = await promise;
    expect(buf.toString("utf8")).toBe("abc");
  });

  it("generates presigned download URL", async () => {
    mockClient.presignedGetObject.mockResolvedValueOnce("http://signed");

    const { getPresignedUrl } = await import("@/lib/storage/minio");
    const url = await getPresignedUrl("uploads", "file.txt", 60);

    expect(mockClient.presignedGetObject).toHaveBeenCalledWith("uploads", "file.txt", 60);
    expect(url).toBe("http://signed");
  });

  it("generates presigned upload URL", async () => {
    mockClient.presignedPutObject.mockResolvedValueOnce("http://signed-put");

    const { getPresignedUploadUrl } = await import("@/lib/storage/minio");
    const url = await getPresignedUploadUrl("uploads", "file.txt", 60);

    expect(mockClient.presignedPutObject).toHaveBeenCalledWith("uploads", "file.txt", 60);
    expect(url).toBe("http://signed-put");
  });
});
