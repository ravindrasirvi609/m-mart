import { SecurityError } from "@/lib/security/errors";

type ValidateImageFileOptions = {
  maxBytes: number;
  allowedMimeTypes: Set<string>;
};

function isPng(bytes: Uint8Array) {
  return (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  );
}

function isJpeg(bytes: Uint8Array) {
  return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

function isWebp(bytes: Uint8Array) {
  if (bytes.length < 12) {
    return false;
  }

  const riff = String.fromCharCode(...bytes.slice(0, 4));
  const webp = String.fromCharCode(...bytes.slice(8, 12));
  return riff === "RIFF" && webp === "WEBP";
}

function matchesMimeSignature(mimeType: string, bytes: Uint8Array) {
  switch (mimeType) {
    case "image/png":
      return isPng(bytes);
    case "image/jpeg":
    case "image/jpg":
      return isJpeg(bytes);
    case "image/webp":
      return isWebp(bytes);
    default:
      return false;
  }
}

export async function validateImageFile(file: File, options: ValidateImageFileOptions) {
  if (!options.allowedMimeTypes.has(file.type)) {
    throw new SecurityError("Unsupported image format.");
  }

  if (file.size > options.maxBytes) {
    throw new SecurityError(`Image must be smaller than ${Math.ceil(options.maxBytes / (1024 * 1024))}MB.`);
  }

  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (!matchesMimeSignature(file.type, bytes)) {
    throw new SecurityError("Uploaded image content does not match the declared file type.");
  }
}
