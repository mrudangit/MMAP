package com.wellsfargo.mmapreader;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.nio.ByteOrder;
import java.nio.CharBuffer;
import java.nio.MappedByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.time.Duration;
import java.util.Date;
import java.util.EnumSet;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class MemoryMapQueueReader {

    private Logger logger = LoggerFactory.getLogger(this.getClass().getName());


    private AtomicLong tailIndex = new AtomicLong(0);
    private AtomicLong headIndex  = new AtomicLong(0);


    @Value("${metaDataFileName}")
    private String metaDataFileName;

    @Value("${indexFileName}")
    private String indexFileName;

    @Value("${dataFileName}")
    private String dataFileName;


    private MappedByteBuffer metaDataByteBuffer;
    private MappedByteBuffer indexByteBuffer;
    private MappedByteBuffer dataByteBuffer;

    protected long INDEX_FILE_SIZE = 1024 * 1024 * 32; // 32MB
    protected long DATA_FILE_SIZE = 1024 * 1024 * 256; // 256MB

    @PostConstruct
    protected void Init() throws IOException {
        logger.info("Starting to Read Memory Map File");

        Path metaDataPath = Paths.get(metaDataFileName);
        Path indexPath = Paths.get(indexFileName);
        Path dataPath = Paths.get(dataFileName);

        FileChannel metaDataFileChannel = (FileChannel) Files.newByteChannel(metaDataPath, EnumSet.of(StandardOpenOption.READ, StandardOpenOption.WRITE));
        metaDataByteBuffer = metaDataFileChannel.map(FileChannel.MapMode.READ_WRITE, 0, 16);
        metaDataByteBuffer.order(ByteOrder.LITTLE_ENDIAN);

        FileChannel indexFileChannel = (FileChannel) Files.newByteChannel(indexPath, EnumSet.of(StandardOpenOption.READ));

        indexByteBuffer = indexFileChannel.map(FileChannel.MapMode.READ_ONLY, 0, INDEX_FILE_SIZE);
        indexByteBuffer.order(ByteOrder.LITTLE_ENDIAN);

        FileChannel dataFileChannel = (FileChannel) Files.newByteChannel(dataPath, EnumSet.of(StandardOpenOption.READ));
        dataByteBuffer = dataFileChannel.map(FileChannel.MapMode.READ_ONLY, 0, DATA_FILE_SIZE);
        dataByteBuffer.order(ByteOrder.LITTLE_ENDIAN);


        Flux<Long> interval = Flux.interval(Duration.ofSeconds(1));
        interval.subscribe(aLong -> {
           this.readMetaData();
        });


    }

    private void readMetaData() {

        long headIndex = this.metaDataByteBuffer.getLong(0);
        long tailIndex = this.metaDataByteBuffer.getLong(8);
        this.tailIndex.set(tailIndex);

        if(tailIndex < headIndex){
            logger.info("Head  Index = {}", headIndex);
            logger.info("Tail  Index = {}", tailIndex);



           indexByteBuffer.position(((int) (tailIndex)*24));

            long dataOffSet = indexByteBuffer.getLong();
            long dataLength = indexByteBuffer.getLong();
            long timeStamp = indexByteBuffer.getLong();


            logger.info("Data OffSet : {} Data Length = {} TimeStamp : [{}] ", dataOffSet, dataLength, timeStamp);
            this.readData(tailIndex,dataOffSet,dataLength);

            tailIndex = tailIndex +1;
            metaDataByteBuffer.position(0);
            metaDataByteBuffer.putLong(8, tailIndex);
            logger.info("Head  Index = {}", headIndex);
            logger.info("Tail  Index = {}", tailIndex);
        }






    }

    private void readData(long index, long dataOffset, long dataLength){

        logger.info("Reading Data at Index : {}  ", index);;
        byte bytes[] = new byte[(int) dataLength];
        dataByteBuffer.position((int) dataOffset);

        dataByteBuffer.get(bytes,0, (int)dataLength);

        String s = new String(bytes);
        logger.info("Data At Index : {} : [{}]", index, s);


    }

}
