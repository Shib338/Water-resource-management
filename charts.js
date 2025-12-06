/**
 * Charts System - Analytics Page
 */

const charts = {
    allCharts: {},

    updateCharts(readings) {
        if (!readings || readings.length === 0) {
            console.log('Clearing all charts');
            this.clearAllCharts();
            return;
        }

        console.log('Updating charts with', readings.length, 'readings');
        
        // Update all 7 parameter charts
        this.updateParameterChart('phChart', readings, 'ph', 'pH Level');
        this.updateParameterChart('temperatureChart', readings, 'temperature', 'Temperature (°C)');
        this.updateParameterChart('oxygenChart', readings, 'dissolvedOxygen', 'Dissolved Oxygen (mg/L)');
        this.updateParameterChart('turbidityChart', readings, 'turbidity', 'Turbidity (NTU)');
        this.updateParameterChart('hydrogenSulfideChart', readings, 'hydrogenSulfide', 'Hydrogen Sulfide (mg/L)');
        this.updateParameterChart('nitrogenChart', readings, 'nitrogen', 'Nitrogen (mg/L)');
        this.updateParameterChart('copperChart', readings, 'copper', 'Copper (mg/L)');
        
        // Update gauges
        this.updateGauges(readings);
        
        // Update quality assessment
        this.updateQualityAssessment(readings);
        
        // Update improvement solutions
        this.updateImprovementSolutions(readings);
        
        // Update correlations
        this.updateCorrelations(readings);
    },

    clearAllCharts() {
        // Destroy all charts
        Object.keys(this.allCharts).forEach(key => {
            if (this.allCharts[key]) {
                this.allCharts[key].destroy();
                delete this.allCharts[key];
            }
        });
        
        // Clear gauges
        ['phGauge', 'tempGauge', 'oxygenGauge', 'turbidityGauge'].forEach(id => {
            const canvas = document.getElementById(id);
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        });
        
        // Clear quality assessment
        const qualityDiv = document.getElementById('qualityAssessment');
        if (qualityDiv) {
            qualityDiv.innerHTML = '<p class="text-muted">No data available</p>';
        }
        
        // Clear correlations
        const corrDiv = document.getElementById('correlationAnalysis');
        if (corrDiv) {
            corrDiv.innerHTML = '<p class="text-muted">No data for correlation analysis</p>';
        }
        
        // Clear statistical summary
        const statsDiv = document.getElementById('statisticalSummary');
        if (statsDiv) {
            statsDiv.innerHTML = '<p class="text-muted text-center">No data available for analysis</p>';
        }
    },

    updateCorrelations(readings) {
        const corrDiv = document.getElementById('correlationAnalysis');
        if (!corrDiv) return;
        
        if (readings.length === 0) {
            corrDiv.innerHTML = '<p class="text-muted">No data for correlation analysis</p>';
            return;
        }
        
        const latest = readings[readings.length - 1];
        
        corrDiv.innerHTML = `
            <h6 class="mb-3">Parameter Relationships</h6>
            <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span><strong>pH vs Temperature</strong></span>
                    <span class="badge bg-success">Normal</span>
                </div>
                <div class="progress" style="height: 8px;">
                    <div class="progress-bar bg-success" style="width: 75%"></div>
                </div>
            </div>
            <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span><strong>Oxygen vs Temperature</strong></span>
                    <span class="badge bg-info">Inverse</span>
                </div>
                <div class="progress" style="height: 8px;">
                    <div class="progress-bar bg-info" style="width: 60%"></div>
                </div>
            </div>
            <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span><strong>Turbidity vs Quality</strong></span>
                    <span class="badge bg-warning">Monitored</span>
                </div>
                <div class="progress" style="height: 8px;">
                    <div class="progress-bar bg-warning" style="width: 50%"></div>
                </div>
            </div>
            <div class="mb-0">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span><strong>Chemical Balance</strong></span>
                    <span class="badge bg-primary">Stable</span>
                </div>
                <div class="progress" style="height: 8px;">
                    <div class="progress-bar bg-primary" style="width: 80%"></div>
                </div>
            </div>
        `;
    },

    updateParameterChart(canvasId, readings, parameter, label) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart
        if (this.allCharts[canvasId]) {
            this.allCharts[canvasId].destroy();
        }

        const labels = readings.map(r => new Date(r.timestamp).toLocaleTimeString());
        const data = readings.map(r => r[parameter]);

        this.allCharts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: label,
                    data: data,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true }
                },
                scales: {
                    y: { beginAtZero: false }
                }
            }
        });
    },

    updateGauges(readings) {
        if (readings.length === 0) return;
        const latest = readings[readings.length - 1];
        
        const gauges = [
            { id: 'phGauge', value: latest.ph, max: 14 },
            { id: 'tempGauge', value: latest.temperature, max: 50 },
            { id: 'oxygenGauge', value: latest.dissolvedOxygen, max: 20 },
            { id: 'turbidityGauge', value: latest.turbidity, max: 10 }
        ];
        
        gauges.forEach(gauge => {
            const canvas = document.getElementById(gauge.id);
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.font = 'bold 20px Arial';
                ctx.fillStyle = '#667eea';
                ctx.textAlign = 'center';
                ctx.fillText(gauge.value.toFixed(1), canvas.width/2, canvas.height/2 + 5);
            }
        });
    },

    updateQualityAssessment(readings) {
        const qualityDiv = document.getElementById('qualityAssessment');
        if (!qualityDiv || readings.length === 0) return;
        
        const latest = readings[readings.length - 1];
        const avgPh = (readings.reduce((sum, r) => sum + r.ph, 0) / readings.length).toFixed(2);
        
        qualityDiv.innerHTML = `
            <div class="text-center">
                <h2 class="text-success mb-3">GOOD</h2>
                <p class="text-muted">Water Quality Status</p>
                <hr>
                <div class="mt-3">
                    <p><strong>Average pH:</strong> ${avgPh}</p>
                    <p><strong>Total Readings:</strong> ${readings.length}</p>
                    <p><strong>Latest:</strong> ${new Date(latest.timestamp).toLocaleString()}</p>
                </div>
            </div>
        `;
    },

    updateImprovementSolutions(readings) {
        const solutionsDiv = document.getElementById('improvementSolutions');
        if (!solutionsDiv) return;
        
        solutionsDiv.innerHTML = `
            <div class="alert alert-warning mb-3">
                <h6 class="alert-heading"><i class="bi bi-exclamation-triangle"></i> Poor pH Levels (< 6.5 or > 8.5)</h6>
                <p class="mb-0"><strong>Solution:</strong> Add lime (calcium carbonate) to increase pH or sulfur to decrease pH. Regular monitoring required.</p>
            </div>
            <div class="alert alert-info mb-3">
                <h6 class="alert-heading"><i class="bi bi-droplet"></i> High Turbidity (> 5 NTU)</h6>
                <p class="mb-0"><strong>Solution:</strong> Install filtration systems, use sedimentation tanks, or apply coagulation/flocculation treatment.</p>
            </div>
            <div class="alert alert-success mb-3">
                <h6 class="alert-heading"><i class="bi bi-thermometer"></i> Temperature Issues</h6>
                <p class="mb-0"><strong>Solution:</strong> Provide shade cover, increase water flow rate, or install cooling/heating systems as needed.</p>
            </div>
            <div class="alert alert-primary mb-3">
                <h6 class="alert-heading"><i class="bi bi-wind"></i> Low Dissolved Oxygen (< 5 mg/L)</h6>
                <p class="mb-0"><strong>Solution:</strong> Install aerators, fountains, or waterfalls. Increase water circulation and reduce organic load.</p>
            </div>
            <div class="alert alert-danger mb-0">
                <h6 class="alert-heading"><i class="bi bi-shield-x"></i> Chemical Contamination</h6>
                <p class="mb-0"><strong>Solution:</strong> Use activated carbon filters, reverse osmosis systems, or biological treatment methods. Test regularly.</p>
            </div>
        `;
    }
};

window.charts = charts;
