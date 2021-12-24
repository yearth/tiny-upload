export const toPercentage = raw => {
  const num = Number(raw);
  if (!isNaN(num)) {
    return num.toFixed(2);
  }
};

export const getFileExt = filename => {
  return filename.split(".").pop();
};
