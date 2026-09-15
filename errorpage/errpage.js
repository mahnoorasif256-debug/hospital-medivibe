document.addEventListener("DOMContentLoaded", () => {
            const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

            tl.from(".error-card", {
                scale: 0.96,
                y: 15,
                opacity: 0,
                duration: 0.8
            })
            .from(".medical-cross-badge", {
                scale: 0,
                rotation: -30,
                duration: 0.5,
                ease: "back.out(2)"
            }, "-=0.3")
            .from(".error-title, .error-desc, .btn-group", {
                y: 12,
                opacity: 0,
                stagger: 0.08,
                duration: 0.6
            }, "-=0.2")
            .from(".floating-pill", {
                opacity: 0,
                scale: 0.85,
                stagger: 0.12,
                duration: 0.5
            }, "-=0.3");
        });