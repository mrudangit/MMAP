import {BufferUtils} from './BufferUtils';

declare var fin;

export class BigArray{




  protected arrayHeadIndex: bigint;
  protected arrayTailIndex: bigint;

  // @ts-ignore
  protected dataOffSet: bigint = 0n;

  protected readonly INDEX_FILE_SIZE = 1024 * 1024 * 32; // 32MB
  protected readonly DATA_FILE_SIZE = 1024 * 1024 * 256; // 256MB

  private metaDataBuffer: SharedArrayBuffer;
  private indexBuffer: SharedArrayBuffer;
  private dataBuffer: SharedArrayBuffer;


  private metaDataBufferView: BigUint64Array;

  private indexBufferArray: BigUint64Array ;
  private dataBufferView: Uint8Array;
  private indexBufferView: DataView;

  public constructor(private metaDataMemoryMap: any, private indexMemoryMap: any, private dataMemoryMap: any) {

    this.indexBuffer = indexMemoryMap.map(0, this.INDEX_FILE_SIZE);
    this.dataBuffer = dataMemoryMap.map(0, this.DATA_FILE_SIZE);
    this.metaDataBuffer = metaDataMemoryMap.map(0, 16);

    this.indexBufferArray = new BigUint64Array(this.indexBuffer);

    this.indexBufferView = new DataView(this.indexBuffer);

    this.dataBufferView = new Uint8Array(this.dataBuffer);
    this.metaDataBufferView = new BigUint64Array(this.metaDataBuffer);
    // @ts-ignore
    this.arrayHeadIndex = Atomics.load(this.metaDataBufferView, 0);
    // @ts-ignore
    this.arrayTailIndex = Atomics.load(this.metaDataBufferView, 1);

    console.log('Head Index : ', this.arrayHeadIndex);
    console.log('Tail Index : ', this.arrayTailIndex);

    this.getDataOffSet();

    console.log('Array Head Index : ', this.arrayHeadIndex);
    console.log('Array Tail Index : ', this.arrayTailIndex);

  }

  private getDataOffSet(): void {
    const localIndex = Number(this.arrayHeadIndex) * 3;
    // @ts-ignore
    // Atomics.load(this.indexBufferArray, localIndex);

   //  this.dataOffSet = this.indexBufferArray[localIndex];

    try {
      // @ts-ignore
      this.dataOffSet = Atomics.load(this.indexBufferArray, localIndex);

      console.log('Data Index : ', this.dataOffSet);
    }catch (e){
      console.log('Error Loading dataOffset : ', e);
    }


  }

  public append(data: ArrayBuffer): number {

    this.getDataOffSet();
    const localBuffer = new Uint8Array(data);
    const index = this.arrayHeadIndex;

    for ( let i = 0; i < data.byteLength; i++){
      this.dataBufferView[ Number(this.dataOffSet) + i] = localBuffer[i];
    }





    this.updateIndex(this.dataOffSet, data.byteLength);
    this.dataOffSet = this.dataOffSet + BigInt(data.byteLength);
    console.log('New Data OffSet : ', this.dataOffSet);


    // @ts-ignore
    Atomics.store(this.metaDataBufferView, 0, this.arrayHeadIndex);
    // this.arrayHeadIndex = this.arrayHeadIndex + 1n;
    // this.metaDataBufferView[0] = this.arrayHeadIndex;
    console.log('Data Was Written at Index : ', index);
    console.log('Nex Array Head Index : ', this.arrayHeadIndex);

    return Number(index);


  }

  protected updateIndex(dataOffset: bigint, dataLength: number): void {


    const localIndex = Number(this.arrayHeadIndex) * 3;
    // @ts-ignore
    const v = Atomics.store(this.indexBufferArray, localIndex, dataOffset);
    // this.indexBufferArray[localIndex] = dataOffset;

    // @ts-ignore
    Atomics.store(this.indexBufferArray, localIndex + 1, BigInt(dataLength));

    // this.indexBufferArray[localIndex + 1n] = BigInt(dataLength);


    // @ts-ignore
    Atomics.store(this.indexBufferArray, localIndex + 2, BigInt(Date.now()));

    // this.indexBufferArray[localIndex + 2n] = BigInt(Date.now());

    // @ts-ignore
    this.arrayHeadIndex = Atomics.load(this.metaDataBufferView, 0) + 1n ;

  }


  public getItem(index: number): void {
    const localIndex = index ;
    // @ts-ignore
    const dataOffset = Atomics.load(this.indexBufferArray, localIndex);
    // @ts-ignore
    const dataLength = Atomics.load(this.indexBufferArray, localIndex + 1);
    // @ts-ignore
    const timeStamp = Atomics.load(this.indexBufferArray, localIndex + 2);





    console.log('Data Offset : ', dataOffset, ' Data length ', dataLength, ' Time Stamp : ', timeStamp);


    const data = BufferUtils.arrayBufferToString(this.dataBuffer, Number(dataOffset), Number(dataLength) );

    console.log('Data At Index : ', index, ' Value : [', data, ']');


  }



}
