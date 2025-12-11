/**
 * Sensor Management System
 * @global
 */

/* global ui */
const sensor = {
    port: null,
    reader: null,
    isConnected: false,
    isReading: false,

    init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupButtons());
        } else {
            this.setupButtons();
        }
    },

    setupButtons() {
        const connectBtn = document.getElementById('connectBtn');
        const disconnectBtn = document.getElementById('disconnectBtn');
        const readBtn = document.getElementById('readBtn');
        const liveBtn = document.getElementById('liveBtn');
        const statusDiv = document.getElementById('sensorStatus');

        if (connectBtn) {
            connectBtn.onclick = async () => {
                try {
                    if (!('serial' in navigator)) {
                        const msg = 'Web Serial API not supported. Use Chrome or Edge browser.';
                        alert(msg);
                        if (statusDiv) statusDiv.innerHTML = '<i class="bi bi-x-circle text-danger"></i> ' + msg;
                        return;
                    }

                    this.port = await navigator.serial.requestPort();
                    await this.port.open({ 
                        baudRate: 9600,
                        dataBits: 8,
                        stopBits: 1,
                        parity: 'none',
                        flowControl: 'none'
                    });
                    
                    this.isConnected = true;
                    connectBtn.disabled = true;
                    connectBtn.classList.remove('btn-outline-primary');
                    connectBtn.classList.add('btn-success');
                    connectBtn.innerHTML = '<i class="bi bi-check-circle"></i> Connected';
                    if (disconnectBtn) disconnectBtn.disabled = false;
                    if (readBtn) readBtn.disabled = false;
                    const liveBtn = document.getElementById('liveBtn');
                    if (liveBtn) liveBtn.disabled = false;
                    if (statusDiv) statusDiv.innerHTML = '<i class="bi bi-check-circle text-success"></i> Connected! Click Read Data';
                    
                } catch (error) {
                    const errorMsg = error.message || 'Connection failed';
                    if (statusDiv) statusDiv.innerHTML = '<i class="bi bi-x-circle text-danger"></i> Failed: ' + errorMsg;
                    
                    this.isConnected = false;
                    this.port = null;
                    connectBtn.disabled = false;
                    connectBtn.classList.remove('btn-success');
                    connectBtn.classList.add('btn-outline-primary');
                    connectBtn.innerHTML = '<i class="bi bi-usb-plug"></i> Connect';
                    if (disconnectBtn) disconnectBtn.disabled = true;
                    if (readBtn) readBtn.disabled = true;
                    const liveBtn = document.getElementById('liveBtn');
                    if (liveBtn) liveBtn.disabled = true;
                }
            };
        }

        if (disconnectBtn) {
            disconnectBtn.onclick = async () => {
                try {
                    this.stopReading();
                    this.releaseReader();
                    
                    if (this.port) {
                        await this.port.close();
                    }
                    
                    this.isConnected = false;
                    this.port = null;
                    
                    // Reset buttons
                    connectBtn.disabled = false;
                    connectBtn.classList.remove('btn-success');
                    connectBtn.classList.add('btn-outline-primary');
                    connectBtn.innerHTML = '<i class="bi bi-usb-plug"></i> Connect';
                    
                    disconnectBtn.disabled = true;
                    if (readBtn) readBtn.disabled = true;
                    const liveBtn = document.getElementById('liveBtn');
                    if (liveBtn) liveBtn.disabled = true;
                    
                    if (statusDiv) statusDiv.innerHTML = '<i class="bi bi-usb text-muted"></i> Disconnected';
                    
                } catch (error) {
                    if (statusDiv) statusDiv.innerHTML = '<i class="bi bi-x-circle text-danger"></i> Disconnect failed: ' + error.message;
                }
            };




        if (readBtn) {
            readBtn.onclick = async () => {
                if (!this.isConnected || !this.port) {
                    const msg = 'Connect sensor first!';
                    alert(msg);
                    if (statusDiv) statusDiv.innerHTML = '<i class="bi bi-exclamation-triangle text-warning"></i> ' + msg;
                    return;
                }

                if (this.isReading) {
                    this.stopReading();
                    readBtn.innerHTML = '<i class="bi bi-download"></i> Start Reading';
                    readBtn.classList.remove('btn-danger');
                    readBtn.classList.add('btn-success');
                } else {
                    this.startContinuousReading(statusDiv, readBtn);
                    readBtn.innerHTML = '<i class="bi bi-stop-circle"></i> Stop';
                    readBtn.classList.remove('btn-success');
                    readBtn.classList.add('btn-danger');
                }
            };

        
        // Retry if buttons missing
        if (!connectBtn || !readBtn || !disconnectBtn || !liveBtn) {
            setTimeout(() => this.setupButtons(), 1000);
        }
    },

    async startContinuousReading(statusDiv, readBtn) {
        this.isReading = true;
        const displayDiv = document.getElementById('readingsDisplay');
        const listDiv = document.getElementById('readingsList');
        if (displayDiv) displayDiv.style.display = 'block';
        
        while (this.isReading) {
            const avgData = await this.collectReadings(statusDiv, listDiv);
            
            if (avgData) {
                this.fillForm(avgData);
                if (listDiv) {
                    listDiv.innerHTML += `<div class="alert alert-success">📊 AVERAGE: pH ${avgData.ph.toFixed(2)} (${avgData.status}), TDS ${avgData.heavyMetal.toFixed(1)} PPM</div>`;
                    listDiv.scrollTop = listDiv.scrollHeight;
                }
            }
            
            if (this.isReading) {
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
        
        readBtn.innerHTML = '<i class="bi bi-download"></i> Start Reading';
        readBtn.classList.remove('btn-danger');
        readBtn.classList.add('btn-success');
        if (statusDiv) statusDiv.innerHTML = '<i class="bi bi-pause-circle text-info"></i> Stopped';
    },

    async collectReadings(statusDiv, listDiv) {
        let phValues = [];
        let tdsValues = [];
        
        if (listDiv) listDiv.innerHTML = '<div class="alert alert-info">📊 Collecting readings for 10 seconds...</div>';
        if (statusDiv) statusDiv.innerHTML = '<i class="bi bi-hourglass-split text-primary"></i> Reading sensors...';
        
        this.releaseReader();
        
        try {
            this.reader = this.port.readable.getReader();
            let buffer = '';
            const startTime = Date.now();
            
            while (this.isReading && (Date.now() - startTime) < 10000) {
                const { value, done } = await this.reader.read();
                if (done) break;
                
                const chunk = new TextDecoder().decode(value);
                buffer += chunk;
                
                const lines = buffer.split(/[\r\n]+/);
                buffer = lines.pop() || '';
                
                for (let line of lines) {
                    line = line.trim();
                    if (line.length < 3) continue;
                    

                    
                    // pH Value: 7.2
                    const phMatch = line.match(/pH\s+Value:\s*([\d.]+)/i);
                    if (phMatch) {
                        const ph = parseFloat(phMatch[1]);
                        if (ph >= 0 && ph <= 14) {
                            phValues.push(ph);
                            if (listDiv) {
                                const timestamp = new Date().toLocaleTimeString();
                                listDiv.innerHTML += `<div class="text-success">[${timestamp}] pH: ${ph.toFixed(2)} (Raw: ${line})</div>`;
                                listDiv.scrollTop = listDiv.scrollHeight;
                            }
                        }
                    }
                    
                    // TDS: 245 ppm
                    const tdsMatch = line.match(/TDS:\s*([\d.]+)\s*ppm/i);
                    if (tdsMatch) {
                        const tds = parseFloat(tdsMatch[1]);
                        if (tds >= 0 && tds <= 5000) {
                            tdsValues.push(tds);
                            if (listDiv) {
                                const timestamp = new Date().toLocaleTimeString();
                                listDiv.innerHTML += `<div class="text-warning">[${timestamp}] TDS: ${tds.toFixed(1)} ppm (Raw: ${line})</div>`;
                                listDiv.scrollTop = listDiv.scrollHeight;
                            }
                        }
                    }
                }
            }
            
            this.reader.releaseLock();
            this.reader = null;
            
            // Calculate averages and show detailed stats
            if (phValues.length > 0) {
                const avgPh = phValues.reduce((a, b) => a + b) / phValues.length;
                const minPh = Math.min(...phValues);
                const maxPh = Math.max(...phValues);
                const avgTds = tdsValues.length > 0 ? tdsValues.reduce((a, b) => a + b) / tdsValues.length : 250;
                const minTds = tdsValues.length > 0 ? Math.min(...tdsValues) : 0;
                const maxTds = tdsValues.length > 0 ? Math.max(...tdsValues) : 0;
                const status = avgPh < 6.5 ? 'Acidic' : avgPh > 7.5 ? 'Alkaline' : 'Neutral';
                
                if (listDiv) {
                    listDiv.innerHTML += `<div class="alert alert-primary mt-2">`;
                    listDiv.innerHTML += `<strong>📊 STATISTICS (${phValues.length} pH readings, ${tdsValues.length} TDS readings):</strong><br>`;
                    listDiv.innerHTML += `pH: Avg=${avgPh.toFixed(2)}, Min=${minPh.toFixed(2)}, Max=${maxPh.toFixed(2)}<br>`;
                    listDiv.innerHTML += `TDS: Avg=${avgTds.toFixed(1)}, Min=${minTds.toFixed(1)}, Max=${maxTds.toFixed(1)}`;
                    listDiv.innerHTML += `</div>`;
                    listDiv.scrollTop = listDiv.scrollHeight;
                }
                
                if (statusDiv) {
                    statusDiv.innerHTML = `<i class="bi bi-check-circle text-success"></i> Final: pH ${avgPh.toFixed(2)} (${status}), TDS ${avgTds.toFixed(1)} | Readings: ${phValues.length}pH, ${tdsValues.length}TDS`;
                }
                
                return {
                    ph: avgPh,
                    status: status,
                    heavyMetal: avgTds
                };
            } else {
                if (listDiv) {
                    listDiv.innerHTML += `<div class="alert alert-danger">❌ NO VALID READINGS FOUND! Check sensor connection and Arduino output format.</div>`;
                }
                if (statusDiv) {
                    statusDiv.innerHTML = '<i class="bi bi-x-circle text-danger"></i> No readings detected - check sensor';
                }
            }
            
        } catch (error) {
            if (statusDiv) statusDiv.innerHTML = '<i class="bi bi-x-circle text-danger"></i> Error: ' + error.message;
            this.releaseReader();
        }
        
        return null;
    },

    stopReading() {
        this.isReading = false;
        this.releaseReader();
    },

    releaseReader() {
        if (this.reader) {
            try {
                this.reader.releaseLock();
            } catch (e) {
                // Reader release handled silently
            } finally {
                this.reader = null;
            }
        }
    },

    fillForm(data) {
        if (!data) return;
        
        const phField = document.getElementById('ph');
        const hmField = document.getElementById('heavyMetal');
        
        if (phField && data.ph) {
            phField.value = data.ph.toFixed(2);
        }
        
        if (hmField && data.heavyMetal) {
            hmField.value = data.heavyMetal.toFixed(1);
        }
        

    },

    testFill() {
        const testData = {
            ph: 7.2,
            heavyMetal: 228.4
        };
        this.fillForm(testData);
        
        const statusDiv = document.getElementById('sensorStatus');
        if (statusDiv) {
            statusDiv.innerHTML = `<i class="bi bi-lightning text-warning"></i> Test data: pH ${testData.ph}, TDS ${testData.heavyMetal}`;
        }
    },

    simulateReading() {
        const displayDiv = document.getElementById('readingsDisplay');
        const listDiv = document.getElementById('readingsList');
        const statusDiv = document.getElementById('sensorStatus');
        
        if (displayDiv) displayDiv.style.display = 'block';
        if (listDiv) listDiv.innerHTML = '<div class="alert alert-info">🧪 Simulating...</div>';
        
        const readings = [];
        for (let i = 0; i < 5; i++) {
            const ph = 6.5 + Math.random() * 2;
            const tds = 150 + Math.random() * 200;
            readings.push({ ph, heavyMetal: tds });
            
            if (listDiv) {
                listDiv.innerHTML += `<div>Reading ${i+1}: pH ${ph.toFixed(2)}, TDS ${tds.toFixed(1)}</div>`;
            }
        }
        
        const avgPh = readings.reduce((sum, r) => sum + r.ph, 0) / readings.length;
        const avgTds = readings.reduce((sum, r) => sum + r.heavyMetal, 0) / readings.length;
        const status = avgPh < 6.5 ? 'Acidic' : avgPh > 7.5 ? 'Alkaline' : 'Neutral';
        
        const avgData = { ph: avgPh, heavyMetal: avgTds, status };
        this.fillForm(avgData);
        
        if (listDiv) {
            listDiv.innerHTML += `<div class="alert alert-success">📊 Average: pH ${avgPh.toFixed(2)} (${status}), TDS ${avgTds.toFixed(1)}</div>`;
        }
        
        if (statusDiv) {
            statusDiv.innerHTML = `<i class="bi bi-check-circle text-success"></i> Simulation complete`;
        }
    },

    async monitorRaw() {
        if (!this.isConnected || this.isReading) return;
        
        const listDiv = document.getElementById('readingsList');
        const statusDiv = document.getElementById('sensorStatus');
        
        if (listDiv) listDiv.innerHTML = '<div class="alert alert-info">📡 Raw monitoring for 15 seconds...</div>';
        if (statusDiv) statusDiv.innerHTML = '<i class="bi bi-broadcast text-info"></i> Monitoring raw data...';
        
        this.releaseReader();
        
        try {
            const reader = this.port.readable.getReader();
            const startTime = Date.now();
            let dataCount = 0;
            
            while ((Date.now() - startTime) < 15000) {
                const { value, done } = await reader.read();
                if (done) break;
                
                const text = new TextDecoder().decode(value);
                dataCount++;
                
                if (listDiv) {
                    // Show both raw bytes and text
                    const bytes = Array.from(value).map(b => b.toString(16).padStart(2, '0')).join(' ');
                    listDiv.innerHTML += `<div class="border p-2 mb-1">`;
                    listDiv.innerHTML += `<div><strong>Data ${dataCount}:</strong></div>`;
                    listDiv.innerHTML += `<div><strong>Text:</strong> "${text}"</div>`;
                    listDiv.innerHTML += `<div><strong>Escaped:</strong> ${text.replace(/\r/g, '\\r').replace(/\n/g, '\\n').replace(/\t/g, '\\t')}</div>`;
                    listDiv.innerHTML += `<div><strong>Bytes:</strong> ${bytes}</div>`;
                    listDiv.innerHTML += `</div>`;
                    listDiv.scrollTop = listDiv.scrollHeight;
                }
                

            }
            
            reader.releaseLock();
            
            if (statusDiv) {
                statusDiv.innerHTML = `<i class="bi bi-check-circle text-success"></i> Raw monitoring complete (${dataCount} chunks)`;
            }
            
        } catch (error) {
            if (statusDiv) {
                statusDiv.innerHTML = `<i class="bi bi-x-circle text-danger"></i> Monitor error: ${error.message}`;
            }
        }
    },

    // Live sensor monitoring
    async liveMonitor() {
        if (!this.isConnected) {
            alert('Connect sensor first!');
            return;
        }
        
        const listDiv = document.getElementById('readingsList');
        const statusDiv = document.getElementById('sensorStatus');
        
        if (listDiv) listDiv.innerHTML = '<div class="alert alert-info">🔴 LIVE MONITORING - Showing real-time sensor values...</div>';
        if (statusDiv) statusDiv.innerHTML = '<i class="bi bi-broadcast text-danger"></i> LIVE monitoring...';
        
        this.releaseReader();
        
        try {
            const reader = this.port.readable.getReader();
            let buffer = '';
            let readingCount = 0;
            
            while (readingCount < 50) { // Show 50 live readings
                const { value, done } = await reader.read();
                if (done) break;
                
                const chunk = new TextDecoder().decode(value);
                buffer += chunk;
                
                const lines = buffer.split(/[\r\n]+/);
                buffer = lines.pop() || '';
                
                for (let line of lines) {
                    line = line.trim();
                    if (line.length < 3) continue;
                    
                    readingCount++;
                    const timestamp = new Date().toLocaleTimeString();
                    
                    if (listDiv) {
                        listDiv.innerHTML += `<div class="border-start border-3 border-info ps-2 mb-1">`;
                        listDiv.innerHTML += `<small class="text-muted">[${timestamp}] Reading #${readingCount}</small><br>`;
                        listDiv.innerHTML += `<strong>${line}</strong>`;
                        listDiv.innerHTML += `</div>`;
                        listDiv.scrollTop = listDiv.scrollHeight;
                    }
                    

                    
                    if (readingCount >= 50) break;
                }
            }
            
            reader.releaseLock();
            
            if (statusDiv) {
                statusDiv.innerHTML = `<i class="bi bi-check-circle text-success"></i> Live monitoring complete (${readingCount} readings)`;
            }
            
        } catch (error) {
            if (statusDiv) {
                statusDiv.innerHTML = `<i class="bi bi-x-circle text-danger"></i> Monitor error: ${error.message}`;
            }
        }
    },

    // Test different Arduino data formats
    testArduinoFormats() {
        const testFormats = [
            'pH Value: 7.2',
            'TDS: 245.5 ppm',
            'pH=7.2',
            'TDS=245',
            '7.2,245.5',
            'pH: 7.2, TDS: 245 ppm',
            'pH 7.2 TDS 245',
            '7.2 ph 245 tds'
        ];
        
        const listDiv = document.getElementById('readingsList');
        if (listDiv) {
            listDiv.innerHTML = '<div class="alert alert-info">🧪 Testing Arduino formats...</div>';
            
            testFormats.forEach((format, i) => {
                listDiv.innerHTML += `<div class="border p-2 mb-1">`;
                listDiv.innerHTML += `<div><strong>Test ${i+1}:</strong> "${format}"</div>`;
                
                // Test pH patterns
                let phMatch = format.match(/pH\s*[:\s]*([\d.]+)/i) || 
                             format.match(/ph\s*=\s*([\d.]+)/i) ||
                             format.match(/([\d.]+)\s*ph/i);
                
                // Test TDS patterns  
                let tdsMatch = format.match(/TDS\s*[:\s]*([\d.]+)/i) ||
                              format.match(/tds\s*=\s*([\d.]+)/i) ||
                              format.match(/([\d.]+)\s*ppm/i) ||
                              format.match(/([\d.]+)\s*tds/i);
                
                // Test CSV
                const csvMatch = format.match(/([\d.]+)\s*,\s*([\d.]+)/);
                
                if (phMatch) listDiv.innerHTML += `<div class="text-success">✅ pH: ${phMatch[1]}</div>`;
                if (tdsMatch) listDiv.innerHTML += `<div class="text-warning">✅ TDS: ${tdsMatch[1]}</div>`;
                if (csvMatch && !phMatch && !tdsMatch) {
                    listDiv.innerHTML += `<div class="text-info">✅ CSV: pH ${csvMatch[1]}, TDS ${csvMatch[2]}</div>`;
                }
                if (!phMatch && !tdsMatch && !csvMatch) {
                    listDiv.innerHTML += `<div class="text-danger">❌ No match</div>`;
                }
                
                listDiv.innerHTML += `</div>`;
            });
        }
    }
};

// Add test button to HTML if needed
if (typeof window !== 'undefined') {
    window.sensor = sensor;
    
    // Add debug functions to window for console access
    window.testArduinoFormats = () => sensor.testArduinoFormats();
    window.monitorRaw = () => sensor.monitorRaw();
    window.liveMonitor = () => sensor.liveMonitor();
}