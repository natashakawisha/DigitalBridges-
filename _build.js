const fs = require('fs');
const path = require('path');
const R = 'c:/Users/User1/Desktop/Digital bridges';

// SVG icon helper - all use 24x24 viewBox, stroke-based (Feather/Lucide style)
const I = (name, cls='icon') => {
  const icons = {
    globe: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    smartphone: '<rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    dollar: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    trending: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    building: '<rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>',
    home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    messageCircle: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
    fileText: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
    video: '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>',
    tool: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    mousePointer: '<path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="M13 13l6 6"/>',
    gradCap: '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 0 3 3 6 3s6-3 6-3v-5"/>',
    radio: '<circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/>',
    heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    cpu: '<rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>',
    mapPin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    monitor: '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    messageSquare: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    creditCard: '<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
    briefcase: '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    megaphone: '<path d="M3 11l18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    scale: '<path d="M16 3h5v5M8 3H3v5M12 22V8M3 8l9-5 9 5"/>',
    scroll: '<path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/>',
    award: '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    checkCircle: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
    barChart: '<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    shoppingCart: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>',
    alertTriangle: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
    externalLink: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
    checkSquare: '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
    clipboard: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>',
    wifi: '<path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  };
  return '<svg class="'+cls+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+icons[name]+'</svg>';
};

const NAV = (active) => `<nav class="navbar" id="navbar"><div class="nav-container"><a href="index.html" class="nav-logo"><div class="logo-icon">${I('globe','icon icon-sm')}</div><div><span class="logo-text">Digital Bridges</span><span class="logo-sub">Zambia</span></div></a><ul class="nav-links" id="navLinks"><li><a href="index.html"${active==='home'?' class="active"':''}>Home</a></li><li><a href="about.html"${active==='about'?' class="active"':''}>About</a></li><li><a href="learning.html"${active==='learning'?' class="active"':''}>Learning</a></li><li><a href="contact.html"${active==='contact'?' class="active"':''}>Contact</a></li><li><a href="login.html" class="nav-cta">Login</a></li></ul><div class="hamburger" id="hamburger"><span></span><span></span><span></span></div></div></nav>`;

const FOOTER = `<footer class="footer"><div class="footer-inner"><div class="footer-brand"><h3>Digital Bridges Zambia</h3><p>Developing accessible, practical, and locally relevant digital literacy training content for underserved communities in Zambia.</p></div><div class="footer-links"><h4>Quick Links</h4><a href="index.html">Home</a><a href="about.html">About</a><a href="learning.html">Learning</a><a href="contact.html">Contact</a></div><div class="footer-links"><h4>Resources</h4><a href="login.html">Login</a><a href="learning.html">Training Modules</a><a href="about.html">Our Approach</a><a href="contact.html">Get Involved</a></div></div><div class="footer-bottom"><p>&copy; 2026 Digital Bridges Zambia. All rights reserved.</p></div></footer>`;

// ===== INDEX.HTML =====
fs.writeFileSync(path.join(R,'index.html'), `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Digital Bridges - Inclusive Digital Literacy for Zambia</title><link rel="stylesheet" href="CSS/style.css"></head><body>
${NAV('home')}
<section class="hero"><div class="hero-inner"><div class="hero-content"><span class="hero-badge">Empowering Communities in Zambia</span><h1>Inclusive <span class="highlight">Digital Literacy</span> for Every Community</h1><p>Bridging the digital divide through accessible, practical, and locally relevant training content for youth, women, and underserved communities across Zambia.</p><div class="hero-buttons"><a href="learning.html" class="btn btn-primary">Explore Training Modules</a><a href="about.html" class="btn btn-outline">Learn More</a></div></div>
<div class="hero-visual"><div class="hero-card-grid">
<div class="hero-mini-card"><div class="mini-icon">${I('smartphone')}</div><h4>Device Skills</h4><p>Smartphone &amp; computer basics</p></div>
<div class="hero-mini-card"><div class="mini-icon">${I('shield')}</div><h4>Online Safety</h4><p>Stay secure online</p></div>
<div class="hero-mini-card"><div class="mini-icon">${I('creditCard')}</div><h4>Digital Finance</h4><p>Mobile money &amp; payments</p></div>
<div class="hero-mini-card"><div class="mini-icon">${I('trending')}</div><h4>Entrepreneurship</h4><p>Grow your business</p></div>
</div></div></div></section>
<div class="stats-bar"><div class="stats-grid"><div class="stat-item"><h3>8</h3><p>Training Modules</p></div><div class="stat-item"><h3>30+</h3><p>Topics Covered</p></div><div class="stat-item"><h3>4</h3><p>Implementation Phases</p></div><div class="stat-item"><h3>7+</h3><p>Target Groups</p></div></div></div>
<section class="section"><div class="section-inner"><div class="section-header"><span class="overline">Training Content</span><h2>What You'll Learn</h2><p>Practical, community-centered digital literacy modules designed for real-world challenges faced by Zambian communities.</p></div>
<div class="modules-grid">
<div class="module-card animate-on-scroll"><div class="module-number">1</div><h3>Introduction to Digital Literacy</h3><p>Build a strong foundation with device basics and internet navigation.</p><div class="module-topics"><span>Digital Devices</span><span>Internet</span><span>Communication</span></div></div>
<div class="module-card animate-on-scroll"><div class="module-number">2</div><h3>Online Safety &amp; Cyber Hygiene</h3><p>Protect yourself from scams, phishing, and online threats.</p><div class="module-topics"><span>Passwords</span><span>Phishing</span><span>Privacy</span></div></div>
<div class="module-card animate-on-scroll"><div class="module-number">3</div><h3>Digital Communication</h3><p>Master email, messaging, and video conferencing tools.</p><div class="module-topics"><span>Email</span><span>Messaging</span><span>Video Calls</span></div></div>
<div class="module-card animate-on-scroll"><div class="module-number">4</div><h3>Information &amp; Media Literacy</h3><p>Identify misinformation and develop critical digital thinking.</p><div class="module-topics"><span>Fake News</span><span>Fact-Checking</span><span>Sharing</span></div></div>
<div class="module-card animate-on-scroll"><div class="module-number">5</div><h3>Digital Financial Literacy</h3><p>Safely use mobile money, digital payments, and avoid fraud.</p><div class="module-topics"><span>Mobile Money</span><span>Payments</span><span>Fraud</span></div></div>
<div class="module-card animate-on-scroll"><div class="module-number">6</div><h3>Productivity &amp; Work Readiness</h3><p>Create documents, research online, and build your digital profile.</p><div class="module-topics"><span>Documents</span><span>Research</span><span>CV Building</span></div></div>
</div><div style="text-align:center;margin-top:2.5rem;"><a href="learning.html" class="btn btn-primary">View All 8 Modules</a></div></div></section>
<section class="section section-alt"><div class="section-inner"><div class="section-header"><span class="overline">Target Beneficiaries</span><h2>Who This Is For</h2><p>Designed for communities and individuals who need practical digital skills for everyday life.</p></div>
<div class="beneficiaries-grid">
<div class="beneficiary-card animate-on-scroll"><div class="beneficiary-icon">${I('users')}</div><div><h4>Youth (Ages 15-35)</h4><p>Build skills for education, employment, and entrepreneurship.</p></div></div>
<div class="beneficiary-card animate-on-scroll"><div class="beneficiary-icon">${I('user')}</div><div><h4>Women &amp; Girls</h4><p>Access digital opportunities and close the gender digital gap.</p></div></div>
<div class="beneficiary-card animate-on-scroll"><div class="beneficiary-icon">${I('briefcase')}</div><div><h4>Informal Sector Workers</h4><p>Use digital tools to grow businesses and reach customers.</p></div></div>
<div class="beneficiary-card animate-on-scroll"><div class="beneficiary-icon">${I('home')}</div><div><h4>Rural Communities</h4><p>Connect to services, information, and opportunities.</p></div></div>
<div class="beneficiary-card animate-on-scroll"><div class="beneficiary-icon">${I('book')}</div><div><h4>Teachers &amp; Facilitators</h4><p>Adaptable teaching resources and facilitation guides.</p></div></div>
<div class="beneficiary-card animate-on-scroll"><div class="beneficiary-icon">${I('globe')}</div><div><h4>Community Organizations</h4><p>Open resources for reuse by CSOs, youth hubs, and centers.</p></div></div>
</div></div></section>
${FOOTER}<script src="js/script.js"></script></body></html>`);
console.log('index.html written');

// ===== ABOUT.HTML =====
fs.writeFileSync(path.join(R,'about.html'), `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>About - Digital Bridges Zambia</title><link rel="stylesheet" href="CSS/style.css"></head><body>
${NAV('about')}
<section class="page-banner"><span class="overline" style="display:inline-block;background:rgba(37,99,235,0.1);color:var(--primary);padding:0.3rem 1rem;border-radius:50px;font-size:0.8rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:1rem;">About the Project</span><h1>Building Digital Bridges Across Zambia</h1><p>Empowering underserved communities with practical digital skills, online safety awareness, and meaningful digital participation.</p></section>
<section class="section"><div class="section-inner"><div class="content-split">
<div class="content-block animate-on-scroll"><h3>The Challenge</h3><p>Digital technologies are increasingly shaping access to education, employment, entrepreneurship, public services, and civic participation. However, many young people, women, informal workers, rural communities, and marginalized groups in Zambia continue to face significant barriers in accessing and effectively using digital tools.</p><p>While internet penetration and smartphone use are growing, digital literacy levels remain uneven, particularly among underserved populations.</p></div>
<div class="content-block animate-on-scroll"><h3>The Gap</h3><p>Many existing digital literacy materials are either too technical, not localized, inaccessible to low literacy audiences, or disconnected from the practical realities of communities.</p><p>There is a growing need for culturally relevant, practical, accessible, and multilingual training content that responds to the everyday digital challenges people face.</p></div>
</div></div></section>
<section class="section section-alt"><div class="section-inner"><div class="section-header"><span class="overline">Our Mission</span><h2>Project Goal &amp; Objectives</h2><p>To develop accessible, practical, and locally relevant digital literacy training content that strengthens digital skills, online safety awareness, and meaningful digital participation among underserved communities in Zambia.</p></div>
<div class="objectives-list">
<div class="objective-item animate-on-scroll"><div class="objective-num">1</div><div><h4>Tailored Curriculum Design</h4><p>Design a comprehensive digital literacy curriculum tailored for youth, women, community groups, and informal sector workers.</p></div></div>
<div class="objective-item animate-on-scroll"><div class="objective-num">2</div><div><h4>Multilingual Training Materials</h4><p>Develop multilingual and easy-to-understand training materials suitable for both online and offline learning environments.</p></div></div>
<div class="objective-item animate-on-scroll"><div class="objective-num">3</div><div><h4>Digital Safety Integration</h4><p>Integrate digital safety, cyber hygiene, misinformation awareness, and responsible technology use into all training modules.</p></div></div>
<div class="objective-item animate-on-scroll"><div class="objective-num">4</div><div><h4>Interactive Learning Tools</h4><p>Create interactive and community-friendly learning tools that improve engagement and retention.</p></div></div>
<div class="objective-item animate-on-scroll"><div class="objective-num">5</div><div><h4>Facilitator Support</h4><p>Support trainers, educators, and community facilitators with adaptable teaching resources and facilitation guides.</p></div></div>
</div></div></section>
<section class="section"><div class="section-inner"><div class="section-header"><span class="overline">Our Approach</span><h2>How We Develop Content</h2><p>A participatory and user-centered approach that puts communities at the heart of the learning experience.</p></div>
<div class="approach-grid">
<div class="approach-item animate-on-scroll"><div class="approach-icon">${I('users','icon icon-xl')}</div><h4>Community Consultations</h4><p>Direct engagement with target communities to understand their needs.</p></div>
<div class="approach-item animate-on-scroll"><div class="approach-icon">${I('messageCircle','icon icon-xl')}</div><h4>Focus Groups</h4><p>Structured discussions with youth, women, and educators.</p></div>
<div class="approach-item animate-on-scroll"><div class="approach-icon">${I('fileText','icon icon-xl')}</div><h4>Simple Language</h4><p>Clear, accessible content for all literacy levels.</p></div>
<div class="approach-item animate-on-scroll"><div class="approach-icon">${I('image','icon icon-xl')}</div><h4>Visual Storytelling</h4><p>Infographics, illustrations, and visual learning aids.</p></div>
<div class="approach-item animate-on-scroll"><div class="approach-icon">${I('video','icon icon-xl')}</div><h4>Audio-Visual Materials</h4><p>Videos and audio content for diverse learning styles.</p></div>
<div class="approach-item animate-on-scroll"><div class="approach-icon">${I('tool','icon icon-xl')}</div><h4>Pilot Testing</h4><p>Community testing and feedback-driven refinement.</p></div>
<div class="approach-item animate-on-scroll"><div class="approach-icon">${I('smartphone','icon icon-xl')}</div><h4>Mobile-Friendly</h4><p>Content optimized for smartphone access and low bandwidth.</p></div>
<div class="approach-item animate-on-scroll"><div class="approach-icon">${I('mousePointer','icon icon-xl')}</div><h4>Interactive Exercises</h4><p>Quizzes and hands-on activities for better retention.</p></div>
</div></div></section>
<section class="section section-alt"><div class="section-inner"><div class="section-header"><span class="overline">Implementation</span><h2>Project Phases</h2><p>A structured four-phase approach from research to deployment.</p></div>
<div class="phases-timeline">
<div class="phase-card animate-on-scroll"><span class="phase-label">Phase 1</span><h3>Needs Assessment</h3><ul><li>Stakeholder consultations</li><li>Community digital literacy mapping</li><li>Identification of priority learning gaps</li></ul></div>
<div class="phase-card animate-on-scroll"><span class="phase-label">Phase 2</span><h3>Curriculum &amp; Content Design</h3><ul><li>Development of learning framework</li><li>Module writing and visual design</li><li>Translation and localization</li></ul></div>
<div class="phase-card animate-on-scroll"><span class="phase-label">Phase 3</span><h3>Pilot Testing</h3><ul><li>Community testing sessions</li><li>Trainer feedback collection</li><li>Content refinement</li></ul></div>
<div class="phase-card animate-on-scroll"><span class="phase-label">Phase 4</span><h3>Deployment &amp; Capacity Building</h3><ul><li>Distribution of training materials</li><li>Training of trainers sessions</li><li>Community learning workshops</li></ul></div>
</div></div></section>
<section class="section"><div class="section-inner"><div class="section-header"><span class="overline">Impact</span><h2>Expected Outcomes</h2><p>Measurable change in digital confidence, safety, and participation across target communities.</p></div>
<div class="modules-grid">
<div class="module-card animate-on-scroll"><div class="icon-circle">${I('trending')}</div><h3>Improved Digital Confidence</h3><p>Target communities gain practical digital skills and confidence to use technology effectively in daily life.</p></div>
<div class="module-card animate-on-scroll"><div class="icon-circle">${I('shield')}</div><h3>Increased Safety Awareness</h3><p>Greater awareness of online safety, cyber risks, and how to protect personal information and data.</p></div>
<div class="module-card animate-on-scroll"><div class="icon-circle">${I('briefcase')}</div><h3>Digital Economic Opportunities</h3><p>Enhanced access to digital opportunities for education, livelihoods, and participation in the digital economy.</p></div>
<div class="module-card animate-on-scroll"><div class="icon-circle">${I('heart')}</div><h3>Community Resilience</h3><p>Stronger community resilience against misinformation, online fraud, and digital manipulation.</p></div>
</div></div></section>
${FOOTER}<script src="js/script.js"></script></body></html>`);
console.log('about.html written');

console.log('Part 1 done - writing remaining pages...');
