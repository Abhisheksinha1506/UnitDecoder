#!/usr/bin/env node

/**
 * Comprehensive test script for Unit Decoder
 * Tests database, API endpoints, search functionality, and all features
 */

const axios = require('axios');
const db = require('../db/database');

class UnitDecoderTester {
    constructor() {
        this.baseUrl = 'http://localhost:3000';
        this.testResults = {
            passed: 0,
            failed: 0,
            errors: []
        };
    }

    async runAllTests() {
        console.log('🧪 Starting comprehensive Unit Decoder tests...\n');
        
        try {
            // Test 1: Database connectivity and structure
            await this.testDatabase();
            
            // Test 2: API health check
            await this.testAPIHealth();
            
            // Test 3: Search functionality
            await this.testSearchFunctionality();
            
            // Test 4: Unit details API
            await this.testUnitDetails();
            
            // Test 5: Category filtering
            await this.testCategoryFiltering();
            
            // Test 6: Conversion functionality
            await this.testConversion();
            
            // Test 7: Database content verification
            await this.testDatabaseContent();
            
            // Test 8: Search edge cases
            await this.testSearchEdgeCases();
            
            // Test 9: Performance tests
            await this.testPerformance();
            
            // Test 10: New comprehensive units
            await this.testNewUnits();
            
            this.printResults();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
            process.exit(1);
        }
    }

    async testDatabase() {
        console.log('📊 Testing database connectivity and structure...');
        
        try {
            const conn = db.getConnection();
            
            // Test basic queries
            const totalUnits = conn.prepare('SELECT COUNT(*) as count FROM units').get();
            const totalAliases = conn.prepare('SELECT COUNT(*) as count FROM aliases').get();
            
            this.assert(totalUnits.count > 0, `Database should have units (found: ${totalUnits.count})`);
            this.assert(totalAliases.count > 0, `Database should have aliases (found: ${totalAliases.count})`);
            
            // Test table structure
            const unitsSchema = conn.prepare("PRAGMA table_info(units)").all();
            const aliasesSchema = conn.prepare("PRAGMA table_info(aliases)").all();
            
            this.assert(unitsSchema.length > 0, 'Units table should exist');
            this.assert(aliasesSchema.length > 0, 'Aliases table should exist');
            
            console.log('✅ Database tests passed');
            
        } catch (error) {
            this.fail('Database test failed', error);
        }
    }

    async testAPIHealth() {
        console.log('🏥 Testing API health check...');
        
        try {
            const response = await axios.get(`${this.baseUrl}/api/health`);
            
            this.assert(response.status === 200, 'Health endpoint should return 200');
            this.assert(response.data.status === 'ok', 'Health status should be ok');
            this.assert(response.data.version === '1.0.0', 'Version should be 1.0.0');
            
            console.log('✅ API health tests passed');
            
        } catch (error) {
            this.fail('API health test failed', error);
        }
    }

    async testSearchFunctionality() {
        console.log('🔍 Testing search functionality...');
        
        const testQueries = [
            { query: 'gram', expectedMin: 1, description: 'Basic metric unit' },
            { query: 'kilogram', expectedMin: 1, description: 'Common metric unit' },
            { query: 'meter', expectedMin: 1, description: 'Length unit' },
            { query: 'liter', expectedMin: 1, description: 'Volume unit' },
            { query: 'tola', expectedMin: 1, description: 'Historical unit' },
            { query: 'watt', expectedMin: 1, description: 'Power unit' },
            { query: 'joule', expectedMin: 1, description: 'Energy unit' },
            { query: 'pascal', expectedMin: 1, description: 'Pressure unit' },
            { query: 'hertz', expectedMin: 1, description: 'Frequency unit' },
            { query: 'byte', expectedMin: 1, description: 'Data storage unit' }
        ];
        
        for (const test of testQueries) {
            try {
                const response = await axios.get(`${this.baseUrl}/api/search?q=${encodeURIComponent(test.query)}`);
                
                this.assert(response.status === 200, `Search for "${test.query}" should return 200`);
                this.assert(Array.isArray(response.data), `Search for "${test.query}" should return array`);
                this.assert(response.data.length >= test.expectedMin, 
                    `Search for "${test.query}" should return at least ${test.expectedMin} results (got ${response.data.length})`);
                
                // Check result structure
                if (response.data.length > 0) {
                    const result = response.data[0];
                    this.assert(result.id, `Search result should have id`);
                    this.assert(result.name, `Search result should have name`);
                    this.assert(result.category, `Search result should have category`);
                    this.assert(result.base_unit, `Search result should have base_unit`);
                }
                
            } catch (error) {
                this.fail(`Search test failed for "${test.query}"`, error);
            }
        }
        
        console.log('✅ Search functionality tests passed');
    }

