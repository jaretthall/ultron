// Debug script for testing authentication flow
// Run this in the browser console to clear state and test signin

// Clear all localStorage
console.log('🧹 Clearing localStorage...');
localStorage.clear();

// Clear sessionStorage
console.log('🧹 Clearing sessionStorage...');
sessionStorage.clear();

console.log('✅ Storage cleared. Now refresh the page and try signing in again.');
console.log('👉 Use email: justclay63@gmail.com, password: t4mhozd25q');

// You can also call this to debug the users table:
// window.debugUsersTable && window.debugUsersTable();