(function (root, interact) {
    function Interactable(options) {
        this.numberX = options.numberX;
        this.numberY = options.numberY;
        this.pixelX = options.pixelX;
        this.pixelY = options.pixelY;
        this.canvasClassName = options.canvasClassName || 'interactable_canvas';
        this.appClassName = options.appClassName || 'interactable_app';
    }

    // 初始化画布
    Interactable.prototype.initCanvas = function (domSelector) {
        var containerDom = document.querySelector(domSelector);
        var conW = containerDom.clientWidth;
        var conH = containerDom.clientHeight;
        var canvasW, canvasH;
        console.log(this)
        var ratio = (this.numberX * this.pixelX) / (this.numberY * this.pixelY);
        if (ratio > conW / conH) {
            canvasW = conW - 10;
            canvasH = canvasW / ratio;
        } else {
            canvasH = conH - 10;
            canvasW = canvasH * ratio;
        }

        // 添加画布
        containerDom.innerHTML = '<div class="' + this.canvasClassName + '"></div>';
        this.canvasDom = containerDom.querySelector('.' + this.canvasClassName);

        // 保存比例
        this.factor = canvasW / (this.numberX * this.pixelX);

        // 根据屏幕信息和容器信息计算画布大小
        this.canvasDom.style.width = canvasW + 'px';
        this.canvasDom.style.height = canvasH + 'px';

        // 添加虚线框
        var tds = '';
        var trs = '';
        for (var i = 0; i < this.numberX; i++) {
            tds += '<td style="width: ' + (1 / this.numberX) + '%"></td>';
        }
        for (var i = 0; i < this.numberY; i++) {
            trs += '<tr>' + tds + '</tr>';
        }
        this.canvasDom.innerHTML = '<table class="interactable_canvas-background">' + trs + '</table>';

        return this;
    }

    /**
     * 将大屏坐标转化为本地浏览器坐标
     * @param screenCorObj
     * @returns {{left: (string|*), top: (string|*), width: (string|*), height: (string|*)}}
     */
    Interactable.prototype.toBrowserCor = function (screenCorObj) {
        var l = screenCorObj.l;
        var r = screenCorObj.r;
        var b = screenCorObj.b;
        var t = screenCorObj.t;
        var left, top, width, height;
        var screenW = this.numberX * this.pixelX;
        var screenH = this.numberY * this.pixelY;
        var canvasW = this.canvasDom.clientWidth;
        var canvasH = this.canvasDom.clientHeight;

        left = l / screenW * canvasW + 'px';
        top = (screenH - t) / screenH * canvasH + 'px';
        width = (r - l) / screenW * canvasW + 'px';
        height = (t - b) / screenH * canvasH + 'px';
        return {
            left: left,
            top: top,
            width: width,
            height: height
        };
    }
    /**
     * 将本地浏览器坐标转化为大屏坐标
     * @param browserCorObj
     * @returns {{l: number, r: number, b: number, t: number}}
     */
    Interactable.prototype.toScreenCor = function (browserCorObj) {
        var left = parseFloat(browserCorObj.left, 10);
        var top = parseFloat(browserCorObj.top, 10);
        var width = parseFloat(browserCorObj.width, 10);
        var height = parseFloat(browserCorObj.height, 10);

        var l = left / this.factor;
        var r = (left + width) / this.factor;
        var b = this.numberY * this.pixelY - (top + height) / this.factor;
        var t = this.numberY * this.pixelY - top / this.factor;

        return {
            l: l,
            r: r,
            b: b,
            t: t
        };
    }

    // 初始化Apps
    Interactable.prototype.initApps = function (appsArr) {
        var appClassName = this.appClassName;
        var cor;
        var appsHtml = '';
        var that = this;
        appsArr.forEach(function (app, index) {
            cor = that.toBrowserCor({
                l: app.cor[0],
                r: app.cor[1],
                b: app.cor[2],
                t: app.cor[3]
            });
            appsHtml += `<div id="${app.id}" data-id="${app.id}" class="${appClassName}" style="width: ${cor.width}; height: ${cor.height}; left: ${cor.left}; top: ${cor.top}">
                    ${app.title}
                </div>`
        });

        // 添加Apps
        this.canvasDom.innerHTML += appsHtml;
        return this;
    }

    // 事件绑定
    Interactable.prototype.bindEventCallback = function (callbackObj) {
        var that = this;

        interact('.' + this.appClassName)
            .draggable({
                // 是否允许惯性移动
                inertia: false,
                // 限制元素在其父区域之内
                restrict: {
                    restriction: "parent",
                    endOnly: true,
                    elementRect: {
                        top: 0,
                        left: 0,
                        bottom: 1,
                        right: 1
                    }
                }
            })
            //拖动效果事件处理
            .on('dragmove', function (event) {
                var el = event.target;
                el.style.left = parseInt(el.style.left, 10) + event.dx + 'px';
                el.style.top = parseInt(el.style.top, 10) + event.dy + 'px';

                el.setAttribute('data-max', 'no');
            })
            //拖动结束事件处理
            .on('dragend', function (event) {
                callbackObj.dragend && callbackObj.dragend(event);
            })
            //边缘拖动大小效果
            .resizable({
                preserveAspectRatio: false,
                edges: {
                    left: true,
                    right: true,
                    bottom: true,
                    top: true
                },
                invert: 'none'
            })
            .on('resizemove', function (event) {
                var el = event.target;

                // update the element's style
                if (event.rect.width >= 50) el.style.width = event.rect.width + 'px';
                if (event.rect.height >= 50) el.style.height = event.rect.height + 'px';

                // translate when resizing from top or left edges
                el.style.left = parseInt(el.style.left, 10) + event.deltaRect.left + 'px';
                el.style.top = parseInt(el.style.top, 10) + event.deltaRect.top + 'px';

                el.setAttribute('data-max', 'no');
            })
            .on('resizeend', function (event) {
                callbackObj.resizeend && callbackObj.resizeend(event);
            })
            //双指控制效果
            .gesturable({
                onstart: function (event) {
                },
                onmove: function (event) {
                    var el = event.target;
                    var scale = 1 * (1 + event.ds);

                    var nextWidth = parseInt(el.style.width, 10) * scale;
                    var nextHeight = parseInt(el.style.height, 10) * scale;
                    var nextTop = parseInt(el.style.top, 10) * -scale;
                    var nextLeft = parseInt(el.style.left, 10) * -scale;

                    if (nextWidth < 50 || nextHeight < 50) return;

                    el.style.width = nextWidth + 'px';
                    el.style.height = nextHeight + 'px';
                    el.style.top = nextTop + 'px';
                    el.style.left = nextLeft + 'px';

                    // el.textContent = Math.round(parseInt(el.style.width, 10)) + '×' + Math.round(parseInt(el.style.height, 10));
                },
                onend: function (event) {
                    callbackObj.gesturableend && callbackObj.gesturableend(event);
                }
            })
            //触摸一下事件处理
            .on('tap', function (event) {
                var el = event.target;
                Array.prototype.filter.call(el.parentNode.children, function (child) {
                    if (child !== el) {
                        child.classList.remove('interactable_highlight');
                    } else {
                        child.classList.add('interactable_highlight');
                    }
                });
                callbackObj.tap && callbackObj.tap(event);
                event.preventDefault();
            })
            //触摸两下事件处理
            .on('doubletap', function (event) {
                var el = event.target;
                var isMax = el.getAttribute('data-max');
                if (isMax === 'yes') {
                    el.style.cssText = el.getAttribute('data-beforecss');
                    el.setAttribute('data-beforecss', el.style.cssText);
                    el.setAttribute('data-max', 'no');
                } else {
                    el.setAttribute('data-beforecss', el.style.cssText);
                    el.style.cssText = 'width: ' + that.canvasDom.style.width + '; height: ' + that.canvasDom.style.height + '; left: 0; top: 0';
                    el.setAttribute('data-max', 'yes');
                }
                callbackObj.doubletap && callbackObj.doubletap(event);
                event.preventDefault();
            })
            //长按事件处理
            .on('hold', function (event) {
                // var el = event.target;
                // el.parentNode.removeChild(el);
                callbackObj.hold && callbackObj.hold(event);
            });

        return this;
    }

    // 全局化
    root.Interactable = Interactable;
}(this, interact));
