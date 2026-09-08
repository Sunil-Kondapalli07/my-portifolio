/* ========================================
   PORTFOLIO 3D — Main JavaScript
   Three.js scene, animations, interactions
   ======================================== */

// ========================================
// THREE.JS 3D BACKGROUND SCENE
// ========================================
(function initThreeScene() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    camera.position.z = 30;

    // Mouse tracking
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    // ---- STARFIELD PARTICLES ----
    const starCount = 2000;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
        starPositions[i * 3] = (Math.random() - 0.5) * 200;
        starPositions[i * 3 + 1] = (Math.random() - 0.5) * 200;
        starPositions[i * 3 + 2] = (Math.random() - 0.5) * 200;
        starSizes[i] = Math.random() * 2 + 0.5;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));

    const starMaterial = new THREE.PointsMaterial({
        color: 0x6c63ff,
        size: 0.8,
        transparent: true,
        opacity: 0.6,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // ---- SECONDARY PARTICLE FIELD (Cyan) ----
    const dustCount = 800;
    const dustGeometry = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);

    for (let i = 0; i < dustCount; i++) {
        dustPositions[i * 3] = (Math.random() - 0.5) * 150;
        dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 150;
        dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 150;
    }

    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));

    const dustMaterial = new THREE.PointsMaterial({
        color: 0x00d4ff,
        size: 0.4,
        transparent: true,
        opacity: 0.35,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending
    });

    const dust = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dust);

    // ---- FLOATING GEOMETRIC SHAPES ----
    const geometries = [];
    const geometryConfigs = [
        { geo: new THREE.IcosahedronGeometry(1.5, 0), pos: [-15, 8, -20], color: 0x6c63ff, speed: 0.003 },
        { geo: new THREE.OctahedronGeometry(1.2, 0), pos: [18, -5, -15], color: 0x00d4ff, speed: 0.004 },
        { geo: new THREE.TetrahedronGeometry(1, 0), pos: [-20, -10, -25], color: 0xff6b9d, speed: 0.005 },
        { geo: new THREE.IcosahedronGeometry(0.8, 0), pos: [12, 12, -18], color: 0x00ff88, speed: 0.003 },
        { geo: new THREE.OctahedronGeometry(1.5, 0), pos: [-8, -15, -22], color: 0x6c63ff, speed: 0.002 },
        { geo: new THREE.TorusGeometry(1, 0.3, 8, 16), pos: [22, 5, -30], color: 0xff6b9d, speed: 0.004 },
        { geo: new THREE.TetrahedronGeometry(0.6, 0), pos: [-25, 3, -15], color: 0x00d4ff, speed: 0.006 },
        { geo: new THREE.IcosahedronGeometry(1, 0), pos: [5, -18, -20], color: 0x00ff88, speed: 0.003 },
    ];

    geometryConfigs.forEach(config => {
        const material = new THREE.MeshBasicMaterial({
            color: config.color,
            wireframe: true,
            transparent: true,
            opacity: 0.15,
        });
        const mesh = new THREE.Mesh(config.geo, material);
        mesh.position.set(...config.pos);
        mesh.userData.speed = config.speed;
        mesh.userData.initialY = config.pos[1];
        scene.add(mesh);
        geometries.push(mesh);
    });

    // ---- CONNECTING LINES (Neural Network Effect) ----
    const nodeCount = 40;
    const nodes = [];
    for (let i = 0; i < nodeCount; i++) {
        nodes.push({
            x: (Math.random() - 0.5) * 80,
            y: (Math.random() - 0.5) * 80,
            z: (Math.random() - 0.5) * 60 - 20,
            vx: (Math.random() - 0.5) * 0.02,
            vy: (Math.random() - 0.5) * 0.02,
            vz: (Math.random() - 0.5) * 0.01,
        });
    }

    // Node dots
    const nodeGeo = new THREE.BufferGeometry();
    const nodePositions = new Float32Array(nodeCount * 3);
    nodes.forEach((n, i) => {
        nodePositions[i * 3] = n.x;
        nodePositions[i * 3 + 1] = n.y;
        nodePositions[i * 3 + 2] = n.z;
    });
    nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3));

    const nodeMat = new THREE.PointsMaterial({
        color: 0x6c63ff,
        size: 2,
        transparent: true,
        opacity: 0.5,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
    });
    const nodePoints = new THREE.Points(nodeGeo, nodeMat);
    scene.add(nodePoints);

    // Lines between close nodes
    const linesMaterial = new THREE.LineBasicMaterial({
        color: 0x6c63ff,
        transparent: true,
        opacity: 0.06,
        blending: THREE.AdditiveBlending,
    });

    let linesMesh = null;

    function updateLines() {
        if (linesMesh) {
            scene.remove(linesMesh);
            linesMesh.geometry.dispose();
        }

        const linePositions = [];
        const maxDist = 25;

        for (let i = 0; i < nodeCount; i++) {
            for (let j = i + 1; j < nodeCount; j++) {
                const dx = nodes[i].x - nodes[j].x;
                const dy = nodes[i].y - nodes[j].y;
                const dz = nodes[i].z - nodes[j].z;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (dist < maxDist) {
                    linePositions.push(nodes[i].x, nodes[i].y, nodes[i].z);
                    linePositions.push(nodes[j].x, nodes[j].y, nodes[j].z);
                }
            }
        }

        if (linePositions.length > 0) {
            const linesGeo = new THREE.BufferGeometry();
            linesGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
            linesMesh = new THREE.LineSegments(linesGeo, linesMaterial);
            scene.add(linesMesh);
        }
    }

    // ---- SCROLL TRACKING ----
    let scrollY = 0;
    window.addEventListener('scroll', () => {
        scrollY = window.pageYOffset;
    }, { passive: true });

    // ---- MOUSE TRACKING ----
    document.addEventListener('mousemove', (e) => {
        mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    // ---- RESIZE ----
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // ---- ANIMATION LOOP ----
    let frameCount = 0;

    function animate() {
        requestAnimationFrame(animate);
        frameCount++;

        // Smooth mouse lerp
        mouse.x += (mouse.targetX - mouse.x) * 0.05;
        mouse.y += (mouse.targetY - mouse.y) * 0.05;

        // Rotate stars based on scroll and mouse
        const scrollFactor = scrollY * 0.0003;
        stars.rotation.y = scrollFactor + mouse.x * 0.1;
        stars.rotation.x = scrollFactor * 0.5 + mouse.y * 0.05;

        dust.rotation.y = -scrollFactor * 0.5 + mouse.x * 0.05;
        dust.rotation.x = scrollFactor * 0.3 - mouse.y * 0.03;

        // Animate floating geometries
        const time = frameCount * 0.01;
        geometries.forEach((mesh, i) => {
            mesh.rotation.x += mesh.userData.speed;
            mesh.rotation.y += mesh.userData.speed * 0.7;
            mesh.position.y = mesh.userData.initialY + Math.sin(time + i * 1.5) * 2;
        });

        // Animate network nodes
        nodes.forEach((n, i) => {
            n.x += n.vx;
            n.y += n.vy;
            n.z += n.vz;

            // Bounce off boundaries
            if (Math.abs(n.x) > 40) n.vx *= -1;
            if (Math.abs(n.y) > 40) n.vy *= -1;
            if (n.z > -5 || n.z < -50) n.vz *= -1;

            nodePositions[i * 3] = n.x;
            nodePositions[i * 3 + 1] = n.y;
            nodePositions[i * 3 + 2] = n.z;
        });
        nodeGeo.attributes.position.needsUpdate = true;

        // Update connecting lines every 3 frames for performance
        if (frameCount % 3 === 0) {
            updateLines();
        }

        // Camera parallax from mouse
        camera.position.x += (mouse.x * 3 - camera.position.x) * 0.02;
        camera.position.y += (mouse.y * 2 - camera.position.y) * 0.02;

        renderer.render(scene, camera);
    }

    animate();
})();


