const sensor = {
    port: null,
    isConnected: false,

    init() {
        const connectBtn = document.getElementById('connectBtn');
        const readBtn = document.getElementById('readBtn');
        const statusDiv = document.getElementById('sensorStatus');

        connectBtn.onclick = async () => {
            try {
                if (!('serial' in navigator)) {
                    alert('Web Serial API not supported. Use Chrome/Edge browser.');
                    return;
                }

                this.port = await navigator.serial.requestPort();
                await this.port.open({ baudRate: 9600 });
                this.isConnected = true;

                connectBtn.disabled = true;
                connectBtn.classList.remove('btn-outline-primary');
                connectBtn.classList.add('btn-success');
                connectBtn.innerHTML = '<i class="bi bi-check-circle"></i> Connected';
                readBtn.disabled = false;
                statusDiv.innerHTML = '<i class="bi bi-check-circle text-success"></i> Connected! Click Read Data';
                ui.showNotification('Sensor connected!', 'success');
            } catch (error) {
                statusDiv.innerHTML = '<i class="bi bi-x-circle text-danger"></i> Connection failed';
                ui.showNotification('Failed: ' + error.message, 'danger');
            }
        };

        readBtn.onclick = async () => {
            if (!this.isConnected) {
                ui.showNotification('Connect sensor first!', 'warning');
                return;
            }

            readBtn.disabled = true;
            statusDiv.innerHTML = '<i class="bi bi-hourglass-split text-primary"></i> Reading...';

            try {
                const reader = this.port.readable.getReader();
                let buffer = '';
                let attempts = 0;
                const maxAttempts = 50;

                while (attempts < maxAttempts) {
                    const { value, done } = await reader.read();
                    if (done) break;

                    const text = new TextDecoder().decode(value);
                    buffer += text;
                    console.log('Received:', text);

                    if (buffer.includes('\n')) {
                        const lines = buffer.split('\n');
                        for (let line of lines) {
                            line = line.trim();
                            if (line.length > 5) {
                                console.log('Processing:', line);
                                const data = this.parseData(line);
                                if (data) {
                                    reader.releaseLock();
                                    this.fillForm(data);
                                    statusDiv.innerHTML = '<i class="bi bi-check-circle text-success"></i> Data loaded!';
                                    readBtn.disabled = false;
                                    return;
                                }
                            }
                        }
                        buffer = '';
                    }
                    attempts++;
                }

                reader.releaseLock();
                statusDiv.innerHTML = '<i class="bi bi-x-circle text-danger"></i> No data received';
                ui.showNotification('No data from sensor', 'warning');
            } catch (error) {
                console.error('Read error:', error);
                statusDiv.innerHTML = '<i class="bi bi-x-circle text-danger"></i> Read failed';
                ui.showNotification('Read error: ' + error.message, 'danger');
            }

            readBtn.disabled = false;
        };
    },

    parseData(line) {
        try {
            // JSON format
            if (line.startsWith('{')) {
                return JSON.parse(line);
            }

            // CSV format: pH,H2S,Turbidity,Nitrogen,Copper,DO,Temp
            const values = line.split(',').map(v => parseFloat(v.trim()));
            
            if (values.length >= 7 && values.every(v => !isNaN(v))) {
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
        } catch (e) {
            console.error('Parse error:', e);
        }
        return null;
    },

    fillForm(data) {
        document.getElementById('ph').value = data.ph;
        document.getElementById('hydrogenSulfide').value = data.hydrogenSulfide;
        document.getElementById('turbidity').value = data.turbidity;
        document.getElementById('nitrogen').value = data.nitrogen;
        document.getElementById('copper').value = data.copper;
        document.getElementById('dissolvedOxygen').value = data.dissolvedOxygen;
        document.getElementById('temperature').value = data.temperature;
        ui.showNotification('Data loaded from sensor!', 'success');
    }
};
