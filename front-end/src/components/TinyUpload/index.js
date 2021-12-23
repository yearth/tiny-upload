import { Button, Progress } from "antd";
import React, { useState } from "react";

import axios from "axios";

export function TinyUpload() {
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onFileChange = e => {
    const [file] = e.target.files;
    setFile(file);
  };

  const handleUpload = () => {
    const form = new FormData();
    form.append("file", file);

    axios.post("/api/upload", form, {
      onUploadProgress: p => {
        setUploadProgress(((p.loaded / p.total) * 100) | 0);
      }
    });
  };

  return (
    <div className="tiny-upload-container">
      <input type="file" name="file" onChange={onFileChange} />
      <Button onClick={handleUpload}>上传</Button>
      <Progress percent={uploadProgress} />
    </div>
  );
}
