function initSnapShot(snapArea) {
  snapArea && snapArea.remove();

  snapArea = document.createElement("div");
  const snapRect = snapArea.cloneNode();

  snapArea.classList.add("snap-area");
  snapRect.classList.add("snap-rect");
  
  const docElem = document.documentElement;
  const overfow = docElem.style.overflow;
  docElem.style.overflow = "hidden";

  // Style snapArea
  Object.assign(snapArea.style, {
    position: "fixed",
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
    cursor: "crosshair",
    zIndex: 100000
  });

  // Style snapRect
  Object.assign(snapRect.style, {
    position: "absolute",
    backgroundColor: "#bbb8b863",
    border: "1px solid #bbb8b863"
  });

  snapArea.appendChild(snapRect);
  document.body.appendChild(snapArea);

  function mouseDownHandler(e) {
    // Trac current mouse position
    let x = e.clientX;
    let y = e.clientY;

    // Set snapRect position
    Object.assign(snapRect.style, {
      top: `${y}px`,
      left: `${x}px`
    });

    function mouseMoveHandler(e) {
      e.preventDefault();
      let dx = e.clientX - x;
      let dy = e.clientY - y;

      snapRect.style.marginLeft = `${dx < 0 ? dx : 0}px`;
      snapRect.style.marginTop  = `${dy < 0 ? dy : 0}px`;

      // Set width and height in snapRect
      Object.assign(snapRect.style, {
        width: `${Math.abs(dx)}px`,
        height: `${Math.abs(dy)}px`
      });
    }

    function mouseUpHandler() {
      snapArea.removeEventListener("mousemove", mouseMoveHandler);
      snapArea.removeEventListener("mouseup", mouseUpHandler);

      const gbrect = snapRect.getBoundingClientRect();
      docElem.style.overflow = overfow; // Set initial value
      snapArea.remove();

      // Set scroll values in x and y of gbrect
      gbrect.x += window.scrollX;
      gbrect.y += window.scrollY;

      // Do not capture snap, If width and height do not exceed 20x10
      if (!(gbrect.width > 20 && gbrect.height > 10)) return;
      CaptureSnapShot(gbrect);
    }

    snapArea.addEventListener("mousemove", mouseMoveHandler);
    snapArea.addEventListener("mouseup", mouseUpHandler);
  }

  snapArea.addEventListener("mousedown", mouseDownHandler);
  document.addEventListener("visibilitychange", () => snapArea.remove());
}

function CaptureSnapShot({x, y, width, height}) {
  try {
    html2canvas(document.documentElement).then(canvas => {
      let ctx = canvas.getContext("2d");
      // Crop or Get image data of specific part
      let imageData = ctx.getImageData(x, y, width, height);

      // Creating a new canvas
      let newCanvas = document.createElement("canvas");
      let newCtx    = newCanvas.getContext("2d");

      newCanvas.height = height;
      newCanvas.width  = width;

      // Put cropped image data into newCtx
      newCtx.putImageData(imageData, 0, 0);

      // Snap Margin 5-5 pixels, left, right, top, bottom
      height += 10;
      width  += 10;

      // Mininum width, height of output window
      let minHeight = 180;
      let minWidth  = 650;

      // Maximum width, height of output window
      let maxHeight = window.outerHeight;
      let maxWidth  = window.innerWidth;
      
      // Current width and height should be less than maxWidth and maxHeight
      let curWidth  = width > maxWidth ? maxWidth : width;
      let curHeight = height > maxHeight ? maxHeight : height;

      // Current width and height should be greater than minWidth and minHeight
      curWidth  = curWidth < minWidth ? minWidth : curWidth;
      curHeight = curHeight < minHeight ? minHeight : curHeight;

      let left = (maxWidth - curWidth) / 2;
      let top  = (maxHeight - curHeight) / 2;

      // Open an output window
      let output = window.open('', '_blank', `width=${curWidth},height=${curHeight},top=${top},left=${left}`);

      // Creating a new image to show the output
      let image  = new Image();

      // Set canvas data url to image src
      image.src  = newCanvas.toDataURL();
      image.style.margin = "auto";
      image.draggable = false; // disabled draggable
      output.document.body.appendChild(image);

      // Set title of output window
      output.document.title = "Snap Tool";

      let favicoURL = chrome.runtime.getURL("icon/st-48x48.png");
      output.document.head.innerHTML += `<link rel="shortcut icon" href="${favicoURL}" type="image/x-icon">`;

      Object.assign(output.document.body.style, {
        display: "flex",
        margin: 0,
        backgroundColor: "#7f7f7f"
      });
    });

    const sound = new Audio(chrome.runtime.getURL("sound/capture.mp3"));
    sound.play();
  } catch(e) {}
}

// Create a fake gbrect
const gbrect = {x: 0, y: 0};

// Snap features
const features = {
  specSnap: initSnapShot,
  fscrSnap: () => {
    gbrect.height = window.innerHeight;
    gbrect.width = window.innerWidth;
    CaptureSnapShot(gbrect);
  },
  fpgSnap: () => {
    const docElem = document.documentElement;
    gbrect.width = docElem.scrollWidth;
    gbrect.height = docElem.scrollHeight;
    CaptureSnapShot(gbrect);
  }
};

window.addEventListener("keydown", ({ctrlKey, key}) => {
  // Ctrl + q to Capture specific part
  // Ctrl + m to Capture 1 screen
  // Ctrl + b to Capture full page
  if (ctrlKey && (key === "q" || key === "m" || key === "b")) {
    const src = {q: "specSnap", m: "fscrSnap", b: "fpgSnap"};
    features[src[key]]();
  }
});

// Recieve menuItemId from backgorund.js
window.addEventListener("message", ({data}) => {
  features[data.id]();
});