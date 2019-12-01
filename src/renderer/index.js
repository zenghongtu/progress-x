import './style.css';
import html2canvas from 'html2canvas';
import { ipcRenderer } from 'electron';
import moment from 'moment';

const updateTrayByElement = ele => {
  return new Promise((resolve, reject) => {
    html2canvas(ele)
      .then(canvas => {
        const dataUrl = canvas.toDataURL();
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

  const app = document.getElementById('app');
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

  app.appendChild(progressMenu);

  const defaultValue = 'day';
  render(defaultValue);

  const handleProgressMenuClick = async e => {
    const { target } = e;
    if (target && target.className === 'progress') {
      await updateTrayByElement(target);
      render(target.dataset.name);
    }
  };

  progressMenu.addEventListener('click', handleProgressMenuClick);
};

const addAppMenu = app => {
  const appMenu = document.createElement('div');
  appMenu.innerHTML = `
  <div class="app-menu">
    <div class="app-menu-item" data-value="feedback">
        Feedback
    </div>  
    <div class="app-menu-item" data-value="quit">
        Quit
    </div>  
  </div>
`;

  const handleAppMenuClick = e => {
    if (e.target) {
      const actionValue = e.target.dataset.value;
      console.log(actionValue);
    }
  };

  appMenu.addEventListener('click', handleAppMenuClick);
  app.appendChild(appMenu);
};

const app = document.getElementById('app');
addProgressMenu(app);
addAppMenu(app);
