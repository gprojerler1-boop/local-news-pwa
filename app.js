const keywords = [
  "تل الهوا","تل الهوى","حي الرمال","الشيخ عجلين","ميناء غزة"
];

async function loadNews() {
  document.getElementById("news").innerHTML = "جاري التحميل...";

  // مثال تجريبي (ستربطه لاحقًا بالمصادر)
  const demoNews = [
    {
      title: "قصف في حي الرمال الجنوبي",
      text: "أفادت مصادر محلية بوقوع قصف في حي الرمال الجنوبي",
      time: new Date()
    }
  ];

  const filtered = demoNews.filter(n =>
    keywords.some(k => n.text.includes(k))
  );

  renderNews(filtered);
}

function renderNews(items) {
  const box = document.getElementById("news");
  box.innerHTML = "";
  items.forEach(n => {
   const div = document.createElement("div");
div.className = "news-item";

    div.innerHTML = `
      <h3>${n.title}</h3>
      <p>${n.text}</p>
      <button onclick="share('${n.title}')">مشاركة</button>
      <hr/>
    `;
    box.appendChild(div);
  });
}

function share(text) {
  navigator.share({ text });
}

