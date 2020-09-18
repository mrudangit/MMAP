import {Component, OnInit} from '@angular/core';
import {BufferUtils} from './BufferUtils';
import {BigArray} from './BigArray';
declare var fin;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  title = 'mmap-ui';
  mmapEnabled: any;
  private buffer: SharedArrayBuffer;
  private mmap: any;
  private offset = 0;

  private indexFile: any;
  private dataFile: any;
  private metaFile: any;
  private bigArray: BigArray;
  itemIndex: number;
  private counter = 0;

  ngOnInit(): void {

    const buffer = new SharedArrayBuffer(16);
    const uint8 = new BigUint64Array(buffer);
    // @ts-ignore
    uint8[0] = 7n;

// 7 + 2 = 9
    // @ts-ignore
    console.log(Atomics.add(uint8, 0, 2n));
// expected output: 7

    // @ts-ignore
    console.log(Atomics.load(uint8, 0));
// expected output: 9


    const MappedFiles = fin && fin.experimental && fin.experimental.MappedFiles;
    if ( MappedFiles ) {
      console.log('Memory Mapped Files is Enabled!!!');
      this.mmapEnabled = true;
      const files: Array<any> = MappedFiles.getSync();
      console.log('files : ', files);
      files.forEach(value => {
        console.log('Memory Map File :', value.name(), ' File Path : ', value.path(), ' Access : ', value.access());
        if (value.name() === 'indexFile'){
          console.log('Mapping indexFile File ');
          this.indexFile = value;
        }

        if (value.name() === 'dataFle'){
          console.log('Mapping dataFle File ');
          this.dataFile = value;
        }

        if (value.name() === 'metaDataFile'){
          console.log('Mapping metaDataFile File ');
          this.metaFile = value;
        }

      });


      if( this.indexFile !== null && this.dataFile !== null && this.metaFile !== null){
        console.log('Creating BigArray');
      }

      this.bigArray = new BigArray(this.metaFile, this.indexFile, this.dataFile);


    }


  }


  increaseMmapsize($event: MouseEvent): void {


    const d = this.counter +  ' New Data : ' + Date.now();
    console.log('Data : [', d, '] Size : ', d.length);



    const arrayBuffer = BufferUtils.StringToArrayBuffer(d);
    this.bigArray.append(arrayBuffer);

    this.counter = this.counter + 1;

  }

  getIndexInfo($event: MouseEvent): void  {

    console.log('Getting Index Info For : ', this.itemIndex);
    this.bigArray.getItem(this.itemIndex);

  }
}
