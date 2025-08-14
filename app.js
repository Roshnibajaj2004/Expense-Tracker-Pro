// Application data and state
const appData = {
  expenses: [], // Start with empty expenses array
  categories: ["Food", "Transportation", "Housing", "Utilities", "Entertainment", "Healthcare", "Shopping", "Travel", "Education", "Other"],
  categoryColors: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545', '#D2BA4C', '#964325', '#944454', '#13343B'],
  nextId: 1,
  currentEditId: null,
  currentDeleteId: null,
  charts: {
    category: null,
    time: null
  }
};

// Utility functions
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const getLastWeekDates = () => {
  const dates = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
};

// Data calculation functions
const calculateSummaryStats = () => {
  const expenses = appData.expenses;
  const currentMonth = getCurrentMonth();
  const lastWeekDates = getLastWeekDates();
  
  // Filter current month expenses
  const monthExpenses = expenses.filter(expense => 
    expense.date.startsWith(currentMonth)
  );
  
  // Filter last week expenses
  const weekExpenses = expenses.filter(expense => 
    lastWeekDates.includes(expense.date)
  );
  
  const totalExpenses = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalTransactions = expenses.length;
  const avgDaily = weekExpenses.length > 0 ? 
    weekExpenses.reduce((sum, expense) => sum + expense.amount, 0) / 7 : 0;
  
  // Find top category
  const categoryTotals = {};
  monthExpenses.forEach(expense => {
    categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
  });
  
  const topCategory = Object.keys(categoryTotals).length > 0 ? 
    Object.keys(categoryTotals).reduce((a, b) => categoryTotals[a] > categoryTotals[b] ? a : b) : '-';
  
  return {
    totalExpenses,
    totalTransactions,
    avgDaily,
    topCategory
  };
};

const getCategoryBreakdown = () => {
  const categoryTotals = {};
  const totalAmount = appData.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  appData.expenses.forEach(expense => {
    categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
  });
  
  return Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalAmount > 0 ? (amount / totalAmount * 100).toFixed(1) : 0,
      color: appData.categoryColors[appData.categories.indexOf(category)] || '#000000'
    }))
    .sort((a, b) => b.amount - a.amount);
};

const getDailySpending = () => {
  const dailyTotals = {};
  const lastWeekDates = getLastWeekDates();
  
  // Initialize all dates with 0
  lastWeekDates.forEach(date => {
    dailyTotals[date] = 0;
  });
  
  // Add actual spending
  appData.expenses.forEach(expense => {
    if (lastWeekDates.includes(expense.date)) {
      dailyTotals[expense.date] += expense.amount;
    }
  });
  
  return lastWeekDates.map(date => ({
    date,
    amount: dailyTotals[date],
    label: new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
  }));
};

// Empty state management
const updateEmptyStates = () => {
  const hasData = appData.expenses.length > 0;
  const dashboardContainer = document.getElementById('dashboard');
  
  if (dashboardContainer) {
    if (hasData) {
      dashboardContainer.classList.add('has-data');
      dashboardContainer.classList.remove('no-data');
    } else {
      dashboardContainer.classList.add('no-data');
      dashboardContainer.classList.remove('has-data');
    }
  }
  
  // Show/hide chart empty states
  const categoryEmpty = document.getElementById('categoryChartEmpty');
  const timeEmpty = document.getElementById('timeChartEmpty');
  const categoryCanvas = document.getElementById('categoryChart');
  const timeCanvas = document.getElementById('timeChart');
  
  if (hasData) {
    if (categoryEmpty) categoryEmpty.style.display = 'none';
    if (timeEmpty) timeEmpty.style.display = 'none';
    if (categoryCanvas) categoryCanvas.style.opacity = '1';
    if (timeCanvas) timeCanvas.style.opacity = '1';
  } else {
    if (categoryEmpty) categoryEmpty.style.display = 'block';
    if (timeEmpty) timeEmpty.style.display = 'block';
    if (categoryCanvas) categoryCanvas.style.opacity = '0.1';
    if (timeCanvas) timeCanvas.style.opacity = '0.1';
  }
};

// UI Update functions
const updateSummaryCards = () => {
  const stats = calculateSummaryStats();
  
  const totalExpensesEl = document.getElementById('totalExpenses');
  const totalTransactionsEl = document.getElementById('totalTransactions');
  const avgDailyEl = document.getElementById('avgDaily');
  const topCategoryEl = document.getElementById('topCategory');
  
  if (totalExpensesEl) totalExpensesEl.textContent = formatCurrency(stats.totalExpenses);
  if (totalTransactionsEl) totalTransactionsEl.textContent = stats.totalTransactions;
  if (avgDailyEl) avgDailyEl.textContent = formatCurrency(stats.avgDaily);
  if (topCategoryEl) topCategoryEl.textContent = stats.topCategory;
};

