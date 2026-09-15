document.addEventListener("DOMContentLoaded", () => {
    
    // Safety check for GSAP availability
    if (typeof gsap === "undefined") {
        console.warn("GSAP CDN is missing. Animations skipped.");
        return;
    }

    // Register ScrollTrigger if available
    if (typeof ScrollTrigger !== "undefined") {
        gsap.registerPlugin(ScrollTrigger);
    }

    /* ==========================================================================
       1. PAGE LOAD ENTRANCE ANIMATION (Hero & Split Layout)
       ========================================================================== */
    const loadTL = gsap.timeline({ defaults: { ease: "power3.out", duration: 0.8 } });

    loadTL
        .from(".page-banner .badge", {
            y: -20,
            opacity: 0,
            duration: 0.6,
            clearProps: "all"
        })
        .from(".page-banner h1", {
            y: 25,
            opacity: 0,
            duration: 0.7,
            clearProps: "all"
        }, "-=0.4")
        .from(".page-banner p, .breadcrumb-nav", {
            y: 15,
            opacity: 0,
            stagger: 0.1,
            clearProps: "all"
        }, "-=0.5")
        .from(".glass-form-card", {
            x: -30,
            opacity: 0,
            duration: 0.8,
            clearProps: "all"
        }, "-=0.3")
        .from(".glass-map-card", {
            x: 30,
            opacity: 0,
            duration: 0.8,
            clearProps: "all"
        }, "-=0.8")
        .from(".vip-contact-form .input-group, .submit-glow-btn", {
            y: 15,
            opacity: 0,
            stagger: 0.06,
            duration: 0.5,
            clearProps: "all"
        }, "-=0.4");


    /* ==========================================================================
       2. FORM INPUT FOCUS & FLOATING ANIMATIONS
       ========================================================================== */
    const inputs = document.querySelectorAll(".input-group input, .input-group select, .input-group textarea");

    inputs.forEach((input) => {
        const icon = input.parentElement.querySelector(".input-icon");

        input.addEventListener("focus", () => {
            if (icon) {
                gsap.to(icon, {
                    scale: 1.25,
                    color: "#135dd8",
                    duration: 0.25,
                    ease: "back.out(2)"
                });
            }
        });

        input.addEventListener("blur", () => {
            if (!input.value && icon) {
                gsap.to(icon, {
                    scale: 1,
                    color: "#64748b",
                    duration: 0.25,
                    ease: "power2.out"
                });
            }
        });
    });


    /* ==========================================================================
       3. SUBMIT BUTTON INTERACTIONS (Hover & SVG Lightning / Click Feedback)
       ========================================================================== */
    const submitBtn = document.querySelector(".submit-glow-btn");

    if (submitBtn) {
        const icon = submitBtn.querySelector("i, svg");

        // Hover Effect on Icon inside Button
        submitBtn.addEventListener("mouseenter", () => {
            if (icon) {
                gsap.to(icon, {
                    x: 4,
                    y: -2,
                    duration: 0.25,
                    ease: "power2.out"
                });
            }
        });

        submitBtn.addEventListener("mouseleave", () => {
            if (icon) {
                gsap.to(icon, {
                    x: 0,
                    y: 0,
                    duration: 0.25,
                    ease: "power2.out"
                });
            }
        });

        // Click Feedback (Scale down/up)
        submitBtn.addEventListener("mousedown", () => {
            gsap.to(submitBtn, { scale: 0.97, duration: 0.1 });
        });

        submitBtn.addEventListener("mouseup", () => {
            gsap.to(submitBtn, { scale: 1, duration: 0.15, ease: "back.out(2)" });
        });
    }


    /* ==========================================================================
       4. SOCIAL CARDS CASCADE REVEAL (ScrollTrigger Safe Fallback)
       ========================================================================== */
    if (typeof ScrollTrigger !== "undefined" && document.querySelector(".social-card")) {
        gsap.from(".social-card", {
            scrollTrigger: {
                trigger: ".social-connect-section",
                start: "top 90%",
                toggleActions: "play none none none",
                once: true
            },
            y: 30,
            opacity: 0,
            scale: 0.97,
            stagger: 0.08,
            duration: 0.6,
            ease: "back.out(1.2)",
            clearProps: "all"
        });
    }


    /* ==========================================================================
       5. HOVER TILT & GLOW EFFECT ON SOCIAL CARDS
       ========================================================================== */
    const socialCards = document.querySelectorAll(".social-card");

    socialCards.forEach((card) => {
        const iconWrapper = card.querySelector(".social-icon-wrapper");
        const arrow = card.querySelector(".card-arrow");

        card.addEventListener("mouseenter", () => {
            gsap.to(card, {
                y: -5,
                scale: 1.02,
                duration: 0.25,
                ease: "power2.out"
            });
            if (iconWrapper) {
                gsap.to(iconWrapper, {
                    scale: 1.12,
                    rotation: -5,
                    duration: 0.25,
                    ease: "back.out(2)"
                });
            }
            if (arrow) {
                gsap.to(arrow, {
                    x: 4,
                    duration: 0.2,
                    ease: "power1.out"
                });
            }
        });

        card.addEventListener("mouseleave", () => {
            gsap.to(card, {
                y: 0,
                scale: 1,
                duration: 0.25,
                ease: "power2.out"
            });
            if (iconWrapper) {
                gsap.to(iconWrapper, {
                    scale: 1,
                    rotation: 0,
                    duration: 0.25,
                    ease: "power2.out"
                });
            }
            if (arrow) {
                gsap.to(arrow, {
                    x: 0,
                    duration: 0.2,
                    ease: "power1.out"
                });
            }
        });
    });


    /* ==========================================================================
       6. FORM SUBMISSION HANDLER
       ========================================================================== */
    const form = document.querySelector(".vip-contact-form");
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            alert("Thank you! Your message has been sent successfully.");
            form.reset();
        });
    }

});