const sensor = {
    port: null,
    reader: null,
    isConnected: false,

    init() {
        const connectBtn = document.getElementById('connectBtn');
        const readBtn = document.getElementById('readBtn');
        const statusDiv = document.getElementById('sensorStatus');

        if (connectBtn) {
            connectBtn.onclick = async () => {
                const success = await this.connect();
                if (success) {
                    connectBtn.disabled = true;
                    connectBtn.classList.remove('btn-outline-primary');
                    connectBtn.classList.add('btn-success');
                    connectBtn.innerHTML = '<i class="bi bi-check-circle"></i> Connected';
                    readBtn.disabled = false;
                    statusDiv.innerHTML = '<i class="bi bi-check-circle text-success"></i> Sensor connected - Ready to read';
                }
            };
        }

        if (readBtn) {
            readBtn.onclick = async () => {
                readBtn.disabled = true;
                statusDiv.innerHTML = '<i class="bi bi-hourglass-split text-primary"></i> Reading data from sensor...';
                const data = await this.readData();
                readBtn.disabled = false;
                
                if (data) {
                    this.fillForm(data);
                    statusDiv.innerHTML = '<i class="bi bi-check-circle text-success"></i> Data loaded successfully!';
                } else {
                    statusDiv.innerHTML = '<i class="bi bi-x-circle text-danger"></i> Failed to read data';
                }
            };
        }
    },

    async connect() {
        if (!('serial' in navigator)) {
            alert('USB Serial not supported. Use Chrome, Edge, or Opera browser.');
            return false;
        }

        try {
            this.port = await navigator.serial.requestPort();
            await this.port.open({ baudRate: 9600 });
            this.isConnected = true;
            ui.showNotification('USB Sensor connected!', 'success');
            return true;
        } catch (error) {
            console.error('Connection error:', error);
            ui.showNotification('Connection failed: ' + error.message, 'danger');
            return false;
        }
    },

    async readData() {
        if (!this.isConnected || !this.port) {
            ui.showNotification('Connect sensor first', 'warning');
            return null;
        }

        try {
            const textDecoder = new TextDecoderStream();
            const readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
            const reader = textDecoder.readable.getReader();

            let buffer = '';
            const startTime = Date.now();
            
            while (Date.now() - startTime < 3000) {
                const { value, done } = await reader.read();
                if (done) break;
                
                buffer += value;
                console.log('Received:', value);
                
                if (buffer.includes('\n') || buffer.includes('\r')) {
                    const lines = buffer.split(/[\r\n]+/);
                    for (let line of lines) {
                        line = line.trim();
                        if (line.length > 0) {
                            console.log('Processing line:', line);
                            const data = this.parseData(line);
                            if (data) {
                                reader.cancel();
                                return data;
                            }
                        }
                    }
                    buffer = '';
                }
            }

            reader.cancel();
            ui.showNotification('No valid data received', 'warning');
            return null;
        } catch (error) {
            console.error('Read error:', error);
            ui.showNotification('Read failed: ' + error.message, 'danger');
            return null;
        }
    },

    parseData(rawData) {
        try {
            console.log('Parsing:', rawData);
            
            // JSON format
            if (rawData.trim().startsWith('{')) {
                const parsed = JSON.parse(rawData);
                console.log('Parsed JSON:', parsed);
                return parsed;
            }
            
            // CSV format: pH,H2S,Turbidity,Nitrogen,Copper,DO,Temp
            const values = rawData.trim().split(',').map(v => parseFloat(v.trim()));
            console.log('CSV values:', values);
            
            if (values.length >= 7 && values.every(v => !isNaN(v))) {
                const data = {
                    ph: values[0],
                    hydrogenSulfide: values[1],
                    turbidity: values[2],
                    nitrogen: values[3],
                    copper: values[4],
                    dissolvedOxygen: values[5],
                    temperature: values[6]
                };
                console.log('Parsed CSV:', data);
                return data;
            }
        } catch (error) {
            console.error('Parse error:', error);
        }
        return null;
    },
    
    fillForm(data) {
        if (!data) return;
        
        document.getElementById('ph').value = data.ph || '';
        document.getElementById('hydrogenSulfide').value = data.hydrogenSulfide || '';
        document.getElementById('turbidity').value = data.turbidity || '';
        document.getElementById('nitrogen').value = data.nitrogen || '';
        document.getElementById('copper').value = data.copper || '';
        document.getElementById('dissolvedOxygen').value = data.dissolvedOxygen || '';
        document.getElementById('temperature').value = data.temperature || '';
        
        ui.showNotification('Sensor data loaded into form!', 'success');
    },

    async disconnect() {
        if (this.port) {
            try {
                await this.port.close();
                this.port = null;
                this.isConnected = false;
                ui.showNotification('Sensor disconnected', 'info');
            } catch (error) {
                console.error('Disconnect error:', error);
            }
        }
    }
};