const updateCharts = () => {
  updateCategoryChart();
  updateTimeChart();
};

const updateCategoryChart = () => {
  const canvas = document.getElementById('categoryChart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const breakdown = getCategoryBreakdown();
  
  if (appData.charts.category) {
    appData.charts.category.destroy();
  }
  
  if (breakdown.length === 0) {
    // Don't create chart if no data
    return;
  }
  
  appData.charts.category = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: breakdown.map(item => item.category),
      datasets: [{
        data: breakdown.map(item => item.amount),
        backgroundColor: breakdown.map(item => item.color),
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const category = context.label;
              const amount = formatCurrency(context.raw);
              const percentage = breakdown[context.dataIndex].percentage;
              return `${category}: ${amount} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
};

const updateTimeChart = () => {
  const canvas = document.getElementById('timeChart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const dailyData = getDailySpending();
  
  if (appData.charts.time) {
    appData.charts.time.destroy();
  }
  
  const hasAnySpending = dailyData.some(item => item.amount > 0);
  
  if (!hasAnySpending) {
    // Don't create chart if no spending data
    return;
  }
  
  appData.charts.time = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: dailyData.map(item => item.label),
      datasets: [{
        label: 'Daily Spending',
        data: dailyData.map(item => item.amount),
        backgroundColor: '#1FB8CD',
        borderColor: '#1FB8CD',
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return formatCurrency(value);
            }
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `Spending: ${formatCurrency(context.raw)}`;
            }
          }
        }
      }
    }
  });
};

const updateExpensesTable = (expenses = null) => {
  const tableBody = document.getElementById('expensesTableBody');
  if (!tableBody) return;
  
  const expensesToShow = expenses || appData.expenses;
  
  if (expensesToShow.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">
          <div class="empty-state-content">
            <h3>No expenses ${expenses ? 'found' : 'added yet'}</h3>
            <p>${expenses ? 'Try adjusting your search or filters.' : 'Click "Add Expense" to begin tracking your spending.'}</p>
            ${!expenses ? '<button class="btn btn--primary" onclick="openAddExpenseModal()">Add Expense</button>' : ''}
          </div>
        </td>
      </tr>
    `;
    return;
  }
  
  // Sort expenses by date (newest first)
  const sortedExpenses = [...expensesToShow].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  tableBody.innerHTML = sortedExpenses.map(expense => `
    <tr>
      <td>${formatDate(expense.date)}</td>
      <td><span class="expense-category">${expense.category}</span></td>
      <td>${expense.description}</td>
      <td class="expense-amount">${formatCurrency(expense.amount)}</td>
      <td class="expense-actions">
        <button class="btn btn--xs btn--outline" onclick="editExpense(${expense.id})">Edit</button>
        <button class="btn btn--xs btn--error" onclick="deleteExpense(${expense.id})">Delete</button>
      </td>
    </tr>
  `).join('');
};

const updateCategoryBreakdown = () => {
  const breakdown = getCategoryBreakdown();
  const container = document.getElementById('categoryBreakdown');
  if (!container) return;
  
  if (breakdown.length === 0) {
    container.innerHTML = `
      <div class="empty-state-content">
        <p>No category data available yet.</p>
        <p class="empty-subtitle">Add expenses to see your category breakdown.</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = breakdown.map(item => `
    <div class="category-item">
      <div class="category-info">
        <div class="category-color" style="background-color: ${item.color}"></div>
        <span>${item.category}</span>
      </div>
      <div class="category-stats">
        <span class="category-amount">${formatCurrency(item.amount)}</span>
        <span class="category-percentage">${item.percentage}%</span>
      </div>
    </div>
  `).join('');
};

const updateSpendingInsights = () => {
  const stats = calculateSummaryStats();
  const breakdown = getCategoryBreakdown();
  const container = document.getElementById('spendingInsights');
  if (!container) return;
  
  if (appData.expenses.length === 0) {
    container.innerHTML = `
      <div class="empty-state-content">
        <p>Start tracking your expenses to see insights here.</p>
        <p class="empty-subtitle">Add a few expenses to get personalized spending insights.</p>
      </div>
    `;
    return;
  }
  
  const insights = [];
  
  if (breakdown.length > 0) {
    const topSpending = breakdown[0];
    insights.push({
      title: 'Highest Spending Category',
      description: `You spent the most on ${topSpending.category} with ${formatCurrency(topSpending.amount)} (${topSpending.percentage}% of total)`
    });
  }
  
  if (stats.avgDaily > 0) {
    insights.push({
      title: 'Daily Average',
      description: `Your average daily spending over the last week is ${formatCurrency(stats.avgDaily)}`
    });
  }
  
  const monthlyTotal = stats.totalExpenses;
  if (monthlyTotal > 0) {
    insights.push({
      title: 'Monthly Progress',
      description: `You've spent ${formatCurrency(monthlyTotal)} this month across ${stats.totalTransactions} transactions`
    });
  }
  
  container.innerHTML = insights.map(insight => `
    <div class="insight-item">
      <div class="insight-title">${insight.title}</div>
      <div class="insight-description">${insight.description}</div>
    </div>
  `).join('');
};

