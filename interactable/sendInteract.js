/**
 * Created by zhangjunrong on 2017/7/17.
 */
var screenInfo;
var appsInfo = [];
var interactable;
var baseUrl = 'http://192.168.1.47:8002/';
var baseUrlHost = window.location.host;


/**
 * get the address form url
 * @return {string} full address contains hostname and port
 */
function getAddressFromUrl() {
    var curLocation = window.location;
    var hostname = curLocation.hostname;
    var port = curLocation.port ? curLocation.port : "80";
    //return {
    //    ip: hostname,
    //    port: port
    //};
    return hostname + ":" + port;
}

/**
 * 更新浏览器上的app状态
 * message为WebSocket推送的数据
 * @param message
 */
function updateStatus(message) {

    var message = '[{"rs_change":{"162":["13_13_master_Z77-picture-\\u5e7f\\' +
        'u5dde\\u5854\\u65e5\\u843d3.JPG",162,3840,5760,2160,3240,165,0,1,' +
        '"untitled"]},"current_config":"configdefault.conf","timestamp":' +
        '1501463163.785134,"screen_info":[9,3,3,5760,3240,1920,1080],"msg":' +
        '"","type":"server","statusCode":0}]';

    var data = JSON.parse(message)
    var rsChange = data[0].rs_change;
    for (var key in rsChange) {
        var infos = rsChange[key];
        var title = infos[0];
        var id = infos[1];
        var cor = [infos[2], infos[3], infos[4], infos[5]];
    }

    var browserCor = interactable.toBrowserCor({
        l: cor[0],
        r: cor[1],
        b: cor[2],
        t: cor[3]
    });

    var browApp = document.getElementById(id)
    browApp.style.width = browserCor.width;
    browApp.style.height = browserCor.height;
    browApp.style.left = browserCor.left;
    browApp.style.top = browserCor.top;
}

fetch(baseUrl + 'getAllAppNB/')
    .then(function (response) {
        return response.json();
    })
    .then(function (data) {
        var screenArr = data[0].screen_info;
        var rsChange = data[0].rs_change;
        console.log(rsChange)
        //屏幕信息
        screenInfo = {
            numberX: screenArr[1], //x轴屏幕个数
            numberY: screenArr[2], //y轴屏幕个数
            pixelX: screenArr[5], //x轴单个屏幕分辨率
            pixelY: screenArr[6] //y轴单个屏幕分辨率
        };

        for (var key in rsChange) {
            var infos = rsChange[key]
            appsInfo.push({
                id: key,
                title: infos[0],
                cor: [infos[2], infos[3], infos[4], infos[5]]
            });
        }

        function updteApp(event) {
            var target = event.target;
            var id = target.getAttribute('data-id');
            var cor = interactable.toScreenCor({
                left: target.style.left,
                top: target.style.top,
                width: target.style.width,
                height: target.style.height
            });

            // 更新数据
            appsInfo = appsInfo.map(function (app) {
                if (app.id === id) {
                    app.cor = [cor.l, cor.r, cor.b, cor.t];
                    app.cor = app.cor.map(function (v) {
                        return parseInt(v, 10);
                    });
                    fetch(baseUrl + 'api/?func=resizeWindow,' + id + ',' + app.cor.toString())
                }
                return app;
            });
        }

        interactable = new Interactable(screenInfo);

        interactable
            .initCanvas('#root')
            .bindEventCallback({
                dragend: updteApp,
                resizeend: updteApp,
                doubletap: updteApp,
                gesturableend: updteApp,
                tap: function (event) {
                    console.log('tap -> highlight')
                },
                hold: function (event) {
                    if (window.confirm('Delete?')) {
                        var el = event.target;
                        var id = el.getAttribute('data-id');
                        el.parentNode.removeChild(el);
                        fetch(baseUrl + 'api/?func=closeApp,' + id);
                    }
                }
            })
            .initApps(appsInfo)
    });

window.onresize = function () {
    interactable.initCanvas('#root').initApps(appsInfo);
    // updateStatus()
}
