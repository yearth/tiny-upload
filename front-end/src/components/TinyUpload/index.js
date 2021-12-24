import { Button, Progress } from "antd";
import React, { useState } from "react";
import { getFileExt, toPercentage } from "../../utils";

import { CHUNK_SIZE } from "../../global";
import axios from "axios";

export function TinyUpload() {
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [hashProgress, setHashProgress] = useState(0);

  const onFileChange = e => {
    const [file] = e.target.files;
    setFile(file);
  };

  const caculateHashWorker = chunks => {
    return new Promise(resolve => {
      const worker = new Worker("/hash.js");
      worker.postMessage({
        chunks
      });

      worker.onmessage = e => {
        const { progress, hash } = e.data;

        setHashProgress(toPercentage(progress));

        if (hash) {
          resolve(hash);
        }
      };
    });
  };

  /**
   * @description 切割文件，分片大小默认为 1M
   * @param {*} file
   * @param {*} size
   * @returns
   */
  const createFileChunks = (file, size = 1 * 1024 * 1024) => {
    const chunks = [];
    let cur = 0;

    while (cur < file.size) {
      chunks.push({
        index: cur,
        file: file.slice(cur, cur + size)
      });
      cur += size;
    }

    return chunks;
  };

  const handleUpload = async () => {
    const chunks = createFileChunks(file, CHUNK_SIZE);
    const hash = await caculateHashWorker(chunks);
    const reqs = chunks
      .map((c, i) => ({
        name: `${hash}-${i}`,
        file: c.file
      }))
      .map(({ name, file }) => {
        const form = new FormData();

        form.append("name", name);
        form.append("file", file);

        axios.post("/api/upload", form);
      });

    await Promise.all(reqs);

    axios.post("/api/merge", {
      ext: getFileExt(file.name),
      size: CHUNK_SIZE
    });
  };

  return (
    <div className="tiny-upload-container">
      <input type="file" name="file" onChange={onFileChange} />
      <Button onClick={handleUpload}>上传</Button>
      <br />
      hash: <Progress percent={hashProgress} />
      upload: <Progress percent={uploadProgress} />
    </div>
  );
}