// ========================================
// CURSOR GLOW EFFECT
// ========================================
(function initCursorGlow() {
    const glow = document.getElementById('cursor-glow');
    if (!glow) return;

    document.addEventListener('mousemove', (e) => {
        glow.style.left = e.clientX + 'px';
        glow.style.top = e.clientY + 'px';
    });
})();


// ========================================
// TYPING EFFECT
// ========================================
(function initTypingEffect() {
    const element = document.getElementById('typed-text');
    if (!element) return;

    const titles = [
        'AI Solutions Engineer',
        'Generative AI Engineer',
        'Cloud Automation Engineer',
        'LangChain Developer',
        'RAG Architect'
    ];

    let titleIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typeSpeed = 80;

    function type() {
        const currentTitle = titles[titleIndex];

        if (isDeleting) {
            element.textContent = currentTitle.substring(0, charIndex - 1);
            charIndex--;
            typeSpeed = 40;
        } else {
            element.textContent = currentTitle.substring(0, charIndex + 1);
            charIndex++;
            typeSpeed = 80;
        }

        if (!isDeleting && charIndex === currentTitle.length) {
            typeSpeed = 2000; // Pause at end
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            titleIndex = (titleIndex + 1) % titles.length;
            typeSpeed = 400; // Pause before new word
        }

        setTimeout(type, typeSpeed);
    }

    // Start after hero animation
    setTimeout(type, 1500);
})();


