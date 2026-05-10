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
    
    // Replace top-bar-actions with top-bar-center
    const topBarRegex = /<div class="top-bar-actions">[\s\S]*?<\/div>\s*<\/div>/;
    const newTopBar = `<div class="top-bar-center">
            <div class="prompt-input-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2" width="18" height="18"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input type="text" placeholder="Ask Campus Connect anything...">
                <span class="shortcut-key">⌘K</span>
            </div>
        </div>
    </div>`;
    content = content.replace(topBarRegex, newTopBar);

    // Remove floating prompt
    const floatingRegex = /<!-- Floating Prompt -->[\s\S]*?<\/div>\s*<script src="js\/app.js">/;
    content = content.replace(floatingRegex, '<script src="js/app.js">');

    fs.writeFileSync(filePath, content);
});
console.log('HTML files updated!');
