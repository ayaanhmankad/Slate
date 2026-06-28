document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("app-search");
  const goButton = document.getElementById("search-go-btn");

  // Function to process and launch the URL or search string
  function processSearch() {
    let query = searchInput.value.trim();
    if (!query) return; // Do nothing if empty

    // Check if the text contains a standard domain suffix indicating a web address
    const isUrl = query.includes('.') && !query.includes(' ');

    if (isUrl) {
      // If they forgot http:// or https://, add it automatically
      if (!query.startsWith('http://') && !query.startsWith('https://')) {
        query = 'https://' + query;
      }
      // Redirect the current window to the typed live website
      window.location.href = query;
    } else {
      // If it is regular text, look it up securely on Kiddle
      const searchUrl = `https://kiddle.co{encodeURIComponent(query)}`;
      window.location.href = searchUrl;
    }
  }

  // Trigger search when the "Go" button is clicked
  goButton.addEventListener("click", processSearch);

  // Trigger search instantly if they hit the "Enter" key on their keyboard
  searchInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      processSearch();
    }
  });
});
