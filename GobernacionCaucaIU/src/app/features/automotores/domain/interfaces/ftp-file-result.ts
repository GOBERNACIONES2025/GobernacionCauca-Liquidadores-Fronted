export interface FtpFileResult {
    fileId: string | null;
    fileName: string;
    originalFileName: string;
    remoteDirectory: string;
    remoteFullPath: string;
    extension: string;
    contentType: string | null;
    sizeBytes: number;
    contentBytes: number[] | null;
    contentStream: unknown | null;
    createdAtUtc: string;
    modifiedAtUtc: string | null;
    success: boolean;
    errorMessage: string | null;
}