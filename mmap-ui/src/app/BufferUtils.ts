export class BufferUtils{

  public static arrayBufferToString(buffer: ArrayBuffer, offset: number, size: number): string {
    const uint8array = new Uint8Array(buffer, offset, size);
    return String.fromCharCode.apply(null, uint8array);

  }


  public static StringToArrayBuffer(str: string): ArrayBuffer {
    const buffer = new ArrayBuffer(str.length);
    const bufferView = new Uint8Array(buffer);
    for (let i = 0; i < str.length; i++){
      bufferView[i] = str.charCodeAt(i);
    }

    return buffer;
  }

}
