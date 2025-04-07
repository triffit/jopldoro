import { createSignal, createEffect } from 'solid-js';
import { Play, Pause, SkipForward, X, Pin } from 'lucide-solid';
import { Window } from '@tauri-apps/api/window';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import './App.css';

const WORK_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;

// Create audio element for the bell sound
const bellSound = new Audio('/src/assets/sounds/bell.mp3');
const startSound = new Audio('/src/assets/sounds/start.mp3');

export default function App() {
  const [time, setTime] = createSignal(WORK_TIME);
  const [running, setRunning] = createSignal(false);
  const [onBreak, setOnBreak] = createSignal(false);
  const [alwaysOnTop, setAlwaysOnTop] = createSignal(false);
  let timer;

  // Request notification permission when the app starts
  const requestNotificationPermission = async () => {
    try {
      let permissionGranted = await isPermissionGranted();
      if (!permissionGranted) {
        const permission = await requestPermission();
        console.log('Tauri notification permission:', permission);
      }
    } catch (err) {
      console.log('Error requesting Tauri notification permission:', err);
    }
  };

  // Call this when component mounts
  requestNotificationPermission();

  const showNotification = async (message) => {
    try {
      await sendNotification({
        title: 'JOPLdoro',
        body: message
      });
    } catch (err) {
      console.log('Error showing Tauri notification:', err);
    }
  };

  const formatTime = (t) => {
    const minutes = Math.floor(t / 60).toString().padStart(2, '0');
    const seconds = (t % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const playBellSound = () => {
    bellSound.currentTime = 0;
    bellSound.play().catch(err => console.log('Error playing bell sound:', err));
  };

  const playStartSound = () => {
    startSound.currentTime = 0;
    startSound.play().catch(err => console.log('Error playing start sound:', err));
  };

  const toggleAlwaysOnTop = async () => {
    const window = Window.getCurrent();
    const newState = !alwaysOnTop();
    await window.setAlwaysOnTop(newState);
    setAlwaysOnTop(newState);
  };

  createEffect(() => {
    if (running()) {
      timer = setInterval(() => {
        setTime((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onBreak() ? playBellSound() : playStartSound();
            if (onBreak()) {
              showNotification('Break is over! Back to work!');
              setOnBreak(false);
              setTime(WORK_TIME);
            } else {
              showNotification('Time is up! Take a 5-minute break.');
              setOnBreak(true);
              setTime(BREAK_TIME);
            }
            setRunning(false);
            return onBreak() ? BREAK_TIME : WORK_TIME;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }
  });

  const skipPeriod = () => {
    if (onBreak()) {
      setOnBreak(false);
      setTime(WORK_TIME);
    } else {
      setOnBreak(true);
      setTime(BREAK_TIME);
    }
    setRunning(false);
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  const closeApp = async () => {
    const window = Window.getCurrent();
    await window.close();
  };

  return (
    <div 
      class="flex flex-col items-center justify-center h-[40px] w-[180px] bg-transparent text-white font-mono select-none overflow-hidden p-0"
      data-tauri-drag-region
    >
      <div class="flex items-center justify-center gap-1 w-full bg-black px-1">
        <div
          class={`${alwaysOnTop() ? 'text-pink-400' : 'text-pink-600'} hover:text-pink-800 transition-all flex items-center justify-center cursor-pointer`}
          style="width: 20px; height: 40px;"
          onClick={toggleAlwaysOnTop}
        >
          <Pin size={20} strokeWidth={5} />
        </div>
        <div
          class="text-purple-600 hover:text-purple-800 transition-all flex items-center justify-center cursor-pointer"
          style="width: 20px; height: 40px;"
          onClick={() => setRunning(!running())}
        >
          {running() ? <Pause size={20} strokeWidth={5} /> : <Play size={20} strokeWidth={5} />}
        </div>
        <div class="text-xl font-bold text-purple-400 bg-gray-800 px-2 py-0.5 rounded shadow-lg text-center w-full max-w-[100px] cursor-move" data-tauri-drag-region>
          {formatTime(time())}
        </div>
        <div class="flex items-center gap-1">
          <div
            class="text-pink-600 hover:text-pink-800 transition-all flex items-center justify-center cursor-pointer"
            style="width: 20px; height: 40px;"
            onClick={skipPeriod}
          >
            <SkipForward size={20} strokeWidth={5} />
          </div>
          <div 
            class="text-purple-600 hover:text-purple-800 transition-all flex items-center justify-center cursor-pointer" 
            style="width: 20px; height: 40px;"
            onClick={closeApp}
          >
            <X size={24} strokeWidth={5} />
          </div>
        </div>
      </div>
    </div>
  );
}
