// ///////////   navbar and cursor funtionality start /////////////

const cursorDot = document.querySelector(".glow-cursor-dot");
const cursorTrail = document.querySelector(".glow-cursor-trail");

window.addEventListener("mousemove", (e) => {
  const posX = e.clientX;
  const posY = e.clientY;

  cursorDot.style.left = `${posX}px`;
  cursorDot.style.top = `${posY}px`;

  cursorTrail.animate(
    {
      left: `${posX}px`,
      top: `${posY}px`,
    },
    { duration: 280, fill: "forwards" }
  );
});

const interactiveElements = document.querySelectorAll("a, button, input, select, .btn, .card");

interactiveElements.forEach((el) => {
  el.addEventListener("mouseenter", () => {
    document.body.classList.add("cursor-hover");
  });
  el.addEventListener("mouseleave", () => {
    document.body.classList.remove("cursor-hover");
  });
});




(function () {
    var nav = document.querySelector('.my-nav');
    if (!nav) return;

    var triggerPoint = 250; 
    var navHeight = nav.offsetHeight;
    document.body.style.setProperty('--nav-h', navHeight + 'px');

    function onScroll() {
      if (window.scrollY > triggerPoint) {
        if (!nav.classList.contains('sticky-active')) {
          nav.classList.add('sticky-active');
          document.body.classList.add('has-sticky-header');
        }
      } else {
        nav.classList.remove('sticky-active');
        document.body.classList.remove('has-sticky-header');
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  })();




// ///////////   navbar and cursor funtionality end /////////////


  const backToTopBtn = document.getElementById('backToTopBtn');

  // scroll trigger — show/hide button
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      backToTopBtn.classList.add('show');
    } else {
      backToTopBtn.classList.remove('show');
    }
  });

  // click — smooth scroll to top
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });



// ///// text animation

const myText = new SplitType('.app', { types: 'chars' });

gsap.fromTo('.app .char', 
    { 
        y: 25, 
        opacity: 0, 
        color: '#1a202c',
        textShadow: '0px 0px 0px rgba(0, 0, 0, 0)'
    },
    {
        y: 0,
        opacity: 1,
        duration: 0.5,
        stagger: 0.05,
        repeat: -1,   
        delay: 1,       
        keyframes: [
            { color: '#135dd8', textShadow: '0px 4px 12px rgba(49, 130, 206, 0.6)', duration: 0.2 }, 
            { color: '#1a202c', textShadow: '0px 0px 0px rgba(0, 0, 0, 0)', duration: 0.3 }  
        ]
    }
);



// /////////////////// counter animation ///////////////////

const section = document.querySelector('.counters-section');

const animateCounter = (counter) => {
  const symbol = counter.getAttribute('data-symbol') || '';
  
  // 1. Handling Special '24/7' Case
  if (counter.getAttribute('data-type') === 'time') {
    let hours = 0;
    let days = 0;
    const timer = setInterval(() => {
      if (hours < 24) hours += 2;
      if (days < 7) days += 1;
      
      counter.innerText = `${hours}/${days}`;
      
      if (hours >= 24 && days >= 7) {
        counter.innerText = '24/7';
        clearInterval(timer);
      }
    }, 50);
    return;
  }

  const target = +counter.getAttribute('data-target');
  if (!target) return;

  let count = 0;
  counter.innerText = '0' + symbol;

  const totalSteps = 30;
  const increment = target / totalSteps; 

  const timer = setInterval(() => {
    count += increment;
    if (count >= target) {
      counter.innerText = target + symbol;
      clearInterval(timer);
    } else {
      counter.innerText = Math.floor(count) + symbol;
    }
  }, 40); // 40ms speed
};

if (section) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        document.querySelectorAll('.counter-number').forEach(counter => {
          animateCounter(counter);
        });
      }
    });
  }, { threshold: 0.3 });

  observer.observe(section);
}





