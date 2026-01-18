import * as LZStringModule from 'lz-string';

// Robustly get the LZString object regardless of how the module is bundled (ESM/CJS/Default)
const getLZ = () => {
    // @ts-ignore
    const mod = LZStringModule?.default || LZStringModule;
    return mod;
};

export const encodeCodeToUrl = (code: string): string => {
  try {
    const lz = getLZ();
    if (!lz || typeof lz.compressToEncodedURIComponent !== 'function') {
        console.warn("LZString library not fully loaded or invalid.");
        return '';
    }
    return lz.compressToEncodedURIComponent(code);
  } catch (e) {
    console.error("Error encoding URL:", e);
    return '';
  }
};

export const decodeCodeFromUrl = (hash: string): string | null => {
  try {
    const lz = getLZ();
    if (!lz || typeof lz.decompressFromEncodedURIComponent !== 'function') {
        return null;
    }
    return lz.decompressFromEncodedURIComponent(hash);
  } catch (e) {
    console.error("Failed to decode URL", e);
    return null;
  }
};