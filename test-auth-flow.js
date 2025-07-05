// Test Authentication Flow
// Run this in your browser console to test the complete flow

console.log('🧪 Starting authentication test...');

// Step 1: Clear all storage
localStorage.clear();
sessionStorage.clear();
console.log('✅ Storage cleared');

// Step 2: Test debug functions
console.log('🔍 Testing debug functions...');
if (typeof debugUsersTable === 'function') {
    console.log('✅ debugUsersTable function available');
} else {
    console.log('❌ debugUsersTable function not available');
}

// Step 3: Check Supabase client status
if (typeof testSupabaseConnection === 'function') {
    console.log('🔗 Testing Supabase connection...');
    testSupabaseConnection().then(result => {
        console.log(result ? '✅ Supabase connection working' : '❌ Supabase connection failed');
    });
} else {
    console.log('❌ testSupabaseConnection function not available');
}

console.log('📋 Next steps:');
console.log('1. Refresh the page');
console.log('2. Sign in with: justclay63@gmail.com / t4mhozd25q');
console.log('3. Watch the console for detailed logs');
console.log('4. Check if home page loads properly');
console.log('5. If successful, run: debugUsersTable()');