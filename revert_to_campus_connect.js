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
    
    // Revert title
    content = content.replace(/<title>.*? — Student Connect<\/title>/, (match) => match.replace('Student Connect', 'Campus Connect'));
    
    // Revert placeholder
    content = content.replace(/placeholder="Ask Student Connect anything\.\.\."/, 'placeholder="Ask Campus Connect anything..."');

    fs.writeFileSync(filePath, content);
});
console.log('Dashboard files reverted to Campus Connect!');
