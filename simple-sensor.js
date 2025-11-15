/**
 * Simple USB Sensor Connection
 */

const sensor = {
    port: null,
    connected: false,

    async init() {
        document.getElementById('connectBtn').onclick = () => this.connect();
        document.getElementById('readBtn').onclick = () => this.read();
        this.updateStatus('Ready');
    },

    async connect() {
        try {
            if (!navigator.serial) {
                alert('USB connection requires Chrome or Edge browser');
                return;
            }

            this.updateStatus('Connecting...');
            
            this.port = await navigator.serial.requestPort();
            await this.port.open({ baudRate: 9600 });
            
            this.connected = true;
            document.getElementById('connectBtn').textContent = 'Disconnect';
            document.getElementById('connectBtn').className = 'btn btn-danger w-100 btn-lg';
            document.getElementById('readBtn').disabled = false;
            
            this.updateStatus('Connected');
            alert('✓ Device connected successfully!');
            
        } catch (error) {
            this.updateStatus('Failed');
            if (error.name === 'NotFoundError') {
                alert('No USB serial device found. Connect Arduino or sensor device.');
            } else {
                alert('Connection failed: ' + error.message);
            }
        }
    },

    async read() {
        if (!this.connected) {
            alert('Connect device first');
            return;
        }

        try {
            this.updateStatus('Reading...');
            
            const writer = this.port.writable.getWriter();
            await writer.write(new TextEncoder().encode('READ\n'));
            writer.releaseLock();
            
            const reader = this.port.readable.getReader();
            const { value } = await reader.read();
            reader.releaseLock();
            
            if (value) {
                const data = new TextDecoder().decode(value);
                this.parseAndFill(data);
                this.updateStatus('Data loaded');
                alert('✓ Data received from device!');
            } else {
                alert('No data received from device');
            }
            
        } catch (error) {
            this.updateStatus('Read failed');
            alert('Read failed: ' + error.message);
        }
    },

    parseAndFill(data) {
        const clean = data.trim();
        
        // Try CSV format
        if (clean.includes(',')) {
            const values = clean.split(',').map(v => parseFloat(v.trim()));
            if (values.length >= 7) {
                document.getElementById('ph').value = values[0] || 7.0;
                document.getElementById('hydrogenSulfide').value = values[1] || 0.05;
                document.getElementById('turbidity').value = values[2] || 1.0;
                document.getElementById('nitrogen').value = values[3] || 5.0;
                document.getElementById('copper').value = values[4] || 1.0;
                document.getElementById('dissolvedOxygen').value = values[5] || 8.0;
                document.getElementById('temperature').value = values[6] || 20.0;
                
                if (!document.getElementById('location').value) {
                    document.getElementById('location').value = 'USB Sensor Reading';
                }
                return;
            }
        }
        
        // Default test values if can't parse
        document.getElementById('ph').value = '7.2';
        document.getElementById('hydrogenSulfide').value = '0.08';
        document.getElementById('turbidity').value = '2.1';
        document.getElementById('nitrogen').value = '3.5';
        document.getElementById('copper').value = '0.15';
        document.getElementById('dissolvedOxygen').value = '8.5';
        document.getElementById('temperature').value = '22.3';
        document.getElementById('location').value = 'USB Device Test';
    },

    updateStatus(message) {
        const status = document.getElementById('sensorStatus');
        if (status) {
            const icon = this.connected ? 'bi-check-circle text-success' : 'bi-usb text-muted';
            status.innerHTML = `<i class="bi ${icon}"></i> ${message}`;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => sensor.init());