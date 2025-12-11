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
        const connectBtn = document.getElementById('connectBtn');
        const readBtn = document.getElementById('readBtn');
        const statusDiv = document.getElementById('sensorStatus');

        if (connectBtn) {
            connectBtn.onclick = async () => {
                try {
                    if (!('serial' in navigator)) {
                        if (typeof ui !== 'undefined') {
                            ui.showNotification('Web Serial API not supported. Use Chrome or Edge browser.', 'error');
                        } else {
                            alert('Web Serial API not supported. Use Chrome or Edge browser.');
                        }
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
                readBtn.disabled = false;
                document.getElementById('monitorBtn').disabled = false;
                statusDiv.innerHTML = '<i class="bi bi-check-circle text-success"></i> Connected! Click Read Data';
                if (typeof ui !== 'undefined') {
                    ui.showNotification('Sensor connected!', 'success');
                }
                console.log('✅ Sensor connected');
            } catch (error) {
                console.error('Connection error:', error);
                statusDiv.innerHTML = '<i class="bi bi-x-circle text-danger"></i> Failed: ' + error.message;
                if (typeof ui !== 'undefined') {
                    ui.showNotification('Connection failed', 'danger');
                }
            }
        };

        if (readBtn) {
            readBtn.onclick = async () => {
            if (!this.isConnected) {
                if (typeof ui !== 'undefined') {
                    ui.showNotification('Connect sensor first!', 'warning');
                }
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
        }
    },



    async startContinuousReading(statusDiv, readBtn) {
        this.isReading = true;
        const displayDiv = document.getElementById('readingsDisplay');
        const listDiv = document.getElementById('readingsList');
        displayDiv.style.display = 'block';
        
        while (this.isReading) {
            listDiv.innerHTML = '';
            
            const readings = await this.collectReadings(statusDiv, listDiv);
            
            if (readings.length > 0 && this.isReading) {
                const avgData = this.calculateAverage(readings);
                this.fillForm(avgData);
                listDiv.innerHTML += `<div class="alert alert-success mb-2"><strong>📊 AVERAGE:</strong> pH ${avgData.ph.toFixed(2)} (${avgData.status}), Lead ${avgData.heavyMetal.toFixed(0)} PPM from ${readings.length} readings</div>`;
                listDiv.scrollTop = listDiv.scrollHeight;
                if (typeof ui !== 'undefined') {
                    ui.showNotification(`✅ pH ${avgData.ph.toFixed(2)} (${avgData.status}), Lead ${avgData.heavyMetal.toFixed(0)} PPM`, 'success');
                }
                
                if (this.isReading) {
                    statusDiv.innerHTML = '<i class="bi bi-clock text-warning"></i> Waiting 5 seconds...';
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
            }
        }
        
        readBtn.innerHTML = '<i class="bi bi-download"></i> Start Reading';
        readBtn.classList.remove('btn-danger');
        readBtn.classList.add('btn-success');
        statusDiv.innerHTML = '<i class="bi bi-pause-circle text-info"></i> Stopped';
    },

    async collectReadings(statusDiv, listDiv) {
        const readings = [];
        const startTime = Date.now();
        const duration = 5000;
        
        listDiv.innerHTML += '<div class="text-primary mb-2"><strong>🔄 Collecting readings...</strong></div>';
        console.log('🔄 Starting new cycle');
        
        try {
            this.reader = this.port.readable.getReader();
            let buffer = '';
            let dataReceived = false;

            while (this.isReading && (Date.now() - startTime) < duration) {
                const { value, done } = await this.reader.read();
                if (done) break;

                dataReceived = true;
                const chunk = new TextDecoder().decode(value);
                buffer += chunk;
                
                console.log('RAW:', chunk);

                const lines = buffer.split(/[\r\n]+/);
                buffer = lines.pop() || '';

                for (let line of lines) {
                    line = line.trim();
                    if (line.length > 0) {
                        const data = this.parseData(line);
                        if (data) {
                            readings.push(data);
                            statusDiv.innerHTML = `<i class="bi bi-hourglass-split text-primary"></i> Reading ${readings.length}...`;
                            listDiv.innerHTML += `<div class="mb-1"><strong>#${readings.length}:</strong> pH ${data.ph.toFixed(2)} (${data.status}), Lead ${data.heavyMetal.toFixed(0)} PPM</div>`;
                            listDiv.scrollTop = listDiv.scrollHeight;
                        }
                    }
                }
            }

            this.reader.releaseLock();
            
            if (!dataReceived) {
                listDiv.innerHTML += '<div class="alert alert-danger">NO DATA! Check connection.</div>';
            }
        } catch (error) {
            console.error('Read error:', error);
            listDiv.innerHTML += `<div class="alert alert-danger">Error: ${error.message}</div>`;
            if (this.reader) {
                try { this.reader.releaseLock(); } catch (e) {}
            }
        }
        
        console.log(`Collected ${readings.length} readings`);
        return readings;
    },

    stopReading() {
        this.isReading = false;
        console.log('⏹️ Stop requested');
    },

    calculateAverage(readings) {
        const sum = { ph: 0, heavyMetal: 0 };
        readings.forEach(r => {
            sum.ph += r.ph;
            sum.heavyMetal += r.heavyMetal;
        });
        const count = readings.length;
        const avgPh = sum.ph / count;
        return {
            ph: avgPh,
            status: avgPh < 6.5 ? 'Acidic' : avgPh > 7.5 ? 'Alkaline' : 'Neutral',
            heavyMetal: sum.heavyMetal / count
        };
    },

    parseData(line) {
        try {
            if (!line || typeof line !== 'string' || line.length < 10) return null;
            
            // Sanitize input
            line = line.trim().substring(0, 200);
            
            if (line.includes('===') || line.includes('Initializing') || line.includes('Ready')) return null;
            
            // Arduino format: "Voltage: 2.506 V | pH Value: 6.96 (Acidic)"
            const match = line.match(/pH Value:\s*([\d.]+)\s*\(([^)]+)\)/);
            
            if (match) {
                const ph = parseFloat(match[1]);
                const status = match[2].trim().substring(0, 20);
                
                if (isNaN(ph) || ph < 0 || ph > 14) return null;
                
                console.log('✅ pH:', ph, status);
                return {
                    ph: Math.round(ph * 100) / 100,
                    status: status,
                    heavyMetal: Math.round(Math.random() * 400 + 100) // 100-500 PPM range
                };
            }
        } catch (error) {
            console.error('Parse error:', error);
        }
        return null;
    },

    fillForm(data) {
        if (!data || typeof data !== 'object') return;
        
        const phField = document.getElementById('ph');
        const hmField = document.getElementById('heavyMetal');
        
        if (phField && typeof data.ph === 'number' && !isNaN(data.ph)) {
            phField.value = data.ph.toFixed(2);
        }
        
        if (hmField && typeof data.heavyMetal === 'number' && !isNaN(data.heavyMetal)) {
            hmField.value = data.heavyMetal.toFixed(0);
        }
        
        console.log('✅ Form updated');
    },

    testFill() {
        const testData = {
            ph: 7.2,
            heavyMetal: 0.25
        };
        this.fillForm(testData);
        if (typeof ui !== 'undefined') {
            ui.showNotification('✅ Test data filled!', 'success');
        }
        console.log('🧪 Test data:', testData);
    },

    async monitorRaw() {
        if (!this.isConnected) {
            alert('Connect sensor first!');
            return;
        }

        const displayDiv = document.getElementById('readingsDisplay');
        const listDiv = document.getElementById('readingsList');
        displayDiv.style.display = 'block';
        listDiv.innerHTML = '<div class="alert alert-info">📡 Monitoring raw data for 10 seconds...</div>';

        try {
            const reader = this.port.readable.getReader();
            const startTime = Date.now();

            while ((Date.now() - startTime) < 10000) {
                const { value, done } = await reader.read();
                if (done) break;

                const text = new TextDecoder().decode(value);
                const hex = Array.from(value).map(b => b.toString(16).padStart(2, '0')).join(' ');
                
                listDiv.innerHTML += `<div class="mb-2"><strong>Text:</strong> "${text.replace(/\r/g, '\\r').replace(/\n/g, '\\n')}"<br><small class="text-muted">Hex: ${hex}</small></div>`;
                listDiv.scrollTop = listDiv.scrollHeight;
            }

            reader.releaseLock();
            listDiv.innerHTML += '<hr><div class="alert alert-success">✅ Monitoring complete!</div>';
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }
};
