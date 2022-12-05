import os

os.environ["PYGAME_HIDE_SUPPORT_PROMPT"] = "hide"    # Disable start message from pygame
os.chdir(os.path.dirname(os.path.abspath(__file__))) # Set working directory to to file directory (.../backend/hardware/)
from pygame import mixer

songs: list[str] = ["rickroll", "mario", "salsa", "podcast"]
currentSong = 0
isPaused = False
isEnabled = False


def start():
    global isEnabled
    if isEnabled:
        return
    isEnabled = True
    mixer.init(buffer=1024)


def stop():
    global isEnabled, currentSong, isPaused
    if not isEnabled:
        return
    currentSong = 0
    isPaused = False
    isEnabled = False
    mixer.quit()


def playMusic(music: str):
    global songs, isPaused, currentSong
    if not isEnabled:
        return
    if music == "pause":
        isPaused = True
        mixer.music.pause()
        return
    elif music == "resume":
        isPaused = False
        mixer.music.unpause()
        return

    index = int(music)
    if currentSong == index:
        pass
    elif index == 0:
        currentSong = index
        mixer.music.stop()
        mixer.music.unload()
    else:
        file = f"sound/{songs[index - 1]}.mp3"
        currentSong = index
        mixer.music.unload()
        mixer.music.load(filename=file)
        mixer.music.play(loops=-1)

    if isPaused:
        mixer.music.pause()
