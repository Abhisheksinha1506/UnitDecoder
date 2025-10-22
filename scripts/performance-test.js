#!/usr/bin/env node

/**
 * Performance test script for The Unit Decoder
 * Tests database performance, search speed, and memory usage
 */

const { performance } = require('perf_hooks');
const db = require('../db/database');
const { searchUnits } = require('../utils/search');

class PerformanceTest {
    constructor() {
        this.results = {
            database: {},
            search: {},
            memory: {}
        };
    }

    async runAllTests() {
        console.log('🚀 Starting performance tests...\n');
        
        await this.testDatabasePerformance();
        await this.testSearchPerformance();
        await this.testMemoryUsage();
        
        this.printResults();
    }

    async testDatabasePerformance() {
        console.log('📊 Testing database performance...');
        
        const start = performance.now();
        
        // Test connection
        const conn = db.getConnection();
        const connectionTime = performance.now() - start;
        
        // Test simple query
        const queryStart = performance.now();
        const units = conn.prepare('SELECT COUNT(*) as count FROM units').get();
        const queryTime = performance.now() - queryStart;
        
        // Test complex query
        const complexStart = performance.now();
        const complexResult = conn.prepare(`
            SELECT u.*, COUNT(a.id) as alias_count
            FROM units u
            LEFT JOIN aliases a ON u.id = a.unit_id
            WHERE u.status = 'verified'
            GROUP BY u.id
            LIMIT 100
        `).all();
        const complexTime = performance.now() - complexStart;
        
        this.results.database = {
            connectionTime: Math.round(connectionTime * 100) / 100,
            simpleQueryTime: Math.round(queryTime * 100) / 100,
            complexQueryTime: Math.round(complexTime * 100) / 100,
            totalUnits: units.count
        };
        
        console.log(`✅ Database tests completed`);
    }

    async testSearchPerformance() {
        console.log('🔍 Testing search performance...');
        
        const testQueries = [
            'tola',
            'meter',
            'pound',
            'inch',
            'gallon',
            'kilogram',
            'foot',
            'liter'
        ];
        
        const searchTimes = [];
        
        for (const query of testQueries) {
            const start = performance.now();
            const results = searchUnits(query);
            const end = performance.now();
            
            searchTimes.push({
                query,
                time: Math.round((end - start) * 100) / 100,
                results: results.length
            });
        }
        
        const avgTime = searchTimes.reduce((sum, test) => sum + test.time, 0) / searchTimes.length;
        const maxTime = Math.max(...searchTimes.map(t => t.time));
        const minTime = Math.min(...searchTimes.map(t => t.time));
        
        this.results.search = {
            averageTime: Math.round(avgTime * 100) / 100,
            maxTime: Math.round(maxTime * 100) / 100,
            minTime: Math.round(minTime * 100) / 100,
            testQueries: searchTimes
        };
        
        console.log(`✅ Search tests completed`);
    }

    async testMemoryUsage() {
        console.log('💾 Testing memory usage...');
        
        const initialMemory = process.memoryUsage();
        
        // Simulate heavy operations
        const operations = [];
        for (let i = 0; i < 1000; i++) {
            operations.push(searchUnits(`test${i}`));
        }
        
        await Promise.all(operations);
        
        const finalMemory = process.memoryUsage();
        
        this.results.memory = {
            initialHeap: Math.round(initialMemory.heapUsed / 1024 / 1024 * 100) / 100,
            finalHeap: Math.round(finalMemory.heapUsed / 1024 / 1024 * 100) / 100,
            heapIncrease: Math.round((finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024 * 100) / 100,
            externalMemory: Math.round(finalMemory.external / 1024 / 1024 * 100) / 100
        };
        
        console.log(`✅ Memory tests completed`);
    }

    printResults() {
        console.log('\n📈 Performance Test Results:');
        console.log('============================');
        
        console.log('\n🗄️  Database Performance:');
        console.log(`  Connection Time: ${this.results.database.connectionTime}ms`);
        console.log(`  Simple Query: ${this.results.database.simpleQueryTime}ms`);
        console.log(`  Complex Query: ${this.results.database.complexQueryTime}ms`);
        console.log(`  Total Units: ${this.results.database.totalUnits}`);
        
        console.log('\n🔍 Search Performance:');
        console.log(`  Average Time: ${this.results.search.averageTime}ms`);
        console.log(`  Max Time: ${this.results.search.maxTime}ms`);
        console.log(`  Min Time: ${this.results.search.minTime}ms`);
        
        console.log('\n💾 Memory Usage:');
        console.log(`  Initial Heap: ${this.results.memory.initialHeap}MB`);
        console.log(`  Final Heap: ${this.results.memory.finalHeap}MB`);
        console.log(`  Heap Increase: ${this.results.memory.heapIncrease}MB`);
        console.log(`  External Memory: ${this.results.memory.externalMemory}MB`);
        
        // Performance recommendations
        console.log('\n💡 Performance Recommendations:');
        
        if (this.results.database.complexQueryTime > 100) {
            console.log('  ⚠️  Complex queries are slow - consider adding indexes');
        }
        
        if (this.results.search.averageTime > 50) {
            console.log('  ⚠️  Search is slow - consider optimizing search algorithm');
        }
        
        if (this.results.memory.heapIncrease > 50) {
            console.log('  ⚠️  High memory usage - check for memory leaks');
        }
        
        if (this.results.database.complexQueryTime < 50 && 
            this.results.search.averageTime < 30 && 
            this.results.memory.heapIncrease < 20) {
            console.log('  ✅ Performance looks good!');
        }
    }
}

// Run tests if called directly
if (require.main === module) {
    const test = new PerformanceTest();
    test.runAllTests().catch(console.error);
}

module.exports = PerformanceTest;