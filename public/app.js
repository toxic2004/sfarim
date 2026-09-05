const STATUS_API = "https://islwlshsrejquylnzano.supabase.co/functions/v1/book-statuses";
const books = window.BOOKS;
const grid = document.querySelector("#book-grid");
const search = document.querySelector("#search");
const filters = document.querySelector("#category-filters");
const count = document.querySelector("#book-count");
const empty = document.querySelector("#empty-state");
const loading = document.querySelector("#loading");

let statuses = {};
let prices = {};
let selectedCategory = "הכול";
const categories = ["הכול", ...new Set(books.map((book) => book.category))];

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function renderFilters() {
  filters.innerHTML = categories.map((category) => `<button type="button" class="chip${category === selectedCategory ? " chip--active" : ""}" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`).join("");
}

function currentPrice(book) {
  const price = Number(prices[book.id]);
  return Number.isInteger(price) && price >= 0 ? price : book.price;
}

function renderBooks() {
  const query = search.value.trim().toLocaleLowerCase("he");
  const visible = books.filter((book) => (selectedCategory === "הכול" || book.category === selectedCategory) && (!query || book.title.toLocaleLowerCase("he").includes(query)));
  count.textContent = `מוצגים ${visible.length} מתוך ${books.length}`;
  empty.classList.toggle("hidden", visible.length > 0);
  grid.classList.toggle("hidden", visible.length === 0);
  grid.innerHTML = visible.map((book) => {
    const status = statuses[book.id] || "זמין";
    const sold = status === "נמכר";
    const price = currentPrice(book);
    const whatsappText = encodeURIComponent(`שלום, אני מתעניין בספר: ${book.title}, במחיר ${price} ₪`);
    return `<article class="book-card${sold ? " book-card--sold" : ""}">
      <div class="book-card__image-wrap">
        <img class="book-card__image" src="${book.image}" alt="הספר ${escapeHtml(book.title)} מתוך האוסף" style="object-position:${book.position}" loading="lazy">
        <span class="book-card__price"><bdi>${price} ₪</bdi></span>
        ${sold ? '<span class="sold-overlay">נמכר</span>' : ""}
      </div>
      <div class="book-card__body">
        <p class="book-card__category">${escapeHtml(book.category)}</p>
        <h3>${escapeHtml(book.title)}</h3>
        <div class="book-card__footer">
          <span class="availability ${sold ? "availability--sold" : "availability--available"}">${status}</span>
          ${sold ? "" : `<a class="book-whatsapp" href="https://wa.me/972547693210?text=${whatsappText}" target="_blank" rel="noopener noreferrer">שליחת הודעה</a>`}
        </div>
      </div>
    </article>`;
  }).join("");
}

filters.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-category]");
  if (!button) return;
  selectedCategory = button.dataset.category;
  renderFilters();
  renderBooks();
});

search.addEventListener("input", renderBooks);
renderFilters();
renderBooks();

fetch(STATUS_API, { cache: "no-store" })
  .then((response) => response.ok ? response.json() : Promise.reject(new Error("status request failed")))
  .then((data) => { statuses = data.statuses || {}; prices = data.prices || {}; })
  .catch(() => { loading.textContent = "לא ניתן היה לרענן מחירים וזמינות כרגע. אפשר עדיין לעיין בספרים ולשלוח הודעה."; })
  .finally(() => { loading.classList.add("hidden"); renderBooks(); });
