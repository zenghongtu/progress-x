import { ipcMain, Tray, nativeImage } from 'electron';
import Positioner from 'electron-positioner';

let progressTray;
let positioner;

const init = win => {
  positioner = new Positioner(win);

  const setProgressTray = img => {
    if (!progressTray) {
      progressTray = new Tray(img);
      progressTray.setHighlightMode('never');
      progressTray.addListener('click', (event, bounds) => {
        win.show();
        positioner.move('trayCenter', bounds);
      });
    } else {
      progressTray.setImage(img);
    }
  };

  global.setProgressTrayWithDataURL = dataURL => {
    const img = nativeImage.createFromDataURL(dataURL).resize({ height: 15 });
    setProgressTray(img);
  };
};

export default init;
