async function handleRequest(request) {
  const parsedUrl = new URL(request.url);
  let path = parsedUrl.pathname;

  let lastSegment = path.substring(path.lastIndexOf("/"));
  if (lastSegment.indexOf(".") === -1) {
    path = "index.html";
  }

  const key = path.replace("/", "");
  const contentTypes = {
    js: "text/javascript",
    html: "text/html"
  };
  const type = contentTypes[key.split(".").pop()];
  const src = await bucket.get(key);

  return new Response(src, { headers: { "Content-Type": type } });
}

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});
