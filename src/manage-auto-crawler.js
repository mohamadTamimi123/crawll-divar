#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class AutoCrawlerManager {
    constructor() {
        this.pidFile = path.join(__dirname, '..', 'auto-crawler.pid');
        this.logFile = path.join(__dirname, '..', 'auto-crawler.log');
        this.process = null;
    }

    // Get PID from file
    getPid() {
        try {
            if (fs.existsSync(this.pidFile)) {
                return parseInt(fs.readFileSync(this.pidFile, 'utf8'));
            }
        } catch (error) {
            console.error('❌ Error reading PID file:', error.message);
        }
        return null;
    }

    // Save PID to file
    savePid(pid) {
        try {
            fs.writeFileSync(this.pidFile, pid.toString());
            console.log(`✅ PID ${pid} saved to ${this.pidFile}`);
        } catch (error) {
            console.error('❌ Error saving PID file:', error.message);
        }
    }

    // Remove PID file
    removePidFile() {
        try {
            if (fs.existsSync(this.pidFile)) {
                fs.unlinkSync(this.pidFile);
                console.log('✅ PID file removed');
            }
        } catch (error) {
            console.error('❌ Error removing PID file:', error.message);
        }
    }

    // Check if process is running
    isRunning() {
        const pid = this.getPid();
        if (!pid) return false;

        try {
            // Check if process exists
            process.kill(pid, 0);
            return true;
        } catch (error) {
            // Process doesn't exist
            this.removePidFile();
            return false;
        }
    }

    // Start the auto-crawler service
    start() {
        if (this.isRunning()) {
            console.log('⚠️ Auto-crawler service is already running!');
            this.status();
            return;
        }

        console.log('🚀 Starting Auto-Crawler Service...');
        
        // Start the auto-crawler process
        this.process = spawn('node', [path.join(__dirname, 'auto-crawler.js')], {
            stdio: ['pipe', 'pipe', 'pipe'],
            detached: true
        });

        // Save PID
        this.savePid(this.process.pid);

        // Handle process events
        this.process.on('error', (error) => {
            console.error('❌ Failed to start auto-crawler:', error.message);
            this.removePidFile();
        });

        this.process.on('exit', (code) => {
            console.log(`⚠️ Auto-crawler process exited with code ${code}`);
            this.removePidFile();
        });

        // Detach process
        this.process.unref();

        console.log('✅ Auto-crawler service started successfully!');
        console.log(`📝 PID: ${this.process.pid}`);
        console.log(`📁 PID file: ${this.pidFile}`);
        console.log(`📋 Log file: ${this.logFile}`);
        console.log('💡 Use "npm run manage:status" to check status');
        console.log('💡 Use "npm run manage:stop" to stop service');
    }

    // Stop the auto-crawler service
    stop() {
        const pid = this.getPid();
        if (!pid) {
            console.log('⚠️ Auto-crawler service is not running');
            return;
        }

        console.log(`🛑 Stopping Auto-Crawler Service (PID: ${pid})...`);

        try {
            // Send SIGTERM signal
            process.kill(pid, 'SIGTERM');
            
            // Wait a bit for graceful shutdown
            setTimeout(() => {
                try {
                    // Force kill if still running
                    process.kill(pid, 'SIGKILL');
                    console.log('⚠️ Force killed the process');
                } catch (error) {
                    // Process already stopped
                }
                this.removePidFile();
                console.log('✅ Auto-crawler service stopped');
            }, 5000);

        } catch (error) {
            console.error('❌ Error stopping service:', error.message);
            this.removePidFile();
        }
    }

    // Restart the auto-crawler service
    restart() {
        console.log('🔄 Restarting Auto-Crawler Service...');
        this.stop();
        
        // Wait a bit before starting
        setTimeout(() => {
            this.start();
        }, 2000);
    }

    // Show service status
    status() {
        const pid = this.getPid();
        
        console.log('📊 Auto-Crawler Service Status');
        console.log('='.repeat(40));
        
        if (this.isRunning()) {
            console.log(`✅ Status: Running`);
            console.log(`🆔 PID: ${pid}`);
            console.log(`📁 PID File: ${this.pidFile}`);
            console.log(`📋 Log File: ${this.logFile}`);
            
            // Show log file info if exists
            if (fs.existsSync(this.logFile)) {
                const stats = fs.statSync(this.logFile);
                console.log(`📅 Log Last Modified: ${stats.mtime.toLocaleString('fa-IR')}`);
                console.log(`📏 Log Size: ${(stats.size / 1024).toFixed(2)} KB`);
            }
            
        } else {
            console.log(`❌ Status: Stopped`);
            console.log(`📁 PID File: ${this.pidFile}`);
            console.log(`📋 Log File: ${this.logFile}`);
        }
        
        console.log('='.repeat(40));
    }

    // Show recent logs
    logs(lines = 20) {
        if (!fs.existsSync(this.logFile)) {
            console.log('⚠️ No log file found');
            return;
        }

        console.log(`📋 Recent logs (last ${lines} lines):`);
        console.log('='.repeat(50));
        
        try {
            const content = fs.readFileSync(this.logFile, 'utf8');
            const logLines = content.split('\n').filter(line => line.trim());
            const recentLines = logLines.slice(-lines);
            
            recentLines.forEach(line => {
                console.log(line);
            });
        } catch (error) {
            console.error('❌ Error reading log file:', error.message);
        }
    }

    // Test the auto-crawler (single run)
    test() {
        console.log('🧪 Testing Auto-Crawler (Single Run)...');
        
        const testProcess = spawn('node', ['-e', 'require("./src/auto-crawler").performCrawl().then(console.log).catch(console.error)'], {
            stdio: 'inherit',
            cwd: path.join(__dirname, '..')
        });

        testProcess.on('exit', (code) => {
            if (code === 0) {
                console.log('✅ Test completed successfully!');
            } else {
                console.log(`⚠️ Test completed with exit code ${code}`);
            }
        });
    }
}

// Main function
function main() {
    const manager = new AutoCrawlerManager();
    const command = process.argv[2];

    switch (command) {
        case 'start':
            manager.start();
            break;
            
        case 'stop':
            manager.stop();
            break;
            
        case 'restart':
            manager.restart();
            break;
            
        case 'status':
            manager.status();
            break;
            
        case 'logs':
            const lines = parseInt(process.argv[3]) || 20;
            manager.logs(lines);
            break;
            
        case 'test':
            manager.test();
            break;
            
        default:
            console.log('🤖 Auto-Crawler Service Manager');
            console.log('='.repeat(40));
            console.log('Usage: node src/manage-auto-crawler.js <command>');
            console.log('');
            console.log('Commands:');
            console.log('  start     Start the auto-crawler service');
            console.log('  stop      Stop the auto-crawler service');
            console.log('  restart   Restart the auto-crawler service');
            console.log('  status    Show service status');
            console.log('  logs [n]  Show recent logs (default: 20 lines)');
            console.log('  test      Test the auto-crawler (single run)');
            console.log('');
            console.log('Examples:');
            console.log('  node src/manage-auto-crawler.js start');
            console.log('  node src/manage-auto-crawler.js status');
            console.log('  node src/manage-auto-crawler.js logs 50');
            console.log('  node src/manage-auto-crawler.js test');
            break;
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = AutoCrawlerManager;
