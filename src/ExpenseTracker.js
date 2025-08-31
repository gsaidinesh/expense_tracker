import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, Calendar, Tag, BarChart3, Download, Settings, Home } from 'lucide-react';

const ExpenseTracker = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState(['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Other']);
  const [newExpense, setNewExpense] = useState({
    amount: '',
    description: '',
    category: 'Food',
    date: new Date().toISOString().split('T')[0]
  });
  const [editingId, setEditingId] = useState(null);
  const [editingExpense, setEditingExpense] = useState({});
  const [newCategory, setNewCategory] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Load sample data
  useEffect(() => {
    if (expenses.length === 0) {
      const sampleExpenses = [
        { id: 1, amount: 450.50, description: 'Lunch at cafe', category: 'Food', date: '2024-08-05' },
        { id: 2, amount: 80.00, description: 'Auto fare', category: 'Transportation', date: '2024-08-04' },
        { id: 3, amount: 800.00, description: 'Movie tickets', category: 'Entertainment', date: '2024-07-30' },
        { id: 4, amount: 1200.00, description: 'Grocery shopping', category: 'Food', date: '2024-08-03' },
        { id: 5, amount: 250.00, description: 'Metro card recharge', category: 'Transportation', date: '2024-08-02' }
      ];
      setExpenses(sampleExpenses);
    }
  }, []);

  // Expense Management Functions
  const addExpense = () => {
    if (newExpense.amount && newExpense.description) {
      const expense = {
        ...newExpense,
        id: Date.now(),
        amount: parseFloat(newExpense.amount)
      };
      setExpenses([...expenses, expense]);
      setNewExpense({
        amount: '',
        description: '',
        category: 'Food',
        date: new Date().toISOString().split('T')[0]
      });
    }
  };

  const deleteExpense = (id) => {
    setExpenses(expenses.filter(expense => expense.id !== id));
  };

  const startEdit = (expense) => {
    setEditingId(expense.id);
    setEditingExpense({...expense});
  };

  const saveEdit = () => {
    setExpenses(expenses.map(expense => 
      expense.id === editingId 
        ? {...editingExpense, amount: parseFloat(editingExpense.amount)}
        : expense
    ));
    setEditingId(null);
    setEditingExpense({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingExpense({});
  };

  // Category Management
  const addCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setNewCategory('');
      setShowAddCategory(false);
    }
  };

  const removeCategory = (categoryToRemove) => {
    if (categories.length > 1) {
      setCategories(categories.filter(cat => cat !== categoryToRemove));
      setExpenses(expenses.map(expense => 
        expense.category === categoryToRemove 
          ? {...expense, category: 'Other'}
          : expense
      ));
    }
  };

  // Filtering Functions
  const getFilteredExpenses = () => {
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const expenseMonth = (expenseDate.getMonth() + 1).toString().padStart(2, '0');
      const expenseYear = expenseDate.getFullYear().toString();
      
      const matchesMonth = !filterMonth || expenseMonth === filterMonth;
      const matchesYear = !filterYear || expenseYear === filterYear;
      const matchesCategory = !filterCategory || expense.category === filterCategory;
      
      return matchesMonth && matchesYear && matchesCategory;
    });
  };

  const getTotalAmount = () => {
    return getFilteredExpenses().reduce((total, expense) => total + expense.amount, 0);
  };

  const getCategoryTotals = () => {
    const filteredExpenses = getFilteredExpenses();
    const categoryTotals = {};
    
    filteredExpenses.forEach(expense => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });
    
    return categoryTotals;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // CSV Export Function
  const downloadCSV = () => {
    const filteredExpenses = getFilteredExpenses();
    
    if (filteredExpenses.length === 0) {
      alert('No expenses to download for the selected filters.');
      return;
    }

    const csvHeader = 'Date,Description,Category,Amount\n';
    const csvRows = filteredExpenses.map(expense => 
      `${expense.date},"${expense.description}",${expense.category},${expense.amount}`
    ).join('\n');

    const categoryTotals = getCategoryTotals();
    const csvSummary = '\n\nSUMMARY\n' + 
      Object.entries(categoryTotals).map(([category, total]) => 
        `"${category} Total:",,,${total.toFixed(2)}`
      ).join('\n') + 
      `\n"GRAND TOTAL:",,,${getTotalAmount().toFixed(2)}`;

    const csvContent = csvHeader + csvRows + csvSummary;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    let filename = 'expenses';
    if (filterYear) filename += `_${filterYear}`;
    if (filterMonth) filename += `_${filterMonth}`;
    filename += '.csv';
    
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('CSV file downloaded successfully!');
  };

  // Analytics Functions
  const getCategoryAnalytics = () => {
    const categoryData = {};
    expenses.forEach(expense => {
      if (!categoryData[expense.category]) {
        categoryData[expense.category] = { 
          category: expense.category, 
          total: 0, 
          count: 0,
          percentage: 0
        };
      }
      categoryData[expense.category].total += expense.amount;
      categoryData[expense.category].count += 1;
    });

    const totalAmount = Object.values(categoryData).reduce((sum, cat) => sum + cat.total, 0);
    
    return Object.values(categoryData).map(cat => ({
      ...cat,
      percentage: totalAmount > 0 ? ((cat.total / totalAmount) * 100).toFixed(1) : 0
    })).sort((a, b) => b.total - a.total);
  };

  const getTopExpenses = () => {
    return [...expenses]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  };

  const getAverageSpending = () => {
    if (expenses.length === 0) return { daily: 0, weekly: 0, monthly: 0 };

    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const oldestDate = new Date(Math.min(...expenses.map(e => new Date(e.date))));
    const newestDate = new Date(Math.max(...expenses.map(e => new Date(e.date))));
    const daysDiff = Math.max(1, (newestDate - oldestDate) / (1000 * 60 * 60 * 24));

    return {
      daily: totalAmount / daysDiff,
      weekly: (totalAmount / daysDiff) * 7,
      monthly: (totalAmount / daysDiff) * 30
    };
  };

  const months = [
    { value: '01', label: 'January' }, { value: '02', label: 'February' }, { value: '03', label: 'March' },
    { value: '04', label: 'April' }, { value: '05', label: 'May' }, { value: '06', label: 'June' },
    { value: '07', label: 'July' }, { value: '08', label: 'August' }, { value: '09', label: 'September' },
    { value: '10', label: 'October' }, { value: '11', label: 'November' }, { value: '12', label: 'December' }
  ];

  const years = [...new Set(expenses.map(expense => new Date(expense.date).getFullYear()))].sort((a, b) => b - a);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'expenses', label: 'Manage Expenses', icon: Plus },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'export', label: 'Export Data', icon: Download },
    { id: 'categories', label: 'Categories', icon: Tag },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl text-white">
                <h3 className="text-blue-100 text-sm">Total Expenses</h3>
                <p className="text-2xl font-bold">{formatCurrency(expenses.reduce((sum, e) => sum + e.amount, 0))}</p>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl text-white">
                <h3 className="text-green-100 text-sm">Monthly Avg</h3>
                <p className="text-2xl font-bold">{formatCurrency(getAverageSpending().monthly)}</p>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl text-white">
                <h3 className="text-purple-100 text-sm">Total Count</h3>
                <p className="text-2xl font-bold">{expenses.length}</p>
              </div>
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-xl text-white">
                <h3 className="text-orange-100 text-sm">Categories</h3>
                <p className="text-2xl font-bold">{categories.length}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Quick Add Expense
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="number"
                  step="0.01"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Amount (₹)"
                />
                <input
                  type="text"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Description"
                />
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <button
                  onClick={addExpense}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Add Expense
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Recent Expenses</h3>
              <div className="space-y-3">
                {expenses.slice(-5).reverse().map(expense => (
                  <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-sm text-gray-600">{expense.date} • {expense.category}</p>
                    </div>
                    <p className="font-bold text-green-600">{formatCurrency(expense.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'expenses':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add New Expense
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="What did you spend on?"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <button
                onClick={addExpense}
                className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Expense
              </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold">
                  All Expenses ({expenses.length} items)
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-4 font-medium text-gray-700">Date</th>
                      <th className="text-left p-4 font-medium text-gray-700">Description</th>
                      <th className="text-left p-4 font-medium text-gray-700">Category</th>
                      <th className="text-right p-4 font-medium text-gray-700">Amount (₹)</th>
                      <th className="text-right p-4 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map(expense => (
                      <tr key={expense.id} className="border-b border-gray-100 hover:bg-gray-50">
                        {editingId === expense.id ? (
                          <>
                            <td className="p-4">
                              <input
                                type="date"
                                value={editingExpense.date}
                                onChange={(e) => setEditingExpense({...editingExpense, date: e.target.value})}
                                className="w-full p-2 border border-gray-300 rounded"
                              />
                            </td>
                            <td className="p-4">
                              <input
                                type="text"
                                value={editingExpense.description}
                                onChange={(e) => setEditingExpense({...editingExpense, description: e.target.value})}
                                className="w-full p-2 border border-gray-300 rounded"
                              />
                            </td>
                            <td className="p-4">
                              <select
                                value={editingExpense.category}
                                onChange={(e) => setEditingExpense({...editingExpense, category: e.target.value})}
                                className="w-full p-2 border border-gray-300 rounded"
                              >
                                {categories.map(category => (
                                  <option key={category} value={category}>{category}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-4 text-right">
                              <input
                                type="number"
                                step="0.01"
                                value={editingExpense.amount}
                                onChange={(e) => setEditingExpense({...editingExpense, amount: e.target.value})}
                                className="w-full p-2 border border-gray-300 rounded text-right"
                              />
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={saveEdit}
                                  className="p-2 text-green-600 hover:bg-green-100 rounded"
                                >
                                  <Save className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-4 text-gray-600">{expense.date}</td>
                            <td className="p-4 font-medium">{expense.description}</td>
                            <td className="p-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {expense.category}
                              </span>
                            </td>
                            <td className="p-4 text-right font-medium text-green-600">{formatCurrency(expense.amount)}</td>
                            <td className="p-4 text-right">
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => startEdit(expense)}
                                  className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteExpense(expense.id)}
                                  className="p-2 text-red-600 hover:bg-red-100 rounded"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'analytics':
        const categoryData = getCategoryAnalytics();
        const topExpenses = getTopExpenses();
        const averages = getAverageSpending();

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-6 rounded-xl text-white">
                <h4 className="text-indigo-100 text-sm">Daily Average</h4>
                <p className="text-2xl font-bold">{formatCurrency(averages.daily)}</p>
              </div>
              <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 p-6 rounded-xl text-white">
                <h4 className="text-cyan-100 text-sm">Weekly Average</h4>
                <p className="text-2xl font-bold">{formatCurrency(averages.weekly)}</p>
              </div>
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 rounded-xl text-white">
                <h4 className="text-emerald-100 text-sm">Monthly Average</h4>
                <p className="text-2xl font-bold">{formatCurrency(averages.monthly)}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Spending Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Category Breakdown</h4>
                  <div className="space-y-3">
                    {categoryData.map((category, index) => (
                      <div key={category.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'][index % 6] }}
                          ></div>
                          <span className="font-medium">{category.category}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{formatCurrency(category.total)}</p>
                          <p className="text-sm text-gray-600">{category.percentage}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Top 5 Expenses</h4>
                  <div className="space-y-3">
                    {topExpenses.map((expense, index) => (
                      <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{expense.description}</p>
                            <p className="text-xs text-gray-600">{expense.date}</p>
                          </div>
                        </div>
                        <p className="font-bold text-green-600">{formatCurrency(expense.amount)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'export':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export Your Data
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Month</label>
                  <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Months</option>
                    {months.map(month => (
                      <option key={month.value} value={month.value}>{month.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Year</label>
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Years</option>
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Category</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex gap-4 mb-4">
                <button
                  onClick={downloadCSV}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export to CSV ({getFilteredExpenses().length} expenses)
                </button>
                
                <button
                  onClick={() => {setFilterMonth(''); setFilterYear(''); setFilterCategory('');}}
                  className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Clear Filters
                </button>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Export Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(getTotalAmount())}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Expense Count</p>
                    <p className="text-lg font-bold">{getFilteredExpenses().length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'categories':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Manage Categories
              </h3>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {categories.map(category => (
                  <div key={category} className="flex items-center gap-2 bg-blue-100 px-3 py-2 rounded-lg border">
                    <span className="text-blue-800 font-medium">{category}</span>
                    {categories.length > 1 && (
                      <button
                        onClick={() => removeCategory(category)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              {showAddCategory ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="New category name"
                    onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                  />
                  <button
                    onClick={addCategory}
                    className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {setShowAddCategory(false); setNewCategory('');}}
                    className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddCategory(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add New Category
                </button>
              )}
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Category Usage Analytics</h3>
              <div className="space-y-4">
                {getCategoryAnalytics().map((category) => (
                  <div key={category.category} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{category.category}</h4>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{formatCurrency(category.total)}</p>
                        <p className="text-sm text-gray-600">{category.percentage}% of total</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${category.percentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-2 text-sm text-gray-600">
                      <span>{category.count} transactions</span>
                      <span>Avg: {formatCurrency(category.total / category.count)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Application Settings
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700">App Information</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Version:</span>
                      <span className="font-medium">2.1.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Expenses:</span>
                      <span className="font-medium">{expenses.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Categories:</span>
                      <span className="font-medium">{categories.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Currency:</span>
                      <span className="font-medium">Indian Rupee (₹)</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700">Features Available</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Add/Edit/Delete Expenses</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Analytics & Insights</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">CSV Export</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Category Management</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Data Filtering</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-blue-800 font-medium mb-2">Usage Tips</h4>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>Use Dashboard for quick overview and adding expenses</li>
                  <li>Manage Expenses tab for detailed operations</li>
                  <li>Analytics shows spending patterns and insights</li>
                  <li>Export Data for CSV downloads with filters</li>
                  <li>Categories to customize your spending categories</li>
                </ul>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Calendar className="w-8 h-8" />
            Enhanced Expense Tracker
          </h1>
          <p className="mt-2 opacity-90">Professional expense management with analytics and export features</p>
        </div>

        {/* Horizontal Navigation */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="p-4">
            <nav className="flex flex-wrap justify-center gap-2">
              {tabs.map(tab => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ExpenseTracker;