    async testUnitDetails() {
        console.log('📋 Testing unit details API...');
        
        try {
            // First get a unit ID from search
            const searchResponse = await axios.get(`${this.baseUrl}/api/search?q=gram`);
            this.assert(searchResponse.data.length > 0, 'Should have search results to test unit details');
            
            const unitId = searchResponse.data[0].id;
            
            // Test unit details endpoint
            const response = await axios.get(`${this.baseUrl}/api/units/${unitId}`);
            
            this.assert(response.status === 200, 'Unit details should return 200');
            this.assert(response.data.id === unitId, 'Unit ID should match');
            this.assert(response.data.name, 'Unit should have name');
            this.assert(response.data.category, 'Unit should have category');
            this.assert(response.data.base_unit, 'Unit should have base_unit');
            this.assert(response.data.conversion_factor, 'Unit should have conversion_factor');
            
            console.log('✅ Unit details tests passed');
            
        } catch (error) {
            this.fail('Unit details test failed', error);
        }
    }

    async testCategoryFiltering() {
        console.log('🏷️ Testing category filtering...');
        
        const categories = ['Mass', 'Volume', 'Length', 'Time', 'Energy', 'Pressure', 'Speed'];
        
        for (const category of categories) {
            try {
                const response = await axios.get(`${this.baseUrl}/api/units/category/${category}`);
                
                this.assert(response.status === 200, `Category "${category}" should return 200`);
                this.assert(Array.isArray(response.data), `Category "${category}" should return array`);
                
                // Verify all results are in the correct category
                for (const unit of response.data) {
                    this.assert(unit.category === category, 
                        `Unit "${unit.name}" should be in category "${category}"`);
                }
                
            } catch (error) {
                this.fail(`Category filtering test failed for "${category}"`, error);
            }
        }
        
        console.log('✅ Category filtering tests passed');
    }

