#!/usr/bin/env node

/**
 * Performance monitoring script for The Unit Decoder
 * Monitors database performance, memory usage, and response times
 */

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            database: {
                queryTimes: [],
                connectionCount: 0,
                preparedStatements: 0
            },
            memory: {
                heapUsed: [],
                heapTotal: [],
                external: []
            },
            api: {
                responseTimes: [],
                errorCount: 0,
                requestCount: 0
            }
        };
        
        this.startTime = Date.now();
        this.isMonitoring = false;
    }

    start() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        console.log('🔍 Starting performance monitoring...');
        
        // Monitor memory usage every 30 seconds
        this.memoryInterval = setInterval(() => {
            this.recordMemoryUsage();
        }, 30000);
        
        // Monitor database performance
        this.setupDatabaseMonitoring();
        
        // Monitor API performance
        this.setupAPIMonitoring();
        
        console.log('✅ Performance monitoring started');
    }

    stop() {
        if (!this.isMonitoring) return;
        
        this.isMonitoring = false;
        
        if (this.memoryInterval) {
            clearInterval(this.memoryInterval);
        }
        
        this.generateReport();
        console.log('🛑 Performance monitoring stopped');
    }

    recordMemoryUsage() {
        const memUsage = process.memoryUsage();
        
        this.metrics.memory.heapUsed.push({
            timestamp: Date.now(),
            value: memUsage.heapUsed / 1024 / 1024 // MB
        });
        
        this.metrics.memory.heapTotal.push({
            timestamp: Date.now(),
            value: memUsage.heapTotal / 1024 / 1024 // MB
        });
        
        this.metrics.memory.external.push({
            timestamp: Date.now(),
            value: memUsage.external / 1024 / 1024 // MB
        });
    }

    setupDatabaseMonitoring() {
        const Database = require('better-sqlite3');
        const originalPrepare = Database.prototype.prepare;
        
        Database.prototype.prepare = function(sql) {
            const start = performance.now();
            const stmt = originalPrepare.call(this, sql);
            
            const originalRun = stmt.run;
            const originalAll = stmt.all;
            const originalGet = stmt.get;
            
            // Wrap run method
            stmt.run = function(...args) {
                const queryStart = performance.now();
                const result = originalRun.apply(this, args);
                const queryTime = performance.now() - queryStart;
                
                this.recordQueryTime(sql, queryTime);
                return result;
            }.bind(this);
            
            // Wrap all method
            stmt.all = function(...args) {
                const queryStart = performance.now();
                const result = originalAll.apply(this, args);
                const queryTime = performance.now() - queryStart;
                
                this.recordQueryTime(sql, queryTime);
                return result;
            }.bind(this);
            
            // Wrap get method
            stmt.get = function(...args) {
                const queryStart = performance.now();
                const result = originalGet.apply(this, args);
                const queryTime = performance.now() - queryStart;
                
                this.recordQueryTime(sql, queryTime);
                return result;
            }.bind(this);
            
            return stmt;
        };
    }

    recordQueryTime(sql, time) {
        this.metrics.database.queryTimes.push({
            timestamp: Date.now(),
            sql: sql.substring(0, 100), // Truncate for storage
            time: time
        });
        
        // Keep only last 1000 queries
        if (this.metrics.database.queryTimes.length > 1000) {
            this.metrics.database.queryTimes = this.metrics.database.queryTimes.slice(-1000);
        }
    }

    setupAPIMonitoring() {
        // This would be integrated into the Express app
        // For now, we'll create a middleware function
        this.apiMiddleware = (req, res, next) => {
            const start = performance.now();
            
            res.on('finish', () => {
                const responseTime = performance.now() - start;
                
                this.metrics.api.responseTimes.push({
                    timestamp: Date.now(),
                    method: req.method,
                    url: req.url,
                    statusCode: res.statusCode,
                    responseTime: responseTime
                });
                
                this.metrics.api.requestCount++;
                
                if (res.statusCode >= 400) {
                    this.metrics.api.errorCount++;
                }
            });
            
            next();
        };
    }

    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            duration: Date.now() - this.startTime,
            metrics: this.analyzeMetrics()
        };
        
        const reportPath = path.join(__dirname, '..', 'performance-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log('📊 Performance report generated:', reportPath);
        this.printSummary(report);
    }

    analyzeMetrics() {
        const analysis = {
            database: this.analyzeDatabaseMetrics(),
            memory: this.analyzeMemoryMetrics(),
            api: this.analyzeAPIMetrics()
        };
        
        return analysis;
    }

    analyzeDatabaseMetrics() {
        const queryTimes = this.metrics.database.queryTimes.map(q => q.time);
        
        if (queryTimes.length === 0) {
            return { average: 0, max: 0, slowQueries: [] };
        }
        
        const average = queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length;
        const max = Math.max(...queryTimes);
        const slowQueries = this.metrics.database.queryTimes
            .filter(q => q.time > 100) // Queries slower than 100ms
            .sort((a, b) => b.time - a.time)
            .slice(0, 10);
        
        return {
            average: Math.round(average * 100) / 100,
            max: Math.round(max * 100) / 100,
            slowQueries: slowQueries.map(q => ({
                sql: q.sql,
                time: Math.round(q.time * 100) / 100
            }))
        };
    }

    analyzeMemoryMetrics() {
        const heapUsed = this.metrics.memory.heapUsed.map(m => m.value);
        
        if (heapUsed.length === 0) {
            return { average: 0, max: 0, trend: 'stable' };
        }
        
        const average = heapUsed.reduce((a, b) => a + b, 0) / heapUsed.length;
        const max = Math.max(...heapUsed);
        const min = Math.min(...heapUsed);
        
        // Simple trend analysis
        const firstHalf = heapUsed.slice(0, Math.floor(heapUsed.length / 2));
        const secondHalf = heapUsed.slice(Math.floor(heapUsed.length / 2));
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        
        let trend = 'stable';
        if (secondAvg > firstAvg * 1.1) trend = 'increasing';
        else if (secondAvg < firstAvg * 0.9) trend = 'decreasing';
        
        return {
            average: Math.round(average * 100) / 100,
            max: Math.round(max * 100) / 100,
            min: Math.round(min * 100) / 100,
            trend
        };
    }

    analyzeAPIMetrics() {
        const responseTimes = this.metrics.api.responseTimes.map(r => r.responseTime);
        
        if (responseTimes.length === 0) {
            return { average: 0, max: 0, errorRate: 0 };
        }
        
        const average = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        const max = Math.max(...responseTimes);
        const errorRate = (this.metrics.api.errorCount / this.metrics.api.requestCount) * 100;
        
        return {
            average: Math.round(average * 100) / 100,
            max: Math.round(max * 100) / 100,
            errorRate: Math.round(errorRate * 100) / 100,
            totalRequests: this.metrics.api.requestCount,
            totalErrors: this.metrics.api.errorCount
        };
    }

    printSummary(report) {
        console.log('\n📈 Performance Summary:');
        console.log('========================');
        console.log(`Duration: ${Math.round(report.duration / 1000)}s`);
        console.log(`\nDatabase Performance:`);
        console.log(`  Average Query Time: ${report.metrics.database.average}ms`);
        console.log(`  Max Query Time: ${report.metrics.database.max}ms`);
        console.log(`  Slow Queries: ${report.metrics.database.slowQueries.length}`);
        
        console.log(`\nMemory Usage:`);
        console.log(`  Average Heap: ${report.metrics.memory.average}MB`);
        console.log(`  Max Heap: ${report.metrics.memory.max}MB`);
        console.log(`  Trend: ${report.metrics.memory.trend}`);
        
        console.log(`\nAPI Performance:`);
        console.log(`  Average Response Time: ${report.metrics.api.average}ms`);
        console.log(`  Max Response Time: ${report.metrics.api.max}ms`);
        console.log(`  Error Rate: ${report.metrics.api.errorRate}%`);
        console.log(`  Total Requests: ${report.metrics.api.totalRequests}`);
    }
}

// CLI usage
if (require.main === module) {
    const monitor = new PerformanceMonitor();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down performance monitor...');
        monitor.stop();
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        monitor.stop();
        process.exit(0);
    });
    
    monitor.start();
    
    // Keep the process running
    setInterval(() => {
        // Keep alive
    }, 1000);
}

module.exports = PerformanceMonitor;
