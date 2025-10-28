// Modern Library Management System - Enhanced JavaScript
const API = {
  users: 'http://127.0.0.1:8001',
  books: 'http://127.0.0.1:8002',
  orchestrator: 'http://127.0.0.1:8000'
};

// Utility Functions
function setOutput(el, data) {
  const output = document.getElementById('orchestrator-output');
  if (typeof data === 'string') {
    output.textContent = data;
  } else {
    output.textContent = JSON.stringify(data, null, 2);
  }
}

function showLoading(element, message = 'Loading...') {
  element.innerHTML = `<div class="loading">${message}</div>`;
}

function showError(element, message) {
  element.innerHTML = `<div class="error">${message}</div>`;
}

function updateStatusIndicator(service, status) {
  const indicator = document.getElementById(`${service}-status`);
  if (indicator) {
    indicator.className = `status-dot ${status}`;
  }
}

function updateCount(elementId, count) {
  const countElement = document.getElementById(elementId);
  if (countElement) {
    countElement.textContent = count;
  }
}

async function fetchJson(url, options = {}) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }
    return res.json();
  } catch (error) {
    console.error(`Fetch error for ${url}:`, error);
    throw error;
  }
}

// Enhanced User Management
let usersData = [];
let booksData = [];

async function loadUsers() {
  const list = document.getElementById('users-list');
  showLoading(list, 'Loading users...');
  
  try {
    updateStatusIndicator('users', 'online');
    const data = await fetchJson(`${API.users}/users`);
    usersData = data; // Store for use in forms
    
    list.innerHTML = '';
    if (data.length === 0) {
      list.innerHTML = '<div class="loading">No users found</div>';
      updateCount('users-count', 0);
      return;
    }
    
    data.forEach(user => {
      const item = document.createElement('div');
      item.className = 'list-item';
      item.innerHTML = `
        <i class="fas fa-user"></i>
        <div class="content">
          <div class="title">${user.username}</div>
          <div class="subtitle">ID: ${user.id}</div>
        </div>
        <button class="btn-delete" onclick="deleteUser(${user.id})" title="Delete User">
          <i class="fas fa-trash"></i>
        </button>
      `;
      list.appendChild(item);
    });
    
    updateCount('users-count', data.length);
    updateUserDropdown(); // Update dropdown when users load
  } catch (error) {
    updateStatusIndicator('users', 'offline');
    showError(list, `Failed to load users: ${error.message}`);
    updateCount('users-count', '?');
  }
}

// Enhanced Book Management
async function loadBooks() {
  const list = document.getElementById('books-list');
  showLoading(list, 'Loading books...');
  
  try {
    updateStatusIndicator('books', 'online');
    const data = await fetchJson(`${API.books}/books`);
    booksData = data; // Store for use in forms
    
    list.innerHTML = '';
    if (data.length === 0) {
      list.innerHTML = '<div class="loading">No books found</div>';
      updateCount('books-count', 0);
      return;
    }
    
    data.forEach(book => {
      const item = document.createElement('div');
      item.className = 'list-item';
      const availabilityClass = book.available_copies > 0 ? 'success' : 'error';
      item.innerHTML = `
        <i class="fas fa-book"></i>
        <div class="content">
          <div class="title">${book.title}</div>
          <div class="subtitle">
            by ${book.author} • 
            <span class="availability ${availabilityClass}">
              ${book.available_copies} copies available
            </span>
          </div>
        </div>
        <button class="btn-delete" onclick="deleteBook(${book.id})" title="Delete Book">
          <i class="fas fa-trash"></i>
        </button>
      `;
      list.appendChild(item);
    });
    
    updateCount('books-count', data.length);
    updateBookDropdowns(); // Update dropdowns when books load
  } catch (error) {
    updateStatusIndicator('books', 'offline');
    showError(list, `Failed to load books: ${error.message}`);
    updateCount('books-count', '?');
  }
}

// Transaction Management
async function loadTransactions() {
  const list = document.getElementById('transactions-list');
  showLoading(list, 'Loading transactions...');
  
  try {
    const data = await fetchJson(`${API.orchestrator.replace('8000', '8003')}/transactions`);
    
    list.innerHTML = '';
    if (data.length === 0) {
      list.innerHTML = '<div class="loading">No transactions found</div>';
      updateCount('transactions-count', 0);
      return;
    }
    
    data.forEach(transaction => {
      const item = document.createElement('div');
      item.className = 'list-item';
      const statusClass = transaction.status === 'returned' ? 'success' : 'warning';
      const statusIcon = transaction.status === 'returned' ? 'fa-check-circle' : 'fa-clock';
      
      item.innerHTML = `
        <i class="fas fa-receipt"></i>
        <div class="content">
          <div class="title">Transaction #${transaction.id}</div>
          <div class="subtitle">
            User ID: ${transaction.user_id} • Book ID: ${transaction.book_id} • 
            <span class="status ${statusClass}">
              <i class="fas ${statusIcon}"></i>
              ${transaction.status.toUpperCase()}
            </span>
          </div>
          <div class="subtitle">
            Issued: ${new Date(transaction.issued_at).toLocaleString()} • 
            ${transaction.returned_at ? `Returned: ${new Date(transaction.returned_at).toLocaleString()}` : 'Not returned'}
          </div>
        </div>
      `;
      list.appendChild(item);
    });
    
    updateCount('transactions-count', data.length);
  } catch (error) {
    showError(list, `Failed to load transactions: ${error.message}`);
    updateCount('transactions-count', '?');
  }
}

