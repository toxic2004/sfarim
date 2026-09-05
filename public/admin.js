const STATUS_API = "https://islwlshsrejquylnzano.supabase.co/functions/v1/book-statuses";
const books = window.BOOKS;
const loginForm = document.querySelector("#login-form");
const codeInput = document.querySelector("#admin-code");
const statusList = document.querySelector("#status-list");
const message = document.querySelector("#admin-message");
const logout = document.querySelector("#logout");
let token = sessionStorage.getItem("booksAdminToken") || "";
let statuses = {};
let prices = {};

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function showMessage(text, type = "success") {
  message.textContent = text;
  message.className = `admin-message admin-message--${type}`;
}

function setLoggedIn(value) {
  loginForm.classList.toggle("hidden", value);
  statusList.classList.toggle("hidden", !value);
  logout.classList.toggle("hidden", !value);
}

async function request(method, body) {
  const response = await fetch(STATUS_API, {
    method,
    headers: { "Content-Type": "application/json", "x-admin-token": token },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "אירעה שגיאה");
  return data;
}

function renderBooks() {
  statusList.innerHTML = books.map((book) => {
    const status = statuses[book.id] || "זמין";
    const price = Number.isInteger(Number(prices[book.id])) ? Number(prices[book.id]) : book.price;
    return `<div class="status-row">
      <span class="status-row__title">${escapeHtml(book.title)}</span>
      <form class="price-editor" data-book-id="${book.id}">
        <label class="visually-hidden" for="price-${book.id}">מחיר הספר ${escapeHtml(book.title)}</label>
        <input id="price-${book.id}" name="price" type="number" min="0" max="100000" step="1" inputmode="numeric" value="${price}" required>
        <span aria-hidden="true">₪</span>
        <button type="submit">שמירה</button>
      </form>
      <select data-book-id="${book.id}" aria-label="זמינות הספר ${escapeHtml(book.title)}">
        <option value="זמין"${status === "זמין" ? " selected" : ""}>זמין</option>
        <option value="נמכר"${status === "נמכר" ? " selected" : ""}>נמכר</option>
      </select>
    </div>`;
  }).join("");
}

async function loadBooks() {
  const response = await fetch(STATUS_API, { cache: "no-store" });
  if (!response.ok) throw new Error("לא ניתן לטעון את נתוני הספרים");
  const data = await response.json();
  statuses = data.statuses || {};
  prices = data.prices || {};
  renderBooks();
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  token = codeInput.value.trim();
  if (!token) return;
  const submit = loginForm.querySelector("button");
  submit.disabled = true;
  try {
    await request("POST", { action: "verify" });
    sessionStorage.setItem("booksAdminToken", token);
    await loadBooks();
    setLoggedIn(true);
    showMessage("הכניסה הצליחה. אפשר לעדכן מחירים וזמינות.");
    codeInput.value = "";
  } catch (error) {
    token = "";
    sessionStorage.removeItem("booksAdminToken");
    showMessage(error.message, "error");
  } finally { submit.disabled = false; }
});

statusList.addEventListener("change", async (event) => {
  const select = event.target.closest("select[data-book-id]");
  if (!select) return;
  const bookId = Number(select.dataset.bookId);
  const previous = statuses[bookId] || "זמין";
  const status = select.value;
  select.disabled = true;
  try {
    await request("POST", { action: "status", bookId, status });
    statuses[bookId] = status;
    showMessage(`הסטטוס של ״${books[bookId - 1].title}״ עודכן ל״${status}״.`);
  } catch (error) {
    select.value = previous;
    showMessage(error.message, "error");
  } finally { select.disabled = false; }
});

statusList.addEventListener("submit", async (event) => {
  const form = event.target.closest("form.price-editor[data-book-id]");
  if (!form) return;
  event.preventDefault();
  const bookId = Number(form.dataset.bookId);
  const input = form.elements.price;
  const button = form.querySelector("button[type=submit]");
  const previous = Number.isInteger(Number(prices[bookId])) ? Number(prices[bookId]) : books[bookId - 1].price;
  const price = Number(input.value);
  if (!Number.isInteger(price) || price < 0 || price > 100000) {
    showMessage("יש להזין מחיר שלם בין 0 ל־100,000.", "error");
    input.focus();
    return;
  }
  input.disabled = true;
  button.disabled = true;
  try {
    await request("POST", { action: "price", bookId, price });
    prices[bookId] = price;
    showMessage(`המחיר של ״${books[bookId - 1].title}״ עודכן ל־${price} ₪.`);
  } catch (error) {
    input.value = previous;
    showMessage(error.message, "error");
  } finally {
    input.disabled = false;
    button.disabled = false;
  }
});

logout.addEventListener("click", () => {
  token = "";
  sessionStorage.removeItem("booksAdminToken");
  setLoggedIn(false);
  message.classList.add("hidden");
});

if (token) {
  request("POST", { action: "verify" })
    .then(loadBooks)
    .then(() => setLoggedIn(true))
    .catch(() => { token = ""; sessionStorage.removeItem("booksAdminToken"); setLoggedIn(false); });
} else {
  setLoggedIn(false);
}
