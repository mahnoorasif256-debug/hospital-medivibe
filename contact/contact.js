document.addEventListener("DOMContentLoaded", () => {
    // 1. Entrance Animations via GSAP
    const tl = gsap.timeline();

    tl.from(".banner-content > *", {
        opacity: 0,
        y: 20,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out"
    })
    .from(".contact-grid > *", {
        opacity: 0,
        y: 30,
        duration: 0.7,
        stagger: 0.15,
        ease: "power3.out"
    }, "-=0.3")
    .from(".features-grid .feature-card", {
        opacity: 0,
        y: 20,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out"
    }, "-=0.2");

    // 2. Feature Cards Hover Background Expanding Logic
    const cards = document.querySelectorAll(".feature-card");

    cards.forEach((card) => {
        const circle = card.querySelector(".circle-expansion");
        const arrow = card.querySelector(".action-arrow");

        card.addEventListener("mouseenter", () => {
            gsap.to(circle, {
                scale: 1,
                opacity: 1,
                duration: 0.45,
                ease: "power3.out"
            });

            if (arrow) {
                gsap.to(arrow, {
                    x: 6,
                    duration: 0.3,
                    ease: "power2.out"
                });
            }
        });

        card.addEventListener("mouseleave", () => {
            gsap.to(circle, {
                scale: 0,
                opacity: 0,
                duration: 0.35,
                ease: "power2.in"
            });

            if (arrow) {
                gsap.to(arrow, {
                    x: 0,
                    duration: 0.3,
                    ease: "power2.out"
                });
            }
        });
    });

    // 3. Contact Form Submission
    const form = document.getElementById("contactForm");
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            alert("Thank you! Your message has been sent successfully.");
            form.reset();
        });
    }
});