const sensor = {
    port: null,
    reader: null,
    isConnected: false,
    isReading: false,

    init() {
        const connectBtn = document.getElementById('connectBtn');
        const readBtn = document.getElementById('readBtn');
        const statusDiv = document.getElementById('sensorStatus');

        connectBtn.onclick = async () => {
            try {
                if (!('serial' in navigator)) {
                    alert('Web Serial API not supported. Use Chrome or Edge browser.');
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
                ui.showNotification('Sensor connected!', 'success');
                console.log('✅ Sensor connected');
            } catch (error) {
                console.error('Connection error:', error);
                statusDiv.innerHTML = '<i class="bi bi-x-circle text-danger"></i> Failed: ' + error.message;
                ui.showNotification('Connection failed', 'danger');
            }
        };

        readBtn.onclick = async () => {
            if (!this.isConnected) {
                ui.showNotification('Connect sensor first!', 'warning');
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
    },



    async startContinuousReading(statusDiv, readBtn) {
        this.isReading = true;
        const displayDiv = document.getElementById('readingsDisplay');
        const listDiv = document.getElementById('readingsList');
        displayDiv.style.display = 'block';
        
        while (this.isReading) {
            // Collect for 5 seconds
            const readings = await this.collectReadings(statusDiv, listDiv);
            
            if (readings.length > 0 && this.isReading) {
                const avgData = this.calculateAverage(readings);
                this.fillForm(avgData);
                listDiv.innerHTML += `<div class="alert alert-success mb-2"><strong>📊 AVG:</strong> pH=${avgData.ph.toFixed(2)}, Temp=${avgData.temperature.toFixed(1)}°C, DO=${avgData.dissolvedOxygen.toFixed(2)}</div>`;
                listDiv.scrollTop = listDiv.scrollHeight;
            }
            
            // Wait 5 seconds
            if (this.isReading) {
                statusDiv.innerHTML = '<i class="bi bi-clock text-warning"></i> Waiting 5 seconds...';
                await new Promise(resolve => setTimeout(resolve, 5000));
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
        
        listDiv.innerHTML += '<hr><div class="text-primary"><strong>🔄 New cycle...</strong></div>';
        
        try {
            this.reader = this.port.readable.getReader();
            let buffer = '';

            while (this.isReading && (Date.now() - startTime) < duration) {
                const { value, done } = await this.reader.read();
                if (done) break;

                const chunk = new TextDecoder().decode(value);
                buffer += chunk;

                const lines = buffer.split(/[\r\n]+/);
                buffer = lines.pop() || '';

                for (let line of lines) {
                    line = line.trim();
                    if (line.length > 0) {
                        const data = this.parseData(line);
                        if (data) {
                            readings.push(data);
                            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                            statusDiv.innerHTML = `<i class="bi bi-hourglass-split text-primary"></i> Reading... ${readings.length} (${elapsed}s)`;
                            listDiv.innerHTML += `<div class="small">#${readings.length}: pH=${data.ph.toFixed(2)}</div>`;
                            listDiv.scrollTop = listDiv.scrollHeight;
                        }
                    }
                }
            }

            this.reader.releaseLock();
        } catch (error) {
            console.error('Read error:', error);
            if (this.reader) {
                try { this.reader.releaseLock(); } catch (e) {}
            }
        }
        
        return readings;
    },

    stopReading() {
        this.isReading = false;
        console.log('⏹️ Stop requested');
    },

    calculateAverage(readings) {
        const sum = {
            ph: 0,
            hydrogenSulfide: 0,
            turbidity: 0,
            nitrogen: 0,
            copper: 0,
            dissolvedOxygen: 0,
            temperature: 0
        };

        readings.forEach(reading => {
            sum.ph += reading.ph;
            sum.hydrogenSulfide += reading.hydrogenSulfide;
            sum.turbidity += reading.turbidity;
            sum.nitrogen += reading.nitrogen;
            sum.copper += reading.copper;
            sum.dissolvedOxygen += reading.dissolvedOxygen;
            sum.temperature += reading.temperature;
        });

        const count = readings.length;
        return {
            ph: sum.ph / count,
            hydrogenSulfide: sum.hydrogenSulfide / count,
            turbidity: sum.turbidity / count,
            nitrogen: sum.nitrogen / count,
            copper: sum.copper / count,
            dissolvedOxygen: sum.dissolvedOxygen / count,
            temperature: sum.temperature / count
        };
    },

    parseData(line) {
        try {
            // JSON format
            if (line.startsWith('{')) {
                const data = JSON.parse(line);
                if (data.ph !== undefined) return data;
            }

            // CSV format: pH,H2S,Turbidity,Nitrogen,Copper,DO,Temp
            const parts = line.split(',');
            if (parts.length >= 7) {
                const values = parts.map(v => parseFloat(v.trim()));
                
                if (values.every(v => !isNaN(v))) {
                    return {
                        ph: values[0],
                        hydrogenSulfide: values[1],
                        turbidity: values[2],
                        nitrogen: values[3],
                        copper: values[4],
                        dissolvedOxygen: values[5],
                        temperature: values[6]
                    };
                }
            }
        } catch (error) {
            console.error('Parse error:', error);
        }
        return null;
    },

    fillForm(data) {
        document.getElementById('ph').value = data.ph.toFixed(2);
        document.getElementById('hydrogenSulfide').value = data.hydrogenSulfide.toFixed(3);
        document.getElementById('turbidity').value = data.turbidity.toFixed(2);
        document.getElementById('nitrogen').value = data.nitrogen.toFixed(2);
        document.getElementById('copper').value = data.copper.toFixed(2);
        document.getElementById('dissolvedOxygen').value = data.dissolvedOxygen.toFixed(2);
        document.getElementById('temperature').value = data.temperature.toFixed(1);
        console.log('✅ Form updated');
    },

    testFill() {
        const testData = {
            ph: 7.2,
            hydrogenSulfide: 0.05,
            turbidity: 2.3,
            nitrogen: 5.1,
            copper: 0.8,
            dissolvedOxygen: 8.5,
            temperature: 22.5
        };
        this.fillForm(testData);
        ui.showNotification('✅ Test data filled!', 'success');
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
