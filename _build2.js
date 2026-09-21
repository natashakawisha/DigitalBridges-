const fs = require('fs');
const path = require('path');
const R = 'c:/Users/User1/Desktop/Digital bridges';
const I = (name, cls='icon') => {
  const icons = {
    globe:'<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    smartphone:'<rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>',
    lock:'<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    trending:'<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
    users:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    user:'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    building:'<rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>',
    heart:'<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    mail:'<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
    monitor:'<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
    shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    messageCircle:'<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
    messageSquare:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    video:'<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>',
    search:'<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    creditCard:'<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
    fileText:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
    briefcase:'<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    eye:'<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    checkCircle:'<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    checkSquare:'<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    alertTriangle:'<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
    megaphone:'<path d="M3 11l18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    shoppingCart:'<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>',
    scale:'<path d="M16 3h5v5M8 3H3v5M12 22V8M3 8l9-5 9 5"/>',
    scroll:'<path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/>',
    externalLink:'<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
    layers:'<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
    clipboard:'<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>',
    image:'<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
    gradCap:'<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 0 3 3 6 3s6-3 6-3v-5"/>',
    radio:'<circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/>',
    zap:'<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    wifi:'<path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>',
    mapPin:'<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    phone:'<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    clock:'<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'
  };
  return '<svg class="'+cls+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+icons[name]+'</svg>';
};
const NAV=(a)=>`<nav class="navbar" id="navbar"><div class="nav-container"><a href="index.html" class="nav-logo"><div class="logo-icon">${I('globe','icon icon-sm')}</div><div><span class="logo-text">Digital Bridges</span><span class="logo-sub">Zambia</span></div></a><ul class="nav-links" id="navLinks"><li><a href="index.html"${a==='home'?' class="active"':''}>Home</a></li><li><a href="about.html"${a==='about'?' class="active"':''}>About</a></li><li><a href="learning.html"${a==='learning'?' class="active"':''}>Learning</a></li><li><a href="contact.html"${a==='contact'?' class="active"':''}>Contact</a></li><li><a href="login.html" class="nav-cta">Login</a></li></ul><div class="hamburger" id="hamburger"><span></span><span></span><span></span></div></div></nav>`;
const FOOTER=`<footer class="footer"><div class="footer-inner"><div class="footer-brand"><h3>Digital Bridges Zambia</h3><p>Developing accessible, practical, and locally relevant digital literacy training content for underserved communities in Zambia.</p></div><div class="footer-links"><h4>Quick Links</h4><a href="index.html">Home</a><a href="about.html">About</a><a href="learning.html">Learning</a><a href="contact.html">Contact</a></div><div class="footer-links"><h4>Resources</h4><a href="login.html">Login</a><a href="learning.html">Training Modules</a><a href="about.html">Our Approach</a><a href="contact.html">Get Involved</a></div></div><div class="footer-bottom"><p>&copy; 2026 Digital Bridges Zambia. All rights reserved.</p></div></footer>`;
const LM=(n,t,s,d,topics)=>`<div class="module-detail"><div class="module-detail-inner"><div class="module-detail-header"><div class="module-detail-number">${n}</div><div><h3>${t}</h3><p class="module-subtitle">${s}</p></div></div><p class="module-description">${d}</p><div class="module-topics-list">${topics.map(x=>`<div class="topic-chip"><div class="topic-icon">${I(x[0],'icon icon-sm')}</div><span>${x[1]}</span></div>`).join('')}</div></div></div>`;

