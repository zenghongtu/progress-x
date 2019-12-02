import './style.css';
import html2canvas from 'html2canvas';
import { ipcRenderer, remote } from 'electron';
import moment from 'moment';
import pkg from '../../package.json';

let activeProgressUnit = localStorage.activeProgressUnit || 'day';
let isDarkMode = remote.systemPreferences.isDarkMode();

const appEl = document.getElementById('app');

const updateTrayByCanvasWithElement = ele => {
  return new Promise((resolve, reject) => {
    const backgroundColor = isDarkMode ? '#000' : null;

    html2canvas(ele, { backgroundColor })
      .then(canvas => {
        const dataUrl = canvas.toDataURL();
        // TODO pref
        ipcRenderer.send('set-progress-tray', dataUrl);
      })
      .catch(e => {
        // TODO
        console.log('e: ', e);
      })
      .finally(() => {
        resolve();
      });
  });
};

const addProgressMenu = () => {
  const getProgressPercentage = (unit, duration) => {
    const start = moment().startOf(unit);
    const pastMins = moment.duration(moment().diff(start)).asSeconds();

    return Math.ceil((pastMins / duration) * 100);
  };

  const getHourPercentage = _ => {
    return getProgressPercentage('hour', 60 * 60);
  };

  const getDayPercentage = _ => {
    return getProgressPercentage('day', 24 * 60 * 60);
  };

  const getWeekPercentage = _ => {
    return getProgressPercentage('week', 7 * 24 * 60 * 60);
  };

  const getMonthPercentage = datetime => {
    return getProgressPercentage(
      'month',
      moment().daysInMonth() * 24 * 60 * 60
    );
  };

  const getYearPercentage = datetime => {
    return getProgressPercentage(
      'year',
      (365 + (moment().isLeapYear() ? 1 : 0)) * 24 * 60 * 60
    );
  };

  const getLifePercentage = datetime => {
    // TODO
    return 0;
  };

  const progressList = [
    {
      label: 'Hour',
      value: 'hour',
      func: getHourPercentage
    },
    {
      label: 'Day',
      value: 'day',
      func: getDayPercentage
    },
    {
      label: 'Week',
      value: 'week',
      func: getWeekPercentage
    },
    {
      label: 'Month',
      value: 'month',
      func: getMonthPercentage
    },
    {
      label: 'Year',
      value: 'year',
      func: getYearPercentage
    }
    // {
    //   label: 'Life',
    //   value: 'life',
    //   func: getLifePercentage
    // }
  ];

  const progressMenu = document.createElement('div');
  progressMenu.className = 'progress-menu';

  const render = activeValue => {
    progressMenu.innerHTML = progressList
      .map(item => {
        const { func, label, value } = item;
        const _percentage = func();
        return `
       <div class="progress-wrap">
          <div data-name="${value}" class="progress${
          activeValue === value ? ' active' : ''
        }">
            <span class="bar-wrap">
              <span class="bar" style="width:${_percentage}%"></span>
            </span>
            ${label}: ${_percentage}%
          </div>
       </div>
          `;
      })
      .join('');
  };

  const handleProgressMenuClick = async e => {
    const { target } = e;
    if (target && target.className === 'progress') {
      activeProgressUnit = localStorage.activeProgressUnit =
        target.dataset.name;
      await updateTrayByCanvasWithElement(target);
      render(activeProgressUnit);
    }
  };

  // TODO add remove
  progressMenu.addEventListener('click', handleProgressMenuClick);

  const updateTray = async (unit = activeProgressUnit) => {
    render(unit);
    const activeProgressEl = document.querySelector('.progress.active');
    await updateTrayByCanvasWithElement(activeProgressEl);
  };

  const initTray = async () => {
    appEl.appendChild(progressMenu);

    await updateTray();
  };

  initTray();

  const refreshProgress = async (unit = activeProgressUnit) => {
    await updateTray(unit);
  };

  return refreshProgress;
};

const addAppMenu = app => {
  const appMenu = document.createElement('div');

  const render = openAtLogin => {
    appMenu.innerHTML = `
    <div class="app-menu">
      <div class="app-menu-item ${
        openAtLogin ? 'active' : ''
      }" data-value="openAtLogin">
        Open At Login
      </div>  
      <div class="app-menu-item" data-value="feedback">
          Feedback
      </div>  
      <div class="app-menu-item" data-value="quit">
          Quit
      </div>  
    </div>
  `;
  };

  const handleAppMenuClick = e => {
    const { target } = e;
    if (target) {
      const actionValue = target.dataset.value;
      if (actionValue === 'openAtLogin') {
        const { openAtLogin } = remote.app.getLoginItemSettings();
        const cur = !openAtLogin;
        remote.app.setLoginItemSettings({ openAtLogin: cur });
        render(cur);
      } else if (actionValue === 'quit') {
        remote.app.quit();
      } else if (actionValue === 'feedback') {
        remote.shell.openExternal(pkg.homepage);
      }
    }
  };

  appMenu.addEventListener('click', handleAppMenuClick);
  app.appendChild(appMenu);
  const { openAtLogin } = remote.app.getLoginItemSettings();
  render(openAtLogin);
};

let timer;
let refreshProgress;

const renderApp = () => {
  appEl.innerHTML = '';
  refreshProgress = addProgressMenu(appEl);
  timer && clearInterval(timer);
  timer = setInterval(() => {
    refreshProgress();
  }, 1000 * 60);
  addAppMenu(appEl);
};

const setTheme = () => {
  isDarkMode = remote.systemPreferences.isDarkMode();
  const theme = isDarkMode ? 'dark' : '';
  document.documentElement.setAttribute('data-theme', theme);
  refreshProgress && refreshProgress();
};

remote.systemPreferences.subscribeNotification(
  'AppleInterfaceThemeChangedNotification',
  setTheme
);

setTheme();
renderApp();
