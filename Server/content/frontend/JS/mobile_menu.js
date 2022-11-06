//Mobile menu
const menu = document.getElementById('menu');
const navbar_toggle = document.getElementById('navbar_toggle');
const navbar_bar = document.getElementsByClassName('navbar_bar');

var isOpen = false;

navbar_toggle.addEventListener('click', () => {
    changeMenu(!isOpen);
    if (isOpen) {
        rotateBar(0, 0, 1);
        rotateBar(1, 0, 1);
        rotateBar(2, 0, 1);
    } else {
        rotateBar(0, 1, 1);
        rotateBar(1, 0, 0);
        rotateBar(2, -1, 1);
    }
    isOpen = !isOpen;
}, { passive: true });

function rotateBar(index, factor, opacity) {
    const deg = 45 * factor, y = 11 * factor;

    navbar_bar[index].style.opacity = `${opacity}`;
    navbar_bar[index].style.transform =
        `translateY(${y}px) rotate(${deg}deg) `
}

function changeMenu(visible) {
    //Reset Animation
    menu.style.animation = 'none';
    menu.offsetHeight;
    menu.style.animation = null; 

    //Play Animation
    if (visible) {
        menu.style.display = 'block';
        menu.style.animation = 'mobileMenu 0.6s ease-in-out 0s 1 reverse forwards';
    } else {
        menu.style.animation = 'mobileMenu 0.6s ease-in-out 0s 1 normal forwards';
        setTimeout(() => {
            menu.style.display = 'none';
        }, 600);
    }
}
