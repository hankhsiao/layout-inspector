const INTERESTING_STYLES = [
  'border',
  'display',
  'float',
  'height',
  'lineHeight',
  'margin',
  'maxWidth',
  'minWidth',
  'padding',
  'position',
  'width'
];

const ORIGIN_RECT = {
  bottom: 0,
  height: 0,
  left: 0,
  right: 0,
  top: 0,
  width: 0
};

function createElement(name, className, parent) {
  parent = parent || document.body;
  let elm = document.createElement(name);
  if (className) {
    elm.classList.add(className);
  }
  parent.appendChild(elm);
  return elm;
}

/**
 * Check if v between start and end
 */
function between(v, start, end) {
  return v < start ^ v < end;
}

function xIntersect(r1, r2) {
  if (xContains(r1, r2) || xContains(r2, r1) || xCrosses(r1, r2)) {
    return {
      left: Math.max(r1.left, r2.left),
      right: Math.min(r1.right, r2.right)
    };
  }
  return null;
}

function yIntersect(r1, r2) {
  if (yContains(r1, r2) || yContains(r2, r1) || yCrosses(r1, r2)) {
    return {
      top: Math.max(r1.top, r2.top),
      bottom: Math.min(r1.bottom, r2.bottom)
    };
  }
  return null;
}

/**
 * Check if r1 contains r2 in terms of their projections onto an x-axis
 */
function xContains(r1, r2) {
  return between(r2.left, r1.left, r1.right) &&
    between(r2.right, r1.left, r1.right);
}
/**
 * Check if r1 contains r2 in terms of their projections onto an y-axis
 */
function yContains(r1, r2) {
  return between(r2.top, r1.top, r1.bottom) &&
    between(r2.bottom, r1.top, r1.bottom);
}
/**
 * Check if r1 contains r2
 */
function contains(r1, r2) {
  return xContains(r1, r2) && yContains(r1, r2);
}

/**
 * Check if r1 crosses r2 in terms of their projections onto an x-axis
 */
function xCrosses(r1, r2) {
  return between(r2.left, r1.left, r1.right) &&
    !between(r2.right, r1.left, r1.right) ||
    !between(r2.left, r1.left, r1.right) &&
    between(r2.right, r1.left, r1.right)
}
/**
 * Check if r1 crosses r2 in terms of their projections onto an y-axis
 */
function yCrosses(r1, r2) {
  return between(r2.top, r1.top, r1.bottom) &&
    !between(r2.bottom, r1.top, r1.bottom) ||
    !between(r2.top, r1.top, r1.bottom) &&
    between(r2.bottom, r1.top, r1.bottom)
}
/**
 * Check if r1 crosses r2
 */
function crosses(r1, r2) {
  return (xCrosses(r1, r2) || xContains(r1, r2)) &&
    (yCrosses(r1, r2) || yContains(r1, r2));
}

/**
 * Return the shortest line between rect1 and rect2 along with x-axis
 */
function xShortest(r1, r2) {
  if (crosses(r1, r2)) {
    return null;
  }
  const intersect = yIntersect(r1, r2);
  if (!intersect) {
    return null;
  }
  return Object.assign({
    left: Math.min(r1.right, r2.right),
    right: Math.max(r1.left, r2.left)
  }, intersect);
}
/**
 * Return the shortest line between rect1 and rect2 along with y-axis
 */
function yShortest(r1, r2) {
  if (crosses(r1, r2)) {
    return null;
  }
  const intersect = xIntersect(r1, r2);
  if (!intersect) {
    return null;
  }
  return Object.assign({
    top: Math.min(r1.bottom, r2.bottom),
    bottom: Math.max(r1.top, r2.top),
  }, intersect);
}

