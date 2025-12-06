/**
 * Simple Sensor Integration
 */

const sensor = {
    port: null,
    reader: null,
    isConnected: false,

    async connect() {
        if (!('serial' in navigator)) {
            ui.showNotification('Web Serial API not supported', 'error');
            return false;
        }

        try {
            this.port = await navigator.serial.requestPort();
            await this.port.open({ baudRate: 9600 });
            this.isConnected = true;
            ui.showNotification('Sensor connected successfully', 'success');
            return true;
        } catch (error) {
            ui.showNotification('Failed to connect sensor', 'error');
            return false;
        }
    },

    async readData() {
        if (!this.isConnected || !this.port) {
            ui.showNotification('No sensor connected', 'warning');
            return null;
        }

        try {
            const reader = this.port.readable.getReader();
            const { value } = await reader.read();
            reader.releaseLock();

            const data = new TextDecoder().decode(value);
            return this.parseData(data);
        } catch (error) {
            ui.showNotification('Failed to read sensor data', 'error');
            return null;
        }
    },

    parseData(rawData) {
        try {
            // Try JSON format first
            if (rawData.trim().startsWith('{')) {
                return JSON.parse(rawData);
            }
            
            // Try CSV format
            const values = rawData.trim().split(',');
            if (values.length >= 7) {
                return {
                    ph: parseFloat(values[0]),
                    hydrogenSulfide: parseFloat(values[1]),
                    turbidity: parseFloat(values[2]),
                    nitrogen: parseFloat(values[3]),
                    copper: parseFloat(values[4]),
                    dissolvedOxygen: parseFloat(values[5]),
                    temperature: parseFloat(values[6])
                };
            }
        } catch (error) {
            console.error('Data parsing error:', error);
        }
        return null;
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