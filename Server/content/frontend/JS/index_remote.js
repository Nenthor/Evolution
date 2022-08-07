//Title Animation on start
const title = document.getElementById('title');
const title_message = title.textContent;
title.textContent = title_message[0];

window.addEventListener('load', function () {
    playAnimation();
}, { passive: true });


function playAnimation() {
    const title_animation = setInterval(() => {
        title.textContent += title_message[title.textContent.length];
        if (title_message.length <= title.textContent.length) {
            clearInterval(title_animation);
        }
    }, 150);
}

//Connect button
[document.getElementById('connectionconnect'), document.getElementById('frontpageconnect')].forEach(button => {
    button.addEventListener('click', event => {
        open('/controll', '_self');
    });
}, { passive: true });
