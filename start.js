document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("app-search");
  const goBtn = document.getElementById("search-go-btn");
  const iframe = document.getElementById("browser-view");

  const backBtn = document.getElementById("back-btn");
  const forwardBtn = document.getElementById("forward-btn");

  const resultsBox = document.getElementById("search-results");

  let history = [];
  let index = -1;

  const MEILI_URL = "http://127.0.0.1:7700";
  const INDEX = "apps";

  function isUrl(text) {
    return /^https?:\/\//i.test(text) || /^[^\s]+\.[^\s]+$/.test(text);
  }

  function fixUrl(url) {
    return /^https?:\/\//i.test(url) ? url : "https://" + url;
  }

  function loadPage(url, save = true) {
    iframe.style.display = "block";
    resultsBox.innerHTML = "";
    iframe.src = url;

    if (save) {
      history = history.slice(0, index + 1);
      history.push(url);
      index++;
    }
  }

  async function search(query) {
    iframe.style.display = "none";
    resultsBox.innerHTML = "<p>Searching...</p>";

    try {
      const res = await fetch(
        `${MEILI_URL}/indexes/${INDEX}/search`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            q: query
          })
        }
      );

      const data = await res.json();

      resultsBox.innerHTML = "";

      if (!data.hits || data.hits.length === 0) {
        resultsBox.innerHTML = "<p>No results found.</p>";
        return;
      }

      data.hits.forEach(item => {
        const div = document.createElement("div");
        div.className = "search-result";

        div.innerHTML = `
          <h3>
            <a href="${item.url}">
              ${item.title}
            </a>
          </h3>
        `;

        div.addEventListener("click", (e) => {
          e.preventDefault();
          loadPage(item.url);
        });

        resultsBox.appendChild(div);
      });

    } catch (err) {
      console.error(err);
      resultsBox.innerHTML = "<p>Meilisearch not running.</p>";
    }
  }

  function run() {
    let q = input.value.trim();
    if (!q) return;

    if (isUrl(q)) {
      loadPage(fixUrl(q));
    } else {
      search(q);
    }
  }

  // ======================
  // YOUR BUTTONS (UNCHANGED)
  // ======================

  goBtn.addEventListener("click", run);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") run();
  });

  backBtn.addEventListener("click", () => {
    if (index > 0) {
      index--;
      loadPage(history[index], false);
    }
  });

  forwardBtn.addEventListener("click", () => {
    if (index < history.length - 1) {
      index++;
      loadPage(history[index], false);
    }
  });
});