    async testConversion() {
        console.log('🔄 Testing conversion functionality...');
        
        try {
            // First get unit IDs from search
            const gramResponse = await axios.get(`${this.baseUrl}/api/search?q=gram`);
            const kilogramResponse = await axios.get(`${this.baseUrl}/api/search?q=kilogram`);
            const meterResponse = await axios.get(`${this.baseUrl}/api/search?q=meter`);
            const centimeterResponse = await axios.get(`${this.baseUrl}/api/search?q=centimeter`);
            
            this.assert(gramResponse.data.length > 0, 'Should find Gram unit');
            this.assert(kilogramResponse.data.length > 0, 'Should find Kilogram unit');
            this.assert(meterResponse.data.length > 0, 'Should find Meter unit');
            this.assert(centimeterResponse.data.length > 0, 'Should find Centimeter unit');
            
            const gramId = gramResponse.data[0].id;
            const kilogramId = kilogramResponse.data[0].id;
            const meterId = meterResponse.data[0].id;
            const centimeterId = centimeterResponse.data[0].id;
            
            const conversionTests = [
                {
                    fromUnitId: gramId,
                    toUnitId: kilogramId,
                    value: 1000,
                    expected: 1,
                    description: 'Gram to Kilogram'
                },
                {
                    fromUnitId: meterId,
                    toUnitId: centimeterId,
                    value: 1,
                    expected: 100,
                    description: 'Meter to Centimeter'
                }
            ];
            
            for (const test of conversionTests) {
                try {
                    const response = await axios.post(`${this.baseUrl}/api/convert`, {
                        fromUnitId: test.fromUnitId,
                        toUnitId: test.toUnitId,
                        value: test.value
                    });
                    
                    this.assert(response.status === 200, `Conversion should return 200 for ${test.description}`);
                    this.assert(response.data.result !== undefined, 
                        `Conversion should return result for ${test.description}`);
                    this.assert(response.data.formula, 
                        `Conversion should return formula for ${test.description}`);
                    
                    // Check if conversion is approximately correct (within 1% tolerance)
                    const tolerance = 0.01;
                    const actual = response.data.result;
                    const expected = test.expected;
                    const difference = Math.abs(actual - expected) / expected;
                    
                    this.assert(difference < tolerance, 
                        `Conversion ${test.description} should be approximately correct (expected: ${expected}, got: ${actual})`);
                    
                } catch (error) {
                    this.fail(`Conversion test failed for ${test.description}`, error);
                }
            }
            
            console.log('✅ Conversion tests passed');
            
        } catch (error) {
            this.fail('Conversion test setup failed', error);
        }
    }

    async testDatabaseContent() {
        console.log('📚 Testing database content...');
        
        try {
            const conn = db.getConnection();
            
            // Test category distribution
            const categories = conn.prepare(`
                SELECT category, COUNT(*) as count 
                FROM units 
                GROUP BY category 
                ORDER BY count DESC
            `).all();
            
            this.assert(categories.length > 10, `Should have at least 10 categories (found: ${categories.length})`);
            
            // Test that we have the new comprehensive units
            const expectedCategories = ['Volume', 'Time', 'Speed', 'Pressure', 'Energy', 'Power', 'Electrical', 'Frequency', 'Data Storage', 'Angle', 'Force'];
            
            for (const expectedCategory of expectedCategories) {
                const categoryExists = categories.find(cat => cat.category === expectedCategory);
                this.assert(categoryExists, `Should have category "${expectedCategory}"`);
                this.assert(categoryExists.count > 0, `Category "${expectedCategory}" should have units`);
            }
            
            // Test total unit count
            const totalUnits = conn.prepare('SELECT COUNT(*) as count FROM units').get();
            this.assert(totalUnits.count >= 100, `Should have at least 100 units (found: ${totalUnits.count})`);
            
            // Test aliases
            const totalAliases = conn.prepare('SELECT COUNT(*) as count FROM aliases').get();
            this.assert(totalAliases.count > 0, `Should have aliases (found: ${totalAliases.count})`);
            
            console.log('✅ Database content tests passed');
            
        } catch (error) {
            this.fail('Database content test failed', error);
        }
    }

    async testSearchEdgeCases() {
        console.log('🔍 Testing search edge cases...');
        
        const edgeCases = [
            { query: '', description: 'Empty query' },
            { query: '   ', description: 'Whitespace only' },
            { query: 'nonexistentunit123', description: 'Non-existent unit' },
            { query: 'a', description: 'Single character' },
            { query: '123', description: 'Numbers only' },
            { query: '!@#$%', description: 'Special characters' }
        ];
        
        for (const test of edgeCases) {
            try {
                const response = await axios.get(`${this.baseUrl}/api/search?q=${encodeURIComponent(test.query)}`);
                
                this.assert(response.status === 200, `Search should return 200 for ${test.description}`);
                this.assert(Array.isArray(response.data), `Search should return array for ${test.description}`);
                
                // Empty or invalid queries should return empty array
                if (test.query.trim() === '' || test.query === 'nonexistentunit123') {
                    this.assert(response.data.length === 0, 
                        `Search for "${test.description}" should return empty array`);
                }
                
            } catch (error) {
                this.fail(`Search edge case test failed for "${test.description}"`, error);
            }
        }
        
        console.log('✅ Search edge cases tests passed');
    }