// ========================================
// NAVBAR SCROLL EFFECT
// ========================================
(function initNavbar() {
    const navbar = document.getElementById('navbar');
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('.nav-link');

    // Scrolled state
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Active section detection
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 200;
            if (window.scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    }, { passive: true });

    // Smooth scroll for nav links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
            // Close mobile menu
            document.getElementById('nav-links').classList.remove('open');
            document.getElementById('nav-toggle').classList.remove('active');
        });
    });

    // Logo click
    document.querySelector('.nav-logo')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
})();


// ========================================
// MOBILE MENU
// ========================================
(function initMobileMenu() {
    const toggle = document.getElementById('nav-toggle');
    const links = document.getElementById('nav-links');
    if (!toggle || !links) return;

    toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        links.classList.toggle('open');
    });
})();


// ========================================
// SCROLL REVEAL ANIMATIONS
// ========================================
(function initScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal-item, .section-header, .stat-card, .skill-category, .project-card');

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    // Stagger delay for grid items
                    const parent = entry.target.parentElement;
                    let staggerIndex = 0;
                    if (parent) {
                        const siblings = Array.from(parent.children).filter(c =>
                            c.classList.contains('stat-card') ||
                            c.classList.contains('skill-category') ||
                            c.classList.contains('project-card')
                        );
                        staggerIndex = siblings.indexOf(entry.target);
                    }

                    setTimeout(() => {
                        entry.target.classList.add('revealed');
                    }, staggerIndex * 120);

                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        });

        revealElements.forEach(el => observer.observe(el));
    } else {
        // Fallback: show all
        revealElements.forEach(el => el.classList.add('revealed'));
    }
})();


// ========================================
// STAT COUNTER ANIMATION
// ========================================
(function initStatCounters() {
    const stats = document.querySelectorAll('.stat-number[data-target]');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.getAttribute('data-target'));
                animateCounter(el, target);
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    stats.forEach(stat => observer.observe(stat));

    function animateCounter(el, target) {
        let current = 0;
        const duration = 1500;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            current = Math.round(eased * target);
            el.textContent = current;

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);
    }
})();


// ========================================
// 3D TILT EFFECT ON PROJECT CARDS
// ========================================
(function initTiltCards() {
    const cards = document.querySelectorAll('.tilt-card');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / centerY * -5;
            const rotateY = (x - centerX) / centerX * 5;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;

            // Move glow
            const glow = card.querySelector('.project-card-glow');
            if (glow) {
                glow.style.left = (x - rect.width) + 'px';
                glow.style.top = (y - rect.height) + 'px';
            }
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
            card.style.transition = 'transform 0.5s ease-out';
        });

        card.addEventListener('mouseenter', () => {
            card.style.transition = 'transform 0.1s ease-out';
        });
    });
})();


// ========================================
// SCROLL INDICATOR HIDE ON SCROLL
// ========================================
(function initScrollIndicator() {
    const indicator = document.getElementById('scroll-indicator');
    if (!indicator) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            indicator.style.opacity = '0';
            indicator.style.pointerEvents = 'none';
        } else {
            indicator.style.opacity = '1';
            indicator.style.pointerEvents = 'auto';
        }
    }, { passive: true });
})();


// ========================================
// CONTACT FORM HANDLER
// ========================================
(function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const btn = document.getElementById('submit-btn');
        const originalHTML = btn.innerHTML;

        // Animate button
        btn.innerHTML = `
            <span>Message Sent!</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
            </svg>
        `;
        btn.style.background = 'linear-gradient(135deg, #00ff88, #00d4ff)';
        btn.disabled = true;

        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.style.background = '';
            btn.disabled = false;
            form.reset();
        }, 3000);
    });
})();


// ========================================
// SMOOTH SECTION VISIBILITY (parallax-like)
// ========================================
(function initSectionParallax() {
    const sections = document.querySelectorAll('.section');

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, {
            threshold: 0.05,
            rootMargin: '0px'
        });

        sections.forEach(section => {
            if (section.id !== 'hero') {
                observer.observe(section);
            }
        });
    }
})();


// ========================================
// PRELOADER / DOM READY
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure everything loads
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.6s ease';

    requestAnimationFrame(() => {
        document.body.style.opacity = '1';
    });
});
