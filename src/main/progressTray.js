import { ipcMain, Tray, nativeImage } from 'electron';
import Positioner from 'electron-positioner';

let progressTray;
let positioner;

const init = win => {
  positioner = new Positioner(win);
  console.log('positioner: ', positioner);

  const setProgressTray = img => {
    if (!progressTray) {
      progressTray = new Tray(img);
    } else {
      progressTray.setImage(img);
    }
  };

  ipcMain.on('set-progress-tray', (event, dataURL) => {
    const img = nativeImage.createFromDataURL(dataURL);
    setProgressTray(img);
  });
};

export default init;
