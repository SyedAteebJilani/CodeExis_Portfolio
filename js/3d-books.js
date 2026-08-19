document.addEventListener("DOMContentLoaded", () => {
    if (!window.THREE || !window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    const container = document.getElementById('books-canvas-container');
    if (!container) return;

    // 1. SETUP
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, container.clientWidth / container.clientHeight, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Advanced Lighting (adapted from React component)
    const hemi = new THREE.HemisphereLight(0x8fa0d8, 0x0d1024, 0.5);
    scene.add(hemi);
    
    const key = new THREE.DirectionalLight(0xffffff, 0.8);
    key.position.set(3.5, 5, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);

    const fillLight = new THREE.DirectionalLight(0xa9b6ff, 0.3);
    fillLight.position.set(-4, 1, 4);
    scene.add(fillLight);

    // 2. DIMENSIONS & SLOTS (VISIBLE = 3)
    const VISIBLE = 3;
    const bookWidth = 1.42;
    const bookHeight = 2.14;
    const bookDepth = 0.34;
    const spacing = 1.8;
    
    function updateCameraZ() {
        const targetWidth = VISIBLE * (bookWidth + spacing);
        const vFov = camera.fov * Math.PI / 180;
        camera.position.z = (targetWidth / camera.aspect) / (2 * Math.tan(vFov / 2)) * 0.8;
        camera.position.y = 0;
        camera.userData.baseZ = camera.position.z;
    }
    updateCameraZ();

    // 3. TEXTURE LOADER
    const textureLoader = new THREE.TextureLoader();

    // 4. MESH GENERATION (Simplified port of Spring logic -> GSAP)
    const books = [];
    const carouselGroup = new THREE.Group();
    scene.add(carouselGroup);

    const mEdge = new THREE.MeshStandardMaterial({ color: 0xeee4cf, roughness: 0.7 });
    const pageMat = new THREE.MeshStandardMaterial({ color: 0xf4eee0, roughness: 0.9 });

    PROJECTS.forEach((project, i) => {
        const bookRoot = new THREE.Group();
        
        const coverGeo = new THREE.BoxGeometry(bookWidth, bookHeight, 0.04);
        
        const coverTex = textureLoader.load(project.image);
        coverTex.colorSpace = THREE.SRGBColorSpace;
        coverTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        coverTex.generateMipmaps = true;
        coverTex.minFilter = THREE.LinearMipmapLinearFilter;
        
        const mFront = new THREE.MeshStandardMaterial({ map: coverTex, roughness: 0.6 });
        const mBack = new THREE.MeshStandardMaterial({ color: project.color || 0x22252b, roughness: 0.6 });
        
        // Block (Pages)
        const blockGeo = new THREE.BoxGeometry(bookWidth - 0.05, bookHeight - 0.04, bookDepth - 0.02);
        const block = new THREE.Mesh(blockGeo, [mEdge, pageMat, mEdge, mEdge, pageMat, pageMat]);
        block.position.set(0, 0, 0);
        block.castShadow = true;
        
        // Covers
        const frontMesh = new THREE.Mesh(coverGeo, [mEdge, mEdge, mEdge, mEdge, mFront, pageMat]);
        frontMesh.position.set(0, 0, bookDepth/2);
        frontMesh.castShadow = true;

        const backMesh = new THREE.Mesh(coverGeo, [mEdge, mEdge, mEdge, mEdge, pageMat, mBack]);
        backMesh.position.set(0, 0, -bookDepth/2);
        backMesh.castShadow = true;

        bookRoot.add(block, frontMesh, backMesh);
        
        // Layout
        bookRoot.userData = { project, index: i, baseX: i * (bookWidth + spacing), frontMesh };
        bookRoot.position.set(bookRoot.userData.baseX, 0, 0);
        
        carouselGroup.add(bookRoot);
        books.push(bookRoot);
    });

    // Center starting position
    const startX = -1 * (bookWidth + spacing); 
    const endX = -(PROJECTS.length - 2) * (bookWidth + spacing);
    carouselGroup.position.x = startX;

    // 5. SCROLLTRIGGER INTEGRATION (shiftCarousel alternative via Scroll)
    let isBookOpen = false;
    let hoveredBook = null;
    let savedCarouselX = 0;

    ScrollTrigger.create({
        trigger: '#work',
        start: "top top",
        end: "+=500%", 
        pin: true,
        scrub: 1, 
        onUpdate: (self) => {
            if (!isBookOpen) {
                // Smooth shift across all 8 projects
                carouselGroup.position.x = gsap.utils.interpolate(startX, endX, self.progress);
            }
        }
    });

    // 6. INTERACTION & UI
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-2, -2);
    
    container.addEventListener('mousemove', (e) => {
        if(isBookOpen) return;
        const rect = container.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    });
    container.addEventListener('mouseleave', () => { mouse.x = -2; mouse.y = -2; });

    const dpPanel = document.getElementById('book-detail-panel');
    const closeBtn = document.getElementById('dp-close-btn');

    function closeBook() {
        if(!isBookOpen || !hoveredBook) return;
        
        dpPanel.style.opacity = '0';
        dpPanel.style.pointerEvents = 'none';
        
        if (window.lenis) window.lenis.start();

        gsap.to(hoveredBook.userData.frontMesh.rotation, {
            y: 0, duration: 0.8, ease: "power3.inOut",
            transformOrigin: "left center"
        });
        
        gsap.to(camera.position, {
            x: 0, y: 0, z: camera.userData.baseZ,
            duration: 0.8, ease: "power3.inOut"
        });

        gsap.to(carouselGroup.position, {
            x: savedCarouselX, duration: 0.8, ease: "power3.inOut",
            onComplete: () => isBookOpen = false
        });
    }

    function openBook(book) {
        if(isBookOpen) return;
        isBookOpen = true;
        hoveredBook = book;
        savedCarouselX = carouselGroup.position.x;
        
        if (window.lenis) window.lenis.stop();

        // Animate Camera & Carousel to frame the open book on the left
        gsap.to(carouselGroup.position, {
            x: -book.userData.baseX - 1.5,
            duration: 0.8, ease: "power3.inOut"
        });
        
        gsap.to(camera.position, {
            x: -1, z: camera.userData.baseZ * 0.65,
            duration: 0.8, ease: "power3.inOut"
        });

        // Open Cover Pivot
        gsap.to(book.userData.frontMesh.rotation, {
            y: -Math.PI * 0.7,
            duration: 0.8, ease: "power3.inOut",
            transformOrigin: "left center" // ensure it swings open from spine edge
        });

        // Populate Detail Panel (No Goodreads/Star ratings as requested)
        const project = book.userData.project;
        document.getElementById('dp-title').textContent = project.name;
        document.getElementById('dp-type').textContent = project.type;
        document.getElementById('dp-desc').textContent = project.description;
        document.getElementById('dp-context').textContent = project.context;
        document.getElementById('dp-tech').innerHTML = project.tech.map(t => `<span class="tech-tag" style="padding: 0.3rem 0.6rem; background: var(--bg-primary); border: 1px solid var(--border); border-radius: 100px; font-size: 0.8rem;">${t}</span>`).join('');
        
        const linkBtn = document.getElementById('dp-link');
        linkBtn.href = project.demo;
        
        // GSAP Reticle instantiation for the new button
        if(!linkBtn.querySelector('.reticle')) {
            const reticleHTML = `<div class="reticle"><div class="corner top-left"></div><div class="corner top-right"></div><div class="corner bottom-left"></div><div class="corner bottom-right"></div><div class="crosshair-h"></div><div class="crosshair-v"></div><div class="tick tick-h1"></div><div class="tick tick-h2"></div><div class="tick tick-h3"></div><div class="tick tick-h4"></div><div class="tick tick-v1"></div><div class="tick tick-v2"></div><div class="tick tick-v3"></div><div class="tick tick-v4"></div></div>`;
            linkBtn.insertAdjacentHTML('beforeend', reticleHTML);
            
            const reticle = linkBtn.querySelector('.reticle');
            const corners = reticle.querySelectorAll('.corner');
            const crossH = reticle.querySelector('.crosshair-h');
            const crossV = reticle.querySelector('.crosshair-v');
            const ticks = reticle.querySelectorAll('.tick');

            gsap.set([corners, crossH, crossV, ticks], { opacity: 0 });

            const tl = gsap.timeline({ paused: true, defaults: { duration: 0.3, ease: "power2.out" } });
            tl.fromTo(corners, { scale: 1.6, opacity: 0 }, { scale: 1, opacity: 1, stagger: 0.05 }, 0);
            tl.fromTo(crossH, { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1 }, 0.1);
            tl.fromTo(crossV, { scaleY: 0, opacity: 0 }, { scaleY: 1, opacity: 1 }, 0.1);
            tl.fromTo(ticks, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, stagger: 0.02 }, 0.2);

            linkBtn.addEventListener('mouseenter', () => tl.play());
            linkBtn.addEventListener('mouseleave', () => tl.reverse());
        }

        setTimeout(() => {
            dpPanel.style.opacity = '1';
            dpPanel.style.pointerEvents = 'all';
        }, 500);
    }

    closeBtn.addEventListener('click', closeBook);

    container.addEventListener('click', () => {
        if (isBookOpen) return;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(carouselGroup.children, true);
        if (intersects.length > 0) {
            let obj = intersects[0].object;
            while(obj.parent && !obj.parent.userData.project) obj = obj.parent;
            if (obj.parent && obj.parent.userData.project) openBook(obj.parent);
        }
    });

    // 7. RENDER LOOP (Physics mapping)
    let time = 0;
    function animate() {
        requestAnimationFrame(animate);
        time += 0.05;

        if (!isBookOpen) {
            books.forEach(book => {
                const absX = book.position.x + carouselGroup.position.x;
                const dist = Math.abs(absX);
                
                // Scale based on center proximity
                let scale = 1.0 - (dist / 10);
                scale = Math.max(0.85, Math.min(1.1, scale)); 

                let targetRotY = 0;
                let targetRotX = 0;

                raycaster.setFromCamera(mouse, camera);
                const intersects = raycaster.intersectObjects(carouselGroup.children, true);
                
                if (intersects.length > 0) {
                    let obj = intersects[0].object;
                    while(obj.parent && !obj.parent.userData.project) obj = obj.parent;
                    if (obj.parent === book) {
                        targetRotY = -0.15;
                        targetRotX = 0.05;
                        scale += 0.05; 
                    }
                }
                
                book.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
                book.rotation.y += (targetRotY - book.rotation.y) * 0.1;
                book.rotation.x += (targetRotX - book.rotation.x) * 0.1;
                
                // Idle float
                book.position.y = Math.sin(time + book.userData.index) * 0.05;
            });
        }

        renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', () => {
        renderer.setSize(container.clientWidth, container.clientHeight);
        camera.aspect = container.clientWidth / container.clientHeight;
        updateCameraZ();
        camera.updateProjectionMatrix();
        ScrollTrigger.refresh();
    });
});