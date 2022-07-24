//Mobile menu
const navbar_toggle = document.getElementById('navbar_toggle');
const navbar_bar = document.getElementsByClassName('navbar_bar');
const mobilmenu = document.getElementById('mobilmenu');
mobilmenu.style.display = 'none';
navbar_toggle.addEventListener('click', () => {
    if (mobilmenu.style.display == 'none') {
        mobilmenu.style.display = 'inline';

        navbar_bar[0].style.transform = "rotate(-45deg) translate(-6px, 6px)";
        navbar_bar[1].style.opacity = 0;
        navbar_bar[2].style.transform = "rotate(45deg) translate(-9px, -9px)";
    } else {
        mobilmenu.style.display = 'none';

        navbar_bar[0].style.transform = "rotate(0) translate(0, 0)";
        navbar_bar[1].style.opacity = 1;
        navbar_bar[2].style.transform = "rotate(0) translate(0, 0)";
    }
}, { passive: true });

window.addEventListener('resize', function (event) {
    if (event.target.innerWidth > 700) {
        if (mobilmenu.style.display = 'inline') {
            mobilmenu.style.display = 'none';

            navbar_bar[0].style.transform = "rotate(0) translate(0, 0)";
            navbar_bar[1].style.opacity = 1;
            navbar_bar[2].style.transform = "rotate(0) translate(0, 0)";
        }
    }
}, { passive: true });