const STATUS_API = "https://islwlshsrejquylnzano.supabase.co/functions/v1/book-statuses";
const books = window.BOOKS;
const loginForm = document.querySelector("#login-form");
const codeInput = document.querySelector("#admin-code");
const statusList = document.querySelector("#status-list");
const message = document.querySelector("#admin-message");
const logout = document.querySelector("#logout");
let token = sessionStorage.getItem("booksAdminToken") || "";
let statuses = {};

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

function renderStatuses() {
  statusList.innerHTML = books.map((book) => {
    const status = statuses[book.id] || "זמין";
    return `<div class="status-row">
      <span>${book.title}</span>
      <select data-book-id="${book.id}" aria-label="זמינות הספר ${book.title}">
        <option value="זמין"${status === "זמין" ? " selected" : ""}>זמין</option>
        <option value="נמכר"${status === "נמכר" ? " selected" : ""}>נמכר</option>
      </select>
    </div>`;
  }).join("");
}

async function loadStatuses() {
  const response = await fetch(STATUS_API, { cache: "no-store" });
  if (!response.ok) throw new Error("לא ניתן לטעון את הזמינות");
  const data = await response.json();
  statuses = data.statuses || {};
  renderStatuses();
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
    await loadStatuses();
    setLoggedIn(true);
    showMessage("הכניסה הצליחה. אפשר לעדכן את זמינות הספרים.");
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
    await request("POST", { bookId, status });
    statuses[bookId] = status;
    showMessage(`הסטטוס של ״${books[bookId - 1].title}״ עודכן ל״${status}״.`);
  } catch (error) {
    select.value = previous;
    showMessage(error.message, "error");
  } finally { select.disabled = false; }
});

logout.addEventListener("click", () => {
  token = "";
  sessionStorage.removeItem("booksAdminToken");
  setLoggedIn(false);
  message.classList.add("hidden");
});

if (token) {
  request("POST", { action: "verify" })
    .then(loadStatuses)
    .then(() => setLoggedIn(true))
    .catch(() => { token = ""; sessionStorage.removeItem("booksAdminToken"); setLoggedIn(false); });
} else {
  setLoggedIn(false);
}
