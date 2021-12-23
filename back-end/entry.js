const Koa = require("koa");

const app = new Koa();

app.use(() => {
  const { url, query } = ctx.request;

  if (url === "/") {
    ctx.body = "hello world";
  }
});

app.listen(8080, () => {
  console.log("server listening on port 8080");
});