// Delete Functions
async function deleteUser(userId) {
  if (!confirm(`Are you sure you want to delete user ID ${userId}? This action cannot be undone.`)) {
    return;
  }
  
  try {
    await fetchJson(`${API.users}/users/${userId}`, { method: 'DELETE' });
    showNotification('User deleted successfully!', 'success');
    loadUsers();
  } catch (error) {
    showNotification(`Failed to delete user: ${error.message}`, 'error');
  }
}

async function deleteBook(bookId) {
  if (!confirm(`Are you sure you want to delete book ID ${bookId}? This action cannot be undone.`)) {
    return;
  }
  
  try {
    await fetchJson(`${API.books}/books/${bookId}`, { method: 'DELETE' });
    showNotification('Book deleted successfully!', 'success');
    loadBooks();
  } catch (error) {
    showNotification(`Failed to delete book: ${error.message}`, 'error');
  }
}

// Dropdown Update Functions
function updateUserDropdown() {
  const userSelect = document.getElementById('issue-user-select');
  if (userSelect) {
    userSelect.innerHTML = '<option value="">Select a user...</option>';
    usersData.forEach(user => {
      const option = document.createElement('option');
      option.value = user.id;
      option.textContent = `${user.username} (ID: ${user.id})`;
      userSelect.appendChild(option);
    });
  }
}

function updateBookDropdowns() {
  // Update issue book dropdown
  const issueBookSelect = document.getElementById('issue-book-select');
  if (issueBookSelect) {
    issueBookSelect.innerHTML = '<option value="">Select a book...</option>';
    booksData.forEach(book => {
      const option = document.createElement('option');
      option.value = book.id;
      option.textContent = `${book.title} by ${book.author} (${book.available_copies} available)`;
      option.disabled = book.available_copies === 0;
      if (book.available_copies === 0) {
        option.textContent += ' - OUT OF STOCK';
      }
      issueBookSelect.appendChild(option);
    });
  }

  // Update return book dropdown
  const returnBookSelect = document.getElementById('return-book-select');
  if (returnBookSelect) {
    returnBookSelect.innerHTML = '<option value="">Select a book...</option>';
    booksData.forEach(book => {
      const option = document.createElement('option');
      option.value = book.id;
      option.textContent = `${book.title} by ${book.author}`;
      returnBookSelect.appendChild(option);
    });
  }
}

