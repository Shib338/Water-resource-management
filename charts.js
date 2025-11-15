/**
 * Charts and Analytics System - Individual Parameter Charts
 */

const charts = {
    distributionChart: null,
    parameterCharts: {},
    trendChart: null,

    // Initialize charts
    init() {
        this.createTrendChart();
        this.createDistributionChart();
        this.createParameterCharts();
    },

    // Create individual parameter charts
    createParameterCharts() {
        const parameters = [
            { id: 'phChart', param: 'ph', label: 'pH Level', color: '#667eea' },
            { id: 'temperatureChart', param: 'temperature', label: 'Temperature (°C)', color: '#38ef7d' },
            { id: 'oxygenChart', param: 'dissolvedOxygen', label: 'Dissolved Oxygen (mg/L)', color: '#00f2fe' },
            { id: 'turbidityChart', param: 'turbidity', label: 'Turbidity (NTU)', color: '#f5576c' },
            { id: 'hydrogenSulfideChart', param: 'hydrogenSulfide', label: 'Hydrogen Sulfide (mg/L)', color: '#f093fb' },
            { id: 'nitrogenChart', param: 'nitrogen', label: 'Nitrogen (mg/L)', color: '#764ba2' },
            { id: 'copperChart', param: 'copper', label: 'Copper (mg/L)', color: '#2c3e50' }
        ];

        parameters.forEach(param => {
            const ctx = document.getElementById(param.id);
            if (!ctx) return;

            this.parameterCharts[param.param] = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: param.label,
                        data: [],
                        borderColor: param.color,
                        backgroundColor: param.color + '20',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            grid: { 
                                display: true,
                                color: 'rgba(0,0,0,0.1)',
                                lineWidth: 1
                            },
                            ticks: { 
                                font: { size: 10 },
                                color: '#666'
                            }
                        },
                        x: {
                            grid: { 
                                display: true,
                                color: 'rgba(0,0,0,0.1)',
                                lineWidth: 1
                            },
                            ticks: { 
                                font: { size: 10 },
                                color: '#666'
                            }
                        }
                    },
                    elements: {
                        point: { 
                            radius: 3,
                            hoverRadius: 5,
                            borderWidth: 2
                        },
                        line: {
                            borderWidth: 2
                        }
                    }
                }
            });
        });
    },

    // Create trend chart for dashboard
    createTrendChart() {
        const ctx = document.getElementById('trendChart');
        if (!ctx) return;

        this.trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'pH Level',
                    data: [],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: {
                            display: true,
                            color: 'rgba(0,0,0,0.15)',
                            lineWidth: 1
                        },
                        ticks: {
                            font: { size: 11 },
                            color: '#555'
                        }
                    },
                    x: {
                        grid: {
                            display: true,
                            color: 'rgba(0,0,0,0.15)',
                            lineWidth: 1
                        },
                        ticks: {
                            font: { size: 11 },
                            color: '#555'
                        }
                    }
                },
                elements: {
                    point: {
                        radius: 4,
                        hoverRadius: 6,
                        borderWidth: 2
                    },
                    line: {
                        borderWidth: 3,
                        tension: 0.4
                    }
                }
            }
        });
    },





    // Create distribution chart
    createDistributionChart() {
        const ctx = document.getElementById('distributionChart');
        if (!ctx) return;

        this.distributionChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Normal', 'Alert'],
                datasets: [{
                    data: [0, 0],
                    backgroundColor: [
                        '#38ef7d',
                        '#f5576c'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: { size: 12 },
                            padding: 15,
                            usePointStyle: true
                        }
                    }
                },
                elements: {
                    arc: {
                        borderWidth: 2,
                        borderColor: '#fff'
                    }
                }
            }
        });
    },

    // Update all charts with data
    updateCharts(readings) {
        if (readings.length === 0) return;

        this.updateTrendChart(readings);
        this.updateDistributionChart(readings);
        this.updateParameterCharts(readings);
        this.updateGauges(readings);
        this.updateAnalytics(readings);
        this.updateNutrientBars(readings);
    },

    // Update individual parameter charts
    updateParameterCharts(readings) {
        try {
            const parameters = ['ph', 'temperature', 'dissolvedOxygen', 'turbidity', 'hydrogenSulfide', 'nitrogen', 'copper'];
            
            parameters.forEach(param => {
                try {
                    const chart = this.parameterCharts[param];
                    if (!chart) return;

                    const labels = readings.map(r => r.time || 'N/A');
                    const data = readings.map(r => {
                        const value = r[param];
                        return isNaN(value) ? 0 : value;
                    });

                    chart.data.labels = labels;
                    chart.data.datasets[0].data = data;
                    chart.update('none');
                } catch (error) {
                    console.error(`Error updating ${param} chart:`, error);
                }
            });
        } catch (error) {
            console.error('Parameter charts update error:', error);
        }
    },

    // Update trend chart
    updateTrendChart(readings) {
        if (!this.trendChart) return;

        const labels = readings.slice(-10).map(r => r.time);
        const data = readings.slice(-10).map(r => r.ph);

        this.trendChart.data.labels = labels;
        this.trendChart.data.datasets[0].data = data;
        this.trendChart.update();
    },





    // Update distribution chart
    updateDistributionChart(readings) {
        if (!this.distributionChart) return;

        const normal = readings.filter(r => this.isNormal(r)).length;
        const alert = readings.filter(r => !this.isNormal(r)).length;

        this.distributionChart.data.datasets[0].data = [normal, alert];
        this.distributionChart.update();
    },

    // Update gauge charts
    updateGauges(readings) {
        if (readings.length === 0) return;

        const latest = readings[readings.length - 1];
        
        this.createGauge('phGauge', latest.ph, 0, 14, 'pH');
        this.createGauge('tempGauge', latest.temperature, 0, 50, '°C');
        this.createGauge('oxygenGauge', latest.dissolvedOxygen, 0, 20, 'mg/L');
        this.createGauge('turbidityGauge', latest.turbidity, 0, 10, 'NTU');
    },

    // Create gauge chart
    createGauge(canvasId, value, min, max, unit) {
        try {
            const canvas = document.getElementById(canvasId);
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const radius = Math.min(canvas.width, canvas.height) / 3;

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Validate value
            const safeValue = isNaN(value) ? min : Math.max(min, Math.min(max, value));

            // Draw background arc
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI);
            ctx.strokeStyle = '#e9ecef';
            ctx.lineWidth = 6;
            ctx.stroke();

            // Draw value arc
            const angle = Math.PI + (Math.PI * (safeValue - min) / (max - min));
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, Math.PI, angle);
            ctx.strokeStyle = this.getGaugeColor(safeValue, min, max);
            ctx.lineWidth = 6;
            ctx.stroke();

            // Draw value text
            ctx.fillStyle = '#333';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(safeValue.toFixed(1), centerX, centerY + 2);
        } catch (error) {
            console.error('Gauge creation error:', error);
        }
    },

    // Get gauge color based on value
    getGaugeColor(value, min, max) {
        const percentage = (value - min) / (max - min);
        
        if (percentage < 0.3) return '#38ef7d'; // Green
        if (percentage < 0.7) return '#f093fb'; // Yellow
        return '#f5576c'; // Red
    },

    // Check if reading is normal
    isNormal(reading) {
        return reading.ph >= 6.5 && reading.ph <= 8.5 &&
               reading.temperature >= 15 && reading.temperature <= 30 &&
               reading.dissolvedOxygen >= 5 && reading.dissolvedOxygen <= 14 &&
               reading.turbidity >= 0 && reading.turbidity <= 5;
    },

    // Update analytics sections
    updateAnalytics(readings) {
        this.updateCorrelationAnalysis(readings);
        this.updateQualityAssessment(readings);
    },

    // Update correlation analysis
    updateCorrelationAnalysis(readings) {
        const container = document.getElementById('correlationAnalysis');
        if (!container) return;
        
        if (readings.length === 0) {
            container.innerHTML = '<div class="text-center text-muted"><small>No data available</small></div>';
            return;
        }

        const latest = readings[readings.length - 1];
        const html = `
            <div class="row g-2">
                <div class="col-6">
                    <div class="text-center p-2 bg-light rounded">
                        <small class="text-muted">pH vs Oxygen</small>
                        <div class="fw-bold text-primary">${(latest.ph * latest.dissolvedOxygen / 10).toFixed(1)}</div>
                    </div>
                </div>
                <div class="col-6">
                    <div class="text-center p-2 bg-light rounded">
                        <small class="text-muted">Temp vs Turbidity</small>
                        <div class="fw-bold text-success">${(latest.temperature * latest.turbidity).toFixed(1)}</div>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML = html;
    },

    // Update quality assessment
    updateQualityAssessment(readings) {
        const container = document.getElementById('qualityAssessment');
        if (!container) return;
        
        if (readings.length === 0) {
            container.innerHTML = '<div class="text-center text-muted"><small>No data available</small></div>';
            return;
        }

        try {
            const latest = readings[readings.length - 1];
            const wqi = Utils.calculateWQI(latest);
            const status = Utils.getWQIStatus(wqi);

            const html = `
                <div class="text-center">
                    <div class="display-6 fw-bold text-${status.color}">${wqi}</div>
                    <div class="text-muted small">Water Quality Index</div>
                    <div class="badge bg-${status.color} mt-2">${status.status}</div>
                </div>
            `;
            container.innerHTML = html;
        } catch (error) {
            console.error('Quality assessment error:', error);
            container.innerHTML = '<div class="text-center text-danger"><small>Error calculating WQI</small></div>';
        }
    },

    // Update nutrient bars for dashboard
    updateNutrientBars(readings) {
        const container = document.getElementById('nutrientBars');
        if (!container || readings.length === 0) return;

        const latest = readings[readings.length - 1];
        const nutrients = [
            { name: 'Nitrogen', value: latest.nitrogen, max: 10, color: 'primary' },
            { name: 'Copper', value: latest.copper, max: 2, color: 'warning' },
            { name: 'H₂S', value: latest.hydrogenSulfide, max: 0.1, color: 'danger' }
        ];

        const html = nutrients.map(nutrient => {
            const percentage = Math.min((nutrient.value / nutrient.max) * 100, 100);
            return `
                <div class="mb-3">
                    <div class="d-flex justify-content-between mb-1">
                        <small class="fw-bold">${nutrient.name}</small>
                        <small class="text-muted">${nutrient.value}/${nutrient.max}</small>
                    </div>
                    <div class="progress" style="height: 8px;">
                        <div class="progress-bar bg-${nutrient.color}" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    },

    // Update charts with all available data
    updateAllCharts() {
        const readings = app.readings || [];
        this.updateCharts(readings);
    }
};

// Initialize charts when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (typeof Chart !== 'undefined') {
        setTimeout(() => {
            charts.init();
        }, 300);
    }
});