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
        statusDiv.innerHTML = '<i class="bi bi-hourglass-split text-primary"></i> Reading live data...';
        console.log('📡 Starting continuous read...');

        try {
            this.reader = this.port.readable.getReader();
            let buffer = '';

            while (this.isReading) {
                const { value, done } = await this.reader.read();
                
                if (done) {
                    console.log('Reader closed');
                    break;
                }

                const chunk = new TextDecoder().decode(value);
                buffer += chunk;
                console.log('📥 Raw:', chunk);

                // Process complete lines
                const lines = buffer.split(/[\r\n]+/);
                buffer = lines.pop() || ''; // Keep incomplete line in buffer

                for (let line of lines) {
                    line = line.trim();
                    if (line.length > 0) {
                        console.log('🔍 Line:', line);
                        const data = this.parseData(line);
                        if (data) {
                            console.log('✅ Valid data:', data);
                            this.fillForm(data);
                            statusDiv.innerHTML = '<i class="bi bi-check-circle text-success"></i> Data received! Reading...';
                        }
                    }
                }
            }

            this.reader.releaseLock();
            console.log('✅ Reading stopped');
            
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
    }
};
