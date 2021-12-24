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

  const sendFileChunks = (chunks, hash) => {
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

    return Promise.all(reqs);
  };

  const mergeFileChunks = hash => {
    return axios.post("/api/merge", {
      ext: getFileExt(file.name),
      size: CHUNK_SIZE,
      hash
    });
  };

  const checkFileChunks = hash => {
    return axios.post("/api/check", {
      hash,
      ext: getFileExt(file.name)
    });
  };

  const handleUpload = async () => {
    let chunks = createFileChunks(file, CHUNK_SIZE);
    const hash = await caculateHashWorker(chunks);

    // 1. 查询后端是否存在文件
    const {
      data: { uploaded, chunks: remoteChunks = [] }
    } = await checkFileChunks(hash);

    // 2. 如果文件存在，直接提示秒传成功，终止后续操作
    if (uploaded) {
      alert("秒传成功！");
      return;
    }

    // 3. 如果文件不存在，根据 chunkList 过滤一遍 chunks，之前传过的就不传了
    chunks = chunks.filter((_, i) => !remoteChunks.includes(`${hash}-${i}`));

    console.log("chunks", chunks);

    await sendFileChunks(chunks, hash);
    await mergeFileChunks(hash);
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
