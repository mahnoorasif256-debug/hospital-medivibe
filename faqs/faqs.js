/**
 * Ultra-Responsive Hospital FAQ Script (ES6+ with GSAP)
 */

const hospitalFaqData = {
    general: [
        {
            q: "What medical departments are available at your hospital?",
            a: "We offer complete healthcare services including Cardiology (Heart), Dermatology (Skin), Dentistry (Teeth), Orthopedics, Pediatrics, Gynecology, and General Surgery."
        },
        {
            q: "Do you offer emergency medical services?",
            a: "Yes, our Emergency Department and ICU are open 24/7 with specialized doctors and ambulances on standby."
        },
        {
            q: "Can I consult with a specialist online?",
            a: "Yes, we offer video consultations for non-emergency conditions. You can book an online appointment directly from our website."
        },
        {
            q: "What should I bring for my first hospital visit?",
            a: "Please bring a valid photo ID, your insurance card, previous prescription files, and a list of your current medications."
        }
    ],
    booking: [
        {
            q: "How do I book an appointment on this website?",
            a: "Click 'Book Appointment' at the top of the page, select your preferred specialty (e.g., Dental, Cardio), choose a doctor and a convenient date/time, and confirm."
        },
        {
            q: "Can I reschedule or cancel my appointment?",
            a: "Yes. Log in to your Patient Dashboard, go to 'My Appointments', and select 'Reschedule' or 'Cancel' at least 2 hours before your slot."
        },
        {
            q: "Can I choose a specific doctor for my treatment?",
            a: "Yes. When booking, you can view doctor profiles, qualifications, available days, and consultation fees before making a choice."
        },
        {
            q: "What happens if I arrive late for my appointment?",
            a: "If you are more than 15 minutes late, your doctor may see the next patient first, or our staff may help you move to the next available slot."
        }
    ],
    dashboard: [
        {
            q: "What can I do inside my Patient Dashboard?",
            a: "Your dashboard lets you view upcoming appointments, download lab reports, track medical history, view doctor prescriptions, and pay bills."
        },
        {
            q: "How do I download my lab and test reports?",
            a: "Log into your Patient Dashboard, go to the 'Lab Reports' section, and click 'Download PDF' next to your test results."
        },
        {
            q: "Is my personal health data kept safe?",
            a: "Yes. Your medical history and records are encrypted and kept strictly confidential in compliance with health privacy standards."
        },
        {
            q: "How do I reset my patient portal password?",
            a: "Click 'Forgot Password' on the login screen, enter your registered email address, and follow the link sent to your inbox to set a new password."
        }
    ],
    billing: [
        {
            q: "Which payment methods do you accept?",
            a: "We accept all major credit/debit cards, online banking, mobile payment wallets, and cash at our hospital counter."
        },
        {
            q: "Do you accept health insurance?",
            a: "Yes, we work with most major health insurance providers. You can upload your insurance details during online booking or present your card at checkout."
        },
        {
            q: "How can I get an official invoice for insurance reimbursement?",
            a: "An official tax invoice is generated automatically after your visit. You can download it anytime from the 'Invoices' tab in your Patient Dashboard."
        }
    ]
};

class HospitalFAQApp {
    constructor() {
        this.container = document.getElementById('accordion-container');
        this.categoryButtons = document.querySelectorAll('.category-card');
        this.currentCategory = 'general';
        this.activeAccordion = null;

        this.init();
    }

    init() {
        this.renderCategory(this.currentCategory);
        this.bindCategoryEvents();
    }

    bindCategoryEvents() {
        this.categoryButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget;
                const category = target.getAttribute('data-category');

                if (category === this.currentCategory) return;

                this.categoryButtons.forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-selected', 'false');
                });
                target.classList.add('active');
                target.setAttribute('aria-selected', 'true');

                this.currentCategory = category;
                this.switchCategory(category);
            });
        });
    }

    switchCategory(category) {
        gsap.to(this.container.children, {
            opacity: 0,
            y: -8,
            duration: 0.15,
            stagger: 0.02,
            onComplete: () => {
                this.renderCategory(category);
            }
        });
    }

    renderCategory(category) {
        this.container.innerHTML = '';
        this.activeAccordion = null;

        const items = hospitalFaqData[category] || [];

        items.forEach((item, index) => {
            const accordion = document.createElement('div');
            accordion.className = 'accordion-item';
            accordion.innerHTML = `
                <button class="accordion-header" aria-expanded="false" id="faq-head-${index}">
                    <h4>${item.q}</h4>
                    <span class="accordion-icon"><i class="ri-arrow-down-s-line"></i></span>
                </button>
                <div class="accordion-body" role="region" aria-labelledby="faq-head-${index}">
                    <div class="accordion-content-inner">
                        ${item.a}
                    </div>
                </div>
            `;

            this.container.appendChild(accordion);
            this.bindAccordionEvent(accordion);
        });

        gsap.fromTo(this.container.children, 
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.25, stagger: 0.04, ease: 'power2.out' }
        );
    }

    bindAccordionEvent(item) {
        const header = item.querySelector('.accordion-header');
        const body = item.querySelector('.accordion-body');
        const icon = item.querySelector('.accordion-icon');

        header.addEventListener('click', () => {
            const isOpen = item.classList.contains('active');

            if (this.activeAccordion && this.activeAccordion !== item) {
                this.closeAccordion(this.activeAccordion);
            }

            if (isOpen) {
                this.closeAccordion(item);
                this.activeAccordion = null;
            } else {
                this.openAccordion(item, body, icon);
                this.activeAccordion = item;
            }
        });
    }

    openAccordion(item, body, icon) {
        item.classList.add('active');
        item.querySelector('.accordion-header').setAttribute('aria-expanded', 'true');

        gsap.to(body, {
            height: 'auto',
            opacity: 1,
            duration: 0.3,
            ease: 'power2.out'
        });

        gsap.to(icon, {
            rotate: 180,
            duration: 0.25,
            ease: 'power2.out'
        });
    }

    closeAccordion(item) {
        const body = item.querySelector('.accordion-body');
        const icon = item.querySelector('.accordion-icon');

        item.classList.remove('active');
        item.querySelector('.accordion-header').setAttribute('aria-expanded', 'false');

        gsap.to(body, {
            height: 0,
            opacity: 0,
            duration: 0.2,
            ease: 'power2.inOut'
        });

        gsap.to(icon, {
            rotate: 0,
            duration: 0.25,
            ease: 'power2.inOut'
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new HospitalFAQApp();
});