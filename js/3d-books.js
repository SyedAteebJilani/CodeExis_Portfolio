document.addEventListener("DOMContentLoaded", () => {
    if (!window.THREE || !window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    const container = document.getElementById('books-canvas-container');
    if (!container) return;

    // --- 1. THREE.JS SCENE SETUP ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, container.clientWidth / container.clientHeight, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.HemisphereLight(0x8fa0d8, 0x0d1024, 0.5));
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    keyLight.position.set(3.5, 5, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xa9b6ff, 0.3);
    fillLight.position.set(-4, 1, 4);
    scene.add(fillLight);

    // --- 2. DIMENSIONS & CAMERA ---
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

    // --- 3. BOOK MESH GENERATION ---
    const textureLoader = new THREE.TextureLoader();
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
        
        const blockGeo = new THREE.BoxGeometry(bookWidth - 0.05, bookHeight - 0.04, bookDepth - 0.02);
        const block = new THREE.Mesh(blockGeo, [mEdge, pageMat, mEdge, mEdge, pageMat, pageMat]);
        block.castShadow = true;
        
        const frontMesh = new THREE.Mesh(coverGeo, [mEdge, mEdge, mEdge, mEdge, mFront, pageMat]);
        frontMesh.position.set(0, 0, bookDepth/2);
        frontMesh.castShadow = true;

        const backMesh = new THREE.Mesh(coverGeo, [mEdge, mEdge, mEdge, mEdge, pageMat, mBack]);
        backMesh.position.set(0, 0, -bookDepth/2);
        backMesh.castShadow = true;

        bookRoot.add(block, frontMesh, backMesh);
        bookRoot.userData = { project, index: i, baseX: i * (bookWidth + spacing), frontMesh };
        bookRoot.position.set(bookRoot.userData.baseX, 0, 0);
        
        carouselGroup.add(bookRoot);
        books.push(bookRoot);
    });

    const startX = -1 * (bookWidth + spacing); 
    const endX = -(PROJECTS.length - 2) * (bookWidth + spacing);
    carouselGroup.position.x = startX;

    // --- 4. SCROLL ANIMATION ---
    let isBookOpen = false;

    ScrollTrigger.create({
        trigger: '#work',
        start: "top top",
        end: "+=500%", 
        pin: true,
        scrub: 1, 
        onUpdate: (self) => {
            if (!isBookOpen) {
                carouselGroup.position.x = gsap.utils.interpolate(startX, endX, self.progress);
            }
        }
    });

    // --- 5. FLIPBOOK & MOBILE MODAL INTEGRATION ---
    const flipbookOverlay = document.getElementById('flipbook-overlay');
    const interactiveBook = document.getElementById('interactive-book');
    const frontCoverCSS = document.getElementById('frontCover');
    const fbPages = Array.from(document.querySelectorAll('.content-page')).reverse();
    const mainNavbar = document.querySelector('.navbar'); 
    
    let isFlipbookOpen = false;
    let cssCurrentPageIndex = -1;
    const cssTotalPages = fbPages.length;

    function updateFlipbookZIndexes() {
        if(!frontCoverCSS) return;
        frontCoverCSS.style.zIndex = isFlipbookOpen ? 0 : 100;
        
        fbPages.forEach((page, index) => {
            const isFlipped = index <= cssCurrentPageIndex;
            if (isFlipped) {
                page.style.transform = `rotateY(-180deg) translateZ(${index + 1}px)`;
                page.style.zIndex = index + 1;
            } else {
                const zOffset = cssTotalPages - index + 2; 
                page.style.transform = `rotateY(0deg) translateZ(${zOffset}px)`;
                page.style.zIndex = cssTotalPages - index;
            }
        });
    }
    
    updateFlipbookZIndexes();
    
    document.querySelectorAll('.page-action-next').forEach(el => {
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            if (cssCurrentPageIndex < cssTotalPages - 1) {
                cssCurrentPageIndex++;
                updateFlipbookZIndexes();
            }
        });
    });

    document.querySelectorAll('.page-action-prev').forEach(el => {
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            if (cssCurrentPageIndex >= 0) {
                cssCurrentPageIndex--;
                updateFlipbookZIndexes();
            }
        });
    });

    document.getElementById('btn-read-again')?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        cssCurrentPageIndex = -1;
        updateFlipbookZIndexes();
    });

    function closeBook() {
        if (!isBookOpen) return;
        
        isFlipbookOpen = false;
        cssCurrentPageIndex = -1;
        interactiveBook.classList.remove('is-open');
        frontCoverCSS.classList.remove('is-open');
        updateFlipbookZIndexes();

        if(mainNavbar) {
            mainNavbar.style.opacity = '1';
            mainNavbar.style.pointerEvents = 'all';
        }

        setTimeout(() => {
            flipbookOverlay.classList.remove('active-overlay');
            container.style.filter = "none";
            if (window.lenis) window.lenis.start();
            isBookOpen = false;
        }, 800); 
    }

    function openBook(book) {
        if (isBookOpen) return;
        
        const project = book.userData.project;

        // --- MOBILE RESPONSIVE CHECK (< 768px): SHOWS CLEAN MOBILE CARD MODAL ---
        if (window.innerWidth <= 768) {
            if (window.lenis) window.lenis.stop();
            if (mainNavbar) {
                mainNavbar.style.opacity = '0';
                mainNavbar.style.pointerEvents = 'none';
            }

            const existingModal = document.querySelector('.mobile-project-card');
            if (existingModal) existingModal.remove();

            const modalHTML = `
                <div class="mobile-project-card" style="position:fixed; inset:0; background:rgba(0,0,0,0.8); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); z-index:99999; display:flex; align-items:center; justify-content:center; padding:1.5rem;">
                    <div class="mobile-card-content" style="background:var(--bg-secondary); width:100%; max-width:380px; max-height:85vh; border-radius:24px; padding:2rem 1.5rem; overflow-y:auto; position:relative; box-shadow:0 25px 50px rgba(0,0,0,0.4); display:flex; flex-direction:column; gap:1.2rem;">
                        <button class="mobile-close-btn" id="mob-close" style="position:absolute; top:15px; right:15px; width:36px; height:36px; border-radius:50%; background:var(--bg-primary); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; cursor:pointer; color:var(--text-primary);">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                        <div style="width:100%; height:180px; border-radius:14px; background-image:url('${project.image}'); background-size:cover; background-position:center;"></div>
                        <span style="font-family:var(--font-audiowide); font-size:0.75rem; text-transform:uppercase; letter-spacing:0.1em; color:var(--text-secondary);">${project.type}</span>
                        <h2 style="font-family:var(--font-display); font-size:1.6rem; color:var(--text-primary); margin-top:-0.5rem;">${project.name}</h2>
                        <p style="font-size:0.95rem; color:var(--text-secondary); line-height:1.6;">${project.description}</p>
                        
                        <div style="font-size:0.85rem; font-weight:600; color:var(--text-primary);">Tech Stack:</div>
                        <div style="display:flex; flex-wrap:wrap; gap:0.5rem;">
                            ${project.tech.map(t => `<span class="tech-tag" style="font-family:var(--font-audiowide); font-size:0.7rem; padding:0.4rem 1rem; border:1px solid rgba(0,0,0,0.15); border-radius:100px;">${t}</span>`).join('')}
                        </div>

                        <a href="${project.demo}" target="_blank" class="btn btn-primary btn-block" style="margin-top:0.5rem; text-align:center; display:flex; justify-content:center;">View Live ↗</a>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHTML);

            document.getElementById('mob-close').addEventListener('click', () => {
                document.querySelector('.mobile-project-card').remove();
                if (mainNavbar) {
                    mainNavbar.style.opacity = '1';
                    mainNavbar.style.pointerEvents = 'all';
                }
                if (window.lenis) window.lenis.start();
            });

            return; 
        }

        // --- DESKTOP 3D FLIPBOOK LOGIC ---[cite: 22]
        isBookOpen = true; 
        if (window.lenis) window.lenis.stop();

        document.getElementById('fb-cover-img').style.backgroundImage = `url(${project.image})`;
        document.getElementById('fb-title').textContent = project.name;
        document.getElementById('fb-type').textContent = project.type;
        document.getElementById('fb-back-title').textContent = project.name;
        document.getElementById('fb-inner-title').textContent = project.name;
        document.getElementById('fb-desc').textContent = project.description;
        document.getElementById('fb-context').textContent = project.context;
        
        document.getElementById('fb-tech').innerHTML = project.tech.map(t => 
            `<span class="tech-tag">${t}</span>`
        ).join('');
        
        document.getElementById('fb-link').href = project.demo;

        flipbookOverlay.classList.add('active-overlay');
        
        if(mainNavbar) {
            mainNavbar.style.opacity = '0';
            mainNavbar.style.pointerEvents = 'none';
            mainNavbar.style.transition = 'opacity 0.4s ease';
        }

        setTimeout(() => {
            isFlipbookOpen = true;
            interactiveBook.classList.add('is-open');
            frontCoverCSS.classList.add('is-open');
            setTimeout(updateFlipbookZIndexes, 750);
        }, 100);

        container.style.filter = "blur(10px)";
        container.style.transition = "filter 0.5s ease";
    }

    document.getElementById('flipbook-close-btn')?.addEventListener('click', closeBook);
    
    flipbookOverlay.addEventListener('click', (e) => {
        if (e.target === flipbookOverlay) closeBook();
    });
    
    window.addEventListener('keydown', (e) => {
        if (!isFlipbookOpen) return;
        if (e.key === 'ArrowRight') {
            if (cssCurrentPageIndex < cssTotalPages - 1) { cssCurrentPageIndex++; updateFlipbookZIndexes(); }
        }
        if (e.key === 'ArrowLeft') {
             if (cssCurrentPageIndex >= 0) { cssCurrentPageIndex--; updateFlipbookZIndexes(); }
        }
        if (e.key === 'Escape') closeBook();
    });

    // --- 6. RAYCASTER & INTERACTION ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-2, -2);
    
    container.addEventListener('mousemove', (e) => {
        if(isBookOpen) return;
        const rect = container.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    });
    
    container.addEventListener('mouseleave', () => { mouse.x = -2; mouse.y = -2; });

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

    // --- 7. RENDER LOOP ---
    let time = 0;
    function animate() {
        requestAnimationFrame(animate);
        time += 0.05;

        if (!isBookOpen) {
            books.forEach(book => {
                const absX = book.position.x + carouselGroup.position.x;
                const dist = Math.abs(absX);
                
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
                
                book.position.y = Math.sin(time + book.userData.index) * 0.05;
            });
        }

        renderer.render(scene, camera);
    }

    animate();

    // --- 8. RESIZE LISTENER ---
    window.addEventListener('resize', () => {
        renderer.setSize(container.clientWidth, container.clientHeight);
        camera.aspect = container.clientWidth / container.clientHeight;
        updateCameraZ();
        camera.updateProjectionMatrix();
        ScrollTrigger.refresh();
    });
});