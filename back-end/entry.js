const Koa = require("koa");
const koaBody = require("koa-body");
const fsEx = require("fs-extra");
const path = require("path");

const app = new Koa();

const UPLOAD_DIR = path.resolve(__dirname, "static");

app.use(
  koaBody({
    multipart: true
  })
);

app.use(async ctx => {
  const { url, query } = ctx.request;

  if (url === "/upload") {
    const { file } = ctx.request.files;
    const { name } = ctx.request.body;
    const hash = name.split("-")[0];
    const chunksDir = path.resolve(UPLOAD_DIR, hash);

    if (!fsEx.existsSync(chunksDir)) {
      fsEx.mkdirSync(chunksDir);
    }

    const cachePath = file.path;
    const targetPath = path.resolve(UPLOAD_DIR, `${hash}/${name}`);

    fsEx.move(cachePath, targetPath);

    ctx.body = {
      msg: "success"
    };
  } else if (url === "/merge") {
    const { ext, hash, size } = ctx.request.body;
    const targetPath = path.resolve(UPLOAD_DIR, `${hash}.${ext}`);

    // 1. 把 chunks 读出来，并且按照 idx 排序
    const chunksDir = path.resolve(UPLOAD_DIR, hash);
    let chunks = await fsEx.readdir(chunksDir);
    chunks = chunks
      .sort((a, b) => a.split("-")[1] - b.split("-")[1])
      .map(c => path.resolve(chunksDir, c));

    // 2. 通过 stream 把 chunks merge 成一个完整的文件
    const pipStream = (file, writeStream) => {
      return new Promise(resolve => {
        const readStream = fsEx.createReadStream(file);
        readStream.on("end", () => {
          // 读完删掉碎片
          fsEx.unlinkSync(file);
          resolve();
        });
        // 一边读一边写
        readStream.pipe(writeStream);
      });
    };

    const pips = chunks.map((c, i) => {
      pipStream(
        c,
        fsEx.createWriteStream(targetPath, {
          start: i * size,
          end: (i + 1) * size
        })
      );
    });

    await Promise.all(pips);

    // 3. 删掉 chunk 目录
    fsEx.rmdir(chunksDir);

    ctx.body = {
      msg: "merge success"
    };
  } else if (url === "/check") {
    const { hash, ext } = ctx.request.body;
    const targetPath = path.resolve(UPLOAD_DIR, `${hash}.${ext}`);

    // 1. 如果文件存在，直接告诉前端，loaded
    let uploaded = false;
    if (fsEx.existsSync(targetPath)) {
      uploaded = true;
    }

    // 2. 如果 chunksDir 存在则去读取 chunks
    const chunksDir = path.resolve(UPLOAD_DIR, hash);
    const chunks = fsEx.existsSync(chunksDir)
      ? // 读取 chunks，并且过滤隐藏文件
        fsEx.readdirSync(chunksDir).filter(v => v[0] !== ".")
      : [];

    ctx.body = {
      uploaded,
      chunks
    };
  }
});

app.listen(8080, () => {
  console.log("server listening on port 8080");
});
