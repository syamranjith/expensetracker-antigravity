const balance = document.getElementById('balance');
const money_plus = document.getElementById('money-plus');
const money_minus = document.getElementById('money-minus');
const list = document.getElementById('list');
const form = document.getElementById('form');
const text = document.getElementById('text');
const amount = document.getElementById('amount');
const category = document.getElementById('category');

const filterBtns = document.querySelectorAll('.filter-btn');
const expensePieChartEl = document.getElementById('expensePieChart');
const barChartEl = document.getElementById('barChart');

let expensePieChart;
let barChart;

// Default Filter
let currentFilter = 'weekly';

const localStorageTransactions = JSON.parse(
  localStorage.getItem('transactions')
);

let transactions =
  localStorage.getItem('transactions') !== null ? localStorageTransactions : [];

// Migration: Add category to old transactions if missing
transactions = transactions.map(t => {
  return { ...t, category: t.category || 'General', date: t.date || new Date().toISOString() };
});


// Add transaction
function addTransaction(e) {
  e.preventDefault();

  if (text.value.trim() === '' || amount.value.trim() === '') {
    alert('Please add a text and amount');
  } else {
    const transaction = {
      id: generateID(),
      text: text.value,
      amount: +amount.value,
      category: category.value,
      date: new Date().toISOString() // Store date for filtering
    };

    transactions.push(transaction);

    addTransactionDOM(transaction);

    updateValues();

    updateLocalStorage();

    updateCharts(currentFilter);

    text.value = '';
    amount.value = '';
  }
}

// Generate random ID
function generateID() {
  return Math.floor(Math.random() * 100000000);
}

// Add transactions to DOM list
function addTransactionDOM(transaction) {
  // Get sign
  const sign = transaction.amount < 0 ? '-' : '+';

  const item = document.createElement('li');

  // Add class based on value
  item.classList.add(transaction.amount < 0 ? 'minus' : 'plus');

  // Show category icon/text
  const cat = transaction.category || 'General';

  item.innerHTML = `
    <div>
        <strong>${transaction.text}</strong> <small>(${cat})</small>
    </div>
    <span>${sign}₹${Math.abs(transaction.amount)}</span> 
    <button class="delete-btn" onclick="removeTransaction(${transaction.id})">x</button>
  `;

  list.appendChild(item);
}

// Update the balance, income and expense
function updateValues() {
  const amounts = transactions.map(transaction => transaction.amount);

  const total = amounts.reduce((acc, item) => (acc += item), 0).toFixed(2);

  const income = amounts
    .filter(item => item > 0)
    .reduce((acc, item) => (acc += item), 0)
    .toFixed(2);

  const expense = (
    amounts.filter(item => item < 0).reduce((acc, item) => (acc += item), 0) *
    -1
  ).toFixed(2);

  balance.innerText = `₹${total}`;
  money_plus.innerText = `+₹${income}`;
  money_minus.innerText = `-₹${expense}`;
}

// Remove transaction by ID
function removeTransaction(id) {
  transactions = transactions.filter(transaction => transaction.id !== id);

  updateLocalStorage();

  init();
}

// Update local storage transactions
function updateLocalStorage() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Filter Logic
function getFilteredTransactions(filter) {
  const now = new Date();
  return transactions.filter(t => {
    const tDate = new Date(t.date);
    if (filter === 'weekly') {
      // Last 7 days
      const past = new Date();
      past.setDate(now.getDate() - 7);
      return tDate >= past && tDate <= now;
    } else if (filter === 'monthly') {
      // This Month
      return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
    } else if (filter === 'yearly') {
      // This Year
      return tDate.getFullYear() === now.getFullYear();
    }
    return true;
  });
}

// Chart Logic
function updateCharts(filter) {
  const data = getFilteredTransactions(filter);

  // --- Pie Chart (Expenses by Category) ---
  const expenses = data.filter(t => t.amount < 0);
  const categories = {};
  expenses.forEach(t => {
    categories[t.category] = (categories[t.category] || 0) + Math.abs(t.amount);
  });

  const pieLabels = Object.keys(categories);
  const pieData = Object.values(categories);

  if (expensePieChart) expensePieChart.destroy();

  // Check if there is data, else show empty or handle gracefully? 
  // Chart.js handles empty arrays fine.

  expensePieChart = new Chart(expensePieChartEl, {
    type: 'doughnut',
    data: {
      labels: pieLabels,
      datasets: [{
        label: 'Expenses by Category',
        data: pieData,
        backgroundColor: [
          '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6', '#34495e'
        ],
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { color: '#fff' } },
        title: { display: true, text: 'Expense Breakdown', color: '#fff' }
      }
    }
  });


  // --- Bar Chart (Income vs Expense) ---
  // For simplicity, let's show Total Income vs Total Expense for the period
  // OR breakdown by day/month. Let's do simple Income vs Expense totals for now to fit the request "bar code graph".
  // Actually typically Bar Graph implies time series or categories. 
  // Let's do a grouped bar chart: Income vs Expense by Category? No, that's messy.
  // Let's do a Time Series Bar Chart if possible, or just Total Income vs Expense for the view.
  // "Bar code graph" might mean Bar Chart. 
  // Let's do Income vs Expense for the filtered period.

  const totalIncome = data.filter(t => t.amount > 0).reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = data.filter(t => t.amount < 0).reduce((acc, t) => acc + Math.abs(t.amount), 0);

  if (barChart) barChart.destroy();

  barChart = new Chart(barChartEl, {
    type: 'bar',
    data: {
      labels: ['Income', 'Expense'],
      datasets: [{
        label: 'Amount (₹)',
        data: [totalIncome, totalExpense],
        backgroundColor: ['#2ecc71', '#e74c3c'],
        borderRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Income vs Expense', color: '#fff' }
      },
      scales: {
        y: { beginAtZero: true, ticks: { color: '#b3b3b3' }, grid: { color: 'rgba(255,255,255,0.1)' } },
        x: { ticks: { color: '#fff' }, grid: { display: false } }
      }
    }
  });

}

// Filter Events
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // Remove active class
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    currentFilter = btn.getAttribute('data-filter');
    updateCharts(currentFilter);
  });
});


// Init app
function init() {
  list.innerHTML = '';
  transactions.forEach(addTransactionDOM);
  updateValues();
  updateCharts(currentFilter);
}

init();

form.addEventListener('submit', addTransaction);

