import LZString from 'lz-string';

export const encodeCodeToUrl = (code: string): string => {
  return LZString.compressToEncodedURIComponent(code);
};

export const decodeCodeFromUrl = (hash: string): string | null => {
  try {
    return LZString.decompressFromEncodedURIComponent(hash);
  } catch (e) {
    console.error("Failed to decode URL", e);
    return null;
  }
};