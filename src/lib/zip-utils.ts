interface ZipEntry {
  name: string;
  data: Blob;
}

export async function createZipFromBlobs(entries: ZipEntry[]): Promise<Blob> {
  const parts: BlobPart[] = [];
  const centralDirectory: Uint8Array[] = [];
  let offset = 0;
  
  for (const entry of entries) {
    const data = new Uint8Array(await entry.data.arrayBuffer());
    const filename = new TextEncoder().encode(entry.name);
    
    const localHeader = createLocalFileHeader(filename, data.length);
    parts.push(localHeader as unknown as BlobPart);
    parts.push(data as unknown as BlobPart);
    
    const centralEntry = createCentralDirectoryEntry(filename, data.length, offset);
    centralDirectory.push(centralEntry);
    
    offset += localHeader.length + data.length;
  }
  
  const centralDirData = concatenateArrays(centralDirectory);
  parts.push(centralDirData as unknown as BlobPart);
  
  const endRecord = createEndOfCentralDirectory(entries.length, centralDirData.length, offset);
  parts.push(endRecord as unknown as BlobPart);
  
  return new Blob(parts, { type: 'application/zip' });
}

function createLocalFileHeader(filename: Uint8Array, dataSize: number): Uint8Array {
  const header = new Uint8Array(30 + filename.length);
  const view = new DataView(header.buffer);
  
  view.setUint32(0, 0x04034b50, true);  // signature
  view.setUint16(4, 20, true);           // version needed
  view.setUint16(6, 0, true);            // flags
  view.setUint16(8, 0, true);            // compression (store)
  view.setUint16(10, 0, true);           // mod time
  view.setUint16(12, 0, true);           // mod date
  view.setUint32(14, 0, true);           // crc32 (skip for simplicity)
  view.setUint32(18, dataSize, true);    // compressed size
  view.setUint32(22, dataSize, true);    // uncompressed size
  view.setUint16(26, filename.length, true); // filename length
  view.setUint16(28, 0, true);           // extra field length
  
  header.set(filename, 30);
  return header;
}

function createCentralDirectoryEntry(filename: Uint8Array, dataSize: number, offset: number): Uint8Array {
  const entry = new Uint8Array(46 + filename.length);
  const view = new DataView(entry.buffer);
  
  view.setUint32(0, 0x02014b50, true);   // signature
  view.setUint16(4, 20, true);           // version made by
  view.setUint16(6, 20, true);           // version needed
  view.setUint16(8, 0, true);            // flags
  view.setUint16(10, 0, true);           // compression
  view.setUint16(12, 0, true);           // mod time
  view.setUint16(14, 0, true);           // mod date
  view.setUint32(16, 0, true);           // crc32
  view.setUint32(20, dataSize, true);    // compressed size
  view.setUint32(24, dataSize, true);    // uncompressed size
  view.setUint16(28, filename.length, true); // filename length
  view.setUint16(30, 0, true);           // extra field length
  view.setUint16(32, 0, true);           // comment length
  view.setUint16(34, 0, true);           // disk start
  view.setUint16(36, 0, true);           // internal attr
  view.setUint32(38, 0, true);           // external attr
  view.setUint32(42, offset, true);      // offset
  
  entry.set(filename, 46);
  return entry;
}

function createEndOfCentralDirectory(numEntries: number, centralDirSize: number, centralDirOffset: number): Uint8Array {
  const record = new Uint8Array(22);
  const view = new DataView(record.buffer);
  
  view.setUint32(0, 0x06054b50, true);         // signature
  view.setUint16(4, 0, true);                  // disk number
  view.setUint16(6, 0, true);                  // disk with central dir
  view.setUint16(8, numEntries, true);         // entries on disk
  view.setUint16(10, numEntries, true);        // total entries
  view.setUint32(12, centralDirSize, true);    // central dir size
  view.setUint32(16, centralDirOffset, true);  // central dir offset
  view.setUint16(20, 0, true);                 // comment length
  
  return record;
}

function concatenateArrays(arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
