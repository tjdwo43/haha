const electron = require('electron')
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow
const Tray = electron.Tray
const Menu = electron.Menu

const path = require('path')
const url = require('url')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow, tray, splash = null

var windowList = readList('windowList')
var shorcutList = readList('shorcutList')


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {

  console.log('window-all-closed')
  
  if (readData('myInfo')) {
    writeData('windowList', windowList)
    writeData('shorcutList', shorcutList)
  }

  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

electron.ipcMain.on('login', function(e, menu1, menu2, menu3, menu4) {
    
  tray = new Tray('build/icon.ico')
  
  const contextMenu = Menu.buildFromTemplate([
    {label: menu1, type: 'normal', click() { mainWindow.show() } },
    {label: menu2, type: 'normal', click() { mainWindow.hide() } },
    {label: menu3, type: 'normal', click() { mainWindow.webContents.send('logout') } },
    {type: 'separator'},
    {label: menu4, type: 'normal', click() { mainWindow.webContents.send('exit') } }
  ])
  tray.setToolTip('OfficeHub Talk')
  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
  })

  for (i in shorcutList) startShorcut(shorcutList[i])

})

electron.ipcMain.on('logout', function(e) {

  if (tray) {
    tray.destroy()
    tray = null
  }
  var windows = BrowserWindow.getAllWindows()
  for (i in windows) {
    if (windows[i] == mainWindow) continue;
    console.log(windows[i].webContents.history[0])
    var url = windows[i].webContents.history[0]
    if (url && url.split('=')[1]) windows[i].close()
  }

  mainWindow.show()
})

electron.ipcMain.on('makeChatRequest', function(e, user_id) {

  mainWindow.webContents.send('makeChatRequest', user_id)
})

electron.ipcMain.on('groupChatRequest', function(e, particitants) {

  mainWindow.webContents.send('groupChatRequest', particitants)
})

electron.ipcMain.on('message', function(e, title, content, chat_id, noti, exit) {
  console.log('message(' + chat_id + ')')
  if (chat_id > 0) {
    var win = findWindow(chat_id)
    if (win && win.isVisible()) {
      
      win.webContents.send('message')

      if (win.isFocused() == false) {
        win.once('focus', () => win.flashFrame(false))
        win.flashFrame(true);
      }
      return;
    }
    if (exit == true) return

    var short = findShorcut(chat_id)
    if (short) short.webContents.send('count')
  }

  if (noti == true) {
    tray.displayBalloon({ icon: 'build/icon.png', title: title + '\t', content: content })
  }

  mainWindow.webContents.send('count', chat_id)
})

electron.ipcMain.on('reply', function(e, chat_id) {
  console.log('reply(' + chat_id + ')')
  if (chat_id > 0) {
    var win = findWindow(chat_id)
    if (win)
      win.webContents.send('reply')
    else
      mainWindow.webContents.send('reply', chat_id)
  }
})

electron.ipcMain.on('start', function(e, chat_id){
  console.log('start(' + chat_id + ')')
  var short = findShorcut(chat_id)
  var win = findWindow(chat_id)
  if (win) {
    win.show()
    win.webContents.send('message')
    if (short) short.webContents.send('started')
  }
  else {
    splash.show()
    var option = findOption(windowList, chat_id)
    if (option == null) option = defaultOption(chat_id)
    
    if (option.x > 1920) option.x = 0;

    let win = new BrowserWindow( option )
    win.loadURL(`file://${__dirname}/chat.html?id=` + chat_id)
    win.once('ready-to-show', () => {
      splash.hide()
      win.show()
      if (short) short.webContents.send('started')
    })
    win.on('close', () => {
      if (tray) splash.hide()
    })
    win.on('move', () => {
      updatePosition(win, windowList, chat_id)
    })
    win.on('resize', () => {
      updateSize(win, windowList, chat_id)
    })
    if (option.frame) win.webContents.openDevTools()
  }

  mainWindow.webContents.send('started', chat_id)
})

electron.ipcMain.on('close', function(e, chat_id){
  console.log('close(' + chat_id + ')')
  if (chat_id == 0) {
    mainWindow.hide()
    return;
  }
  var win = findWindow(chat_id)
  if (win) {
    win.hide()
    mainWindow.webContents.send('closed', chat_id)
    updatePosition(win, windowList, chat_id)
    updateSize(win, windowList, chat_id)
    writeData('windowList', windowList)
  }
})

electron.ipcMain.on('exit', function(e, chat_id){
  console.log('exit(' + chat_id + ')')
  mainWindow.webContents.send('closed', chat_id)
  removeOption(chat_id)
})

electron.ipcMain.on('shortcut', function(e, chat_id){
  console.log('shortcut(' + chat_id + ')')
  var win = findShorcut(chat_id)
  if (win)
    win.show();
  else {
    var option = findOption(shorcutList, chat_id)
    if (option == null) option = defaultShortcut(chat_id)
    startShorcut(option)
  }
})

electron.ipcMain.on('goHomeWindow', function () {
  
  mainWindow.hide()

  let win = new BrowserWindow({"width":390,"height":600,"frame":false,"x":1182,"y":391})
  
  win.on('closed', () => {
      win = null
  })

  win.loadURL(`file://${__dirname}/nHome.html`)
  win.webContents.openDevTools()

})

