#!/usr/bin/env node

/**
 * Test script to verify Vercel deployment configuration
 * Tests API endpoints and routing
 */

const axios = require('axios');

class VercelDeploymentTester {
    constructor() {
        this.baseUrl = 'https://unit-decoder.vercel.app';
        this.testResults = {
            passed: 0,
            failed: 0,
            errors: []
        };
    }

    async runTests() {
        console.log('🧪 Testing Vercel deployment...\n');
        
        try {
            // Test 1: Health check
            await this.testHealthCheck();
            
            // Test 2: Search API
            await this.testSearchAPI();
            
            // Test 3: Convert API
            await this.testConvertAPI();
            
            // Test 4: Units API
            await this.testUnitsAPI();
            
            this.printResults();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
            process.exit(1);
        }
    }

    async testHealthCheck() {
        console.log('🔍 Testing health check...');
        try {
            const response = await axios.get(`${this.baseUrl}/api/health`);
            
            if (response.status === 200 && response.data.status === 'ok') {
                console.log('✅ Health check passed');
                this.testResults.passed++;
            } else {
                throw new Error('Health check failed');
            }
        } catch (error) {
            console.log('❌ Health check failed:', error.message);
            this.testResults.failed++;
            this.testResults.errors.push('Health check failed');
        }
    }

    async testSearchAPI() {
        console.log('🔍 Testing search API...');
        try {
            // Test empty search
            const emptyResponse = await axios.get(`${this.baseUrl}/api/search`);
            if (emptyResponse.status === 200 && Array.isArray(emptyResponse.data)) {
                console.log('✅ Empty search works');
            } else {
                throw new Error('Empty search failed');
            }
            
            // Test search with query
            const searchResponse = await axios.get(`${this.baseUrl}/api/search?q=kilogram`);
            if (searchResponse.status === 200 && Array.isArray(searchResponse.data)) {
                console.log('✅ Search with query works');
                this.testResults.passed++;
            } else {
                throw new Error('Search with query failed');
            }
        } catch (error) {
            console.log('❌ Search API failed:', error.message);
            this.testResults.failed++;
            this.testResults.errors.push('Search API failed');
        }
    }

    async testConvertAPI() {
        console.log('🔍 Testing convert API...');
        try {
            const response = await axios.post(`${this.baseUrl}/api/convert`, {
                fromUnitId: 1,
                toUnitId: 2,
                value: 1000
            });
            
            if (response.status === 200 && response.data.result !== undefined) {
                console.log('✅ Convert API works');
                this.testResults.passed++;
            } else {
                throw new Error('Convert API failed');
            }
        } catch (error) {
            console.log('❌ Convert API failed:', error.message);
            this.testResults.failed++;
            this.testResults.errors.push('Convert API failed');
        }
    }

    async testUnitsAPI() {
        console.log('🔍 Testing units API...');
        try {
            const response = await axios.get(`${this.baseUrl}/api/units/1`);
            
            if (response.status === 200 && response.data.id === 1) {
                console.log('✅ Units API works');
                this.testResults.passed++;
            } else {
                throw new Error('Units API failed');
            }
        } catch (error) {
            console.log('❌ Units API failed:', error.message);
            this.testResults.failed++;
            this.testResults.errors.push('Units API failed');
        }
    }

    printResults() {
        console.log('\n📊 Test Results:');
        console.log(`✅ Passed: ${this.testResults.passed}`);
        console.log(`❌ Failed: ${this.testResults.failed}`);
        
        if (this.testResults.errors.length > 0) {
            console.log('\n❌ Errors:');
            this.testResults.errors.forEach(error => console.log(`  - ${error}`));
        }
        
        if (this.testResults.failed === 0) {
            console.log('\n🎉 All tests passed! Deployment is working correctly.');
        } else {
            console.log('\n⚠️  Some tests failed. Check the deployment configuration.');
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const tester = new VercelDeploymentTester();
    tester.runTests();
}

module.exports = VercelDeploymentTester;