class SelectingBox {
  constructor(env) {
    this.env = env;
    this.box = createElement('DIV');
    this.target = null;
    this.borders = []; //[top, right, bottom, left]
    for (let i = 0; i < 4; i++) {
      this.borders[i] = createElement('DIV', 'ruler-selecting-box', this.box);
    }
    this.infoBox = createElement('DIV', 'ruler-info-box', this.box);
    this.distances = []; //[top, right, bottom, left]
    for (let i = 0; i < 4; i++) {
      this.distances[i] = createElement('DIV', 'ruler-distance-box', this.box);
    }
  }

  getRectOnDocument(target) {
    target = target || this.target;
    if (!target) {
      return ORIGIN_RECT;
    }
    const rect = target.getBoundingClientRect();
    const {top, left} = this.env.scroll;
    return {
      bottom: rect.bottom + top,
      height: rect.height,
      left: rect.left + left,
      right: rect.right + left,
      top: rect.top + top,
      width: rect.width
    };
  }

  isHolding() {
    return !!this.target;
  }

  hold(target) {
    if (!target) {
      this.reset();
    }
    this.target = target;
    this.move(this.getRectOnDocument(target));
  }

  reset() {
    this.target = null;
    this.move(ORIGIN_RECT);
    for (let i = 0; i < 4; i++) {
      this.distances[i].style.top = 0;
      this.distances[i].style.left = 0;
      this.distances[i].style.width = 0;
      this.distances[i].style.height = 0;
    }
    this.infoBox.innerHTML = '';
  }

  showInfo() {
    if (!this.target) {
      return;
    }
    const style = window.getComputedStyle(this.target);
    const myStyle = INTERESTING_STYLES.reduce((accu, curr) => {
      accu[curr] = style[curr];
      return accu;
    }, {});

    const rect = this.getRectOnDocument();
    this.infoBox.innerHTML =
      `<div>width: ${rect.width}</div>` +
      `<div>height: ${rect.height}</div>` +
      Object.keys(myStyle).map(key => {
        return `<div>${key}: ${myStyle[key]}</div>`;
      }).join('');
  }

  move(rect) {
    rect = rect || ORIGIN_RECT;
    for (let i = 0; i < 4; i++) {
      this.borders[i].style.top = rect.top + 'px';
      this.borders[i].style.left = rect.left + 'px';
      if (i % 2 === 0) {
        this.borders[i].style.width = rect.width + 'px';
      } else {
        this.borders[i].style.height = rect.height + 'px';
      }
    }
    this.borders[1].style.left = (rect.left + rect.width) + 'px';
    this.borders[2].style.top = (rect.top + rect.height) + 'px';
    // infobox
    this.infoBox.style.top = rect.bottom + 'px';
    this.infoBox.style.left = rect.right + 'px';
  }

  showDistance(box) {
    let myRect = this.getRectOnDocument();
    let rect = box.getRectOnDocument();

    if (contains(myRect, rect) || contains(rect, myRect)) {
      if (contains(rect, myRect)) {
        let tmp = rect;
        rect = myRect;
        myRect = tmp;
      }
      const x = (rect.left + rect.right) / 2;
      const y = (rect.top + rect.bottom) / 2;

      this._connect(
        this.distances[0],
        {x: x, y: myRect.top},
        {x: x, y: rect.top}
      );
      this._connect(
        this.distances[2],
        {x: x, y: myRect.bottom},
        {x: x, y: rect.bottom}
      );

      this._connect(
        this.distances[1],
        {x: myRect.right, y: y},
        {x: rect.right, y: y}
      );
      this._connect(
        this.distances[3],
        {x: myRect.left, y: y},
        {x: rect.left, y: y}
      );
    } else {
      const xline = xShortest(myRect, rect);
      const yline = yShortest(myRect, rect);

      if (yline) {
        const x = (yline.left + yline.right) / 2;
        this._connect(
          this.distances[0],
          {x: x, y: yline.top},
          {x: x, y: yline.bottom}
        );
      }

      if (xline) {
        const y = (xline.top + xline.bottom) / 2;
        this._connect(
          this.distances[1],
          {x: xline.left, y: y},
          {x: xline.right, y: y}
        );
      }
    }
  }

