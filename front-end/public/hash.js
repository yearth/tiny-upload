self.importScripts("spark-md5.min.js");

self.onmessage = e => {
  const { chunks } = e.data;

  const spark = new self.SparkMD5.ArrayBuffer();

  let progress = 0;
  let count = 0;

  const loadNext = index => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(chunks[index].file);

    reader.onload = e => {
      count++;

      spark.append(e.target.result);
      if (count === chunks.length) {
        self.postMessage({
          hash: spark.end(),
          progress: 100
        });
      } else {
        progress += 100 / chunks.length;
        self.postMessage({
          progress
        });
        loadNext(count);
      }
    };
  };
  loadNext(0);
};