// Modal functions
const showModal = (modalId) => {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  modal.classList.remove('hidden');
  
  // Focus management
  const firstInput = modal.querySelector('input, select, textarea, button');
  if (firstInput) {
    setTimeout(() => firstInput.focus(), 100);
  }
};

const hideModal = (modalId) => {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  modal.classList.add('hidden');
};

const resetExpenseForm = () => {
  const form = document.getElementById('expenseForm');
  if (!form) return;
  
  form.reset();
  const dateInput = document.getElementById('expenseDate');
  if (dateInput) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }
  appData.currentEditId = null;
  const modalTitle = document.getElementById('modalTitle');
  if (modalTitle) {
    modalTitle.textContent = 'Add Expense';
  }
};

// Global function for opening add expense modal
window.openAddExpenseModal = () => {
  resetExpenseForm();
  showModal('expenseModal');
};

// CRUD operations
const addExpense = (expenseData) => {
  const newExpense = {
    id: appData.nextId++,
    amount: parseFloat(expenseData.amount),
    category: expenseData.category,
    description: expenseData.description,
    date: expenseData.date
  };
  
  appData.expenses.push(newExpense);
  updateAllData();
};

const updateExpense = (id, expenseData) => {
  const index = appData.expenses.findIndex(expense => expense.id === id);
  if (index !== -1) {
    appData.expenses[index] = {
      ...appData.expenses[index],
      amount: parseFloat(expenseData.amount),
      category: expenseData.category,
      description: expenseData.description,
      date: expenseData.date
    };
    updateAllData();
  }
};

const removeExpense = (id) => {
  appData.expenses = appData.expenses.filter(expense => expense.id !== id);
  updateAllData();
};

// Global functions for onclick handlers
window.editExpense = (id) => {
  const expense = appData.expenses.find(expense => expense.id === id);
  if (expense) {
    appData.currentEditId = id;
    const modalTitle = document.getElementById('modalTitle');
    const amountInput = document.getElementById('expenseAmount');
    const categorySelect = document.getElementById('expenseCategory');
    const descriptionInput = document.getElementById('expenseDescription');
    const dateInput = document.getElementById('expenseDate');
    
    if (modalTitle) modalTitle.textContent = 'Edit Expense';
    if (amountInput) amountInput.value = expense.amount;
    if (categorySelect) categorySelect.value = expense.category;
    if (descriptionInput) descriptionInput.value = expense.description;
    if (dateInput) dateInput.value = expense.date;
    
    showModal('expenseModal');
  }
};

window.deleteExpense = (id) => {
  appData.currentDeleteId = id;
  showModal('deleteModal');
};

// Filter and search functions
const filterExpenses = () => {
  const categoryFilter = document.getElementById('categoryFilter');
  const searchInput = document.getElementById('searchExpenses');
  
  if (!categoryFilter || !searchInput) return;
  
  const categoryFilterValue = categoryFilter.value;
  const searchTerm = searchInput.value.toLowerCase();
  
  let filteredExpenses = appData.expenses;
  
  if (categoryFilterValue) {
    filteredExpenses = filteredExpenses.filter(expense => 
      expense.category === categoryFilterValue
    );
  }
  
  if (searchTerm) {
    filteredExpenses = filteredExpenses.filter(expense => 
      expense.description.toLowerCase().includes(searchTerm) ||
      expense.category.toLowerCase().includes(searchTerm)
    );
  }
  
  updateExpensesTable(filteredExpenses);
};

// Tab navigation
const switchTab = (tabName) => {
  // Hide all tab contents
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Remove active class from all nav tabs
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Show selected tab content
  const selectedTab = document.getElementById(tabName);
  if (selectedTab) {
    selectedTab.classList.add('active');
  }
  
  // Add active class to selected nav tab
  const selectedNavTab = document.querySelector(`[data-tab="${tabName}"]`);
  if (selectedNavTab) {
    selectedNavTab.classList.add('active');
  }
  
  // Update data if necessary
  if (tabName === 'summary') {
    updateCategoryBreakdown();
    updateSpendingInsights();
  } else if (tabName === 'expenses') {
    updateExpensesTable();
  }
};

