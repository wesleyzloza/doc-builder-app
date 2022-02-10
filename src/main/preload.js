const { ipcRenderer } = require('electron')

/*
window.addEventListener("error", (event) => {
    ipcRenderer.invoke('message-box', {
        type: "error",
        title: "Internal Error",
        message: `An unknown internal error occurred. If this issue persists please contact a system administrator. \n\n${event.error?.stack}`
    })
})
*/

window.addEventListener("unhandledrejection", (event) => { 
    ipcRenderer.invoke('message-box', {
        type: "error",
        title: "Internal Error",
        message: `Unhandled promise rejection; something internally is not working properly. Please contact a system administrator. \n\nReason: ${event.reason}`
    })
})