fs.writeFileSync(path.join(R,'learning.html'), `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Learning Modules - Digital Bridges Zambia</title><link rel="stylesheet" href="CSS/style.css"></head><body>${NAV('learning')}
<section class="page-banner"><span class="overline" style="display:inline-block;background:rgba(37,99,235,0.1);color:var(--primary);padding:0.3rem 1rem;border-radius:50px;font-size:0.8rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:1rem;">Training Content</span><h1>Digital Literacy Learning Modules</h1><p>Eight comprehensive modules covering everything from device basics to digital entrepreneurship, designed for Zambian communities.</p></section>
<section class="section"><div class="section-inner"><div class="section-header"><span class="overline">Curriculum</span><h2>All Training Modules</h2><p>Click any module to expand its details.</p></div>
${LM('01','Introduction to Digital Literacy','Build your foundation','Learn the essentials of using digital devices, from smartphones to computers.',[['monitor','Digital Devices'],['smartphone','Smartphone & Computer Basics'],['globe','Internet Navigation'],['messageCircle','Digital Communication']])}
${LM('02','Online Safety & Cyber Hygiene','Protect yourself online','Create strong passwords, recognize scams, and protect your personal data.',[['lock','Password Management'],['alertTriangle','Scam & Phishing'],['shield','Social Media Safety'],['eye','Privacy & Data Protection'],['checkCircle','Safe Online Behavior']])}
${LM('03','Digital Communication & Collaboration','Connect effectively','Master email, messaging, and video conferencing tools.',[['mail','Email & Etiquette'],['messageSquare','Messaging Platforms'],['video','Video Conferencing'],['users','Digital Teamwork']])}
${LM('04','Information & Media Literacy','Think critically online','Identify misinformation, verify sources, and share content responsibly.',[['search','Identifying Misinformation'],['checkSquare','Fact-Checking'],['share','Responsible Sharing'],['eye','Critical Thinking']])}
${LM('05','Digital Financial Literacy','Manage money safely','Use mobile money safely, make secure payments, and recognize fraud.',[['smartphone','Mobile Money Safety'],['creditCard','Digital Payments'],['alertTriangle','Fraud Awareness'],['shield','Safe Transactions']])}
${LM('06','Productivity & Work Readiness','Build workplace skills','Document creation, research, online applications, and digital profiles.',[['fileText','Document Creation'],['search','Internet Research'],['externalLink','Online Applications'],['user','CV & Digital Profile']])}
${LM('07','Digital Entrepreneurship','Grow with digital tools','Social media marketing, customer engagement, and e-commerce.',[['megaphone','Social Media Marketing'],['users','Customer Engagement'],['settings','Business Tools'],['shoppingCart','E-Commerce Basics']])}
${LM('08','Responsible Digital Citizenship','Be a positive force','Digital rights, ethical use, inclusive participation, and mental wellbeing.',[['scale','Ethical Technology Use'],['scroll','Digital Rights'],['globe','Inclusive Participation'],['heart','Mental Wellbeing']])}
</div></section>
<section class="section section-alt"><div class="section-inner"><div class="section-header"><span class="overline">Resources</span><h2>What We Produce</h2><p>Comprehensive learning resources for facilitators and learners.</p></div><div class="modules-grid">
<div class="module-card animate-on-scroll"><div class="icon-circle">${I('layers')}</div><h3>Structured Curriculum</h3><p>Complete curriculum across 8 modules with clear outcomes.</p></div>
<div class="module-card animate-on-scroll"><div class="icon-circle">${I('clipboard')}</div><h3>Training Manuals</h3><p>Detailed manuals and facilitator guides.</p></div>
<div class="module-card animate-on-scroll"><div class="icon-circle">${I('monitor')}</div><h3>Interactive Modules</h3><p>Digital modules with exercises and quizzes.</p></div>
<div class="module-card animate-on-scroll"><div class="icon-circle">${I('image')}</div><h3>Infographics</h3><p>Visual awareness materials.</p></div>
<div class="module-card animate-on-scroll"><div class="icon-circle">${I('video')}</div><h3>Educational Videos</h3><p>Short videos and animations.</p></div>
<div class="module-card animate-on-scroll"><div class="icon-circle">${I('checkSquare')}</div><h3>Assessment Tools</h3><p>Evaluation tools to measure progress.</p></div>
</div></div></section>
<section class="section" style="text-align:center;"><div class="section-inner"><h2 style="font-size:2rem;font-weight:800;margin-bottom:1rem;">Ready to Start Learning?</h2><p style="color:var(--text-muted);max-width:500px;margin:0 auto 2rem;font-size:1.1rem;">Sign in to access training modules and track your progress.</p><a href="login.html" class="btn btn-primary" style="font-size:1.05rem;padding:1rem 2.5rem;">Get Started Now</a></div></section>
${FOOTER}<script src="js/script.js"></script></body></html>`);
console.log('learning.html done');

