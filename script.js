const menuButton = document.querySelector(".menu-button");
const navigation = document.querySelector("#site-nav");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

menuButton?.addEventListener("click", () => {
  const open = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!open));
  menuButton.querySelector(".sr-only").textContent = open ? "Open navigation" : "Close navigation";
  navigation.classList.toggle("open", !open);
});

navigation?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuButton?.setAttribute("aria-expanded", "false");
    navigation.classList.remove("open");
  });
});

document.querySelector("#year").textContent = new Date().getFullYear();

const revealItems = document.querySelectorAll(".reveal");
if (reducedMotion || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("visible"));
} else {
  const observer = new IntersectionObserver((entries, activeObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        activeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach((item) => observer.observe(item));
}

const roles = [
  "Computer science student.",
  "Python developer.",
  "Curious problem solver."
];

if (!reducedMotion) {
  const roleElement = document.querySelector("#typed-role");
  let roleIndex = 0;
  let characterIndex = roles[0].length;
  let deleting = true;

  const type = () => {
    const currentRole = roles[roleIndex];
    characterIndex += deleting ? -1 : 1;
    roleElement.textContent = currentRole.slice(0, characterIndex);

    let delay = deleting ? 45 : 75;
    if (!deleting && characterIndex === currentRole.length) {
      deleting = true;
      delay = 1700;
    } else if (deleting && characterIndex === 0) {
      deleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
      delay = 350;
    }
    window.setTimeout(type, delay);
  };
  window.setTimeout(type, 1600);
}

const canvas = document.querySelector("#starfield");
const context = canvas.getContext("2d");
let stars = [];

function resizeStars() {
  const density = Math.min(window.innerWidth * window.innerHeight / 8500, 150);
  canvas.width = window.innerWidth * window.devicePixelRatio;
  canvas.height = window.innerHeight * window.devicePixelRatio;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  context.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  stars = Array.from({ length: density }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    radius: Math.random() * 1.2 + 0.25,
    alpha: Math.random() * 0.55 + 0.1,
    speed: Math.random() * 0.08 + 0.02
  }));
}

function drawStars() {
  context.clearRect(0, 0, window.innerWidth, window.innerHeight);
  stars.forEach((star) => {
    context.beginPath();
    context.fillStyle = `rgba(202, 204, 178, ${star.alpha * 0.75})`;
    context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    context.fill();
    if (!reducedMotion) {
      star.y += star.speed;
      if (star.y > window.innerHeight) star.y = 0;
    }
  });
  if (!reducedMotion) window.requestAnimationFrame(drawStars);
}

resizeStars();
drawStars();
window.addEventListener("resize", resizeStars);
