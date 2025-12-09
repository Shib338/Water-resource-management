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
                readBtn.innerHTML = '<i class="bi bi-download"></i> Read Data';
                readBtn.classList.remove('btn-danger');
                readBtn.classList.add('btn-success');
                statusDiv.innerHTML = '<i class="bi bi-pause-circle text-warning"></i> Reading stopped';
            } else {
                this.startReading(statusDiv, readBtn);
                readBtn.innerHTML = '<i class="bi bi-stop-circle"></i> Stop Reading';
                readBtn.classList.remove('btn-success');
                readBtn.classList.add('btn-danger');
            }
        };
    },

    async startReading(statusDiv, readBtn) {
        this.isReading = true;
        const readings = [];
        const startTime = Date.now();
        const duration = 5000; // 5 seconds
        
        statusDiv.innerHTML = '<i class="bi bi-hourglass-split text-primary"></i> Collecting data for 5 seconds...';
        console.log('📡 Starting 5-second data collection...');

        try {
            this.reader = this.port.readable.getReader();
            let buffer = '';

            while (this.isReading && (Date.now() - startTime) < duration) {
                const { value, done } = await this.reader.read();
                
                if (done) break;

                const chunk = new TextDecoder().decode(value);
                buffer += chunk;
                console.log('📥 Raw:', chunk);

                const lines = buffer.split(/[\r\n]+/);
                buffer = lines.pop() || '';

                for (let line of lines) {
                    line = line.trim();
                    if (line.length > 0) {
                        console.log('🔍 Line:', line);
                        const data = this.parseData(line);
                        if (data) {
                            readings.push(data);
                            console.log('✅ Reading', readings.length, ':', data);
                            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                            statusDiv.innerHTML = `<i class="bi bi-hourglass-split text-primary"></i> Collected ${readings.length} readings (${elapsed}s / 5s)`;
                        }
                    }
                }
            }

            this.reader.releaseLock();
            this.isReading = false;
            
            if (readings.length > 0) {
                const avgData = this.calculateAverage(readings);
                console.log('📊 Average of', readings.length, 'readings:', avgData);
                this.fillForm(avgData);
                statusDiv.innerHTML = `<i class="bi bi-check-circle text-success"></i> Average of ${readings.length} readings calculated!`;
                ui.showNotification(`✅ Average of ${readings.length} readings!`, 'success');
            } else {
                statusDiv.innerHTML = '<i class="bi bi-x-circle text-danger"></i> No data received';
                ui.showNotification('No data received from sensor', 'warning');
            }
            
            readBtn.innerHTML = '<i class="bi bi-download"></i> Read Data';
            readBtn.classList.remove('btn-danger');
            readBtn.classList.add('btn-success');
            
        } catch (error) {
            console.error('❌ Read error:', error);
            statusDiv.innerHTML = '<i class="bi bi-x-circle text-danger"></i> Error: ' + error.message;
            ui.showNotification('Read error: ' + error.message, 'danger');
            this.isReading = false;
            
            if (this.reader) {
                try { this.reader.releaseLock(); } catch (e) {}
            }
            
            readBtn.innerHTML = '<i class="bi bi-download"></i> Read Data';
            readBtn.classList.remove('btn-danger');
            readBtn.classList.add('btn-success');
        }
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
    }
};
