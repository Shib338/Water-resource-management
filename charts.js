/**
 * Charts System - Analytics Page
 * @global
 */

/* global Chart */
const charts = {
    allCharts: {},

    updateCharts(readings) {
        if (!readings || !Array.isArray(readings) || readings.length === 0) {
            console.log('Clearing all charts');
            this.clearAllCharts();
            return;
        }
        
        // Validate and sanitize readings data
        const validReadings = readings.filter(reading => 
            reading && 
            typeof reading === 'object' && 
            typeof reading.ph === 'number' && 
            typeof reading.heavyMetal === 'number' &&
            reading.timestamp
        );
        
        if (validReadings.length === 0) {
            this.clearAllCharts();
            return;
        }

        console.log('Updating charts with', validReadings.length, 'valid readings');
        
        // Update statistical summary
        this.updateStatisticalSummary(validReadings);
        
        // Update 2 parameter charts
        this.updateParameterChart('phChart', validReadings, 'ph', 'pH Level');
        this.updateParameterChart('heavyMetalChart', validReadings, 'heavyMetal', 'Lead Concentration (PPM)');
        
        // Update gauges
        this.updateGauges(validReadings);
        
        // Update quality assessment
        this.updateQualityAssessment(validReadings);
        
        // Update improvement solutions
        this.updateImprovementSolutions(validReadings);
        
        // Update correlations
        this.updateCorrelations(validReadings);
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
        ['phGauge', 'heavyMetalGauge'].forEach(id => {
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
        const phValues = readings.map(r => r.ph);
        const hmValues = readings.map(r => r.heavyMetal);
        
        // Calculate simple correlation coefficient
        const correlation = this.calculateCorrelation(phValues, hmValues);
        const corrStrength = Math.abs(correlation);
        const corrType = correlation > 0 ? 'Positive' : 'Negative';
        
        let corrStatus, corrColor;
        if (corrStrength > 0.7) {
            corrStatus = 'Strong';
            corrColor = 'danger';
        } else if (corrStrength > 0.3) {
            corrStatus = 'Moderate';
            corrColor = 'warning';
        } else {
            corrStatus = 'Weak';
            corrColor = 'success';
        }
        
        corrDiv.innerHTML = `
            <h6 class="mb-3">Parameter Relationships</h6>
            <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span><strong>pH vs Heavy Metal</strong></span>
                    <span class="badge bg-${corrColor}">${corrStatus} ${corrType}</span>
                </div>
                <div class="progress" style="height: 8px;">
                    <div class="progress-bar bg-${corrColor}" style="width: ${corrStrength * 100}%"></div>
                </div>
                <small class="text-muted">Correlation: ${correlation.toFixed(3)}</small>
            </div>
            <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span><strong>Water Quality Index</strong></span>
                    <span class="badge bg-info">Calculated</span>
                </div>
                <div class="progress" style="height: 8px;">
                    <div class="progress-bar bg-info" style="width: ${this.calculateWQI(latest)}%"></div>
                </div>
                <small class="text-muted">Based on pH and heavy metal levels</small>
            </div>
            <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span><strong>Safety Status</strong></span>
                    <span class="badge bg-${this.getSafetyStatus(latest).color}">${this.getSafetyStatus(latest).status}</span>
                </div>
                <div class="progress" style="height: 8px;">
                    <div class="progress-bar bg-${this.getSafetyStatus(latest).color}" style="width: ${this.getSafetyStatus(latest).percentage}%"></div>
                </div>
            </div>
            <div class="mb-0">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span><strong>Trend Analysis</strong></span>
                    <span class="badge bg-primary">Monitoring</span>
                </div>
                <div class="progress" style="height: 8px;">
                    <div class="progress-bar bg-primary" style="width: 85%"></div>
                </div>
                <small class="text-muted">Based on ${readings.length} readings</small>
            </div>
        `;
    },

    calculateCorrelation(x, y) {
        const n = x.length;
        if (n === 0) return 0;
        
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
        const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
        
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        
        return denominator === 0 ? 0 : numerator / denominator;
    },

    calculateWQI(reading) {
        if (!reading) return 0;
        
        const phScore = (reading.ph >= 6.5 && reading.ph <= 8.5) ? 100 : Math.max(0, 100 - Math.abs(reading.ph - 7) * 20);
        const hmScore = reading.heavyMetal <= 500 ? 100 : Math.max(0, 100 - (reading.heavyMetal - 500) / 10);
        
        return Math.round((phScore + hmScore) / 2);
    },

    getSafetyStatus(reading) {
        if (!reading) return { status: 'Unknown', color: 'secondary', percentage: 0 };
        
        const phSafe = reading.ph >= 6.5 && reading.ph <= 8.5;
        const hmSafe = reading.heavyMetal <= 500;
        
        if (phSafe && hmSafe) {
            return { status: 'Safe', color: 'success', percentage: 100 };
        } else if (phSafe || hmSafe) {
            return { status: 'Caution', color: 'warning', percentage: 60 };
        } else {
            return { status: 'Alert', color: 'danger', percentage: 30 };
        }
    },

    updateParameterChart(canvasId, readings, parameter, label) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.warn(`Canvas not found: ${canvasId}`);
            return;
        }
        
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded');
            return;
        }

        try {
            const ctx = canvas.getContext('2d');
            
            // Destroy existing chart
            if (this.allCharts[canvasId]) {
                this.allCharts[canvasId].destroy();
            }

            const chartReadings = validReadings.length > 15 ? validReadings.slice(-15) : validReadings;
            const labels = chartReadings.map((r, index) => `Reading ${index + 1}`);
            const data = chartReadings.map(r => {
                const value = r[parameter];
                return (typeof value === 'number' && !isNaN(value)) ? value : 0;
            });

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
        } catch (error) {
            console.error(`Chart creation error for ${canvasId}:`, error);
        }
    },

    updateGauges(readings) {
        if (readings.length === 0) return;
        const latest = readings[readings.length - 1];
        if (!latest) return;
        
        const gauges = [
            { id: 'phGauge', value: latest.ph || 0, max: 14 },
            { id: 'heavyMetalGauge', value: latest.heavyMetal || 0, max: 500 }
        ];
        
        gauges.forEach(gauge => {
            const canvas = document.getElementById(gauge.id);
            if (canvas) {
                try {
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.font = 'bold 20px Arial';
                    ctx.fillStyle = '#667eea';
                    ctx.textAlign = 'center';
                    ctx.fillText(gauge.value.toFixed(1), canvas.width/2, canvas.height/2 + 5);
                } catch (error) {
                    console.error(`Gauge update error for ${gauge.id}:`, error);
                }
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
                    <p><strong>Lead Level:</strong> ${latest.heavyMetal?.toFixed(0)} PPM</p>
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
            <div class="alert alert-danger mb-3">
                <h6 class="alert-heading"><i class="bi bi-shield-x"></i> High Lead Levels (> 500 PPM)</h6>
                <p class="mb-0"><strong>Solution:</strong> Install lead-specific filtration systems, replace lead pipes, use reverse osmosis or activated carbon filters.</p>
            </div>
            <div class="alert alert-info mb-3">
                <h6 class="alert-heading"><i class="bi bi-droplet"></i> Water Treatment Recommendations</h6>
                <p class="mb-0"><strong>Solution:</strong> Regular testing, proper filtration systems, and immediate action when parameters exceed safe limits.</p>
            </div>
            <div class="alert alert-success mb-0">
                <h6 class="alert-heading"><i class="bi bi-check-circle"></i> Preventive Measures</h6>
                <p class="mb-0"><strong>Solution:</strong> Install early warning systems, maintain equipment regularly, and establish emergency response protocols.</p>
            </div>
        `;
    },

    updateStatisticalSummary(readings) {
        const statsDiv = document.getElementById('statisticalSummary');
        if (!statsDiv || readings.length === 0) {
            if (statsDiv) statsDiv.innerHTML = '<p class="text-muted text-center">No data available for analysis</p>';
            return;
        }
        
        try {
            const phValues = readings.map(r => r.ph).filter(v => v !== undefined && v !== null && !isNaN(v));
            const heavyMetalValues = readings.map(r => r.heavyMetal).filter(v => v !== undefined && v !== null && !isNaN(v));
            
            if (phValues.length === 0 || heavyMetalValues.length === 0) {
                statsDiv.innerHTML = '<p class="text-muted text-center">Insufficient valid data for analysis</p>';
                return;
            }
            
            const phAvg = (phValues.reduce((a, b) => a + b, 0) / phValues.length).toFixed(2);
            const phMin = Math.min(...phValues).toFixed(2);
            const phMax = Math.max(...phValues).toFixed(2);
            
            const hmAvg = (heavyMetalValues.reduce((a, b) => a + b, 0) / heavyMetalValues.length).toFixed(0);
            const hmMin = Math.min(...heavyMetalValues).toFixed(0);
            const hmMax = Math.max(...heavyMetalValues).toFixed(0);
            
            const phNormal = phValues.filter(v => v >= 6.5 && v <= 8.5).length;
            const hmNormal = heavyMetalValues.filter(v => v >= 10 && v <= 500).length;
        
            statsDiv.innerHTML = `
            <div class="row g-4">
                <div class="col-md-6">
                    <div class="card border-primary">
                        <div class="card-header bg-primary text-white">
                            <h6 class="mb-0"><i class="bi bi-droplet-fill"></i> pH Level Statistics</h6>
                        </div>
                        <div class="card-body">
                            <div class="row text-center">
                                <div class="col-4">
                                    <h5 class="text-primary">${phAvg}</h5>
                                    <small class="text-muted">Average</small>
                                </div>
                                <div class="col-4">
                                    <h5 class="text-success">${phMin}</h5>
                                    <small class="text-muted">Minimum</small>
                                </div>
                                <div class="col-4">
                                    <h5 class="text-danger">${phMax}</h5>
                                    <small class="text-muted">Maximum</small>
                                </div>
                            </div>
                            <hr>
                            <div class="text-center">
                                <span class="badge bg-success">${phNormal}/${phValues.length} Normal Range</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card border-danger">
                        <div class="card-header bg-danger text-white">
                            <h6 class="mb-0"><i class="bi bi-exclamation-triangle"></i> Lead Statistics</h6>
                        </div>
                        <div class="card-body">
                            <div class="row text-center">
                                <div class="col-4">
                                    <h5 class="text-primary">${hmAvg}</h5>
                                    <small class="text-muted">Average (PPM)</small>
                                </div>
                                <div class="col-4">
                                    <h5 class="text-success">${hmMin}</h5>
                                    <small class="text-muted">Minimum (PPM)</small>
                                </div>
                                <div class="col-4">
                                    <h5 class="text-danger">${hmMax}</h5>
                                    <small class="text-muted">Maximum (PPM)</small>
                                </div>
                            </div>
                            <hr>
                            <div class="text-center">
                                <span class="badge bg-success">${hmNormal}/${heavyMetalValues.length} Normal Range</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        } catch (error) {
            console.error('Statistical summary error:', error);
            if (statsDiv) statsDiv.innerHTML = '<p class="text-danger text-center">Error calculating statistics</p>';
        }
    }
};

window.charts = charts;
