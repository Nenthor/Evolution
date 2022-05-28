//Mobile menu
const navbar_toggle = document.getElementById('navbar_toggle');
const navbar_bar = document.getElementsByClassName('navbar_bar');
const mobilmenu = document.getElementById('mobilmenu');
mobilmenu.style.display = 'none';
navbar_toggle.addEventListener('click', () => {
    if(mobilmenu.style.display == 'none'){
        mobilmenu.style.display = 'inline';

        navbar_bar[0].style.transform = "rotate(-45deg) translate(-6px, 6px)";
        navbar_bar[1].style.opacity = 0;
        navbar_bar[2].style.transform = "rotate(45deg) translate(-9px, -9px)";
    }else{
        mobilmenu.style.display = 'none';

        navbar_bar[0].style.transform = "rotate(0) translate(0, 0)";
        navbar_bar[1].style.opacity = 1;
        navbar_bar[2].style.transform = "rotate(0) translate(0, 0)";
    }
}, false);

window.addEventListener('resize', function(event) {
    if(event.target.innerWidth > 700){
        if(mobilmenu.style.display = 'inline'){
            mobilmenu.style.display = 'none';

            navbar_bar[0].style.transform = "rotate(0) translate(0, 0)";
            navbar_bar[1].style.opacity = 1;
            navbar_bar[2].style.transform = "rotate(0) translate(0, 0)";
        }
    }
}, false);

//Title Animation on start
const title = document.getElementById('title');
const title_message = title.textContent;
title.textContent = title_message[0];

const title_animation = setInterval(() => {
    title.textContent += title_message[title.textContent.length];
    if(title_message.length <= title.textContent.length){
        clearInterval(title_animation);
    }
}, 150);

//Connect button
[document.getElementById('connectionconnect'), document.getElementById('frontpageconnect')].forEach(button => {
    button.addEventListener('click', event => {
        open('/content/html/controll.html', '_self');
    });
});
