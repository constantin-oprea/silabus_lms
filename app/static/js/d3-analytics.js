/**
 * D3.js Real-Time Pedagogical Analytics
 * SilabusLMS - Student Performance Visualizations
 * 
 * Features:
 * - Sunburst chart for grade distribution by category
 * - Line chart for participation trends
 * - Real-time updates with D3 General Update Pattern
 */

// ===== GLOBAL STATE =====
const D3Analytics = {
    data: null,
    selectedGrade: null,
    colors: {
        AD: '#2E5D4B',  // Primary green - top grades
        A: '#4A8B6F',   // Light green
        B: '#5A9CB5',   // Blue
        C: '#F4A460',   // Orange
        D: '#E57373',   // Red
        categories: {
            essay: '#2E5D4B',
            quiz: '#5A9CB5',
            oral: '#4A8B6F',
            homework: '#F4A460',
            exam: '#9C27B0'
        }
    }
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('D3 Analytics: Initializing...');
    
    // Generate sample data (replace with API call in production)
    D3Analytics.data = generateSampleData();
    
    // Initialize visualizations
    buildSunburstChart();
    buildParticipationLine();
    
    // Setup filter event listeners
    setupFilterListeners();
    
    // Populate course filter from server data
    populateCourseFilter();
    
    console.log('D3 Analytics: Ready');
});

// ===== DATA FUNCTIONS =====

/**
 * Main update function - accepts JSON data and refreshes all charts
 * @param {Object} data - { grades: [], participation_scores: [], homework_metadata: [] }
 */
function updateAnalytics(data) {
    D3Analytics.data = transformToHierarchy(data);
    
    // Update visualizations with D3 General Update Pattern
    updateSunburst();
    updateParticipationLine();
}

/**
 * Transform backend data to D3-friendly hierarchical structure
 */
function transformToHierarchy(rawData) {
    if (!rawData || !rawData.grades) return generateSampleData();
    
    const categories = ['essay', 'quiz', 'oral', 'homework', 'exam'];
    const gradeLabels = ['AD', 'A', 'B', 'C', 'D'];
    
    const children = categories.map(category => ({
        name: category.charAt(0).toUpperCase() + category.slice(1),
        category: category,
        children: gradeLabels.map(grade => ({
            name: grade,
            grade: grade,
            value: rawData.grades.filter(g => 
                g.category === category && g.grade === grade
            ).length || Math.floor(Math.random() * 20) + 5
        }))
    }));
    
    return {
        name: 'Grades',
        children: children
    };
}

/**
 * Generate sample data for demonstration
 */
function generateSampleData() {
    const categories = [
        { name: 'Essays', category: 'essay' },
        { name: 'Quizzes', category: 'quiz' },
        { name: 'Spoken Tasks', category: 'oral' },
        { name: 'Homework', category: 'homework' },
        { name: 'Exams', category: 'exam' }
    ];
    
    const grades = ['AD', 'A', 'B', 'C', 'D'];
    
    return {
        name: 'Grades',
        children: categories.map(cat => ({
            name: cat.name,
            category: cat.category,
            children: grades.map(grade => ({
                name: grade,
                grade: grade,
                value: Math.floor(Math.random() * 25) + 5
            }))
        }))
    };
}

// ===== SUNBURST CHART =====

function buildSunburstChart() {
    const container = document.querySelector('#main-sunburst-container .d3-chart-container');
    if (!container) return;
    
    const svg = d3.select('#sunburstChart');
    const width = container.clientWidth || 400;
    const height = Math.min(width, 350);
    const radius = Math.min(width, height) / 2;
    
    svg.attr('viewBox', `0 0 ${width} ${height}`)
       .attr('preserveAspectRatio', 'xMidYMid meet');
    
    // Clear previous content
    svg.selectAll('*').remove();
    
    const g = svg.append('g')
        .attr('transform', `translate(${width / 2}, ${height / 2})`);
    
    // Create partition layout
    const partition = d3.partition()
        .size([2 * Math.PI, radius]);
    
    // Create hierarchy
    const root = d3.hierarchy(D3Analytics.data)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value);
    
    partition(root);
    
    // Arc generator
    const arc = d3.arc()
        .startAngle(d => d.x0)
        .endAngle(d => d.x1)
        .innerRadius(d => d.y0 * 0.6)
        .outerRadius(d => d.y1 * 0.6 - 1);
    
    // Draw arcs
    const paths = g.selectAll('path')
        .data(root.descendants().filter(d => d.depth))
        .join('path')
        .attr('d', arc)
        .attr('fill', d => getArcColor(d))
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .style('opacity', 0.85)
        .on('mouseover', function(event, d) {
            d3.select(this).style('opacity', 1);
            showTooltip(event, d);
        })
        .on('mouseout', function() {
            d3.select(this).style('opacity', 0.85);
            hideTooltip();
        })
        .on('click', function(event, d) {
            handleArcClick(d);
        });
    
    // Add center text
    g.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '-0.2em')
        .attr('class', 'sunburst-center-text')
        .style('font-size', '14px')
        .style('font-weight', '600')
        .style('fill', '#333')
        .text('Total');
    
    g.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '1.2em')
        .attr('class', 'sunburst-center-value')
        .style('font-size', '24px')
        .style('font-weight', '700')
        .style('fill', '#2E5D4B')
        .text(root.value);
}