  _connect(distance, p1, p2) {
    if (p1.x === p2.x && p1.y === p2.y) {
      return;
    }
    if (p1.x === p2.x) {
      const length = Math.abs(p1.y - p2.y);
      distance.innerHTML = `<span>${length}px</span>`;
      distance.style.top = Math.min(p1.y, p2.y) + 'px';
      distance.style.left = p1.x + 'px';
      distance.style.height = length + 'px';
      distance.style.width = '0px';
    } else if (p1.y === p2.y) {
      const length = Math.abs(p1.x - p2.x);
      distance.innerHTML = `<span>${length}px<span>`;
      distance.style.top = p1.y + 'px';
      distance.style.left = Math.min(p1.x, p2.x) + 'px';
      distance.style.height = '0px';
      distance.style.width = length + 'px';
    }
  }

  contains(target) {
    return this.target === target || this.box.contains(target);
  }
}

class Env {
  constructor() {
    this.isAttached = false;
    this.scroll = {top: 0, left: 0};
    this.currIdx = 0;
    this.selectingBoxes = [
      new SelectingBox(this),
      new SelectingBox(this),
      new SelectingBox(this)
    ];

    this._switchBox = this._switchBox.bind(this);
    this._updateBoxPosition = this._updateBoxPosition.bind(this);
    this._updateScroll = this._updateScroll.bind(this);
  }

  toggle() {
    if (!this.isAttached) {
      return this.attach();
    }
    return this.detach();
  }

  attach() {
    this.isAttached = true;
    this._updateScroll();
    document.addEventListener('click', this._switchBox, true);
    document.addEventListener('mousemove', this._updateBoxPosition);
    document.addEventListener('scroll', this._updateScroll);
    return this.isAttached;
  }

  detach() {
    this.isAttached = false;
    document.removeEventListener('click', this._switchBox, true);
    document.removeEventListener('mousemove', this._updateBoxPosition);
    document.removeEventListener('scroll', this._updateScroll);
    this.selectingBoxes.forEach(box => {
      box.reset();
    });
    return this.isAttached;
  }

  _switchBox(e) {
    // check if any box is selected, if not, don't switch
    if (!this.selectingBoxes[this.currIdx].isHolding()) {
      return;
    }

    if (this.currIdx === 0) {
      this.selectingBoxes[0].showInfo();
    } else if (this.currIdx === 1) {
      // get distance between the first 2
      this.selectingBoxes[0].showDistance(this.selectingBoxes[1]);
    }

    this.currIdx++;
    if (this.currIdx >= this.selectingBoxes.length) {
      // reset all
      for (let i = 0, l = this.selectingBoxes.length; i < l; i++) {
        this.selectingBoxes[i].reset();
      }
      this.currIdx = 0;
    }
    e.preventDefault();
    e.stopPropagation();
  }

  _updateBoxPosition(e) {
    let selectingBox = this.selectingBoxes[this.currIdx];
    if (
      !selectingBox.contains(e.target) &&
      !this.selectingBoxes[0].contains(e.target) &&
      !this.selectingBoxes[2].contains(e.target)
    ) {
      selectingBox.hold(e.target);
    }
  }

  _updateScroll() {
    const docEl = document.documentElement;
    const docBody = document.body;
    this.scroll.top = docBody.scrollTop + docEl.scrollTop;
    this.scroll.left = docBody.scrollLeft + docEl.scrollLeft;
  }
}

let env;
chrome.runtime.onMessage.addListener(function(request, sender, callback) {
  switch(request.action) {
    case 'echo':
      callback({echo: 'echo'});
      break;
    case 'toggle':
      if (!env) {
        env = new Env();
      }
      callback({toggle: env.toggle()});
      break;
  }
});
