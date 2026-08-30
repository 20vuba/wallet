// Categories are grouped by type so the form always shows relevant choices.
const categories = {
  expense: ["Food", "Housing", "Transport", "Bills", "Health", "Shopping", "Fun", "Other"],
  // Salary streams are separate so each can be tracked in the summary.
  income: ["Base Salary", "Secondary Salary", "Gift", "Investment", "Other"]
};

const form = document.querySelector("#transaction-form");
const fields = {
  description: document.querySelector("#description"), amount: document.querySelector("#amount"),
  type: document.querySelector("#type"), category: document.querySelector("#category"), date: document.querySelector("#date")
};
const list = document.querySelector("#transaction-list");
const template = document.querySelector("#transaction-template");
const filter = document.querySelector("#filter");

// Read saved data once. If this is a first visit, start with an empty list.
let transactions = JSON.parse(localStorage.getItem("budget-transactions")) || [];

const money = value => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
const today = () => new Date().toISOString().slice(0, 10);

function saveTransactions() {
  localStorage.setItem("budget-transactions", JSON.stringify(transactions));
}

function updateCategoryOptions() {
  const typeCategories = categories[fields.type.value];
  fields.category.innerHTML = typeCategories.map(category => `<option value="${category}">${category}</option>`).join("");
}

function renderSummary() {
  const income = transactions.filter(item => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
  const expenses = transactions.filter(item => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
  const baseSalary = transactions.filter(item => item.type === "income" && item.category === "Base Salary").reduce((sum, item) => sum + item.amount, 0);
  const secondarySalary = transactions.filter(item => item.type === "income" && item.category === "Secondary Salary").reduce((sum, item) => sum + item.amount, 0);
  const balance = income - expenses;

  document.querySelector("#income").textContent = money(income);
  document.querySelector("#base-salary").textContent = money(baseSalary);
  document.querySelector("#secondary-salary").textContent = money(secondarySalary);
  document.querySelector("#expenses").textContent = money(expenses);
  document.querySelector("#balance").textContent = money(balance);
  document.querySelector("#balance-note").textContent = transactions.length
    ? `${transactions.length} transaction${transactions.length === 1 ? "" : "s"} recorded.`
    : "Add your first transaction to begin.";
}

function renderChart() {
  const chart = document.querySelector("#category-chart");
  const emptyMessage = document.querySelector("#chart-empty");
  const totals = {};
  transactions.filter(item => item.type === "expense").forEach(item => {
    totals[item.category] = (totals[item.category] || 0) + item.amount;
  });
  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const largestTotal = entries[0]?.[1] || 1;

  chart.innerHTML = entries.map(([category, total]) => `
    <div class="chart-row">
      <span class="chart-label">${category}</span>
      <div class="bar-track"><div class="bar-fill" style="width: ${(total / largestTotal) * 100}%"></div></div>
      <span class="chart-value">${money(total)}</span>
    </div>`).join("");
  emptyMessage.hidden = entries.length > 0;
}

function renderTransactions() {
  list.innerHTML = "";
  const chosenType = filter.value;
  const visibleTransactions = transactions
    .filter(item => chosenType === "all" || item.type === chosenType)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  visibleTransactions.forEach(item => {
    const row = template.content.cloneNode(true);
    const article = row.querySelector(".transaction");
    article.classList.add(item.type);
    row.querySelector(".transaction-description").textContent = item.description;
    row.querySelector(".transaction-meta").textContent = `${item.category} · ${new Date(`${item.date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    row.querySelector(".transaction-amount").textContent = `${item.type === "income" ? "+" : "−"}${money(item.amount)}`;
    row.querySelector(".delete-button").addEventListener("click", () => {
      transactions = transactions.filter(transaction => transaction.id !== item.id);
      saveTransactions(); render();
    });
    list.append(row);
  });
  document.querySelector("#list-empty").hidden = visibleTransactions.length > 0;
}

function render() { renderSummary(); renderChart(); renderTransactions(); }

form.addEventListener("submit", event => {
  event.preventDefault();
  transactions.push({
    id: crypto.randomUUID(),
    description: fields.description.value.trim(),
    amount: Number(fields.amount.value),
    type: fields.type.value,
    category: fields.category.value,
    date: fields.date.value
  });
  saveTransactions();
  form.reset(); fields.date.value = today(); updateCategoryOptions(); render();
});

fields.type.addEventListener("change", updateCategoryOptions);
filter.addEventListener("change", renderTransactions);
document.querySelector("#clear-data").addEventListener("click", () => {
  if (transactions.length && confirm("Delete all of your budget data?")) {
    transactions = []; saveTransactions(); render();
  }
});

fields.date.value = today();
updateCategoryOptions();
render();