    async testPerformance() {
        console.log('⚡ Testing performance...');
        
        try {
            const startTime = Date.now();
            
            // Test search performance
            const searchPromises = [];
            for (let i = 0; i < 10; i++) {
                searchPromises.push(axios.get(`${this.baseUrl}/api/search?q=gram`));
            }
            
            await Promise.all(searchPromises);
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            this.assert(duration < 5000, `10 concurrent searches should complete in under 5 seconds (took: ${duration}ms)`);
            
            // Test individual search speed
            const singleSearchStart = Date.now();
            await axios.get(`${this.baseUrl}/api/search?q=meter`);
            const singleSearchDuration = Date.now() - singleSearchStart;
            
            this.assert(singleSearchDuration < 1000, `Single search should complete in under 1 second (took: ${singleSearchDuration}ms)`);
            
            console.log('✅ Performance tests passed');
            
        } catch (error) {
            this.fail('Performance test failed', error);
        }
    }

    async testNewUnits() {
        console.log('🆕 Testing new comprehensive units...');
        
        const newUnitTests = [
            { query: 'gigabyte', category: 'Data Storage' },
            { query: 'watt', category: 'Power' },
            { query: 'joule', category: 'Energy' },
            { query: 'pascal', category: 'Pressure' },
            { query: 'hertz', category: 'Frequency' },
            { query: 'newton', category: 'Force' },
            { query: 'ampere', category: 'Electrical' },
            { query: 'gallon', category: 'Volume' },
            { query: 'hour', category: 'Time' },
            { query: 'degree', category: 'Angle' }
        ];
        
        for (const test of newUnitTests) {
            try {
                const response = await axios.get(`${this.baseUrl}/api/search?q=${test.query}`);
                
                this.assert(response.status === 200, `Search for "${test.query}" should return 200`);
                this.assert(response.data.length > 0, `Search for "${test.query}" should return results`);
                
                const unit = response.data.find(u => u.name.toLowerCase().includes(test.query.toLowerCase()));
                this.assert(unit, `Should find unit for "${test.query}"`);
                this.assert(unit.category === test.category, 
                    `Unit "${test.query}" should be in category "${test.category}"`);
                
            } catch (error) {
                this.fail(`New unit test failed for "${test.query}"`, error);
            }
        }
        
        console.log('✅ New units tests passed');
    }

    assert(condition, message) {
        if (condition) {
            this.testResults.passed++;
        } else {
            this.testResults.failed++;
            this.testResults.errors.push(message);
            console.error(`❌ ${message}`);
        }
    }

    fail(message, error) {
        this.testResults.failed++;
        this.testResults.errors.push(`${message}: ${error.message}`);
        console.error(`❌ ${message}: ${error.message}`);
    }

    printResults() {
        console.log('\n📊 Test Results Summary:');
        console.log('========================');
        console.log(`✅ Passed: ${this.testResults.passed}`);
        console.log(`❌ Failed: ${this.testResults.failed}`);
        console.log(`📈 Success Rate: ${((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(1)}%`);
        
        if (this.testResults.errors.length > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error}`);
            });
        }
        
        if (this.testResults.failed === 0) {
            console.log('\n🎉 All tests passed! Unit Decoder is working perfectly!');
        } else {
            console.log(`\n⚠️  ${this.testResults.failed} test(s) failed. Please review the errors above.`);
        }
        
        process.exit(this.testResults.failed > 0 ? 1 : 0);
    }
}

// Run tests if script is executed directly
if (require.main === module) {
    const tester = new UnitDecoderTester();
    tester.runAllTests();
}

module.exports = UnitDecoderTester;
