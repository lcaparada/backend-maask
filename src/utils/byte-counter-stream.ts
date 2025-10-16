import { Transform } from "stream";

export class ByteCounterStream extends Transform {
  private bytesWritten = 0;

  _transform(chunk: any, encoding: string, callback: Function) {
    this.bytesWritten += chunk.length;
    this.push(chunk);
    callback();
  }

  getBytesWritten(): number {
    return this.bytesWritten;
  }

  // Alias para compatibilidade
  get byteCount(): number {
    return this.bytesWritten;
  }
}
