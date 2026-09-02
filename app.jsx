const { useEffect, useMemo, useState } = React;

const categories = {
  expense: ["Food", "Housing", "Transport", "Bills", "Health", "Shopping", "Fun", "Other"],
  income: ["Base Salary", "Secondary Salary", "Gift", "Investment", "Other"]
};

const money = (value) => new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD"
}).format(value);
const today = () => new Date().toISOString().slice(0, 10);

function SummaryCard({ label, value, className, note }) {
  return <article className={`summary-card ${className}`}>
    <span>{label}</span>
    <strong>{money(value)}</strong>
    {note && <small>{note}</small>}
  </article>;
}

function TransactionForm({ onAdd }) {
  const [type, setType] = useState("expense");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(categories.expense[0]);
  const [date, setDate] = useState(today());

  function changeType(nextType) {
    setType(nextType);
    setCategory(categories[nextType][0]);
  }

  function submit(event) {
    event.preventDefault();
    onAdd({ id: crypto.randomUUID(), description: description.trim(), amount: Number(amount), type, category, date });
    setDescription("");
    setAmount("");
    setDate(today());
  }

  return <form className="panel form-panel" onSubmit={submit}>
    <div className="panel-heading"><p className="eyebrow">NEW ENTRY</p><h2>Add a transaction</h2></div>
    <label>Description
      <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="e.g. Weekly groceries" maxLength="60" required />
    </label>
    <div className="form-row">
      <label>Amount
        <input value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min="0.01" step="0.01" placeholder="0.00" required />
      </label>
      <label>Type
        <select value={type} onChange={(event) => changeType(event.target.value)}>
          <option value="expense">Expense</option><option value="income">Income</option>
        </select>
      </label>
    </div>
    <label>Category
      <select value={category} onChange={(event) => setCategory(event.target.value)}>
        {categories[type].map((item) => <option key={item}>{item}</option>)}
      </select>
    </label>
    <label>Date
      <input value={date} onChange={(event) => setDate(event.target.value)} type="date" required />
    </label>
    <button className="primary-button" type="submit">Add transaction <span>→</span></button>
  </form>;
}

function CategoryChart({ expenses }) {
  const totals = expenses.reduce((result, item) => ({
    ...result, [item.category]: (result[item.category] || 0) + item.amount
  }), {});
  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const largest = entries[0]?.[1] || 1;
  return <section className="panel insights-panel" aria-label="Spending insights">
    <div className="panel-heading"><p className="eyebrow">AT A GLANCE</p><h2>Spending by category</h2></div>
    {entries.length ? <div className="category-chart">
      {entries.map(([category, total]) => <div className="chart-row" key={category}>
        <span className="chart-label">{category}</span>
        <div className="bar-track"><div className="bar-fill" style={{ width: `${(total / largest) * 100}%` }} /></div>
        <span className="chart-value">{money(total)}</span>
      </div>)}
    </div> : <p className="empty-message">Your spending categories will appear here.</p>}
  </section>;
}

function TransactionHistory({ transactions, onDelete }) {
  const [filter, setFilter] = useState("all");
  const visible = transactions.filter((item) => filter === "all" || item.type === filter)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  return <section className="panel transactions-panel">
    <div className="transactions-header">
      <div><p className="eyebrow">HISTORY</p><h2>Recent transactions</h2></div>
      <label className="filter-label"><span className="sr-only">Filter transactions</span>
        <select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter transactions">
          <option value="all">All transactions</option><option value="income">Income only</option><option value="expense">Expenses only</option>
        </select>
      </label>
    </div>
    {visible.length ? <div className="transaction-list">{visible.map((item) => <article className={`transaction ${item.type}`} key={item.id}>
      <div className="transaction-icon" />
      <div className="transaction-details"><strong>{item.description}</strong><span>{item.category} · {new Date(`${item.date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span></div>
      <strong className="transaction-amount">{item.type === "income" ? "+" : "−"}{money(item.amount)}</strong>
      <button className="delete-button" type="button" onClick={() => onDelete(item.id)} aria-label={`Delete ${item.description}`}>×</button>
    </article>)}</div> : <p className="empty-message">No transactions yet. Add one above to get started.</p>}
  </section>;
}

function BudgetApp() {
  const [transactions, setTransactions] = useState(() => JSON.parse(localStorage.getItem("budget-transactions")) || []);
  const [theme, setTheme] = useState(() => localStorage.getItem("budget-theme") || "light");
  useEffect(() => localStorage.setItem("budget-transactions", JSON.stringify(transactions)), [transactions]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("budget-theme", theme);
  }, [theme]);

  const totals = useMemo(() => {
    const income = transactions.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
    const expenses = transactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
    const salary = (category) => transactions.filter((item) => item.type === "income" && item.category === category).reduce((sum, item) => sum + item.amount, 0);
    return { income, expenses, balance: income - expenses, base: salary("Base Salary"), secondary: salary("Secondary Salary") };
  }, [transactions]);

  return <>
    <header className="hero"><div><p className="eyebrow">PERSONAL FINANCE</p><h1>My Budget</h1><p className="subtitle">A calmer way to see where your money goes.</p></div>
      <div className="header-actions">
        <div className="theme-switch" aria-label="Choose color mode">
          <button type="button" className={theme === "light" ? "selected" : ""} onClick={() => setTheme("light")}>Light</button>
          <button type="button" className={theme === "dark" ? "selected" : ""} onClick={() => setTheme("dark")}>Dark</button>
        </div>
        <button className="text-button" type="button" onClick={() => { if (transactions.length && window.confirm("Delete all of your budget data?")) setTransactions([]); }}>Clear all data</button>
      </div>
    </header>
    <section className="summary" aria-label="Budget summary">
      <SummaryCard label="Current balance" value={totals.balance} className="balance-card" note={transactions.length ? `${transactions.length} transaction${transactions.length === 1 ? "" : "s"} recorded.` : "Add your first transaction to begin."} />
      <SummaryCard label="Total income" value={totals.income} className="income-card" />
      <SummaryCard label="Base Salary" value={totals.base} className="primary-income-card" />
      <SummaryCard label="Secondary Salary" value={totals.secondary} className="secondary-income-card" />
      <SummaryCard label="Total spending" value={totals.expenses} className="expense-card" />
    </section>
    <section className="workspace"><TransactionForm onAdd={(item) => setTransactions((current) => [...current, item])} /><CategoryChart expenses={transactions.filter((item) => item.type === "expense")} /></section>
    <TransactionHistory transactions={transactions} onDelete={(id) => setTransactions((current) => current.filter((item) => item.id !== id))} />
  </>;
}

ReactDOM.createRoot(document.querySelector("#root")).render(<BudgetApp />);