// Update all data and UI
const updateAllData = () => {
  updateSummaryCards();
  updateEmptyStates();
  updateCharts();
  
  // Update expenses table if on expenses tab
  const expensesTab = document.getElementById('expenses');
  if (expensesTab && expensesTab.classList.contains('active')) {
    updateExpensesTable();
  }
  
  // Update summary if on summary tab
  const summaryTab = document.getElementById('summary');
  if (summaryTab && summaryTab.classList.contains('active')) {
    updateCategoryBreakdown();
    updateSpendingInsights();
  }
};

// Initialize app
const initializeApp = () => {
  console.log('Initializing Expense Tracker Pro...');
  
  // Set default date to today
  const dateInput = document.getElementById('expenseDate');
  if (dateInput) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }
  
  // Populate category dropdowns
  const categorySelects = [
    document.getElementById('expenseCategory'),
    document.getElementById('categoryFilter')
  ];
  
  categorySelects.forEach(select => {
    if (!select) return;
    
    if (select.id === 'categoryFilter') {
      // Add "All Categories" option for filter
      select.innerHTML = '<option value="">All Categories</option>';
    } else {
      select.innerHTML = '<option value="">Select a category</option>';
    }
    
    appData.categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      select.appendChild(option);
    });
  });
  
  // Initialize UI
  updateAllData();
  
  // Event listeners
  
  // Tab navigation
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const tabName = e.target.getAttribute('data-tab');
      if (tabName) {
        switchTab(tabName);
      }
    });
  });
  
  // Add expense buttons
  const addExpenseBtn = document.getElementById('addExpenseBtn');
  if (addExpenseBtn) {
    addExpenseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openAddExpenseModal();
    });
  }
  
  const addFirstExpenseBtn = document.getElementById('addFirstExpenseBtn');
  if (addFirstExpenseBtn) {
    addFirstExpenseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openAddExpenseModal();
    });
  }
  
  // Expense form submission
  const expenseForm = document.getElementById('expenseForm');
  if (expenseForm) {
    expenseForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const amountInput = document.getElementById('expenseAmount');
      const categorySelect = document.getElementById('expenseCategory');
      const descriptionInput = document.getElementById('expenseDescription');
      const dateInput = document.getElementById('expenseDate');
      
      if (!amountInput || !categorySelect || !descriptionInput || !dateInput) return;
      
      const formData = {
        amount: amountInput.value,
        category: categorySelect.value,
        description: descriptionInput.value,
        date: dateInput.value
      };
      
      if (appData.currentEditId) {
        updateExpense(appData.currentEditId, formData);
      } else {
        addExpense(formData);
      }
      
      hideModal('expenseModal');
      resetExpenseForm();
    });
  }
  
  // Modal close buttons
  const closeModalBtn = document.getElementById('closeModal');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', (e) => {
      e.preventDefault();
      hideModal('expenseModal');
      resetExpenseForm();
    });
  }
  
  const cancelBtn = document.getElementById('cancelBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', (e) => {
      e.preventDefault();
      hideModal('expenseModal');
      resetExpenseForm();
    });
  }
  
  // Delete confirmation
  const confirmDeleteBtn = document.getElementById('confirmDelete');
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (appData.currentDeleteId) {
        removeExpense(appData.currentDeleteId);
        appData.currentDeleteId = null;
      }
      hideModal('deleteModal');
    });
  }
  
  const cancelDeleteBtn = document.getElementById('cancelDelete');
  if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener('click', (e) => {
      e.preventDefault();
      appData.currentDeleteId = null;
      hideModal('deleteModal');
    });
  }
  
  // Filter and search
  const categoryFilter = document.getElementById('categoryFilter');
  if (categoryFilter) {
    categoryFilter.addEventListener('change', filterExpenses);
  }
  
  const searchInput = document.getElementById('searchExpenses');
  if (searchInput) {
    searchInput.addEventListener('input', filterExpenses);
  }
  
  // Modal click outside to close
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      if (e.target.id === 'expenseModal') {
        hideModal('expenseModal');
        resetExpenseForm();
      } else if (e.target.id === 'deleteModal') {
        hideModal('deleteModal');
        appData.currentDeleteId = null;
      }
    }
  });
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const visibleModal = document.querySelector('.modal:not(.hidden)');
      if (visibleModal) {
        hideModal(visibleModal.id);
        if (visibleModal.id === 'expenseModal') {
          resetExpenseForm();
        } else if (visibleModal.id === 'deleteModal') {
          appData.currentDeleteId = null;
        }
      }
    }
  });
  
  console.log('Expense Tracker Pro initialized successfully with empty state!');
};

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);