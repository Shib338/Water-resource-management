/**
 * Simple Sensor Integration
 */

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
                    readBtn.disabled = false;
                    statusDiv.innerHTML = '<i class="bi bi-check-circle text-success"></i> Sensor connected';
                }
            };
        }

        if (readBtn) {
            readBtn.onclick = async () => {
                statusDiv.innerHTML = '<i class="bi bi-hourglass-split text-primary"></i> Reading data...';
                const data = await this.readData();
                if (data) {
                    this.fillForm(data);
                    statusDiv.innerHTML = '<i class="bi bi-check-circle text-success"></i> Data loaded successfully';
                } else {
                    statusDiv.innerHTML = '<i class="bi bi-x-circle text-danger"></i> Failed to read data';
                }
            };
        }
    },

    async connect() {
        if (!('serial' in navigator)) {
            alert('Web Serial API not supported. Please use Chrome, Edge, or Opera browser.');
            return false;
        }

        try {
            this.port = await navigator.serial.requestPort();
            await this.port.open({ baudRate: 9600 });
            this.isConnected = true;
            ui.showNotification('Sensor connected successfully!', 'success');
            return true;
        } catch (error) {
            console.error('Connection error:', error);
            ui.showNotification('Failed to connect: ' + error.message, 'danger');
            return false;
        }
    },

    async readData() {
        if (!this.isConnected || !this.port) {
            ui.showNotification('Please connect sensor first', 'warning');
            return null;
        }

        try {
            const reader = this.port.readable.getReader();
            let buffer = '';
            
            // Read for 2 seconds
            const timeout = setTimeout(() => reader.cancel(), 2000);
            
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                
                buffer += new TextDecoder().decode(value);
                
                // Check if we have a complete line
                if (buffer.includes('\n')) {
                    clearTimeout(timeout);
                    break;
                }
            }
            
            reader.releaseLock();
            
            if (buffer.trim()) {
                return this.parseData(buffer);
            }
            
            ui.showNotification('No data received from sensor', 'warning');
            return null;
        } catch (error) {
            console.error('Read error:', error);
            ui.showNotification('Failed to read: ' + error.message, 'danger');
            return null;
        }
    },

    parseData(rawData) {
        try {
            console.log('Raw sensor data:', rawData);
            
            // Try JSON format first
            if (rawData.trim().startsWith('{')) {
                const parsed = JSON.parse(rawData);
                console.log('Parsed JSON:', parsed);
                return parsed;
            }
            
            // Try CSV format: pH,H2S,Turbidity,Nitrogen,Copper,DO,Temp
            const values = rawData.trim().split(',').map(v => v.trim());
            console.log('CSV values:', values);
            
            if (values.length >= 7) {
                const data = {
                    ph: parseFloat(values[0]),
                    hydrogenSulfide: parseFloat(values[1]),
                    turbidity: parseFloat(values[2]),
                    nitrogen: parseFloat(values[3]),
                    copper: parseFloat(values[4]),
                    dissolvedOxygen: parseFloat(values[5]),
                    temperature: parseFloat(values[6])
                };
                console.log('Parsed CSV:', data);
                return data;
            }
            
            ui.showNotification('Invalid data format from sensor', 'warning');
        } catch (error) {
            console.error('Data parsing error:', error);
            ui.showNotification('Error parsing sensor data', 'danger');
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
        
        ui.showNotification('Sensor data loaded into form', 'success');
    },

    async disconnect() {
        if (this.port) {
            await this.port.close();
            this.port = null;
            this.isConnected = false;
            ui.showNotification('Sensor disconnected', 'info');
        }
    }
};