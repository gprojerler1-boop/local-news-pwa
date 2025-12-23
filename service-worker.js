self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("news-cache").then(cache =>
      cache.addAll(["index.html","app.js","style.css"])
    )
  );
});
