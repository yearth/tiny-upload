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
    const filename = file.name;
    const cachePath = file.path;
    const targetPath = `${UPLOAD_DIR}/${filename}`;

    fsEx.move(cachePath, targetPath);
  }
});

app.listen(8080, () => {
  console.log("server listening on port 8080");
});