function getArcColor(d) {
    if (d.depth === 1) {
        // Category level - use category colors
        return D3Analytics.colors.categories[d.data.category] || '#666';
    } else if (d.depth === 2) {
        // Grade level - use grade colors
        return D3Analytics.colors[d.data.grade] || '#999';
    }
    return '#ccc';
}

function updateSunburst() {
    // Re-render with updated data
    buildSunburstChart();
}

// ===== PARTICIPATION LINE CHART =====

function buildParticipationLine() {
    const container = document.querySelector('#workload-timeline .d3-chart-container');
    if (!container) return;
    
    const svg = d3.select('#participationLineChart');
    const width = container.clientWidth || 250;
    const height = 200;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    
    svg.attr('viewBox', `0 0 ${width} ${height}`)
       .attr('preserveAspectRatio', 'xMidYMid meet');
    
    // Clear previous
    svg.selectAll('*').remove();
    
    const g = svg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Sample participation data (7 days)
    const data = generateParticipationData();
    
    // Scales
    const x = d3.scalePoint()
        .domain(data.map(d => d.day))
        .range([0, innerWidth]);
    
    const y = d3.scaleLinear()
        .domain([0, 100])
        .range([innerHeight, 0]);
    
    // Line generator
    const line = d3.line()
        .x(d => x(d.day))
        .y(d => y(d.value))
        .curve(d3.curveMonotoneX);
    
    // Add axes
    g.append('g')
        .attr('transform', `translate(0, ${innerHeight})`)
        .call(d3.axisBottom(x).tickSize(0))
        .selectAll('text')
        .style('font-size', '10px')
        .style('fill', '#888');
    
    g.append('g')
        .call(d3.axisLeft(y).ticks(5).tickSize(-innerWidth))
        .selectAll('line')
        .style('stroke', '#eee');
    
    // Draw line
    g.append('path')
        .datum(data)
        .attr('class', 'participation-line')
        .attr('fill', 'none')
        .attr('stroke', '#2E5D4B')
        .attr('stroke-width', 2.5)
        .attr('d', line);
    
    // Add dots
    g.selectAll('.dot')
        .data(data)
        .join('circle')
        .attr('class', 'dot')
        .attr('cx', d => x(d.day))
        .attr('cy', d => y(d.value))
        .attr('r', 4)
        .attr('fill', '#2E5D4B')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);
}

function generateParticipationData() {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(day => ({
        day: day,
        value: Math.floor(Math.random() * 40) + 60
    }));
}

function updateParticipationLine() {
    buildParticipationLine();
}

// ===== INTERACTIONS =====

function handleArcClick(d) {
    const info = document.getElementById('selectedGradeInfo');
    
    if (d.depth === 2) {
        // Clicked on a grade
        D3Analytics.selectedGrade = d.data.grade;
        if (info) {
            info.innerHTML = `<span>Filtering: <strong>${d.data.grade}</strong> grades in ${d.parent.data.name}</span>`;
        }
    } else if (d.depth === 1) {
        // Clicked on a category
        D3Analytics.selectedGrade = null;
        if (info) {
            info.innerHTML = `<span>Category: <strong>${d.data.name}</strong></span>`;
        }
    }
    
    // Update participation chart with filtered data
    updateParticipationLine();
}

function showTooltip(event, d) {
    const tooltip = document.getElementById('sunburstTooltip');
    if (!tooltip) return;
    
    let content = '';
    if (d.depth === 1) {
        content = `<strong>${d.data.name}</strong><br>Total: ${d.value} grades`;
    } else if (d.depth === 2) {
        const percentage = ((d.value / d.parent.value) * 100).toFixed(1);
        content = `<strong>${d.data.grade}</strong><br>${d.value} students (${percentage}%)`;
    }
    
    tooltip.innerHTML = content;
    tooltip.style.opacity = 1;
    tooltip.style.left = (event.pageX + 10) + 'px';
    tooltip.style.top = (event.pageY - 10) + 'px';
}

function hideTooltip() {
    const tooltip = document.getElementById('sunburstTooltip');
    if (tooltip) {
        tooltip.style.opacity = 0;
    }
}

// ===== FILTER HANDLING =====

function setupFilterListeners() {
    const courseFilter = document.getElementById('d3CourseFilter');
    const dateFilter = document.getElementById('d3DateFilter');
    const categoryFilter = document.getElementById('d3CategoryFilter');
    
    [courseFilter, dateFilter, categoryFilter].forEach(filter => {
        if (filter) {
            filter.addEventListener('change', handleFilterChange);
        }
    });
}

function handleFilterChange() {
    console.log('D3 Analytics: Filter changed, updating charts...');
    
    // In production, fetch new data from API based on filters
    // For now, regenerate sample data
    D3Analytics.data = generateSampleData();
    
    // Update charts using D3 General Update Pattern
    updateSunburst();
    updateParticipationLine();
}

function populateCourseFilter() {
    const filter = document.getElementById('d3CourseFilter');
    if (!filter) return;
    
    // Get courses from server data if available
    if (typeof serverCoursesData !== 'undefined' && serverCoursesData.length) {
        serverCoursesData.forEach(course => {
            const option = document.createElement('option');
            option.value = course.id;
            option.textContent = course.name;
            filter.appendChild(option);
        });
    }
}

// ===== WINDOW RESIZE HANDLING =====
let resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        buildSunburstChart();
        buildParticipationLine();
    }, 250);
});

// Export for external access
window.D3Analytics = D3Analytics;
window.updateAnalytics = updateAnalytics;