// Enhanced Form Handling
function bindForms() {
  // Make status indicators clickable
  document.getElementById('users-status').parentElement.addEventListener('click', async () => {
    await loadUsers();
    showNotification('Users refreshed!', 'success');
  });

  document.getElementById('books-status').parentElement.addEventListener('click', async () => {
    await loadBooks();
    showNotification('Books refreshed!', 'success');
  });

  document.getElementById('system-status').parentElement.addEventListener('click', async () => {
    showNotification('System status checked!', 'info');
  });

  // Refresh buttons
  document.getElementById('refresh-users').addEventListener('click', async () => {
    const btn = document.getElementById('refresh-users');
    const icon = btn.querySelector('i');
    icon.style.animation = 'spin 1s linear infinite';
    await loadUsers();
    icon.style.animation = '';
  });

  document.getElementById('refresh-books').addEventListener('click', async () => {
    const btn = document.getElementById('refresh-books');
    const icon = btn.querySelector('i');
    icon.style.animation = 'spin 1s linear infinite';
    await loadBooks();
    icon.style.animation = '';
  });

  document.getElementById('refresh-transactions').addEventListener('click', async () => {
    const btn = document.getElementById('refresh-transactions');
    const icon = btn.querySelector('i');
    icon.style.animation = 'spin 1s linear infinite';
    await loadTransactions();
    icon.style.animation = '';
  });

  // Add User Form
  document.getElementById('add-user-form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const form = ev.target;
    const button = form.querySelector('button[type="submit"]');
    const originalText = button.innerHTML;
    
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    button.disabled = true;
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    fetchJson(`${API.users}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    .then(() => {
      form.reset();
      loadUsers();
      showNotification('User added successfully!', 'success');
    })
    .catch(error => {
      showNotification(`Failed to add user: ${error.message}`, 'error');
    })
    .finally(() => {
      button.innerHTML = originalText;
      button.disabled = false;
    });
  });

  // Add Book Form
  document.getElementById('add-book-form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const form = ev.target;
    const button = form.querySelector('button[type="submit"]');
    const originalText = button.innerHTML;
    
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    button.disabled = true;
    
    const title = document.getElementById('title').value.trim();
    const author = document.getElementById('author').value.trim();
    const available_copies = Number(document.getElementById('available_copies').value);
    
    fetchJson(`${API.books}/books`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, author, available_copies })
    })
    .then(() => {
      form.reset();
      loadBooks();
      showNotification('Book added successfully!', 'success');
    })
    .catch(error => {
      showNotification(`Failed to add book: ${error.message}`, 'error');
    })
    .finally(() => {
      button.innerHTML = originalText;
      button.disabled = false;
    });
  });

  // Issue Book Form
  document.getElementById('issue-form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const form = ev.target;
    const button = form.querySelector('button[type="submit"]');
    const originalText = button.innerHTML;
    
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    button.disabled = true;
    
    const user_id = Number(document.getElementById('issue-user-select').value);
    const book_id = Number(document.getElementById('issue-book-select').value);
    
    if (!user_id || !book_id) {
      showNotification('Please select both user and book!', 'error');
      button.innerHTML = originalText;
      button.disabled = false;
      return;
    }
    
    try {
      updateStatusIndicator('system', 'online');
      const data = await fetchJson(`${API.orchestrator}/issue-book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id, book_id })
      });
      
      setOutput(data);
      loadBooks(); // Refresh books to show updated availability
      loadTransactions(); // Refresh transactions to show new transaction
      showNotification('Book issued successfully!', 'success');
      form.reset();
    } catch (error) {
      updateStatusIndicator('system', 'offline');
      setOutput(`Issue failed: ${error.message}`);
      showNotification(`Failed to issue book: ${error.message}`, 'error');
    } finally {
      button.innerHTML = originalText;
      button.disabled = false;
    }
  });

  // Return Book Form
  document.getElementById('return-form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const form = ev.target;
    const button = form.querySelector('button[type="submit"]');
    const originalText = button.innerHTML;
    
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    button.disabled = true;
    
    const transaction_id = Number(document.getElementById('return-tx-id').value);
    const book_id = Number(document.getElementById('return-book-select').value);
    
    if (!transaction_id || !book_id) {
      showNotification('Please enter transaction ID and select a book!', 'error');
      button.innerHTML = originalText;
      button.disabled = false;
      return;
    }
    
    try {
      updateStatusIndicator('system', 'online');
      const data = await fetchJson(`${API.orchestrator}/return-book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction_id, book_id })
      });
      
      setOutput(data);
      loadBooks(); // Refresh books to show updated availability
      loadTransactions(); // Refresh transactions to show updated status
      showNotification('Book returned successfully!', 'success');
      form.reset();
    } catch (error) {
      updateStatusIndicator('system', 'offline');
      setOutput(`Return failed: ${error.message}`);
      showNotification(`Failed to return book: ${error.message}`, 'error');
    } finally {
      button.innerHTML = originalText;
      button.disabled = false;
    }
  });
}

// Notification System
function showNotification(message, type = 'info') {
  // Remove existing notifications
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();
  
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
    <span>${message}</span>
    <button onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  // Add notification styles
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#4ade80' : type === 'error' ? '#f87171' : '#60a5fa'};
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    display: flex;
    align-items: center;
    gap: 8px;
    z-index: 1000;
    animation: slideInRight 0.3s ease-out;
    max-width: 300px;
  `;
  
  notification.querySelector('button').style.cssText = `
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    padding: 0;
    margin-left: 8px;
  `;
  
  document.body.appendChild(notification);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }
  }, 5000);
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .availability.success { color: #4ade80; }
  .availability.error { color: #f87171; }
`;
document.head.appendChild(style);

// Initialize Application
window.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Library Management System initialized');
  
  // Bind all form handlers
  bindForms();
  
  // Load initial data
  try {
    await Promise.all([loadUsers(), loadBooks(), loadTransactions()]);
    showNotification('System connected successfully!', 'success');
  } catch (error) {
    console.error('Initialization error:', error);
    showNotification('Some services may be unavailable', 'error');
  }
  
  // Periodic health check
  setInterval(async () => {
    try {
      await fetchJson(`${API.users}/users`);
      updateStatusIndicator('users', 'online');
    } catch {
      updateStatusIndicator('users', 'offline');
    }
    
    try {
      await fetchJson(`${API.books}/books`);
      updateStatusIndicator('books', 'online');
    } catch {
      updateStatusIndicator('books', 'offline');
    }
  }, 30000); // Check every 30 seconds
});