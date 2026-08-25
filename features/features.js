document.addEventListener("DOMContentLoaded", () => {
    // Register GSAP Micro-Interactions
    const cards = document.querySelectorAll(".feature-card");

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Initial Stagger Entrance Animation
    if (!prefersReducedMotion) {
        gsap.from(".feature-card", {
            opacity: 0,
            y: 40,
            duration: 0.8,
            stagger: 0.08,
            ease: "power3.out",
            clearProps: "all" // Clear inline styles post-animation to avoid GPU layout bugs
        });
    }

    cards.forEach((card) => {
        const circle = card.querySelector(".circle-expansion");
        const icon = card.querySelector(".feature-icon");
        const iconContainer = card.querySelector(".icon-container");
        const title = card.querySelector(".feature-title");
        const arrow = card.querySelector(".action-arrow");
        const particleEmitter = card.querySelector(".particle-emitter");

        if (prefersReducedMotion) return;

        // Create Master Hover Timeline
        const hoverTimeline = gsap.timeline({ paused: true });

        // Phase 1: Card Lift, Shadow Increase & Title Color Shift
        hoverTimeline
            .to(card, {
                y: -10,
                borderColor: "#135dd8",
                boxShadow: "0 25px 50px -12px rgba(19, 93, 216, 0.2)",
                duration: 0.4,
                ease: "cubic-bezier(0.22, 1, 0.36, 1)"
            }, 0)
            .to(title, {
                color: "#135dd8",
                duration: 0.3,
                ease: "power2.out"
            }, 0)
            .to(iconContainer, {
                borderColor: "rgba(19, 93, 216, 0.4)",
                boxShadow: "0 0 20px rgba(19, 93, 216, 0.35)",
                duration: 0.4,
                ease: "power2.out"
            }, 0);

        // Phase 2: Expanding Circle Animation (duration 0.6s - 0.8s)
        hoverTimeline.to(circle, {
            scale: 1.2,
            opacity: 1,
            duration: 0.65,
            ease: "cubic-bezier(0.22, 1, 0.36, 1)"
        }, 0);

        // Phase 3: Icon Rotates & Turns White AFTER/DURING Expansion End
        hoverTimeline
            .to(icon, {
                color: "#ffffff",
                rotate: 9,
                scale: 1.1,
                duration: 0.3,
                ease: "power2.out"
            }, 0.35) // Delayed shift for visual elegance
            .to(arrow, {
                x: 4,
                y: -4,
                duration: 0.3,
                ease: "power2.out"
            }, 0.2);

        // Event Listeners for Hover and Focus (Keyboard Accessibility)
        const handleEnter = () => {
            hoverTimeline.play();
            spawnParticles(particleEmitter);
        };

        const handleLeave = () => {
            hoverTimeline.reverse();
        };

        card.addEventListener("mouseenter", handleEnter);
        card.addEventListener("mouseleave", handleLeave);
        card.addEventListener("focus", handleEnter);
        card.addEventListener("blur", handleLeave);
    });

    // Helper: Tiny GSAP Floating Particle Ripple Effect
    function spawnParticles(container) {
        if (!container) return;
        
        // Clean out old particles
        container.innerHTML = "";

        const particleCount = 6;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement("span");
            particle.classList.add("particle");
            container.appendChild(particle);

            // Randomize Burst Coordinates Around Icon
            const angle = (i / particleCount) * Math.PI * 2;
            const velocity = 25 + Math.random() * 15;
            const x = Math.cos(angle) * velocity;
            const y = Math.sin(angle) * velocity;

            gsap.fromTo(particle, 
                {
                    x: 0,
                    y: 0,
                    opacity: 1,
                    scale: Math.random() * 0.8 + 0.6
                },
                {
                    x: x,
                    y: y,
                    opacity: 0,
                    scale: 0,
                    duration: 0.65,
                    ease: "power2.out",
                    onComplete: () => particle.remove()
                }
            );
        }
    }
});

document.addEventListener("DOMContentLoaded", () => {
    // Banner Entrance Timeline
    const bannerTl = gsap.timeline();

    bannerTl.from(".banner-bg", {
        scale: 1.15,
        duration: 1.2,
        ease: "power2.out"
    })
    .from(".banner-content > *", {
        opacity: 0,
        y: 25,
        duration: 0.7,
        stagger: 0.12,
        ease: "power3.out"
    }, "-=0.8");
});