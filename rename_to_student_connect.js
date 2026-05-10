const fs = require('fs');
const path = require('path');

const files = [
    'frontend/student-dashboard.html',
    'frontend/teacher-dashboard.html',
    'frontend/admin-dashboard.html',
    'frontend/analytics.html'
];

files.forEach(f => {
    const filePath = path.join(__dirname, f);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Update title
    content = content.replace(/<title>.*? — Campus Connect<\/title>/, (match) => match.replace('Campus Connect', 'Student Connect'));
    
    // Update placeholder
    content = content.replace(/placeholder="Ask Campus Connect anything\.\.\."/, 'placeholder="Ask Student Connect anything..."');

    fs.writeFileSync(filePath, content);
});
console.log('Dashboard files updated to Student Connect!');