fs.writeFileSync(path.join(R,'contact.html'), `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Contact - Digital Bridges Zambia</title><link rel="stylesheet" href="CSS/style.css"></head><body>${NAV('contact')}
<section class="page-banner"><span class="overline" style="display:inline-block;background:rgba(37,99,235,0.1);color:var(--primary);padding:0.3rem 1rem;border-radius:50px;font-size:0.8rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:1rem;">Get in Touch</span><h1>Contact Us</h1><p>Questions, partnerships, or bringing training to your community? We'd love to hear from you.</p></section>
<section class="section"><div class="section-inner"><div class="contact-grid">
<div class="contact-info animate-on-scroll"><h3>Let's Build Bridges Together</h3><p>Whether you're an organization looking to partner, a facilitator, or a community member seeking training.</p>
<div class="contact-detail"><div class="contact-detail-icon">${I('mapPin')}</div><div><h4>Location</h4><p>Lusaka, Zambia</p></div></div>
<div class="contact-detail"><div class="contact-detail-icon">${I('mail')}</div><div><h4>Email</h4><p>info@digitalbridgeszambia.org</p></div></div>
<div class="contact-detail"><div class="contact-detail-icon">${I('phone')}</div><div><h4>Phone</h4><p>+260 XXX XXX XXX</p></div></div>
<div class="contact-detail"><div class="contact-detail-icon">${I('clock')}</div><div><h4>Office Hours</h4><p>Mon-Fri, 08:00-17:00 CAT</p></div></div></div>
<div class="contact-form-card animate-on-scroll"><h3>Send Us a Message</h3><form id="contactForm"><div class="form-group"><label for="contactName">Full Name</label><input type="text" id="contactName" placeholder="Your full name" required></div><div class="form-group"><label for="contactEmail">Email</label><input type="email" id="contactEmail" placeholder="you@example.com" required></div><div class="form-group"><label for="contactSubject">Subject</label><select id="contactSubject" required><option value="">Select a topic</option><option value="partnership">Partnership</option><option value="training">Training Request</option><option value="facilitator">Become a Facilitator</option><option value="content">Content Collaboration</option><option value="general">General Inquiry</option></select></div><div class="form-group"><label for="contactMessage">Message</label><textarea id="contactMessage" placeholder="How can we help?" required></textarea></div><button type="submit" class="btn btn-primary" style="width:100%;">Send Message</button></form></div>
</div></div></section>
<section class="section section-alt"><div class="section-inner"><div class="section-header"><span class="overline">Collaboration</span><h2>Potential Partners</h2><p>Partnerships to scale impact across multiple sectors.</p></div><div class="partners-grid">
<div class="partner-item animate-on-scroll"><div class="partner-icon">${I('gradCap')}</div><span>Schools &amp; Universities</span></div>
<div class="partner-item animate-on-scroll"><div class="partner-icon">${I('radio')}</div><span>Community Radio</span></div>
<div class="partner-item animate-on-scroll"><div class="partner-icon">${I('users')}</div><span>Youth Organizations</span></div>
<div class="partner-item animate-on-scroll"><div class="partner-icon">${I('heart')}</div><span>Civil Society</span></div>
<div class="partner-item animate-on-scroll"><div class="partner-icon">${I('zap')}</div><span>ICT Hubs</span></div>
<div class="partner-item animate-on-scroll"><div class="partner-icon">${I('building')}</div><span>Government</span></div>
<div class="partner-item animate-on-scroll"><div class="partner-icon">${I('wifi')}</div><span>Telecoms</span></div>
<div class="partner-item animate-on-scroll"><div class="partner-icon">${I('globe')}</div><span>International Partners</span></div>
</div></div></section>
<section class="section"><div class="section-inner"><div class="content-split">
<div class="content-block animate-on-scroll"><h3>Sustainability</h3><p>Open and adaptable resources for schools, CSOs, youth hubs, and community centers. Partnerships support long-term use and scaling.</p></div>
<div class="content-block animate-on-scroll"><h3>Get Involved</h3><ul><li>Partner to deliver training</li><li>Translate content to local languages</li><li>Become a certified facilitator</li><li>Support through funding</li><li>Share feedback</li></ul></div>
</div></div></section>
${FOOTER}<div class="toast" id="toast"></div><script src="js/script.js"></script></body></html>`);
console.log('contact.html done');

fs.writeFileSync(path.join(R,'login.html'), `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Login - Digital Bridges Zambia</title><link rel="stylesheet" href="CSS/style.css"></head><body>
<div class="login-page"><a href="index.html" class="back-link">&larr; Back to Home</a><div class="login-container"><div class="login-card"><div class="login-header"><div class="logo">Digital Bridges Zambia</div><h2>Welcome Back</h2><p>Sign in to access your training modules</p></div>
<form id="loginForm" novalidate>
<div class="form-group"><label for="email">Email</label><div class="input-wrapper"><span class="input-icon">${I('mail','icon icon-sm')}</span><input type="email" id="email" placeholder="you@example.com" required></div></div>
<div class="form-group"><label for="password">Password</label><div class="input-wrapper"><span class="input-icon">${I('lock','icon icon-sm')}</span><input type="password" id="password" placeholder="Enter your password" required><button type="button" class="password-toggle" id="togglePassword" aria-label="Toggle visibility">${I('eye','icon icon-sm')}</button></div></div>
<div class="form-options"><label class="remember-me"><input type="checkbox" name="remember"> Remember me</label><a href="#" class="forgot-password">Forgot password?</a></div>
<button type="submit" class="login-btn" id="loginBtn">Sign In</button></form>
<div class="divider">or continue with</div>
<div class="social-login"><button class="social-btn" id="googleBtn"><svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11.997 11.997 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1A7.22 7.22 0 0 1 5.58 12c0-.73.1-1.44.26-2.1V7.06H2.18A11.997 11.997 0 0 0 1 12c0 1.92.46 3.74 1.18 5.34l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>Google</button><button class="social-btn" id="githubBtn"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.49.5.09.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.337-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>GitHub</button></div>
<p class="signup-link">Don't have an account? <a href="#">Sign up free</a></p></div></div></div>
<div class="toast" id="toast"></div><script src="js/script.js"></script></body></html>`);
console.log('login.html done');

// Update password toggle in JS to use SVG
let js = fs.readFileSync(path.join(R,'js','script.js'),'utf8');
const eyeOpen = '<svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
const eyeOff = '<svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
js = js.replace(/togglePw\.textContent = show\?.*$/m, "togglePw.innerHTML = show?'"+eyeOff.replace(/'/g,"\\'")+"':'"+eyeOpen.replace(/'/g,"\\'")+"';");
fs.writeFileSync(path.join(R,'js','script.js'), js);
console.log('All done!');
