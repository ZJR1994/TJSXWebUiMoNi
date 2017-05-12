(function(root, interact) {
    function Interactable(options) {
        this.numberX = options.numberX;
        this.numberY = options.numberY;
        this.pixelX = options.pixelX;
        this.pixelY = options.pixelY;
        this.canvasClassName = options.canvasClassName || 'interactable_canvas';
        this.appClassName = options.appClassName || 'interactable_app';
    }

    // 初始化画布
    Interactable.prototype.initCanvas = function(domSelector) {
        var containerDom = document.querySelector(domSelector);

        // 添加画布
        containerDom.innerHTML = '<div class="' + this.canvasClassName + '"></div>';
        this.canvasDom = containerDom.querySelector('.' + this.canvasClassName);

        // TODO 跟据屏幕信息和容器信息计算画布大小
        this.canvasDom.style.width = '100%';
        this.canvasDom.style.height = '400px';

        return this;
    }

    // 初始化Apps
    Interactable.prototype.initApps = function(appsArr) {
        var appClassName = this.appClassName;
        var appsHtml = '';
        appsArr.forEach(function(app, index) {
            appsHtml += `<div class="${appClassName}" style="width: ${app.width}; height: ${app.height}; left: ${app.left}; top: ${app.top}">
                    ${app.title}
                </div>`
        });

        // 添加Apps
        this.canvasDom.innerHTML = appsHtml;
        return this;
    }

    // 事件绑定
    Interactable.prototype.bindEventCallback = function(callbackObj) {
        interact('.' + this.appClassName)
            .draggable({
                // enable inertial throwing
                inertia: false,
                // keep the element within the area of it's parent
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
            .on('dragmove', function(event) {
                var el = event.target;
                el.style.left = parseInt(el.style.left, 10) + event.dx + 'px';
                el.style.top = parseInt(el.style.top, 10) + event.dy + 'px';
            })
            .on('dragend', function(event) {
                callbackObj.dragend && callbackObj.dragend(event);
            })
            .resizable({
                preserveAspectRatio: false,
                edges: {
                    left: true,
                    right: true,
                    bottom: true,
                    top: true
                }
            })
            .on('resizemove', function(event) {
                var el = event.target;

                // update the element's style
                if (event.rect.width >= 100) target.style.width = event.rect.width + 'px';
                if (event.rect.height >= 100) target.style.height = event.rect.height + 'px';

                // translate when resizing from top or left edges
                el.style.left = parseInt(el.style.left, 10) + event.deltaRect.left + 'px';
                el.style.top = parseInt(el.style.top, 10) + event.deltaRect.top + 'px';
            })
            .on('resizeend', function(event) {
                callbackObj.resizeend && callbackObj.resizeend(event);
            })
            .gesturable({
                onmove: function(event) {
                    var target = event.target;
                    var scale = 1 * (1 + event.ds);
                    var nextWidth = parseInt(target.style.width, 10) * scale;
                    var nextHeight = parseInt(target.style.height, 10) * scale;
                    if (nextWidth >= 100) target.style.width = nextWidth + 'px';
                    if (nextHeight >= 100) target.style.height = nextHeight + 'px';
                    target.textContent = Math.round(parseInt(target.style.width, 10)) + '×' + Math.round(parseInt(target.style.height, 10));
                }
            })
            .on('tap', function(event) {
                var el = event.target;
                Array.prototype.filter.call(el.parentNode.children, function(child){
                    if (child !== el) {
                        child.classList.remove('interactable_highlight');
                    } else {
                        child.classList.add('interactable_highlight');
                    }
                });
                callbackObj.tap && callbackObj.tap(event);
                event.preventDefault();
            })
            .on('doubletap', function(event) {
                var el = event.target;
                var isMax = el.getAttribute('data-max');
                if (isMax === 'yes') {
                    el.style.cssText = el.getAttribute('data-beforecss');
                    el.setAttribute('data-beforecss', el.style.cssText);
                    el.setAttribute('data-max', 'no');
                } else {
                    el.setAttribute('data-beforecss', el.style.cssText);
                    el.style.cssText = 'width: 100%; height: 100%; left: 0; top: 0';
                    el.setAttribute('data-max', 'yes');
                }
                callbackObj.doubletap && callbackObj.doubletap(event);
                event.preventDefault();
            })
            .on('hold', function(event) {
                var el = event.target;
                el.parentNode.removeChild(el);
                callbackObj.hold && callbackObj.hold(event);
            });
    }

    // 全局化
    root.Interactable = Interactable;
}(this, interact));
