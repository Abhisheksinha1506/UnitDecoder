const { searchUnits } = require('../utils/search');
const db = require('../db/database');

/**
 * Test search functionality
 */
async function testSearch() {
  console.log('🧪 Testing search functionality...\n');
  
  const testCases = [
    {
      query: 'tola',
      description: 'Exact match for Indian unit',
      expected: 'Should find Tola unit'
    },
    {
      query: 'toolah',
      description: 'Phonetic match (misspelling)',
      expected: 'Should find Tola via phonetic matching'
    },
    {
      query: 'dozen',
      description: 'Counting unit',
      expected: 'Should find Dozen unit'
    },
    {
      query: 'nonexistent',
      description: 'Non-existent unit',
      expected: 'Should return empty results'
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    try {
      console.log(`🔍 Testing: "${testCase.query}"`);
      console.log(`   Description: ${testCase.description}`);
      console.log(`   Expected: ${testCase.expected}`);
      
      const results = searchUnits(testCase.query);
      
      if (testCase.query === 'nonexistent') {
        if (results.length === 0) {
          console.log(`   ✅ PASS: No results as expected`);
          passed++;
        } else {
          console.log(`   ❌ FAIL: Expected no results, got ${results.length}`);
          failed++;
        }
      } else {
        if (results.length > 0) {
          console.log(`   ✅ PASS: Found ${results.length} result(s)`);
          console.log(`   📋 First result: ${results[0].name} (${results[0].category})`);
          passed++;
        } else {
          console.log(`   ❌ FAIL: Expected results, got none`);
          failed++;
        }
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      failed++;
    }
    
    console.log('');
  }
  
  console.log('📊 Test Results:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed > 0) {
    console.log('\n⚠️  Some tests failed. Check database seeding and search implementation.');
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed!');
  }
}

// Run if called directly
if (require.main === module) {
  testSearch().catch(error => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
}

module.exports = { testSearch };
