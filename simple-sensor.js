const sensor = {
    port: null,
    reader: null,
    isConnected: false,
    keepReading: false,

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
                    parity: 'none'
                });
                
                this.isConnected = true;
                connectBtn.disabled = true;
                connectBtn.classList.remove('btn-outline-primary');
                connectBtn.classList.add('btn-success');
                connectBtn.innerHTML = '<i class="bi bi-check-circle"></i> Connected';
                readBtn.disabled = false;
                statusDiv.innerHTML = '<i class="bi bi-check-circle text-success"></i> Sensor connected! Ready to read';
                ui.showNotification('USB Sensor connected successfully!', 'success');
                
                console.log('✅ Sensor connected');
            } catch (error) {
                console.error('Connection error:', error);
                statusDiv.innerHTML = '<i class="bi bi-x-circle text-danger"></i> Connection failed: ' + error.message;
                ui.showNotification('Connection failed: ' + error.message, 'danger');
            }
        };

        readBtn.onclick = async () => {
            if (!this.isConnected || !this.port) {
                ui.showNotification('Please connect sensor first!', 'warning');
                return;
            }

            readBtn.disabled = true;
            statusDiv.innerHTML = '<i class="bi bi-hourglass-split text-primary"></i> Reading data from sensor...';
            console.log('📡 Starting to read data...');

            try {
                this.keepReading = true;
                this.reader = this.port.readable.getReader();
                let buffer = '';
                let timeout = setTimeout(() => {
                    this.keepReading = false;
                }, 5000);

                while (this.keepReading) {
                    const { value, done } = await this.reader.read();
                    
                    if (done) {
                        console.log('❌ Reader done');
                        break;
                    }

                    const chunk = new TextDecoder().decode(value);
                    buffer += chunk;
                    console.log('📥 Received chunk:', chunk);
                    console.log('📦 Buffer:', buffer);

                    // Check for complete line
                    if (buffer.includes('\n') || buffer.includes('\r')) {
                        clearTimeout(timeout);
                        const lines = buffer.split(/[\r\n]+/);
                        
                        for (let line of lines) {
                            line = line.trim();
                            console.log('🔍 Processing line:', line);
                            
                            if (line.length > 0) {
                                const data = this.parseData(line);
                                if (data) {
                                    console.log('✅ Valid data found:', data);
                                    this.keepReading = false;
                                    this.reader.releaseLock();
                                    this.fillForm(data);
                                    statusDiv.innerHTML = '<i class="bi bi-check-circle text-success"></i> Data loaded successfully!';
                                    readBtn.disabled = false;
                                    return;
                                }
                            }
                        }
                        buffer = '';
                    }
                }

                this.reader.releaseLock();
                statusDiv.innerHTML = '<i class="bi bi-x-circle text-danger"></i> No valid data received from sensor';
                ui.showNotification('No valid data received. Check sensor output.', 'warning');
                console.log('⚠️ No valid data found');
                
            } catch (error) {
                console.error('❌ Read error:', error);
                statusDiv.innerHTML = '<i class="bi bi-x-circle text-danger"></i> Read error: ' + error.message;
                ui.showNotification('Read error: ' + error.message, 'danger');
                
                if (this.reader) {
                    try {
                        this.reader.releaseLock();
                    } catch (e) {}
                }
            }

            readBtn.disabled = false;
        };
    },

    parseData(line) {
        console.log('🔧 Parsing:', line);
        
        try {
            // Try JSON format
            if (line.trim().startsWith('{')) {
                const data = JSON.parse(line);
                console.log('✅ Parsed as JSON:', data);
                return data;
            }

            // Try CSV format: pH,H2S,Turbidity,Nitrogen,Copper,DO,Temp
            const parts = line.split(',');
            console.log('📊 CSV parts:', parts);
            
            if (parts.length >= 7) {
                const values = parts.map(v => parseFloat(v.trim()));
                console.log('🔢 Parsed values:', values);
                
                if (values.every(v => !isNaN(v) && v >= 0)) {
                    const data = {
                        ph: values[0],
                        hydrogenSulfide: values[1],
                        turbidity: values[2],
                        nitrogen: values[3],
                        copper: values[4],
                        dissolvedOxygen: values[5],
                        temperature: values[6]
                    };
                    console.log('✅ Parsed as CSV:', data);
                    return data;
                }
            }
        } catch (error) {
            console.error('❌ Parse error:', error);
        }
        
        console.log('⚠️ Could not parse data');
        return null;
    },

    fillForm(data) {
        console.log('📝 Filling form with:', data);
        
        document.getElementById('ph').value = data.ph || '';
        document.getElementById('hydrogenSulfide').value = data.hydrogenSulfide || '';
        document.getElementById('turbidity').value = data.turbidity || '';
        document.getElementById('nitrogen').value = data.nitrogen || '';
        document.getElementById('copper').value = data.copper || '';
        document.getElementById('dissolvedOxygen').value = data.dissolvedOxygen || '';
        document.getElementById('temperature').value = data.temperature || '';
        
        ui.showNotification('✅ Sensor data loaded into form!', 'success');
        console.log('✅ Form filled successfully');
    }
};