electron.ipcMain.on('modal', function () {
  let child = new BrowserWindow({ parent: mainWindow, modal: true, show: false })

  child.loadURL(`file://${__dirname}/app/index.html`)

  child.once('ready-to-show', () => {
    child.show()
  })

})


function createWindow () {

  splash = new BrowserWindow( { width: 200, height: 240, frame: false, lwaysOnTop: true, skipTaskbar: true, transparent: true })
  splash.loadURL(`file://${__dirname}/splash.html`)

  var option = findOption(windowList, 0);

  if (option == null) option = defaultOption(0)
  
  if (option.x > 1920) option.x = 0;

  // Create the browser window.
  mainWindow = new BrowserWindow( option )
  mainWindow.once('ready-to-show', () => {
    splash.hide()
    mainWindow.show()
  })

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'login.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Call it before 'did-finish-load' with mainWindow a reference to your window
  const { setup: setupPushReceiver } = require('electron-push-receiver');
  setupPushReceiver(mainWindow.webContents);

  // Open the DevTools.
  mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {

    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null

    if (tray) {
      tray.destroy()
      tray = null
    }
    var windows = BrowserWindow.getAllWindows()
    for (i in windows) windows[i].close()
  })

  mainWindow.on('move', function () {
    updatePosition(mainWindow, windowList, 0)
  })

  mainWindow.on('resize', function () {
    updateSize(mainWindow, windowList, 0)
  })
}

function startShorcut(option) {
  splash.show()
  let win = new BrowserWindow( option )
  var chat_id = option.id
  win.loadURL(`file://${__dirname}/shortcut.html?id=` + chat_id)
  win.once('ready-to-show', () => {
    splash.hide()
    win.show()
  })
  win.on('move', () => {
    updatePosition(win, shorcutList, chat_id)
  })
  win.on('resize', () => {
    updateSize(win, shorcutList, chat_id)
  })
  win.on('maximize', (e) => {
    win.unmaximize()
    win.blur()
    win.webContents.send('start')
  })
  win.on('close', () => {
    if (tray) removeShortcut(chat_id)
  })
}

function findOption(list, id) {
  for (i in list) {
    if (list[i].id == id) return list[i]
  }
  return null
}

function defaultOption(id) {
  var option = { id: id, width: 320, height: 500, show: false, frame: false, backgroundColor: '#fff' }
  windowList.push(option)
  writeData('windowList', windowList)
  return option
}

function removeOption(id) {
  for (i in windowList) {
      if (windowList[i].id == id) {
        windowList.splice(i, 1);
        writeData('windowList', windowList)
        return true;
      }
  }
  return false;
}

function defaultShortcut(id) {
  var option = { id: id, width: 160, height: 20, minWidth: 100, maxWidth: 500, minHeight: 20, maxHeight: 20, show:false, frame: false, skipTaskbar: true, alwaysOnTop: true }
  shorcutList.push(option)
  writeData('shorcutList', shorcutList)
  return option
}

function removeShortcut(id) {
  for (i in shorcutList) {
      if (shorcutList[i].id == id) {
        shorcutList.splice(i, 1);
        writeData('shorcutList', shorcutList)
        console.log(shorcutList)
        return true;
      }
  }
  return false;
}

function findWindow(chat_id) {
  var windows = BrowserWindow.getAllWindows()
  for (i in windows) {
    var win = windows[i]
    if (win == splash) continue
    if (win == mainWindow) continue
    if (win.isAlwaysOnTop() == true) continue
    if (win.webContents.history.length == 0) continue
    if (win.webContents.history[0].split('=')[1] == chat_id) {
      return win
    }
  }
  return null
}

function findShorcut(chat_id) {
  var windows = BrowserWindow.getAllWindows()
  for (i in windows) {
    var win = windows[i]
    if (win == splash) continue
    if (win == mainWindow) continue
    if (win.isAlwaysOnTop() == false) continue
    if (win.webContents.history.length == 0) continue
    if (win.webContents.history[0].split('=')[1] == chat_id) {
      return win
    }
  }
  return null
}

function updatePosition(window, list, id) {
  if (window == null || list == null) return false
  for (i in list) {
    if (list[i].id == id) {
      list[i].x = window.getPosition()[0]
      list[i].y = window.getPosition()[1]
      return true
    }
  }
  return false
}

function updateSize(window, list, id) {
  if (window == null || list == null) return false
  for (i in list) {
    if (list[i].id == id) {
      list[i].width = window.getSize()[0]
      list[i].height = window.getSize()[1]
      return true
    }
  }
  return false
}

function readData(filename) {
  const fs = require('fs');
  var path = 'data/' + filename + '.json';
  if (!fs.existsSync(path)) return null;
  var data = fs.readFileSync(path, 'utf8');
  return data ? JSON.parse(data) : null;
}

function readList(filename) {
var list = readData(filename);
if (list == null) list = [];
return list;
}

function writeData(filename, obj) {
  const fs = require('fs');
  var data = JSON.stringify(obj);
  if (data == null) return;
  var path = 'data/' + filename + '.json';
  try {
    fs.writeFileSync(path, data, 'utf8');
  }
  catch(e) {
    console.log(path);
  }
}