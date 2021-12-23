import React, { useState } from "react";

import { Button } from "antd";
import axios from "axios";

export function TinyUpload() {
  const [file, setFile] = useState(null);

  const onFileChange = e => {
    const [file] = e.target.files;
    setFile(file);
  };

  const handleUpload = () => {
    const form = new FormData();
    form.append("file", file);

    axios.post("/api/upload", form);
  };

  return (
    <div className="tiny-upload-container">
      <input type="file" name="file" onChange={onFileChange} />
      <Button onClick={handleUpload}>上传</Button>
    </div>
  );
}
