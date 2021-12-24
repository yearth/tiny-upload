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

app.use(ctx => {
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
    ctx.body = {
      msg: "merge success"
    };
  }
});

app.listen(8080, () => {
  console.log("server listening on port 8080");
});
