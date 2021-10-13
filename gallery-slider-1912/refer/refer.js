/* 191226 add */
$(document).ready(function(){
    $(".h4_tit a[href='#']").on("click",function(e){
      e.preventDefault();                 
    });   
});
/* //191226 add */
/*!
 * @module vcui.helper.BreakpointDispatcher
 * @bechmark https://github.com/paulirish/matchMedia.js
 * @license MIT License
 * @description 반응형 분기점을 지날때마다 이벤트를 발생시켜주는 헬퍼
 * @copyright VinylC UID Group
 */

var IEUA = (function(){
    var ua = navigator.userAgent.toLowerCase();
    var mua = {
        IE: /msie [7-9]/.test(ua),
        MAC: /macintosh/.test(ua),
        IEALL: /msie [7-9]|trident/.test(ua),
        MOBILE: /mobile/.test(ua), //Mobile Device (iPad 포함)
        TABLET: false               //Tablet (iPad, Android, Windows)
    };
    mua.SMART = mua.MOBILE || mua.TABLET;
    return mua;
}());

define('helper/breakpointDispatcher', ['jquery', 'vcui'], function($, core) {
    "use strict";

    window.matchMedia || (window.matchMedia = function() {
        "use strict";

        var styleMedia = (window.styleMedia || window.media);
        if (!styleMedia) {
            var style = document.createElement('style'),
                script = document.getElementsByTagName('script')[0],
                info = null;

            style.type = 'text/css';
            style.id = 'matchmediajs-test';

            if (!script) {
                document.head.appendChild(style);
            } else {
                script.parentNode.insertBefore(style, script);
            }

            info = ('getComputedStyle' in window) && window.getComputedStyle(style, null) || style.currentStyle;

            styleMedia = {
                matchMedium: function(media) {
                    var text = '@media ' + media + '{ #matchmediajs-test { width: 1px; } }';

                    if (style.styleSheet) {
                        style.styleSheet.cssText = text;
                    } else {
                        style.textContent = text;
                    }

                    return info.width === '1px';
                }
            };
        }

        return function(media) {
            return {
                matches: styleMedia.matchMedium(media || 'all'),
                media: media || 'all'
            };
        };
    }());

    (function() {
        if (window.matchMedia && window.matchMedia('all').addListener) {
            return false;
        }

        var localMatchMedia = window.matchMedia,
            hasMediaQueries = localMatchMedia('only all').matches,
            isListening = false,
            timeoutID = 0, // setTimeout for debouncing 'handleChange'
            queries = [], // Contains each 'mql' and associated 'listeners' if 'addListener' is used
            handleChange = function(evt) {
                // Debounce
                clearTimeout(timeoutID);

                timeoutID = setTimeout(function() {
                    for (var i = 0, il = queries.length; i < il; i++) {
                        var mql = queries[i].mql,
                            listeners = queries[i].listeners || [],
                            matches = localMatchMedia(mql.media).matches;

                        if (matches !== mql.matches) {
                            mql.matches = matches;

                            for (var j = 0, jl = listeners.length; j < jl; j++) {
                                listeners[j].call(window, mql);
                            }
                        }
                    }
                }, 30);
            };

        window.matchMedia = function(media) {
            var mql = localMatchMedia(media),
                listeners = [],
                index = 0;

            mql.addListener = function(listener) {

                if (!hasMediaQueries) {
                    return;
                }

                if (!isListening) {
                    isListening = true;
                    window.addEventListener('resize', handleChange, true);
                }

                if (index === 0) {
                    index = queries.push({
                        mql: mql,
                        listeners: listeners
                    });
                }

                listeners.push(listener);
            };

            mql.removeListener = function(listener) {
                for (var i = 0, il = listeners.length; i < il; i++) {
                    if (listeners[i] === listener) {
                        listeners.splice(i, 1);
                    }
                }
            };

            return mql;
        };
    }());

    /**
     * @class
     * @name vcui.helper.BreakpointDispatcher
     */
    var BreakpointDispatcher = core.helper.BreakpointDispatcher = /** @lends  vcui.helper.BreakpointDispatcher */ vcui.BaseClass.extend({
        $singleton: true,
        initialize: function(options) {
            var self = this;

            self.options = core.extend({
                matches: {}
            }, options);
        },
        /**
         *
         */
        start: function() {
            var self = this,
                data;

            core.each(self.options.matches, function(item, key) {
                var mq = window.matchMedia(key);

                mq.addListener(item);
                item(mq);
            });
        }
    });

    return BreakpointDispatcher;
});
/*!
 * @module vcui.helper.Geolocation
 * @license MIT License
 * @description 지오로케이션 헬퍼
 * @copyright VinylC UID Group
 */
define('helper/geolocation', ['jquery', 'vcui'], function($, core) {
    "use strict";

    var geo = navigator.geolocation;

    /**
     * 네이티브 지오로케이션를 좀더 사용하기 쉽도록 작성된 Wrapper 클래스
     * @class
     * @name vcui.helper.Geolocation
     * @example
     * var geo = vcui.helper.Geolocation.getInstance();
     * geo.getCurrentPosition({
     *    timeout: 20000
     * }).done(function(position) {
     *     // position.coords.latitude;
     *     // position.coords.longitude;
     * });
     */
    var Geolocation = core.helper('Geolocation', core.Class( /**@lends vcui.helper.Geolocation# */ {
        $singleton: true, // 싱글톤
        /**
         * 생성자
         * @param {Object} options
         */
        initialize: function(options) {
            var self = this;

            self.options = core.extend({}, {
                mapService: 'naver',
                maximumAge: 600000, // 최대 유지 시간
                timeout: 60000, // 타임아웃
                enableHighAccuracy: false //
            }, options);

        },

        queryPermission: function() {
            var defer = $.Deferred();

            if (navigator.permissions) {
                navigator.permissions.query({
                    name: 'geolocation'
                }).then(function(permission) {
                    defer.resolve(permission);
                    permission.addEventListener('change', function() {
                        defer.resolve(this);
                    });
                });
            } else {
                if (navigator.geolocation) {
                    defer.resolve({
                        state: 'unknown'
                    });
                } else {
                    defer.resolve({
                        state: 'error',
                        message: "Permission API is not supported"
                    });
                }
            }

            return defer.promise();
        },

        /**
         * 에러코드에 해당하는 한글메세지 반환
         * @param {Object} err err.code, err.message
         * @return {string} 한글 에러메세지
         */
        _getTransKorMessage: function(err) {
            /*
             err.code는 다음을 의미함. - error.UNKNOWN_ERROR
             0 : 알 수 없는 오류 - error.PERMISSION_DENIED
             1 : 권한 거부 - error.PERMISSION_DENIED
             2 : 위치를 사용할 수 없음 (이 오류는 위치 정보 공급자가 응답) - error.POSITION_UNAVAILABLE
             3 : 시간 초과 - error.TIMEOUT
             */
            var message = '';
            if (err.code === 0) {
                //alert("Error: An unknown error occurred");
                message = "알 수 없는 오류입니다. \n다시 시도해 주세요.";
            } else if (err.code === 1) {
                //alert("Error: User denied the request for Geolocation!");
                message = "권한이 거부되었습니다! \n설정에서 위치서비스가 켜져있는지 확인해주세요.";
            } else if (err.code === 2) {
                //alert("Error: Location information is unavailable!");
                message = "위치를 사용할 수 없습니다!";
            } else if (err.code === 3) {
                //alert("Error: The request to get user location timed out!");
                message = "시간 초과되었습니다. \n다시 시도해 주세요.";
            }
            return message;
        },

        /**
         * 현재 위치 가져옴
         * @returns {*}
         */
        getCurrentPosition: function(options) {
            var self = this,
                defer = $.Deferred();

            options = $.extend({}, self.options, options);

            if (geo) {
                geo.getCurrentPosition(function(position) {
                    defer.resolve(core.extend(position.coords, {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    }));
                }, function(err) {
                    defer.reject({
                        code: err.code,
                        message: self._getTransKorMessage(err)
                    });
                }, options);
            } else {
                defer.reject({
                    code: 101,
                    message: "죄송합니다. " + (core.detect.isMobileDevice ? "디바이스에서" : "브라우저에서") + " 위치서비스를 제공하지 않습니다!"
                });
            }

            return defer.promise();
        },

        /**
         * 실시간으로 감시(움직일 때 마다 success 실행)
         * @returns {*}
         */
        watchPosition: function(successCallback, failCallback, options) {
            var self = this,
                defer = $.Deferred();

            if (geo) {
                defer.resolve('사용 가능합니다.');
                geo.watchPosition(successCallback, failCallback, options || self.options);
            } else {
                defer.reject({
                    code: 101,
                    message: "죄송합니다. " + (core.detect.isMobileDevice ? "디바이스에서" : "브라우저에서") + " 위치서비스를 제공하지 않습니다!"
                });
            }

            return defer.promise();
        },

        /**
         * 다음맵의 api를 이용하여 현재 위치를 주소로 변환하여 반환
         * @returns {*}
         */
        getCurrentAddress: function() {
            var self = this,
                defer = $.Deferred();

            self.getCurrentPosition()
                .done(function(position) {
                    self._getCoord2Addr(position)
                        .done(function() {
                            defer.resolve.apply(defer, arguments);
                        }).fail(function() {
                            defer.reject.apply(defer, arguments);
                        });

                }).fail(function(err) {
                    defer.reject({
                        code: err.code,
                        message: self._getTransKorMessage(err)
                    });
                });

            return defer.promise();
        },

        _getCoord2Addr: function(position) {
            var defer = $.Deferred();

            if (this.options.mapService === 'naver') {
                naver.maps.Service.reverseGeocode({
                    location: new naver.maps.LatLng(position.latitude, position.longitude)
                }, function(status, response) {
                    if (status === naver.maps.Service.Status.ERROR) {
                        defer.reject({
                            code: status,
                            status: status,
                            response: response
                        });
                        return;
                        //return alert('Something Wrong!');
                    }

                    defer.resolve({
                        code: status,
                        status: status,
                        response: response
                    });
                });
            }

            return defer.promise();
        }
    }));

    return Geolocation;

});
/*!
 * @module vcui.helper.Gesture
 * @license MIT License
 * @description 제스처 헬퍼
 * @copyright VinylC UID Group
 */
define('helper/gesture', ['jquery', 'vcui'], function($, core) {
    "use strict";

    function makeEventNS(name, ns) {
        return core.array.reduce(name.split(/\s+/g), function(prev, cur) {
            return prev + ' ' + cur + ns;
        }, '').trim();
    }

    // 벨생되는 이벤트
    // - gesturestart : 터치가 시작될 때
    // - gesturemove : 터치한 체 움직일 때
    // - gestureend : 터치가 끝났을 때
    // - gesturecancel : 터치가 취소됐을 때
    // - gestureup : 터치가 윗 방향으로 움직일 때
    // - gesturedown : 터치가 아랫방향으로 움직일 때
    // - gestureleft : 터치가 왼쪽으로 움직일 때
    // - gestureright : 터치가 오른쪽으로 움직일 때

    var Gesture = core.helper('Gesture', core.ui.View.extend({
        name: 'Gesture',
        defaults: {
            container: document, // move이벤트를 어디에 걸 것인가
            threshold: 50, // 움직임을 감지하기 위한 최소 크기
            direction: 'horizontal', // 'vertical', 'both' 중 택일
            gesture: null, // 모든 제스처에 의해 호출되는 콜백형식의 헨들러함수. 이벤트 랑 콜백방식 중에 아무거나 편한거 사용
            gestureStart: null, // 터치가 시작될 때 호출되는 핸들러. 이벤트 랑 콜백방식 중에 아무거나 편한거 사용
            gestureMove: null, // 터치가 움직일 때 호출되는 핸들러. 이벤트 랑 콜백방식 중에 아무거나 편한거 사용
            gestureEnd: null // 터치가 끝났을 때 호출되는 핸들러. 이벤트 랑 콜백방식 중에 아무거나 편한거 사용
        },
        initialize: function initialize(el, options) {
            var self = this;
            if (self.supr(el, options) === false) {
                return;
            }

            var direction = self.options.direction;

            self.isHoriz = direction === 'horizontal' || direction === 'both';
            self.isVerti = direction === 'vertical' || direction === 'both';
            self.$container = $(self.options.container);

            self._bindGestureEvents();
        },

        _getEventPoint: function _getEventPoint(ev, type) {
            var e = ev.originalEvent || ev;
            if (type === 'end' || ev.type === 'touchend') {
                e = e.changedTouches && e.changedTouches[0] || e;
            } else {
                e = e.touches && e.touches[0] || e;
            }
            return {
                x: e.pageX || e.clientX,
                y: e.pageY || e.clientY
            };
        },

        _getAngle: function _getAngle(startPoint, endPoint) {
            var x = startPoint.x - endPoint.x;
            var y = endPoint.y - startPoint.y;
            var r = Math.atan2(y, x); //radians
            var angle = Math.round(r * 180 / Math.PI); //degrees
            if (angle < 0) angle = 360 - Math.abs(angle);
            return angle;
        },

        _getDirection: function _getDirection(startPoint, endPoint, direction) {
            var angle,
                isHoriz = !direction || direction === 'horizontal' || direction === 'both',
                isVert = !direction || direction === 'vertical' || direction === 'both';

            if (isHoriz != isVert) {
                if (isHoriz) {
                    if (startPoint.x > endPoint.x) {
                        return 'left';
                    } else if (startPoint.x == endPoint.x) {
                        return '';
                    } else {
                        return 'right';
                    }
                } else {
                    if (startPoint.y > endPoint.y) {
                        return 'up';
                    } else if (startPoint.y == endPoint.y) {
                        return '';
                    } else {
                        return 'down';
                    }
                }
            }

            angle = this._getAngle(startPoint, endPoint);
            if (angle <= 45 && angle >= 0) {
                return 'left';
            } else if (angle <= 360 && angle >= 315) {
                return 'left';
            } else if (angle >= 135 && angle <= 225) {
                return 'right';
            } else if (angle > 45 && angle < 135) {
                return 'down';
            } else {
                return 'up';
            }
        },

        _getDiff: function _getDiff(a, b) {
            return {
                x: a.x - b.x,
                y: a.y - b.y
            };
        },

        _bindGestureEvents: function _bindGestureEvents() {
            var self = this,
                opt = self.options,
                touchStart,
                downPos,
                isSwipe = false,
                isScroll = false,
                eventNS = '.gesture' + self.cid,
                $container = self.$container;

            //self.$el[0].onselectstart = function (){ return false; };
            //self.$el.attr('unselectable', 'on');

            self.$el.on(makeEventNS('mousedown touchstart', eventNS), function(downEvent) {
                if (downEvent.type === 'mousedown') {
                    downEvent.preventDefault();
                }
                downPos = touchStart = self._getEventPoint(downEvent);
                isSwipe = isScroll = false;

                $container.on(makeEventNS('mousemove touchmove', eventNS), function(moveEvent) {
                    var touch = self._getEventPoint(moveEvent),
                        diff,
                        slope,
                        swipeY,
                        swipeX;

                    if (!touchStart || isScroll) return;
                    diff = self._getDiff(touch, touchStart);

                    if (!isSwipe) {
                        swipeX = Math.abs(diff.y) / (Math.abs(diff.x) || 1);
                        swipeY = Math.abs(diff.x) / (Math.abs(diff.y) || 1);
                        if (swipeX < 1 && self.isHoriz || swipeY < 1 && self.isVerti) {
                            touch.event = moveEvent;
                            if (self._gestureCallback('start', touch) === false) {
                                return;
                            }
                            var ev = $.Event('gesturestart');
                            self.triggerHandler(ev, touch);
                            if (ev.isDefaultPrevented()) {
                                return;
                            }
                            isSwipe = true;
                            self.$el.on(makeEventNS('mousemove touchmove', eventNS), function(e) {
                                e.preventDefault();
                            });
                        } else {
                            if (self.isHoriz && swipeX > 1 || self.isVerti && swipeY > 1) {
                                isScroll = true;
                            }
                        }
                    }

                    if (isSwipe) {
                        moveEvent.stopPropagation();
                        moveEvent.preventDefault();

                        touch.diff = diff;
                        touch.direction = self._getDirection(touchStart, touch, opt.direction);
                        touch.event = moveEvent;

                        self._gestureCallback('move', touch);
                        self.triggerHandler('gesturemove', touch);
                    }
                }).on(makeEventNS('mouseup mousecancel touchend touchcancel', eventNS), function(upEvent) {
                    if (isSwipe && touchStart) {
                        var touch = self._getEventPoint(upEvent, 'end');
                        touch.diff = self._getDiff(touch, touchStart);

                        touch.direction = self._getDirection(touchStart, touch, opt.direction);
                        touch.event = upEvent;

                        self.$el.off(makeEventNS('mousemove touchmove', eventNS));

                        switch (touch.direction) {
                            case 'left':
                            case 'right':
                                if (Math.abs(touch.diff.x) > opt.threshold && self.isHoriz) {
                                    self._gestureCallback(touch.direction, touch);
                                    self.triggerHandler('gesture' + touch.direction, touch);
                                }
                                break;
                            case 'up':
                            case 'down':
                                if (Math.abs(touch.diff.y) > opt.threshold && self.isVerti) {
                                    self._gestureCallback(touch.direction, touch);
                                    self.triggerHandler('gesture' + touch.direction, touch);
                                }
                                break;
                        }

                        if (Math.abs(touch.diff.x) > opt.threshold || Math.abs(touch.diff.y) > opt.threshold) {
                            self._gestureCallback('end', touch);
                            self.triggerHandler('gestureend', touch);
                        } else {
                            self._gestureCallback('cancel', touch);
                            self.triggerHandler('gesturecancel', touch);
                        }
                    }

                    touchStart = null;
                    isScroll = false;
                    $container.off(eventNS);
                });
            }).on('click' + eventNS, 'a, button', function(e) {
                if (!downPos) {
                    return;
                }
                var pos = self._getEventPoint(e);
                if (downPos.x !== pos.x || downPos.y !== pos.y) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            });
        },

        _gestureCallback: function _gestureCallback(type, data) {
            var self = this,
                ret;
            self.options['gesture' + type] && (ret = self.options['gesture' + type].call(self, data));
            self.options['gesture'] && (ret = self.options['gesture'].call(self, type, data));
            return ret;
        },

        destroy: function destroy() {
            var eventNS = '.gesture' + this.cid;
            this.$el.off(eventNS);
            this.$container.off(eventNS);
            this.supr();
        }
    }));

    core.ui.bindjQuery(Gesture, 'Gesture');

    return Gesture;
});
define('helper/jusoAPI', ['vcui'], function() {
    var JusoAPI = core.Class({
        $singleton: true,
        initialize: function() {

        }
    });

    return JusoAPI;
});
/*!
 * @module vcui.helper.ResponseImage
 * @license MIT License
 * @description 반응형에 따라 해당이미지를 로드해주는 헬퍼
 * @copyright VinylC UID Group
 */
define('helper/responsiveImage', [
    'jquery',
    'vcui'
], function($, core) {
    "use strict";

    var getBg = function(el) {
        var style = el.currentStyle || window.getComputedStyle(el, false);
        return style.backgroundImage.slice(4, -1).replace(/"|'/g, "");
    };

    /**
     * class vcui.helper.ResponsiveImage
     * 창 사이드에 따라 img 태그의 data-src-mobile, data-src-pc 속성에서 알맞는 이미지로 교체
     */
    var ResponsiveImage = core.helper('ResponsiveImage', core.ui.View.extend({
        $singleton: true,
        $statics: {
            run: function($el) {
                var currentMode = window.breakpoint.name;
                var $items = $el.find('[data-src-pc], [data-src-mobile]');


                $items.each(function() {
                    var src = this.getAttribute('data-src-' + currentMode);
                    var tagName = this.tagName.toLowerCase();

                    if (!src ||
                        (tagName === 'img' && this.src === src) ||
                        (tagName !== 'img' && getBg(this) === src)) {
                        return;
                    }
                    switch (tagName) {
                        case 'img':
                            this.src = src;
                            break;
                        default:
                            this.style.backgroundImage = 'url(' + src + ')';
                            break;
                    }
                });
            }
        },
        name: 'ResponsiveImage',
        bindjQuery: true,
        defaults: {
            breakpoints: {
                mobile: 768,
                pc: 100000
            }
        },
        initialize: function(el, options) {
            var self = this;
            if (self.supr(el, options) === false) {
                return;
            }

            ResponsiveImage.breakpoints = self.options.breakpoints;
            self.$items = $();
            //self._makeSelector();
            self._bindEvents();
        },

        _makeSelector: function() {
            var self = this;

            self.selector = '';
            core.each(core.object.keys(this.options.breakpoints), function(name) {
                if (self.selector) {
                    self.selector += ',';
                }
                self.selector += '[data-src-' + name + ']'
            });
        },

        _bindEvents: function() {
            var self = this;

            $(window).on('breakpointchange.responsiveimage orientationchange.responsiveimage load.responsiveimage',
                core.throttle(self._handleResize.bind(self), 50)
            );
            self._handleResize();
        },

        _handleResize: function() {
            var self = this;
            var currentMode = window.breakpoint.name;

            if (currentMode === self.prevMode) {
                return;
            }
            self.prevMode = currentMode;

            ResponsiveImage.run(self.$el);
        }
    }));

    return ResponsiveImage;

});
/*!
 * @module vcui.helper.Sharer
 * @license MIT License
 * @description Sharer 컴포넌트
 * @copyright VinylC UID Group
 */
define('helper/sharer', ['jquery', 'vcui'], function($, core) {
    "use strict";

    var $doc = core.$doc,
        win = window,
        enc = encodeURIComponent;

    var detect = {
        PC: 1,
        MOBILE: 2,
        APP: 4
    };

    var defaultOption = {
        selector: '.ui-sharer',
        attr: 'data-service',
        metas: {
            title: {},
            description: {},
            image: {}
        },
        onBeforeShare: function() {},
        onShrered: function() {}
    };

    var Sharer = /** @lends axl.module.Sharer */ {
        support: detect,
        services: /** @lends axl.module.Sharer.services */ { //['facebook', 'twitter', 'kakaotalk', 'kakaostory'/* , 'googleplus'*/],
            'facebook': /** @lends axl.module.Sharer.services.facebook */ {
                name: '페이스북',
                support: detect.PC | detect.MOBILE,
                size: [500, 300],
                url: 'https://www.facebook.com/sharer.php?',
                makeParam: function makeParam(data) {
                    data.url = core.uri.addParam(data.url, {
                        '_t': +new Date()
                    });
                    return {
                        u: data.url,
                        t: data.title || ''
                    };
                }
            },
            'twitter': /** @lends axl.module.Sharer.services.twitter */ {
                name: '트위터',
                support: detect.PC | detect.MOBILE,
                size: [550, 300],
                url: 'https://twitter.com/intent/tweet?',
                makeParam: function makeParam(data) {
                    data.desc = data.desc || '';

                    var length = 140 - data.url.length - 6,
                        // ... 갯수
                        txt = data.title + ' - ' + data.desc;

                    txt = txt.length > length ? txt.substr(0, length) + '...' : txt;
                    return {
                        text: txt + ' ' + data.url
                    };
                }
            },
            'googleplus': /** @lends axl.module.Sharer.services.googleplus */ {
                name: '구글플러스',
                support: detect.PC | detect.MOBILE,
                size: [400, 420],
                url: 'https://plus.google.com/share?',
                makeParam: function makeParam(data) {
                    return {
                        url: data.url
                    };
                }
            },
            'pinterest': /** @lends axl.module.Sharer.services.pinterest */ {
                name: '핀터레스트',
                support: detect.PC | detect.MOBILE,
                size: [740, 740],
                url: 'https://www.pinterest.com/pin/create/button/?',
                makeParam: function makeParam(data) {
                    return {
                        url: data.url,
                        media: data.image,
                        description: data.desc
                    };
                }
            },
            'linkedin': {
                name: '링크드인',
                support: detect.PC | detect.MOBILE,
                url: 'https://www.linkedin.com/shareArticle',
                makeParam: function(data) {
                    return {
                        url: data.url,
                        mini: true
                    };
                }
            },
            'kakaotalk': /** @lends axl.module.Sharer.services.kakaotalk */ {
                name: '카카오톡',
                support: detect.APP | detect.MOBILE,
                makeParam: function makeParam(data) {
                    return {
                        msg: data.title + "\n" + (data.desc || ''),
                        url: data.url,
                        appid: "common store",
                        appver: "0.1",
                        type: "link",
                        appname: data.title
                    };
                }
            },
            'kakaostory': /** @lends axl.module.Sharer.services.kakaostory */ {
                name: '카카오스토리',
                support: detect.APP | detect.MOBILE,
                makeParam: function makeParam(data) {
                    return {
                        post: data.title + "\n" + (data.desc || '') + "\n" + data.url,
                        appid: "axl.com",
                        appver: "1.0",
                        apiver: "1.0",
                        appname: data.title
                    };
                }
            },
            'line': /** @lends axl.module.Sharer.services.line */ {
                name: '라인',
                support: detect.APP | detect.MOBILE,
                appUrl: 'http://line.me/R/msg/text/',
                url: 'line://msg/text/',
                store: {
                    android: {
                        intentPrefix: "intent://msg/text/",
                        intentSuffix: "#Intent;scheme=line;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=jp.naver.line.android;end"
                    },
                    ios: "http://itunes.apple.com/jp/app/line/id443904275"
                },
                makeParam: function makeParam(data) {
                    return {};
                }
            },
            'band': /** @lends axl.module.Sharer.services.band */ {
                name: '밴드',
                support: detect.APP | detect.MOBILE,
                size: [550, 645],
                url: 'http://www.band.us/plugin/share?',
                makeParam: function(data) {
                    return {
                        body: encodeURIComponent(data.title) + " " +encodeURIComponent(data.url),
                        route: $(location).attr("href")
                    };
                }
            },
            'kakao': /** @lends axl.module.Sharer.services.band */ {
                name: '카카오톡'
            },
            'copy_url': {
                support: detect.PC | detect.MOBILE,
                run: function(el) {

                }
            }
        },
        addService: function(name, options) {
            this.services[name] = options;
        },

        /**
         * 전송
         * @param {string} type facebook|twitter|line|kakaotalk|kakaostory|googleplus|pinterest
         * @param {Object} params
         * @param {string} params.url url 주소
         * @param {string} params.title 타이틀
         * @param {string} params.image 이미지
         * @param {string} params.desc 설명
         */
        share: function share(type, params) {
            var service = this.services[type];
            var sizeFeature = '';
            if (!service) {
                return;
            }

            //카카오톡 공유
            if( $(params.target).attr("class") == "kakao" ){
                params.url = (params.url + '').replace(/#$/g, '');
                params.url = params.url || location.href.replace(/#$/g, '');
                params.title = params.title || document.title;

                Kakao.Link.sendDefault({
                    objectType : 'feed',
                    content : {
                        title : params.title,
                        imageUrl : $('meta[property="kakao:image"]').attr('content'),
                        link : {
                            mobileWebUrl : params.url,
                            webUrl : params.url
                        }
                    }
                });
                return;
            }else if( $(params.target).attr("class") == "facebook" ){
                $('meta[property="og:image"]').attr('content', $('meta[property="facebook:image"]').attr('content'));

            }else if( $(params.target).attr("class") == "band" ){
                $('meta[property="og:image"]').attr('content', $('meta[property="band:image"]').attr('content'));
            }

            if (service.support & (detect.PC | detect.MOBILE)) {
                if (core.isFunction(service.run)) {
                    service.run(params.target);
                } else {
                    params.url = (params.url + '').replace(/#$/g, '');
                    params.url = params.url || location.href.replace(/#$/g, '');
                    params.title = params.title || document.title;

                    if (service.size) {
                        sizeFeature += ', height=' + service.size[1] + ', width=' + service.size[0];
                    }
                    window.open(service.url + core.json.toQueryString(service.makeParam(params)),
                        type,
                        'menubar=no' + sizeFeature
                    );
                }
            } else if (service.support & detect.APP) {

            }
        },

        _getMetaInfo: function(type, service) {
            var metas = this.options.metas;
            var name = metas[type][service] || type;

            switch (type) {
                case 'title':
                case 'description':
                case 'image':
                    if (core.isFunction(name)) {
                        return name(type, service);
                    } else {
                        return $('head meta').filter('[name$="' + name + '"], ' +
                            '[property$="' + name + '"]').eq(0).attr('content') || '';
                    }
            }

            return '';
        },

        /**
         * 공유하기 실행
         * @param {jQuery|Element|string} el 버튼
         * @param {string} service sns벤더명
         */
        _share: function _share(el, service) {
            var $el = $(el),
                url = ($el.attr('href') || '').replace(/^#/, '') || $el.attr('data-url') || location.href,
                title = $el.attr('data-title') || this._getMetaInfo('title', service) || document.title,
                desc = $el.attr('data-desc') || this._getMetaInfo('description', service) || '',
                image = $el.attr('data-image') || this._getMetaInfo('image', service) || '',
                data;

            this.share(service, data = {
                target: el,
                url: url,
                title: title,
                desc: desc,
                image: image
            });

            data.service = service;
            this.options.onShrered($el, data);
        },

        init: function init(options) {
            var self = this,
                services = core.object.keys(this.services);

            self.options = core.extend(true, defaultOption, options);

            function hasClass($el) {
                var service;
                core.each(self.services, function(item, svc) {
                    if ($el.hasClass(svc)) {
                        service = svc;
                        return false;
                    }
                });
                return service;
            }

            $(document).on('click.sharer', self.options.selector, function(e) {
                e.preventDefault();

                var $el = $(this),
                    service = '';

                if (self.options.attr === 'class') {
                    service = hasClass($el);
                } else {
                    service = $el.attr(self.options.attr);
                }

                if (self.options.onBeforeShare($el, {
                        service: service
                    }) === false) {
                    return;
                }

                if (!service || !core.array.include(services, service)) {
                    alert('공유할 SNS타입을 지정해주세요.');
                    return;
                }

                self._share($el.get(0), service);
            });
        }
    };

    return Sharer;
});
/*!
 * @module vcui.ui.Timeline
 * @license MIT License
 * @description Timeline 컴포넌트
 * @copyright VinylC UID Group
 *
 *
 */
define('helper/timeline', ['jquery', 'vcui', 'libs/jquery.transit'], function($, core) {
    "use strict";

    /**
     * @class
     * @description
     * @name
     * @extends vcui.ui.View
     */

    var TweenItem = core.BaseClass.extend({

        initialize: function(id, target, start, end, animate) {
            var self = this;

            self.id = id;
            self.$el = target;
            self.seqId = -1;
            self.startFrame = start;
            self.endFrame = end;
            self.totalFrame = end - start;

            self.progress = 0;
            self.oldProgress = 0;
            self.currentFrame = 0;
            self.isPause = false;

            self.startCss = animate.start;
            self.endCss = animate.end;
            self.easing = animate.ease ? $.easing[animate.ease] : $.easing.easeNone;

            self.$child = self.$el.children();
            self.currentCss = {};


            //self.tween(0);
        },

        pause: function() {
            var self = this;
            self.isPause = true;

        },
        restart: function() {
            var self = this;
            self.isPause = false;
        },

        getStartFrame: function() {
            var self = this;
            return self.startFrame;
        },

        getEndFrame: function() {
            var self = this;
            return self.endFrame;
        },

        getId: function() {
            var self = this;
            return self.id;
        },

        update: function(currentFrame) {
            var self = this;

            if (currentFrame < self.startFrame) return;
            self.progress = (currentFrame - self.startFrame) / self.totalFrame;
            if (self.oldProgress == self.progress) return;

            if (self.progress <= 0.001) self.progress = 0;
            if (self.progress >= 0.999) self.progress = 1;

            self.tween(self.progress);
            self.oldProgress = self.progress;

        },

        tween: function(d) {
            var self = this;
            if (self.isPause) return;
            var value = self.easing(d);
            var cal, val, start, end, seqId;

            for (var prop in self.endCss) {

                start = self.startCss[prop];
                end = self.endCss[prop];
                cal = 0.0;
                val = 0.0;

                if (core.isArray(end)) {
                    val = Interpolation.bezier(end, value);
                } else {
                    if (core.isNumeric(end)) {
                        start = parseFloat(start);
                        end = parseFloat(end);
                        cal = (end - start) * value;
                        val = start + cal;
                    } else {
                        val = self._convert(start, end, value);
                    }
                }

                if (prop == "seq") {
                    seqId = parseInt(val);
                    if (seqId != self.seqId && seqId > -1) {

                        if (self.$child.length > seqId) {
                            self.$child.eq(seqId).css({
                                visibility: 'visible'
                            });
                            self.$child.not(self.$child.eq(seqId)).css({
                                visibility: 'hidden'
                            });
                        }
                        self.seqId = seqId;
                    }
                }
                self.currentCss[prop] = val;
            }

            self.$el.css(self.currentCss);

        },
        _convert: function(stStr, edStr, d) {
            var outStr = "";

            var stArr = stStr.split(',');
            var endArr = edStr.split(',');
            if (endArr.length < 2) return;

            var cal, val, start, end;
            var arr = [];

            for (var i = 0; i < endArr.length; i++) {

                start = parseFloat(stArr[i]);
                end = parseFloat(endArr[i]);

                cal = (end - start) * d;
                val = start + cal;
                arr[i] = val;

            }

            for (var j = 0; j < arr.length; j++) {
                outStr += (arr.length - 1 == j) ? arr[j] : arr[j] + ",";
            }
            return outStr;
        }

    });



    var Timeline = core.ui('Timeline', /** @lends vcui.ui.Timeline# */ {
        bindjQuery: 'timeline',
        defaults: {
            status: false
        },
        selectors: {},
        initialize: function initialize(el, options) {
            var self = this;
            if (self.supr(el, options) === false) {
                return;
            }
            self._build();
        },

        _build: function() {

            var self = this;

            self.idCnt = 10000;
            self.direction = 1;
            self.isAnimate = false;
            self.labels = [];
            self.tweenItems = [];
            self.frameObj = {
                current: 0,
                total: 0
            };
            //self.$el.css({opacity:0});

        },

        _bindEvents: function() {
            var self = this;
        },

        _updateFrame: function() {
            var self = this;
            var total = 0;
            for (var o in self.tweenItems) {
                var endFrame = self.tweenItems[o].getEndFrame();
                if (total < endFrame) total = endFrame;
            }

            self.frameObj.total = total;
            if (self.frameObj.current >= self.frameObj.total) self.frameObj.current = self.frameObj.total;
        },

        _addTween: function(obj) {
            var self = this;

            var id = self.idCnt++;

            for (var o in self.tweenItems) {
                if (self.tweenItems[o].getId() == id) {
                    return;
                }
            }
            var $target = (obj.target instanceof $) ? obj.target : self.$el.find(obj.target);
            var aniObj = obj.animate;

            var frameArr = aniObj.frame.split(',');
            if (frameArr.length < 2) return;


            var startFrame = parseInt(frameArr[0]);
            var endFrame = parseInt(frameArr[1]);

            var endRdFrame;

            $target.each(function(i, target) {

                var random = aniObj.random ? core.number.random(0, endFrame - startFrame) + startFrame : endFrame;
                endRdFrame = parseInt(random);

                var item = new TweenItem(id, $(target), startFrame, endRdFrame, aniObj);
                self.tweenItems.push(item);

                if (self.frameObj.total < endRdFrame) self.frameObj.total = endRdFrame;
                id = self.idCnt++;

            });


        },

        _getIdValue: function(obj) {
            var objId;
            if (core.isObject(obj)) {
                if (obj.constructor.name === "BaseClass") {
                    objId = obj.getId();
                } else {
                    objId = obj.id;
                }
            } else {
                objId = obj;
            }
            return objId;
        },

        _removeTween: function(obj) {
            var self = this;
            var objId = self._getIdValue(obj);

            self.tweenItems = $.grep(self.tweenItems, function(item) {
                if (item.getId() === objId) {
                    item.clear();
                    return false;
                } else {
                    return true;
                }
            });
            self._updateFrame();
        },

        _animation: function() {
            var self = this;

            var frame = self.frameObj.current;
            for (var o in self.tweenItems) {
                self.tweenItems[o].update(frame);
            }

            if (self.options.status) self._status();
            self.uiTriggerHandler('update', self.frameObj);
            if (frame == self.frameObj.total) self.uiTriggerHandler('complete', self.frameObj);

        },


        _status: function() {
            var self = this;
            if (!self.$status) {
                self.$status = $("<div id='timelineStatus' style='position:absolute; bottom:0px; right:0px; z-index:10000; padding:10px; font-size:12px; background-color:#000; color:#fff'></div>");
                $('body').prepend(self.$status);
            }
            self.$status.html(" total = " + self.frameObj.total + " / " + " current = " + self.frameObj.current.toFixed(0));

        },

        gotoLabel: function(label, option, isReset) {
            var self = this;
            var frame = self.getFrame(label);

            if (frame < 0) return;
            self.gotoFrame(frame, option, isReset);
        },


        getFrame: function(label) {
            var self = this;
            for (var o in self.labels) {
                if (self.labels[o].label == label) {
                    return self.labels[o].frame;
                }
            }
            return -1;
        },

        getLabel: function(frame) {
            var self = this;
            for (var o in self.labels) {
                if (self.labels[o].frame == frame) {
                    return self.labels[o].label;
                }
            }
            return null;
        },

        gotoFrame: function(frame, option, isReset) {
            var self = this;

            if (typeof(option) === "boolean") {
                isReset = option;
                option = null;
            }

            if (isReset) {
                self.stop();
                self.frameObj.current = 0;
                self._animation();
            }


            if (self.isAnimate) return;
            self.isAnimate = true;


            var config = option ? option : {
                duration: self.frameObj.total,
                ease: "linear"
            };

            if (config.duration == 0) {
                self.isAnimate = false;
                self.frameObj.current = frame;
                self._animation();
            } else {

                $(self.frameObj).clearQueue().stop().animate({
                    current: frame
                }, {
                    duration: config.duration ? config.duration : 1000,
                    easing: config.ease ? config.ease : "linear",
                    step: function(val) {
                        self._animation();
                    },
                    complete: function(e, data) {
                        self.isAnimate = false;
                        self._animation();
                    }
                });
            }
        },
        getCurrentFrame: function() {
            var self = this;
            return self.frameObj.current;
        },
        replaceTween: function(arr) {
            var self = this;
            self.removeTween(arr);
            self.addTween(arr);

        },
        addTween: function(arr) {
            var self = this;
            if (core.isArray(arr)) {
                for (var i = 0; i < arr.length; i++) {
                    self._addTween(arr[i]);
                }
            } else {
                self._addTween(arr);
            }

        },
        removeTween: function(arr) {
            var self = this;

            if (core.isArray(arr)) {
                for (var i = 0; i < arr.length; i++) {
                    self._removeTween(arr[i]);
                }
            } else {
                self._removeTween(arr);
            }
        },
        addLabel: function(label, frame) {
            var self = this;

            for (var o in self.labels) {
                if (self.labels[o].label == label) return;
            }
            var label = {
                label: label,
                frame: frame
            };
            self.labels.push(label);
            if (self.frameObj.total < frame) self.frameObj.total = frame;
        },
        stop: function() {
            var self = this;
            self.isAnimate = false;
            $(self.frameObj).clearQueue().stop();

        },
        restart: function(arr, isPlay) {
            var self = this;
            self.pause(arr, true);
        },
        pause: function(arr, isPlay) {
            var self = this;
            var objId;
            if (core.isArray(arr)) {
                for (var i = 0; i < arr.length; i++) {
                    objId = self._getIdValue(arr[i]);
                    for (var o in self.tweenItems) {
                        if (self.tweenItems[o].getId() == objId) {
                            if (isPlay) {
                                self.tweenItems[o].restart();
                            } else {
                                self.tweenItems[o].pause();
                            }
                            break;
                        }
                    }
                }
            } else {
                for (var o in self.tweenItems) {
                    objId = self._getIdValue(arr);
                    if (self.tweenItems[o].getId() == objId) {
                        if (isPlay) {
                            self.tweenItems[o].restart();
                        } else {
                            self.tweenItems[o].pause();
                        }
                        return;
                    }
                }
            }
        }

    });

    var Interpolation = {
        bezier: function(v, k) {
            var b = 0,
                n = v.length - 1,
                bn = Interpolation.bernstein,
                i, bc, k1, k2, k3;
            for (i = 0; i <= n; i++) {
                bc = bn(n, i);
                k1 = Math.pow(1 - k, n - i);
                k2 = Math.pow(k, i);
                k3 = v[i];
                b += k1 * k2 * k3 * bc;
            }
            return b;
        },
        bernstein: function(n, i) {
            var fc = Interpolation.factorial;
            var a1 = fc(n);
            var b1 = fc(i);
            var c1 = fc(n - i);
            return a1 / b1 / c1;
        },
        factorial: function(n, i) {
            var a = [1];
            var s = 1,
                i;
            if (a[n]) return a[n];
            for (i = n; i > 1; i--) s *= i;
            return a[n] = s;
        }
    };

    function easeOutBounce(k) {
        if (k < (1 / 2.75)) {
            return 7.5625 * k * k;
        } else if (k < (2 / 2.75)) {
            return 7.5625 * (k -= (1.5 / 2.75)) * k + 0.75;
        } else if (k < (2.5 / 2.75)) {
            return 7.5625 * (k -= (2.25 / 2.75)) * k + 0.9375;
        } else {
            return 7.5625 * (k -= (2.625 / 2.75)) * k + 0.984375;
        }
    }

    $.extend($.easing, {
        easeNone: function(k) {
            return k;
        },
        easeInQuad: function(k) {
            return k * k;
        },
        easeOutQuad: function(k) {
            return k * (2 - k);
        },
        easeInOutQuad: function(k) {
            if ((k *= 2) < 1) return 0.5 * k * k;
            return -0.5 * (--k * (k - 2) - 1);
        },
        easeInQuart: function(k) {
            return k * k * k * k;
        },
        easeOutQuart: function(k) {
            return 1 - (--k * k * k * k);
        },
        easeInOutQuart: function(k) {
            if ((k *= 2) < 1) return 0.5 * k * k * k * k;
            return -0.5 * ((k -= 2) * k * k * k - 2);
        },
        easeInQuint: function(k) {
            return k * k * k * k * k;
        },
        easeOutQuint: function(k) {
            return --k * k * k * k * k + 1;
        },
        easeInOutQuint: function(k) {
            if ((k *= 2) < 1) return 0.5 * k * k * k * k * k;
            return 0.5 * ((k -= 2) * k * k * k * k + 2);
        },
        easeInElastic: function(k) {
            var s, a = 0.1,
                p = 0.4;
            if (k === 0) return 0;
            if (k === 1) return 1;
            if (!a || a < 1) {
                a = 1;
                s = p / 4;
            } else {
                s = p * Math.asin(1 / a) / (2 * Math.PI);
            }
            return -(a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));
        },
        easeOutElastic: function(k) {
            var s, a = 0.1,
                p = 0.4;
            if (k === 0) return 0;
            if (k === 1) return 1;
            if (!a || a < 1) {
                a = 1;
                s = p / 4;
            } else {
                s = p * Math.asin(1 / a) / (2 * Math.PI);
            }
            return (a * Math.pow(2, -10 * k) * Math.sin((k - s) * (2 * Math.PI) / p) + 1);
        },
        easeInOutElastic: function(k) {
            var s, a = 0.1,
                p = 0.4;
            if (k === 0) return 0;
            if (k === 1) return 1;
            if (!a || a < 1) {
                a = 1;
                s = p / 4;
            } else {
                s = p * Math.asin(1 / a) / (2 * Math.PI);
            }
            if ((k *= 2) < 1) return -0.5 * (a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));
            return a * Math.pow(2, -10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p) * 0.5 + 1;
        },
        easeInBack: function(k) {
            var s = 1.70158;
            return k * k * ((s + 1) * k - s);
        },
        easeOutBack: function(k) {
            var s = 1.70158;
            return --k * k * ((s + 1) * k + s) + 1;
        },
        easeInOutBack: function(k) {
            var s = 1.70158 * 1.525;
            if ((k *= 2) < 1) return 0.5 * (k * k * ((s + 1) * k - s));
            return 0.5 * ((k -= 2) * k * ((s + 1) * k + s) + 2);
        },
        easeInBounce: function(k) {
            return 1 - easeOutBounce(1 - k);
        },
        easeOutBounce: easeOutBounce,
        easeInOutBounce: function(k) {
            if (k < 0.5) return (1 - easeOutBounce(1 - k * 2)) * 0.5;
            return easeOutBounce(k * 2 - 1) * 0.5 + 0.5;
        }
    });

    ///////////////////////////////////////////////////////////////////////////////////////

    return Timeline;
});
/*!
 * @module vcui.ui.Accordion
 * @license MIT License
 * @description 아코디온 컴포넌트
 * @copyright VinylC UID Group
 */
define('ui/accordion', ['jquery', 'vcui'], function($, core) {
    "use strict";

    var ui = core.ui,
        name = 'accordion',
        eventBeforeCollapse = name + 'beforecollapse',
        eventCollapse = name + 'collapse',
        eventBeforeExpand = name + 'beforeexpand',
        eventExpand = name + 'expand';

    /**
     * @class
     * @description 아코디언 컴포넌트
     * @name vcui.ui.Accordion
     * @extends vcui.ui.View
     */
    var Accordion = ui('Accordion', /**@lends vcui.ui.Accordion# */ {
        $statics: {
            ON_BEFORE_COLLAPSE: eventBeforeCollapse,
            ON_COLLAPSE: eventCollapse,
            ON_BEFORE_EXPAND: eventBeforeExpand,
            ON_EXPAND: eventExpand
        },
        bindjQuery: name,
        defaults: {
            singleOpen: false,
            useAnimate: true,
            openIndex: null,
            duration: 200,
            autoScroll: false,
            scrollTopOffset: 0,
            activeClass: "active",
            selectedClass: 'on',
            itemClosest: 'li',
            itemSelector: '>ul>li',
            toggleSelector: ">.head>.ui_accord_toggle",
            contentSelector: ">.ui_accord_content"
        },

        /**
         * 생성자
         * @param el 모듈 요소
         * @param {object} [options] 옵션(기본값: defaults 속성 참조)
         * @param {boolean} [options.singleOpen = false] 단일열림 / 다중열림 여부
         * @param {number} [options.duration = 200] 펼쳐지거나 닫혀지거나 할 때 애니메이션 속도
         * @param {string} [options.activeClass = 'active'] 활성화됐을 때 추가할 css 클래스명
         * @param {string} [options.selectedClass = 'on'] 버튼이 토글될 때 추가할 css 클래스명
         * @param {string} [options.itemClosest = 'li']
         * @param {string} [options.itemSelector = '>ul>li']
         * @param {string} [options.toggleSelector = '>.head>.ui_accord_toggle'] 토글버튼
         * @param {string} [options.contentSelector = '>.ui_accord_content'] 컨텐츠
         */
        initialize: function initialize(el, options) {
            var self = this;

            if (self.supr(el, options) === false) {
                return;
            }

            self._buildARIA();
            self._bindEvent();

            var openIndex = self.options.openIndex;
            if (openIndex === 0 || openIndex) {
                if (openIndex === 'all') {
                    self.expandAll();
                } else {
                    self.collapseAll();
                    var indexes = [].concat(openIndex);
                    if (self.options.singleOpen) {
                        self.expand(indexes[0], false);
                    } else {
                        core.each(indexes, function(index) {
                            self.expand(index, false);
                        });
                    }
                }
            }
        },

        _buildARIA: function _buildARA() {
            var self = this;
            var o = self.options;

            self._updateSelectors();

            self.$el.attr('role', 'presentation');
            self.$items.each(function() {
                var $btn = $(this).find(o.toggleSelector);
                var $content = $(this).find(o.contentSelector);
                var id = core.string.random(10);

                $btn.attr({
                    'id': 'accrod_toggle_' + id,
                    'aria-controls': 'accord_content_' + id,
                    'aria-expanded': $btn.attr('aria-expanded') === 'true'
                }).parent().attr('role', 'heading');

                $content.attr({
                    'id': 'accord_content_' + id,
                    'role': 'region',
                    'aria-labelledby': 'accord_toggle_' + id
                });
            });
        },

        update: function update() {
            this._buildARIA();
        },

        _updateSelectors: function _updateSelectors() {
            var self = this;
            var o = self.options;

            self.$items = self.$(o.itemSelector);
        },

        /**
         * 이벤트 바인딩
         * @private
         */
        _bindEvent: function _bindEvent() {
            var self = this,
                o = self.options;

            // 토글버튼 클릭됐을 때
            self.on("click dblclick", o.itemSelector + o.toggleSelector, function(e) {
                e.preventDefault();

                //self.updateSelectors();
                var $item = $(this).closest(o.itemClosest),
                    $items = self._findItems(),
                    index = $items.index($item);

                if ($item.hasClass(o.selectedClass)) {
                    self.collapse(index, self.options.useAnimate, function() {
                        $item.addClass(o.activeClass);
                    });
                } else {
                    self.expand(index, self.options.useAnimate);
                }
            });

            if (o.accordGroup && o.singleOpen) {
                // 아코디언 요소가 따로 떨어져 있는 것을 data-accord-group속성을 묶고,
                // 하나가 열리면 그룹으로 묶여진 다른 아코디언에 열려진게 있으면 닫아준다.
                self.on(eventBeforeExpand, function(e) {
                    $('.ui_accordion[data-accord-group=' + o.accordGroup + '], ' +
                            '.ui_accordion_list[data-accord-group=' + o.accordGroup + ']')
                        .not(self.$el).vcAccordion('collapse')
                        .find(o.itemSelector).removeClass(o.selectedClass);
                });
            }
        },

        _findSelected: function _findSelected() {
            return this.$items.filter('.' + self.options.selectedClass);
        },

        // 재정의
        _findItems: function _findItems() {
            var self = this,
                o = self.options,
                $items;

            if (o.accordType === 'detailview') {
                $items = self.$el;
            } else {
                $items = o.itemSelector ? self.$(o.itemSelector) : self.$el;
            }
            return $items;
        },

        _postCollapse: function _postCollapse(data) {
            var self = this;
        },
        _postExpand: function _postExpand(data) {
            var self = this,
                o = self.options;

            self._autoScroll(data);
        },

        _autoScroll: function _autoScroll(data) {
            var self = this,
                o = self.options,
                $con,
                scrollTop,
                top,
                sto;

            if (o.autoScroll) {
                if (o.autoScroll === true) {
                    $con = $('html, body');
                    scrollTop = $(data.header).offset().top;
                } else {
                    top = $(data.header).position().top;
                    $con = $(o.autoScroll);
                    scrollTop = top + $(o.autoScroll).scrollTop();
                }
                if (typeof o.scrollTopOffset === 'function') {
                    sto = o.scrollTopOffset();
                } else {
                    sto = o.scrollTopOffset;
                }
                $con.animate({
                    scrollTop: scrollTop + sto
                }, 'fast');
            }
        },
        /**
         * @param {number} index 인댁스
         * @param {boolean} isAni 애니메이션 여부
         * @param {function} callback 콜백함수
         * @fires vcui.ui,Accordion#accordion:beforeCollapse
         * @fires vcui.ui,Accordion#accordion:collapse
         */
        collapse: function collapse(index, isAni, cb) {
            var self = this,
                opts = self.options,
                data = {},
                // 애니메이션 시간
                $items = self._findItems(),
                oldIndex = $items.filter('.' + opts.selectedClass).index();

            if (arguments.length === 0 || index === null) {
                // index가 안넘어보면 현재 활성화된 패널의 index를 갖고 온다.
                index = oldIndex;
            }

            if (index < 0) {
                return;
            }

            data.index = index;
            data.oldIndex = oldIndex;
            data.header = $items.eq(index);
            data.content = data.header.find(opts.contentSelector);

            /**
             * 닫히기 전에 발생하는 이벤트
             * @event vcui.ui.Accordion#accordionbeforecollapse
             * @type {object}
             * @property {number} index 접혀질 인덱스번호
             */
            var ev = $.Event(eventBeforeCollapse);
            self.$el.triggerHandler(ev, data);
            if (ev.isDefaultPrevented()) {
                return;
            }

            if (typeof isAni === 'undefined') {
                isAni = self.options.useAnimate;
            }

            /**
             * 닫힌 후에 발생하는 이벤트
             * @event vcui.ui.Accordion#accordioncollapse
             * @type {object}
             * @property {number} index 닫힌 인덱스 번호
             */
            if (isAni !== false) {
                // 애니메이션 모드
                //if(this.isAnimate) { return; }
                data.header.removeClass(opts.selectedClass);
                data.content.slideUp(opts.duration, function() {
                    // 닫혀진 후에 이벤트 발생
                    self.trigger(eventCollapse, data);
                    self._updateButton(index, false);
                    self._postCollapse(data);
                    cb && cb();
                });
            } else {
                // 일반 모드
                data.header.removeClass(opts.selectedClass);
                data.content.hide();
                // 닫혀진 후에 이벤트 발생
                self.trigger(eventCollapse, data);
                self._updateButton(index, false);
                self._postCollapse(data);
                cb && cb();
            }
        },

        /**
         * 확장시키기
         * @param {number} index 인댁스
         * @param {boolean} isAni 애니메이션 여부
         * @param {function} callback 콜백함수
         * @fires vcui.ui,Accordion#accordion:beforeExpand
         * @fires vcui.ui,Accordion#accordion:expand
         */
        expand: function expand(index, isAni, callback) {
            var self = this,
                opts = self.options,
                $items,
                oldItem,
                oldIndex,
                newItem,
                data;

            if (arguments.length === 0) {
                return;
            }

            $items = self._findItems();
            newItem = $items.eq(index);
            oldItem = $items.filter('.' + opts.selectedClass);
            oldIndex = oldItem.index();
            data = {
                index: index,
                header: newItem,
                oldIndex: oldIndex,
                oldHeader: oldIndex < 0 ? null : oldItem
            };

            if (data.index === data.oldIndex) {
                return;
            }

            data.content = newItem.find(opts.contentSelector);
            data.oldContent = oldIndex < 0 ? null : oldItem.find(opts.contentSelector);

            /**
             * 열리기 전에 이벤트 발생
             * @event vcui.ui.Accordion#accordionbeforeexpand
             * @type {object}
             * @property {number} index 열린 인덱스
             */
            var ev = $.Event(eventBeforeExpand);
            self.trigger(ev, data);
            if (ev.isDefaultPrevented()) {
                return;
            }

            if (typeof isAni === 'undefined') {
                isAni = self.options.useAnimate;
            }

            /**
             * @event vcui.ui.Accordion#accordionexpand
             * @type {object}
             * @property {number} index 열린 인덱스.
             */
            if (isAni !== false) {
                // 애니메이션 사용
                self.isAnimate = true;
                if (opts.singleOpen && data.oldHeader) {
                    // 하나만 열리는 모드
                    data.oldHeader.removeClass(opts.selectedClass);
                    data.oldContent.slideUp(opts.duration, function() {
                        self._updateButton(data.oldIndex, false);
                        callback && callback();
                    });
                }
                data.header.addClass(opts.selectedClass);
                data.content.slideDown(opts.duration, function() {
                    self.isAnimate = false;
                    // 열려진 후에 이벤트 발생
                    self.trigger(eventExpand, data);
                    self._updateButton(index, true);
                    self._postExpand(data);
                    callback && callback();
                });
            } else {
                // 에니메이션 미사용
                if (opts.singleOpen && data.oldHeader) {
                    // 하나만 열리는 모드
                    data.oldHeader.removeClass(opts.selectedClass);
                    data.oldContent.hide();
                }
                data.header.addClass(opts.selectedClass);
                data.content.show();

                // 열려진 후에 이벤트 발생
                self.trigger(eventExpand, data);
                self._updateButton(index, true);
                self._postExpand(data);
                callback && callback();
            }
        },

        getActivate: function getActivate() {
            var self = this,
                o = self.options,
                item = self._findItems().filter('.' + o.selectedClass);

            if (item.length === 0) {
                return {
                    index: -1,
                    header: null,
                    content: null
                };
            } else {
                return {
                    index: item.index(),
                    header: item,
                    content: item.find(o.contentSelector)
                };
            }
        },

        _updateButton: function _updateButton(index, toggle) {
            var self = this,
                options = self.options,
                activeClass = options.activeClass,
                toggleClass = options.toggleButtonClass,
                $btn = self._findItems().eq(index).find(options.toggleSelector),
                $btnWrap = $btn.parent().parent(),
                closeText = $btn.attr('data-close-text') || '닫기',
                openText = $btn.attr('data-open-text') || '상세보기',
                to = toggle ? 'btn_open' : 'btn_close',
                from = toggle ? 'btn_close' : 'btn_open';

            if ($btn.is('a')) {
                if (toggle) {
                    $btnWrap.replaceClass(activeClass, toggleClass);
                } else {
                    $btnWrap.removeClass(toggleClass);
                }

                $btn.find('.ui_accord_text').html(function() {
                    return toggle ? closeText : openText;
                });
                $btnWrap.replaceClass(to, from);
            } else {
                if (toggle) {
                    $btnWrap.replaceClass(activeClass, toggleClass);
                } else {
                    $btnWrap.removeClass(toggleClass);
                }

                $btn.replaceClass(to, from).find('.ui_accord_text').html(function() {
                    return toggle ? closeText : openText;
                });
            }

            $btn.attr('aria-expanded', !!toggle).find('.btn_txt').html(toggle ? '닫기' : '상세보기');
        },

        collapseAll: function collapseAll() {
            var self = this,
                count = self._findItems().length;

            self.collapseMode = 'all';
            for (var i = 0; i < count; i++) {
                self.collapse(i, false);
            }
            self.collapseMode = null;
        },

        expandAll: function expandAll() {
            if (this.options.singleOpen) {
                return;
            }
            var self = this,
                count = self._findItems().length;

            self.expandMode = 'all';
            for (var i = 0; i < count; i++) {
                self.expand(i, false);
            }
            self.expandMode = null;
        }
    });

    return Accordion;
});
/**
 * 현대 상용차 역사 컴포넌트
 */
define('ui/behicleHistory', ['jquery', 'vcui', 'ui/spyScroll', 'ui/inviewScroll', 'ui/smoothScroll'], function($, core) {
    return core.ui('BehicleHistory', {
        bindjQuery: true,
        selectors: {
            list: '.yearList_wrap .list_wrap', // 연혁 리스트
            yearLabel: '.tab_open span', // 연혁 레이블
            scrollArea: '.yearList_wrap ul.list' // 스크롤 요소
        },
        initialize: function(el, options) {
            var self = this;

            if (self.supr(el, options) === false) {
                return;
            }

            // 190401_1 load 삭제
            //$(window).on('load', function () {
            //// 190401_1 load 삭제
                self._build();
                self._bindEvents();
            // 190401_1 load 삭제
            //});
            //// 190401_1 load 삭제
        },

        _build: function() {
            var self = this;

            // 로딩 때 부하를 주기 않기 위해 딜레이로 처리
            setTimeout(function() {
                $('.historyList .h3_tit').each(function() {
                    var $title = $(this);

                    // ios voiceover bug 에 대한 꽁수(하위요소가 두개이상일때 tabindex=-1가 안먹음.  그래서 aria-label로 대치)
                    $title.children().attr('aria-hidden', 'true');
                    $title.attr({
                        'aria-label': $title.text() + '년도 상용차 리스트',
                        'tabindex': -1
                    });
                });
            });

            // 상단 sticky
            self.$el.on('spyscrollactive', function(e, $anchor) {
                // 앵커 이동 컴포넌트에서 발생하는 이벤트로, 앵커가 활성화될 때 발생

                // 현재 활성화된 앵커를 레이블에 반영
                self.$yearLabel.text($anchor[0].childNodes[0].textContent);
                if (window.breakpoint.isPc && self.$list.data('ui_smoothScroll')) {
                    // pc일 때, 활성화된 앵커가 가운데에 오도록 스크롤
                    self.$list.vcSmoothScroll('scrollToActive');
                }
            }).vcSpyScroll({ // 해당 요소가 화면안에 들어왔을 때 연결된 앵커가 활성화되도록 해주는 컴포넌트
                selectors: {
                    links: '.item a'
                },
                // 앵커 클릭시 호출
                onSelect: function($target, index) {
                    var $title = $target.find('.h3_tit:first');

                    $title.focus(); // ios voiceover 포커싱 오류로 div가 아닌 text만 담고 있는 요소에 직접 포커싱
                    return false; // 기본 기능 무효화
                }
            });

        },

        _bindEvents: function() {
            var self = this;

            // pc에서는 옆으로 펼쳐져 있다가,
            // 모바일에서는 드롭다운으로 변경되기 때문에
            // 드롭다운으로서 작동하도록 이벤트 바인딩(.tab_open 버튼은 pc에서 숨겨져 있음)
            self.on('click', '.tab_open', function(e) {
                e.preventDefault();

                var $wrap = $(this).closest('.list_wrap');

                if ($wrap.hasClass('open')) {
                    self._close();
                } else {
                    self._open();
                }
            });

            // 항목을 클릭시
            self.on('click', '.list a', function(e) {
                if (window.breakpoint.isMobile) {
                    self._close();
                    self.$('.tab_open').focus();
                }
            });

            var fn;
            // pc에서는 커스텀스크롤 컴포넌트를 빌드하고
            // 모바일에서는 해제시켜 준다.
            self.winOn('breakpointchange', fn = function(e, data) {
                self._close();
                if (data.isMobile) {
                    self.$list.vcSmoothScroll('destroy');
                } else {
                    self.$list.vcSmoothScroll({
                        center: true,
                        prevButton: '.ui_smoothscroll_prev',
                        nextButton: '.ui_smoothscroll_next',
                        selectors: {
                            scroller: '>.list'
                        }
                    });
                }
            });
            fn(null, window.breakpoint);
        },
        /**
         * 드롭다운 리스트가 열릴 때
         * 활성화된 요소가 보이도록 스크롤처리 해준다.
         * @private
         */
        _scrollToActive: function() {
            var self = this;

            if (window.breakpoint.isMobile) {
                var pos = $('.on', self.$scrollArea.scrollTop(0)).position();

                if (pos) {
                    self.$scrollArea.scrollTop(pos.top - 60);
                }
            }
        },
        /**
         * 드롭다운 리스트 오픈
         * @private
         */
        _open: function() {
            var self = this;
            var $wrap = self.$('.year_list .list_wrap');

            $wrap.addClass('open');
            self._scrollToActive();

            setTimeout(function() {
                // 드롭다운 바깥영역에서 클릭하면 닫히도록...
                self.docOn('click', function(e) {
                    if ($.contains(self.$scrollArea.get(0), e.target)) {
                        return;
                    }
                    self._close();
                });
            }, 100)
        },
        /**
         * 드롭다운 리스트 클로즈
         * @private
         */
        _close: function() {
            var self = this;
            var $wrap = self.$('.year_list .list_wrap');

            $wrap.removeClass('open');
            self.docOff('click');
        }
    })
});
/*!
 * @module vcui.ui.BoardHeader
 * @license MIT License
 * @description BoardHeader 컴포넌트
 * @copyright VinylC UID Group.
 */
define('ui/boardHeader', ['jquery', 'vcui'], function($, core) {
    "use strict";

    // 게시판헤더 컴포넌트
    return core.ui('BoardHeader', {
        bindjQuery: true,
        defaults: {
            onSearch: function() {

            }
        },
        initialize: function(el, options) {
            var self = this;

            if (self.supr(el, options) === false) {
                return;
            }


            // 리스트 요소
            self.$list = self.$el.closest('.thumb_boardlist');

            self._buildARIA();
            self._bindEvents();
        },

        _buildARIA: function() {
            var self = this;

            self.$srOnly = $('<span class="sr_only">선택됨</span>');
            self.$toggles = $('.view_type button');

            // 히든텍스트로 돼 있던걸 title 로 변경 => ios voiceover bug
            self.$('.search_wrap .input_box :text').attr('title', '검색어를 입력해 주세요.').prop('disabled', true);
            self.$('.search_wrap .btn_open').attr('title', '검색영역 열기');
            self.$('.search_wrap .btn_close').attr('title', '검색영역 닫기');

            self._updateSrOnly();
        },

        /**
         * 리스트의 형식(리스트, 그리드)에 따라 해당 버튼으로 히든텍스트를 옮김
         * @private
         */
        _updateSrOnly: function() {
            var self = this;

            if (self.$list.hasClass('view_grid')) {
                self.$toggles.first().append(self.$srOnly); // 그리드 버튼
            } else {
                self.$toggles.last().append(self.$srOnly); // 리스트 버튼
            }
        },

        _bindEvents: function() {
            var self = this;

            // 리스트, 그리드 토글
            self.on('click', '.view_type button', function(e) {
                switch (this.className) {
                    case 'btn_list':
                        self.$list.removeClass('view_grid').addClass('view_list');
                        // 리스트의 형식이 바뀔 때 외부에서 무언가를 할 수 있도록 글로벌이벤트를 날려준다.
                        core.PubSub.trigger('common:toggleBoardType', {
                            type: 'list'
                        });
                        break;
                    case 'btn_grid':
                        self.$list.removeClass('view_list').addClass('view_grid');
                        // 리스트의 형식이 바뀔 때 외부에서 무언가를 할 수 있도록 글로벌이벤트를 날려준다.
                        core.PubSub.trigger('common:toggleBoardType', {
                            type: 'grid'
                        });
                        break;
                }

                self._updateSrOnly();
            });

            // 검색 토글 클릭시
            self.on('click', '.search_wrap .btn_open, .search_wrap .btn_close', function(e) {
                var isOpen = $(this).hasClass('btn_open'),
                    $wrap = self.$('.search_wrap');

                $wrap.toggleClass('open', isOpen);

                if (isOpen) {
                    $wrap.find('.input_box :input').prop('disabled', !isOpen); // 마크업이 open클래스에 따라 토글형식으로 해놓은게 아니고 뒤에 가려지게 해놓아서 포커스가 안가도록 disabled로 처리함..
                    $wrap.find('.btn_open').prop('disabled', true);
                    $wrap.find('input').focus();
                } else {
                    $wrap.find('.btn_open').prop('disabled', false).focus();
                    setTimeout(function() {
                        $wrap.find('.input_box :input').prop('disabled', !isOpen);
                    }, 200);
                }
            });

            self.on('submit', 'form', function(e) {
                e.preventDefault();

                var val = $(this).find('input[type=text]').val();

                // 밸리데이션 체크
                if (!core.string.trim(val)) {
                    alert('한 글자 이상을 입력해 주세요.');
                    $(this).find('input[type=text]').focus();
                    return;
                }

                // 둘러싸고 있는 폼이 서브밋 될 때, 기본 이벤트를 막고 onSearch 콜백함수를
                // 실행시켜 준다.
                self.options.onSearch(val);
            });
        },
        // 검색을 닫는다.
        closeSearch: function() {
            self.$('.search_wrap').removeClass('open');
            self.$('.search_wrap input').val('');
        }
    })
});
/*!
 * @module vcui.ui.BoardHeader
 * @license MIT License
 * @description BoardHeader 컴포넌트
 * @copyright VinylC UID Group.
 */
define(
    'ui/carInterior', ['jquery', 'vcui', 'libs/libpannellum', 'libs/pannellum'],
    function($, core) {

        // web gl 지원 여부 체크
        var supportWebGL = (function() {
            if (!!window.WebGLRenderingContext) {
                var canvas = document.createElement("canvas"),
                    names = ["webgl", "experimental-webgl", "moz-webgl", "webkit-3d"],
                    context = false;

                for (var i in names) {
                    try {
                        context = canvas.getContext(names[i]);
                        if (context && typeof context.getParameter === "function") {
                            return true;
                        }
                    } catch (e) {}
                }
            }

            return false;
        })();

        return core.ui('CarInterior', {
            bindjQuery: true,
            defaults: {
                "panorama": '', // 파노라마 이미지
                "preview": '', // 미리보기 이미지
                "autoLoad": false, // 처음에 자동으로 3d이미지를 로드할 것인가
                "showControls": false // 제어 버튼들을 표시할 것인가
            },
            selectors: {
                buttons: '.ui_carinterior_list button', // 토글(리스트, 그리드) 버튼
                viewer: '.ui_carinterior_viewer' // 뷰어
            },
            initialize: function(el, options) {
                var self = this;

                if (self.supr(el, options) === false) {
                    return;
                }

                self.$('.inner').css('height', '100%');
                self.viewerId = 'carinterior_' + core.getUniqId(3);

                if (!supportWebGL) {
                    self._unsupportBuild();
                    return;
                }

                self.buildARIA();
                self._bindEvents();
                self._activeButton(self.$buttons.first()); // 처음에 첫번째 활성화
                self.build(core.extend({}, self.options, self.$buttons.first().data())); // 첫번째 프리뷰 로드
            },

            buildARIA: function() {
                var self = this;

            },

            _bindEvents: function() {
                var self = this;

                // 칼라칩 버튼 클릭시
                self.on('click', '.ui_carinterior_list button', function(e) {
                    var $btn = $(this);

                    self._activeButton($btn);
                    self.build($btn.data());
                });

                // 상하좌우버튼 클릭시
                self.on('click', '.mobile_btns button', function(e) {
                    e.preventDefault();

                    // 3d이미지가 로드된 상태가 아니면 무효
                    if (!self.loadedPanorama || !self.viewer) {
                        return;
                    }

                    switch ($(this).data('direction')) {
                        case 'up':
                            self.viewer.setPitch(self.viewer.getPitch() + 10);
                            break;
                        case 'right':
                            self.viewer.setYaw(self.viewer.getYaw() + 10);
                            break;
                        case 'left':
                            self.viewer.setYaw(self.viewer.getYaw() - 10);
                            break;
                        case 'down':
                            self.viewer.setPitch(self.viewer.getPitch() - 10);
                            break;
                    }
                });

                /*// Make buttons work
                document.getElementById('zoom-in').addEventListener('click', function(e) {
                    viewer.setHfov(viewer.getHfov() - 10);
                });
                document.getElementById('zoom-out').addEventListener('click', function(e) {
                    viewer.setHfov(viewer.getHfov() + 10);
                });
                document.getElementById('fullscreen').addEventListener('click', function(e) {
                    viewer.toggleFullscreen();
                });*/

                // breakpoint가 바뀌면 해상도에 맞는 이미지로 빌드
                self.winOn('breakpointchange', function(e, breakpoint) {
                    self.build(self.$buttons.parent().filter('.on').children().data());
                });
            },

            /**
             * 컬러칩 버튼 활성화
             * @param $btn
             * @private
             */
            _activeButton: function($btn) {
                this.$buttons.removeClass('on');
                $btn.addClass('on').parent().activeItem('on');
            },

            /**
             * webl gl 을 지원하지 브라우저에서는 안내메세지는 표시
             */
            _unsupportBuild: function() {
                var self = this;
                var $el = self.$buttons.eq(0);
                var preview = '';

                if (window.breakpoint.isPc) {
                    preview = $el.data('pcPreview');
                } else {
                    preview = $el.data('mobilePreview');
                }

                self.$viewer.html('<div class="pnlm-container" tabindex="-1">' +
                    '<div class="pnlm-render-container">' +
                    '<div class="pnlm-preview-img" style=\'background-image: url("' + preview + '");\'></div>' +
                    '<div class="pnlm-error-msg pnlm-info-box" style="display: table;"><p>Your browser does not have the necessary WebGL support to display this panorama.</p></div>' +
                    '</div>' +
                    '</div>');
            },

            /**
             * panirama 라이브러리 빌드
             * @param options
             */
            build: function(options) {
                var self = this;
                var breakpoint = window.breakpoint;


                options = core.extend({}, self.options, options);
                options.preview = options[breakpoint.name + 'Preview'];
                options.panorama = options[breakpoint.name + 'Panorama'];

                if (self.currentPreview === options.preview) {
                    return;
                }

                self.loadedPanorama = false;
                self.currentPreview = options.preview;

                self.clear();

                setTimeout(function() {
                    self.$viewer.append('<div id="' + self.viewerId + '"></div>');
                    self.viewer = pannellum.viewer(self.viewerId, options);
                    self.viewer.on('beforeload', function() {
                        // I hate 웹접근성
                        if (core.detect.isIOS) {
                            self.$buttons.filter('.on').focus();
                        } else {
                            self.$('.ui_carinterior_viewer').attr('tabindex', -1).attr('title', 'VR 이미지 영역').focus();
                        }
                    });
                    self.viewer.on('load', function() {
                        self.loadedPanorama = true;
                        self.$el.addClass('loaded'); // 컨트롤 버튼 표시
                    });
                    self._updateLabelIntereriorButton();
                });
            },

            /**
             * // I hate 웹접근성
             * @private
             */
            _updateLabelIntereriorButton: function() {
                var self = this;

                self.$viewer.find('.pnlm-load-button')
                    .attr('title', !core.detect.isTouch ? '키보드 좌, 우, 상, 하 버튼으로 화면을 제어할 수 있습니다.' : '')
                    .append('<span class="sr_only">' + self.$buttons.filter('.on').attr('data-name') + ' 내부 인테리어 보기</span>');
            },

            /**
             * 초기화
             */
            clear: function() {
                var self = this;

                self.loadedPanorama = false;
                if (self.viewer) {
                    self.viewer.destroy();
                }
                self.$viewer.empty();
                self.viewer = null;
                self.$el.removeClass('loaded');
            }

        });

        /*viewer = pannellum.viewer('panorama', ﻿{
            "panorama": "/images/alma-correlator-facility.jpg",
            "autoLoad": true,
            "showControls": false
        });

        // Make buttons work
        document.getElementById('pan-up').addEventListener('click', function(e) {
            viewer.setPitch(viewer.getPitch() + 10);
        });
        document.getElementById('pan-down').addEventListener('click', function(e) {
            viewer.setPitch(viewer.getPitch() - 10);
        });
        document.getElementById('pan-left').addEventListener('click', function(e) {
            viewer.setYaw(viewer.getYaw() - 10);
        });
        document.getElementById('pan-right').addEventListener('click', function(e) {
            viewer.setYaw(viewer.getYaw() + 10);
        });
        document.getElementById('zoom-in').addEventListener('click', function(e) {
            viewer.setHfov(viewer.getHfov() - 10);
        });
        document.getElementById('zoom-out').addEventListener('click', function(e) {
            viewer.setHfov(viewer.getHfov() + 10);
        });
        document.getElementById('fullscreen').addEventListener('click', function(e) {
            viewer.toggleFullscreen();
        });
        */
    });
/*!
 Version: 1.7.1
  Author: Ken Wheeler
 Website: http://kenwheeler.github.io
    Docs: http://kenwheeler.github.io/slick
    Repo: http://github.com/kenwheeler/slick
  Issues: http://github.com/kenwheeler/slick/issues

 */
/* global window, document, define, jQuery, setInterval, clearInterval */
/*!
 * @module vcui.ui.Carousel
 * @license MIT License
 * @description 캐로우셀 컴포넌트
 * @copyright VinylC UID Group.
 */
define('ui/carousel', ['jquery', 'vcui'], function($, core) {
    "use strict";

    var prefixModule = 'ui_carousel_';
    var _N = 'carousel';
    var _V = {
        INDEX: prefixModule + 'index',
        ACTIVE: 'on', //'slick-active',
        ARROW: prefixModule + 'arrow',
        INITIALIZED: prefixModule + 'initialized',
        PLAY: prefixModule + 'play',
        HIDDEN: prefixModule + 'hidden',
        DISABLED: 'disabled',
        DOTS: prefixModule + 'dots',
        SLIDE: prefixModule + 'slide',
        SLIDER: prefixModule + 'slider',
        CLONED: prefixModule + 'cloned',
        TRACK: prefixModule + 'track',
        LIST: prefixModule + 'list',
        LOADING: prefixModule + 'loading',
        CENTER: prefixModule + 'center',
        VISIBLE: prefixModule + 'visible',
        CURRENT: prefixModule + 'current',
        SRONLY: 'sr_only',
        PREV: prefixModule + 'prev',
        NEXT: prefixModule + 'next',

        UNBUILD: 'unbuild'
    };

    function addEventNS(str) {
        var pairs = str.split(' ');
        for (var i = -1, item; item = pairs[++i];) {
            pairs[i] = item + '.' + _N;
        }
        return pairs.join(' ');
    }

    var REGEX_HTML = /^(?:\s*(<[\w\W]+>)[^>]*)$/;
    var instanceUid = 0;
    var componentInitials = {
        animating: false,
        dragging: false,
        autoPlayTimer: null,
        currentDirection: 0,
        currentLeft: null,
        currentSlide: 0,
        direction: 1,
        $dots: null,
        listWidth: null,
        listHeight: null,
        loadIndex: 0,
        $nextArrow: null,
        $prevArrow: null,
        $playButton: null,
        scrolling: false,
        slideCount: null,
        slideWidth: null,
        $slideTrack: null,
        $slides: null,
        sliding: false,
        slideOffset: 0,
        swipeLeft: null,
        swiping: false,
        $list: null,
        touchObject: {},
        transformsEnabled: false,
        unbuilded: false
    };

    var Carousel = core.ui('Carousel', {
        bindjQuery: _N,
        defaults: {
            activeClass: _V.ACTIVE, // 활성 css 클래스
            dotsSelector: '.' + _V.DOTS, // 인디케이터 셀렉터
            playSelector: '.' + _V.PLAY, // 재생 버튼 셀렉터
            carouselTitle: '', // 제목

            accessibility: true, // 접근성 속성(aria-)들을 붙일것인가
            adaptiveHeight: false, // 높이를 유동적으로 할것인가
            appendArrows: '.' + _V.ARROW, // 좌우 버튼을 넣을 요소
            appendDots: '.' + _V.DOTS, // 인디케이터를 넣을 요소
            arrows: true, // 좌우버튼을 표시할 것인가
            arrowsUpdate: 'disabled', // or 'toggle', 좌우버튼이 비활성화될 때 처리할 방식
            asNavFor: null, // 두 Carousel간에 연동할 때 다른 Carousel 객체
            prevArrow: '.' + _V.PREV, // 이전 버튼 셀렉터
            nextArrow: '.' + _V.NEXT, // 이후 버튼 셀렉터
            autoplay: false, // 자동 재생 여부
            autoplaySpeed: 5000, // 자동 재생 속도
            centerMode: false, // 활성화된 슬라이드를 가운데에 위치시킬 것인가...
            centerPadding: '50px', // centerMode가 true일 때 슬라이드간의 간격
            cssEase: 'ease', // css ease
            customPaging: function customPaging(carousel, i) { // 인디케이터 버튼 마크업
                return $('<button type="button" />').text(i + 1);
            },
            dots: true, // 인디케이터 사용 여부
            buildDots: true,

            dotsClass: _V.DOTS, // 인디케이터 css 클래스
            draggable: true, // 마우스로 슬라이드가 되도록 허용할 것인가
            easing: 'linear', // slide easing 타입
            edgeFriction: 0.35, // infinite:false일 때 끝에 다다랐을 때의 바운싱 효과 크기
            fade: false, // 슬라이딩이 아닌 fade in/out으로 할 것인가
            focusOnSelect: false, // 선택한 요소에 포커싱 사용
            focusOnChange: false, // 활성화후에 포커싱시킬 것인가
            infinite: true, // 무한루프 사용 여부
            initialSlide: 0, // 처음 로딩시에 활성화시킬 슬라이드 인덱스
            autoScrollActive: false, // 처음 로딘시 on클래스가 있는 슬라이드로 슬라이드 시킬 것인가
            lazyLoad: 'ondemand', // or progressive. 지연로딩 방식을 설정
            mobileFirst: false, // 반응형 모드일 때 모바일 사이즈를 우선으로 할 것인가
            pauseOnHover: true, // 마우스가 들어왔을 때 잠시 자동재생을 멈출 것인가
            pauseOnFocus: true, // 포커싱됐을 때 잠시 자동재생을 멈출 것인가
            pauseOnDotsHover: false, // 인디케이터 영역에 마우스가 들어왔을 때 잠시 자동재생을 멈출 것인가
            respondTo: 'window', // 반응형모드일 때 어느 요소의 사이즈에 맞출 것인가
            responsive: null, // 브레이크포인트에 따른 설정값들
            rows: 1, // 1보가 크면 그리드모양으로 배치된다.
            rtl: false, // right to left
            slide: '.' + _V.TRACK + '>*', // 슬라이드 셀렉터
            slidesPerRow: 1, // rows가 1보다 클 경우 행별 슬라이드 수
            slidesToShow: 1, // 표시할 슬라이드 수
            slidesToScroll: 1, // 슬라이딩될 때 한번에 움직일 갯수
            speed: 800, // 슬라이딩 속도
            swipe: true, // 스와이핑 허용 여부
            swipeToSlide: false, // 사용자가 slidesToScroll과 관계없이 슬라이드로 직접 드래그 또는 스 와이프 할 수 있도록 허용
            touchMove: true, // 터치로 슬라이드 모션 사용
            touchThreshold: 5, // 슬라이드를 진행하려면 사용자는 슬라이더의 너비 (1 / touchThreshold) * 너비를 스 와이프해야합니다
            useCSS: true, // CSS 전환 활성화 / 비활성화
            useTransform: true, // CSS 변환 활성화 / 비활성화
            variableWidth: false, // 가변 너비 슬라이드
            vertical: false, // 세로 슬라이드 모드
            verticalSwiping: false, // 수직 스 와이프 모드
            preventVertical: false, // 슬라이딩 할 때 수직으로 움직이는 걸 막을 것인가.
            waitForAnimate: true, // 애니메이션을 적용하는 동안 슬라이드를 앞으로 이동하라는 요청을 무시합니다.
            zIndex: 1000, // 슬라이드의 zIndex 값 설정, IE9 이하의 경우 유용함
            activeHover: false,
            additionWidth: 0 // 모듈이 내부 너비를 제대로 계산 못할 때 가감할 너비를 설정
        },
        initialize: function initialize(element, options) {

            var self = this;
            var $el = $(element);

            if ($el.find('.' + _V.TRACK + '>*').length <= 1) {
                $el.find('.' + _V.NEXT + ', .' + _V.PREV + ', .' + _V.DOTS + ', .' + _V.PLAY).hide();
                return;
            }

            if (self.supr(element, options) === false) {
                return;
            }

            core.extend(self, componentInitials);
            if (!self.options.activeClass) {
                self.options.activeClass = _V.ACTIVE;
            }

            self.activeBreakpoint = null;
            self.animType = null;
            self.animProp = null;
            self.breakpoints = [];
            self.breakpointSettings = [];
            self.cssTransitions = false;
            // self.focussed = false;
            self.inactive = false;
            self.interrupted = false;
            self.paused = true;
            self.positionProp = null;
            self.respondTo = null;
            self.rowCount = 1;
            self.shouldClick = true;
            self.$slider = $(element);
            self.$slidesCache = null;
            self.transformType = null;
            self.transitionType = null;
            self.hidden = 'hidden';
            self.visibilityChange = 'visibilitychange';
            self.windowWidth = 0;
            self.windowTimer = null;
            self.currentSlide = self.options.initialSlide;
            self.originalSettings = self.options;

            if (typeof document.mozHidden !== 'undefined') {
                self.hidden = 'mozHidden';
                self.visibilityChange = 'mozvisibilitychange';
            } else if (typeof document.webkitHidden !== 'undefined') {
                self.hidden = 'webkitHidden';
                self.visibilityChange = 'webkitvisibilitychange';
            }

            self.autoPlay = self.autoPlay.bind(self);
            self.autoPlayClear = self.autoPlayClear.bind(self);
            self.autoPlayIterator = self.autoPlayIterator.bind(self);
            self.changeSlide = self.changeSlide.bind(self);
            self.clickHandler = self.clickHandler.bind(self);
            self.selectHandler = self.selectHandler.bind(self);
            self.setPosition = self.setPosition.bind(self);
            self.swipeHandler = self.swipeHandler.bind(self);
            self.keyHandler = self.keyHandler.bind(self);

            self.instanceUid = instanceUid++;

            // A simple way to check for HTML strings
            // Strict HTML recognition (must start with <)
            // Extracted from jQuery v1.11 source
            self.htmlExpr = REGEX_HTML;

            self.registerBreakpoints();
            self.init(true);
        },
        activateADA: function activateADA(flag) {
            var self = this;
            var opt = self.options;

            self.$slideTrack.find('.' + opt.activeClass + ', .ui_carousel_current, .ui_carousel_center').attr({
                'aria-hidden': 'false'
            }).find('a, input, button, select').attr({
                'tabindex': ''
            });
        },
        addSlide: function addSlide(markup, index, addBefore) {

            var self = this;
            var opt = self.options;

            if (typeof index === 'boolean') {
                addBefore = index;
                index = null;
            } else if (index < 0 || index >= self.slideCount) {
                return false;
            }

            self.unload();

            if (typeof index === 'number') {
                if (index === 0 && self.$slides.length === 0) {
                    $(markup).appendTo(self.$slideTrack);
                } else if (addBefore) {
                    $(markup).insertBefore(self.$slides.eq(index));
                } else {
                    $(markup).insertAfter(self.$slides.eq(index));
                }
            } else {
                if (addBefore === true) {
                    $(markup).prependTo(self.$slideTrack);
                } else {
                    $(markup).appendTo(self.$slideTrack);
                }
            }

            self.$slides = self.$slideTrack.children(opt.slide);
            // comahead
            self.$slides.css('float', 'left');

            self.$slideTrack.children(opt.slide).detach();

            self.$slideTrack.append(self.$slides);

            self.$slides.each(function(index, element) {
                $(element).attr('data-' + _V.INDEX, index);
            });

            self.$slidesCache = self.$slides;

            self.reinit();
        },
        animateHeight: function animateHeight() {
            var self = this;
            var opt = self.options;

            if (opt.slidesToShow === 1 && opt.adaptiveHeight === true && opt.vertical === false) {
                var targetHeight = self.$slides.eq(self.currentSlide).outerHeight(true);
                self.$list.animate({
                    height: targetHeight
                }, opt.speed);
            }
        },
        animateSlide: function animateSlide(targetLeft, callback) {

            var animProps = {},
                self = this,
                opt = self.options;

            self.animateHeight();

            if (opt.rtl === true && opt.vertical === false) {
                targetLeft = -targetLeft;
            }
            if (self.transformsEnabled === false) {
                if (opt.vertical === false) {
                    self.$slideTrack.animate({
                        left: targetLeft
                    }, opt.speed, opt.easing, callback);
                } else {
                    self.$slideTrack.animate({
                        top: targetLeft
                    }, opt.speed, opt.easing, callback);
                }
            } else {

                if (self.cssTransitions === false) {
                    if (opt.rtl === true) {
                        self.currentLeft = -self.currentLeft;
                    }
                    $({
                        animStart: self.currentLeft
                    }).animate({
                        animStart: targetLeft
                    }, {
                        duration: opt.speed,
                        easing: opt.easing,
                        step: function step(now) {
                            now = Math.ceil(now);
                            if (opt.vertical === false) {
                                animProps[self.animType] = 'translate(' + now + 'px, 0px)';
                                self.$slideTrack.css(animProps);
                            } else {
                                animProps[self.animType] = 'translate(0px,' + now + 'px)';
                                self.$slideTrack.css(animProps);
                            }
                        },
                        complete: function complete() {
                            if (callback) {
                                callback.call();
                            }
                        }
                    });
                } else {

                    self.applyTransition();
                    targetLeft = Math.ceil(targetLeft);

                    if (opt.vertical === false) {
                        animProps[self.animType] = 'translate3d(' + targetLeft + 'px, 0px, 0px)';
                    } else {
                        animProps[self.animType] = 'translate3d(0px,' + targetLeft + 'px, 0px)';
                    }
                    self.$slideTrack.css(animProps);

                    if (callback) {
                        setTimeout(function() {

                            self.disableTransition();

                            callback.call();
                        }, opt.speed);
                    }
                }
            }
        },
        getNavTarget: function getNavTarget() {

            var self = this,
                opt = self.options,
                asNavFor = opt.asNavFor;

            if (asNavFor && asNavFor !== null) {
                asNavFor = $(asNavFor).not(self.$slider);
            }

            return asNavFor;
        },
        asNavFor: function asNavFor(index) {

            var self = this,
                asNavFor = self.getNavTarget();

            if (asNavFor !== null && (typeof asNavFor === 'undefined' ? 'undefined' : _typeof(asNavFor)) === 'object') {
                asNavFor.each(function() {
                    var target = $(this).vcCarousel('instance');
                    if (!target.unbuilded) {
                        target.slideHandler(index, true);
                    }
                });
            }
        },
        applyTransition: function applyTransition(slide) {

            var self = this,
                transition = {},
                opt = self.options;

            if (opt.fade === false) {
                transition[self.transitionType] = self.transformType + ' ' + opt.speed + 'ms ' + opt.cssEase;
            } else {
                transition[self.transitionType] = 'opacity ' + opt.speed + 'ms ' + opt.cssEase;
            }

            if (opt.fade === false) {
                self.$slideTrack.css(transition);
            } else {
                self.$slides.eq(slide).css(transition);
            }
        },
        autoPlay: function autoPlay() {

            var self = this;
            var opt = self.options;

            self.autoPlayClear();

            if (!self.options.autoplay) {
                return;
            }

            if (self.slideCount > opt.slidesToShow) {
                self.autoPlayTimer = setInterval(self.autoPlayIterator, opt.autoplaySpeed);
            }
        },
        autoPlayClear: function autoPlayClear() {

            var self = this;

            if (self.autoPlayTimer) {
                clearInterval(self.autoPlayTimer);
            }
        },
        autoPlayIterator: function autoPlayIterator() {

            var self = this,
                opt = self.options,
                slideTo = self.currentSlide + opt.slidesToScroll;

            if (!self.paused && !self.interrupted && self.inactive /*!self.focussed*/ ) {

                if (opt.infinite === false) {

                    if (self.direction === 1 && self.currentSlide + 1 === self.slideCount - 1) {
                        self.direction = 0;
                    } else if (self.direction === 0) {

                        slideTo = self.currentSlide - opt.slidesToScroll;

                        if (self.currentSlide - 1 === 0) {
                            self.direction = 1;
                        }
                    }
                }

                self.slideHandler(slideTo);
            }
        },
        buildArrows: function buildArrows() {

            var self = this,
                opt = self.options,
                $p,
                $n;

            if (opt.arrows === true) {
                $p = self.$prevArrow = self.$(opt.prevArrow).addClass(_V.ARROW).attr('title', '이전 슬라이드 보기');
                $n = self.$nextArrow = self.$(opt.nextArrow).addClass(_V.ARROW).attr('title', '다음 슬라이드 보기');

                if (self.slideCount > opt.slidesToShow) {

                    $p.removeClass(_V.HIDDEN).removeAttr('aria-hidden tabindex');
                    $n.removeClass(_V.HIDDEN).removeAttr('aria-hidden tabindex');

                    if (self.htmlExpr.test(opt.prevArrow)) {
                        $p.prependTo(opt.appendArrows);
                    }

                    if (self.htmlExpr.test(opt.nextArrow)) {
                        $n.appendTo(opt.appendArrows);
                    }

                    if (opt.infinite !== true) {
                        $p.addClass(_V.DISABLED)
                            .prop('disabled', true)
                            .attr('aria-disabled', 'true')
                            .attr('title', '더이상 이전 슬라이드가 없습니다.');
                    }
                } else {

                    $p.add($n).addClass(_V.HIDDEN).attr({
                        'aria-disabled': 'true',
                        'tabindex': '-1'
                    });
                }
            }
        },
        buildDots: function buildDots() {

            var self = this,
                opt = self.options,
                i,
                dots,
                dot,
                cloned;

            if (opt.dots === true) {

                self.$slider.addClass(_V.DOTS);

                if (opt.dotsSelector) {
                    dots = self.$slider.find(opt.dotsSelector).show().addClass('ui_static');
                    if (opt.buildDots === false) {
                        self.$dots = dots;
                        dots.find('li').removeClass(opt.activeClass).first().addClass(opt.activeClass);
                        return;
                    }

                    if (dots.children().length || self.staticDot) {
                        if (self.staticDot) {
                            dot = self.staticDot;
                        } else {
                            dot = dots.children().first();
                            self.staticDot = dot;
                        }
                        dots.empty();
                        if (!opt.carouselTitle) {
                            opt.carouselTitle = dot.find('.' + _V.SRONLY).text();
                        }
                        for (i = 0; i <= self.getDotCount(); i += 1) {
                            dots.append(cloned = dot.clone().removeClass(opt.activeClass));
                            cloned.find('.' + _V.SRONLY).text(opt.carouselTitle.replace(/{{no}}/, i + 1));
                        }
                        dot = null;
                    } else {
                        for (i = 0; i <= self.getDotCount(); i += 1) {
                            dots.append($('<li />').append(opt.customPaging.call(this, self, i)));
                        }
                    }
                } else {
                    dots = $('<ul />');
                    dots.addClass(opt.dotsClass);
                    dots.appendTo(opt.appendDots);
                    for (i = 0; i <= self.getDotCount(); i += 1) {
                        dots.append($('<li />').append(opt.customPaging.call(this, self, i)));
                    }
                }
                self.$dots = dots;
                dots.find('li').first().addClass(opt.activeClass);
            } else {
                self.$dots = $();
            }
        },
        buildOut: function buildOut() {

            var self = this,
                opt = self.options;

            self.$slides = self.$slider.find(opt.slide + ':not(' + _V.CLONED + ')').addClass(_V.SLIDE);
            // comahead
            self.$slides.css('float', 'left');

            self.slideCount = self.$slides.length;

            self.$slides.each(function(index, element) {
                $(element).attr('data-' + _V.INDEX, index).data('originalStyling', $(element).attr('style') || '');
            });

            self.$slider.attr('role', 'toolbar').addClass(_V.SLIDER);

            if ((self.$slideTrack = self.$slider.find('.' + _V.TRACK)).length === 0) {
                self.$slideTrack = self.slideCount === 0 ? $('<div class="' + _V.TRACK + '"/>').appendTo(self.$slider) : self.$slides.wrapAll('<div class="' + _V.TRACK + '"/>').parent();
            } else {
                self.$slideTrack.addClass('ui_static');
            }

            if ((self.$list = self.$slider.find('.' + _V.LIST)).length === 0) {
                self.$list = self.$slideTrack.wrap('<div class="' + _V.LIST + '"/>').parent();
            } else {
                self.$list.addClass('ui_static');
            }

            self.$list.css('overflow', 'hidden');
            self.$slideTrack /*.attr('role', 'listbox')*/ .css('opacity', 0);

            if (opt.centerMode === true || opt.swipeToSlide === true) {
                opt.slidesToScroll = 1;
            }

            $('img[data-lazy]', self.$slider).not('[src]').addClass(_V.LOADING);

            self.setupInfinite();

            self.buildArrows();

            self.buildDots();

            self.updateDots();

            self.setSlideClasses(typeof self.currentSlide === 'number' ? self.currentSlide : 0);

            if (opt.draggable === true) {
                self.$list.addClass('draggable');
            }
        },
        buildRows: function buildRows() {

            var self = this,
                opt = self.options,
                a,
                b,
                c,
                newSlides,
                numOfSlides,
                originalSlides,
                slidesPerSection;

            newSlides = document.createDocumentFragment();
            originalSlides = self.$slider.children();

            if (opt.rows > 1) {

                slidesPerSection = opt.slidesPerRow * opt.rows;
                numOfSlides = Math.ceil(originalSlides.length / slidesPerSection);

                for (a = 0; a < numOfSlides; a++) {
                    var slide = document.createElement('div');
                    for (b = 0; b < opt.rows; b++) {
                        var row = document.createElement('div');
                        for (c = 0; c < opt.slidesPerRow; c++) {
                            var target = a * slidesPerSection + (b * opt.slidesPerRow + c);
                            if (originalSlides.get(target)) {
                                row.appendChild(originalSlides.get(target));
                            }
                        }
                        slide.appendChild(row);
                    }
                    newSlides.appendChild(slide);
                }

                self.$slider.empty().append(newSlides);
                self.$slider.children().children().children().css({
                    'width': 100 / opt.slidesPerRow + '%',
                    'display': 'inline-block'
                });
            }
        },

        _getTargetBreakpoint: function _getTargetBreakpoint() {
            var self = this,
                b = self.breakpoints,
                breakpoint,
                respondToWidth,
                targetBreakpoint = null;

            switch (self.responseTo) {
                case 'carousel':
                    respondToWidth = self.$slider.width();
                    break;
                case 'min':
                    respondToWidth = Math.min(window.innerWidth || $(window).width(), self.$slider.width());
                    break;
                default:
                    respondToWidth = window.innerWidth || $(window).width();
                    break;
            }

            for (breakpoint in b) {
                if (b.hasOwnProperty(breakpoint)) {
                    if (self.originalSettings.mobileFirst === false) {
                        if (respondToWidth < b[breakpoint]) {
                            targetBreakpoint = b[breakpoint];
                        }
                    } else {
                        if (respondToWidth > b[breakpoint]) {
                            targetBreakpoint = b[breakpoint];
                        }
                    }
                }
            }
            return targetBreakpoint;
        },

        checkResponsive: function checkResponsive(initial, forceUpdate) {

            var self = this,
                opt = self.options,
                bs = self.breakpointSettings,
                targetBreakpoint,
                triggerBreakpoint = false;

            if (opt.responsive && opt.responsive.length) {

                targetBreakpoint = self._getTargetBreakpoint();

                if (targetBreakpoint !== null) {
                    if (self.activeBreakpoint !== null) {
                        if (targetBreakpoint !== self.activeBreakpoint || forceUpdate) {
                            self.activeBreakpoint = targetBreakpoint;
                            if (bs[targetBreakpoint] === _V.UNBUILD) {
                                self.unbuild(targetBreakpoint);
                            } else {
                                self.options = opt = $.extend({}, self.originalSettings, bs[targetBreakpoint]);
                                if (initial === true) {
                                    self.currentSlide = opt.initialSlide;
                                }

                                self.refresh(initial);
                            }
                            triggerBreakpoint = targetBreakpoint;
                        }
                    } else {
                        self.activeBreakpoint = targetBreakpoint;
                        if (bs[targetBreakpoint] === _V.UNBUILD) {
                            self.unbuild(targetBreakpoint);
                        } else {
                            self.options = $.extend({}, self.originalSettings, bs[targetBreakpoint]);
                            if (initial === true) {
                                self.currentSlide = opt.initialSlide;
                            }
                            self.refresh(initial);
                        }
                        triggerBreakpoint = targetBreakpoint;
                    }
                } else {
                    if (self.activeBreakpoint !== null) {
                        self.activeBreakpoint = null;
                        self.options = opt = self.originalSettings;
                        if (initial === true) {
                            self.currentSlide = opt.initialSlide;
                        }
                        self.refresh(initial);
                        triggerBreakpoint = targetBreakpoint;
                    }
                }

                // only trigger breakpoints during an actual break. not on initialize.
                if (!initial && triggerBreakpoint !== false) {
                    self.triggerHandler(_N + 'breakpoint', [self, triggerBreakpoint]);
                }
            }
        },
        changeSlide: function changeSlide(event, dontAnimate) {

            var self = this,
                opt = self.options,
                $target = $(event.currentTarget),
                indexOffset,
                slideOffset,
                unevenOffset;

            // If target is a link, prevent default action.
            if ($target.is('a')) {
                event.preventDefault();
            }

            // If target is not the <li> element (ie: a child), find the <li>.
            if (!$target.is('li')) {
                $target = $target.closest('li');
            }

            unevenOffset = self.slideCount % opt.slidesToScroll !== 0;
            indexOffset = unevenOffset ? 0 : (self.slideCount - self.currentSlide) % opt.slidesToScroll;

            switch (event.data.message) {

                case 'previous':
                    slideOffset = indexOffset === 0 ? opt.slidesToScroll : opt.slidesToShow - indexOffset;
                    if (self.slideCount > opt.slidesToShow) {
                        self.slideHandler(self.currentSlide - slideOffset, false, dontAnimate);
                    }
                    break;

                case 'next':
                    slideOffset = indexOffset === 0 ? opt.slidesToScroll : indexOffset;
                    if (self.slideCount > opt.slidesToShow) {
                        self.slideHandler(self.currentSlide + slideOffset, false, dontAnimate);
                    }
                    break;

                case 'index':
                    var index = event.data.index === 0 ? 0 : event.data.index || $target.index() * opt.slidesToScroll;

                    self.slideHandler(self.checkNavigable(index), false, dontAnimate);
                    //comahead: $target.children().trigger('focus');
                    break;

                default:
                    return;
            }
        },
        checkNavigable: function checkNavigable(index) {

            var self = this,
                opt = self.options,
                navigables,
                prevNavigable;

            navigables = self.getNavigableIndexes();
            prevNavigable = 0;
            if (index > navigables[navigables.length - 1]) {
                index = navigables[navigables.length - 1];
            } else {
                for (var n in navigables) {
                    if (index < navigables[n]) {
                        index = prevNavigable;
                        break;
                    }
                    prevNavigable = navigables[n];
                }
            }

            return index;
        },
        cleanUpEvents: function cleanUpEvents() {

            var self = this,
                opt = self.options;

            if (opt.dots && self.$dots !== null) {

                $('li', self.$dots).off('click.' + _N, self.changeSlide).off('mouseenter.' + _N).off('mouseleave.' + _N);

                if (opt.accessibility === true) {
                    self.$dots.off('keydown.' + _N, self.keyHandler);
                }
            }

            self.$slider.off('focus.' + _N + ' blur.' + _N);

            if (opt.arrows === true && self.slideCount > opt.slidesToShow) {
                self.$prevArrow && self.$prevArrow.off('click.' + _N, self.changeSlide);
                self.$nextArrow && self.$nextArrow.off('click.' + _N, self.changeSlide);
            }

            self.$list.off('touchstart.' + _N + ' mousedown.' + _N, self.swipeHandler);
            self.$list.off('touchmove.' + _N + ' mousemove.' + _N, self.swipeHandler);
            self.$list.off('touchend.' + _N + ' mouseup.' + _N, self.swipeHandler);
            self.$list.off('touchcancel.' + _N + ' mouseleave.' + _N, self.swipeHandler);

            self.$list.off('click.' + _N, self.clickHandler);

            $(document).off(self.visibilityChange, self.visibility);

            self.cleanUpSlideEvents();

            if (opt.accessibility === true) {
                self.$list.off('keydown.' + _N, self.keyHandler);
            }

            if (opt.focusOnSelect === true) {
                $(self.$slideTrack).children().off('click.' + _N, self.selectHandler);
            }

            $(window).off('orientationchange.' + _N + '-' + self.instanceUid, self.orientationChange);

            $(window).off('resize.' + _N + '-' + self.instanceUid, self.resize);

            $('[draggable!=true]', self.$slideTrack).off('dragstart', self.preventDefault);

            $(window).off('load.' + _N + '-' + self.instanceUid, self.setPosition);
            $(document).off('ready.' + _N + '-' + self.instanceUid, self.setPosition);
        },
        cleanUpSlideEvents: function cleanUpSlideEvents() {

            var self = this,
                opt = self.options;

            self.$list.off('mouseenter.' + _N);
            self.$list.off('mouseleave.' + _N);
        },
        cleanUpRows: function cleanUpRows() {

            var self = this,
                opt = self.options,
                originalSlides;

            if (opt.rows > 1) {
                originalSlides = self.$slides.children().children();
                originalSlides.removeAttr('style');
                self.$slider.empty().append(originalSlides);
            }
        },
        clickHandler: function clickHandler(event) {

            var self = this,
                opt = self.options;

            if (self.shouldClick === false) {
                event.stopImmediatePropagation();
                event.stopPropagation();
                event.preventDefault();
            }
        },
        destroy: function destroy(refresh) {

            var self = this,
                opt = self.options;

            self.autoPlayClear();

            self.touchObject = {};

            self.cleanUpEvents();

            $(_V.CLONED, self.$slider).detach();

            if (self.$dots) {
                if (self.$dots.hasClass('ui_static')) {
                    self.$dots.empty().removeClass('ui_static');
                } else {
                    self.$dots.remove();
                }
            }

            if (self.$prevArrow && self.$prevArrow.length) {

                self.$prevArrow.removeClass(_V.DISABLED + ' ' + _V.ARROW + ' ' + _V.HIDDEN).prop('disabled', false).removeAttr('aria-hidden aria-disabled tabindex').css('display', '');

                if (self.htmlExpr.test(opt.prevArrow)) {
                    self.$prevArrow.remove();
                }
            }

            if (self.$nextArrow && self.$nextArrow.length) {

                self.$nextArrow.removeClass(_V.DISABLED + ' ' + _V.ARROW + ' ' + _V.HIDDEN).prop('disabled', false).removeAttr('aria-hidden aria-disabled tabindex').css('display', '');

                if (self.htmlExpr.test(opt.nextArrow)) {
                    self.$nextArrow.remove();
                }
            }

            if (self.$slides) {

                var isMarkuped = self.$slideTrack.hasClass('ui_static');
                // comahead
                self.$slides.css('float', '');

                self.$slides.removeClass(_V.SLIDE + ' ' + opt.activeClass + ' ' + _V.CENTER + ' ' + _V.VISIBLE + ' ' + _V.CURRENT)
                    .removeAttr('aria-hidden data-' + _V.INDEX + ' tabindex role')
                    .each(function() {
                        $(this).attr('style', $(this).data('originalStyling'));
                    });

                if (isMarkuped) {
                    self.$list.off().removeClass('ui_static');
                    self.$slideTrack.attr('style', '').off().removeClass('ui_static');
                    self.$slideTrack.empty().append(self.$slides);
                } else {
                    self.$slideTrack.children(this.options.slide).detach();
                    self.$slideTrack.detach();
                    self.$list.detach();
                    self.$slider.append(self.$slides);
                }
            }

            self.cleanUpRows();

            self.$slider.removeClass(_V.SLIDER);
            self.$slider.removeClass(_V.INITIALIZED);
            self.$slider.removeClass(_V.DOTS);

            self.unbuilded = true;

            if (!refresh) {
                self.triggerHandler('destroy', [self]);
            }
        },
        disableTransition: function disableTransition(slide) {

            var self = this,
                opt = self.options,
                transition = {};

            transition[self.transitionType] = '';

            if (opt.fade === false) {
                self.$slideTrack.css(transition);
            } else {
                self.$slides.eq(slide).css(transition);
            }
        },
        fadeSlide: function fadeSlide(slideIndex, callback) {

            var self = this,
                opt = self.options;

            if (self.cssTransitions === false) {

                self.$slides.eq(slideIndex).css({
                    zIndex: opt.zIndex
                });

                self.$slides.eq(slideIndex).animate({
                    opacity: 1
                }, opt.speed, opt.easing, callback);
            } else {

                self.applyTransition(slideIndex);

                self.$slides.eq(slideIndex).css({
                    opacity: 1,
                    zIndex: opt.zIndex
                });

                if (callback) {
                    setTimeout(function() {

                        self.disableTransition(slideIndex);

                        callback.call();
                    }, opt.speed);
                }
            }
        },
        fadeSlideOut: function fadeSlideOut(slideIndex) {

            var self = this,
                opt = self.options;

            if (self.cssTransitions === false) {

                self.$slides.eq(slideIndex).animate({
                    opacity: 0,
                    zIndex: opt.zIndex - 2
                }, opt.speed, opt.easing);
            } else {

                self.applyTransition(slideIndex);

                self.$slides.eq(slideIndex).css({
                    opacity: 0,
                    zIndex: opt.zIndex - 2
                });
            }
        },
        filterSlides: function filterSlides(filter) {

            var self = this,
                opt = self.options;

            if (filter !== null) {

                self.$slidesCache = self.$slides;

                self.unload();

                self.$slideTrack.children(this.options.slide).detach();

                self.$slidesCache.filter(filter).appendTo(self.$slideTrack);

                self.reinit();
            }
        },
        focusHandler: function focusHandler() {
            var self = this,
                opt = self.options,
                moveHandle;

            self.on('mousemove', moveHandle = function() {
                if (moveHandle) {
                    self.off('mousemove', moveHandle);
                    moveHandle = null;
                }
                self.$el.triggerHandler('carouselactive');
            });

            self.inactive = false;
            self.on('mouseenter mouseleave', function(e) {
                if (moveHandle) {
                    self.off('mousemove', moveHandle);
                    moveHandle = null;
                }

                switch (e.type) {
                    case 'mouseenter':
                        if (!self.inactive) {
                            self.autoPlay();
                            self.inactive = true;
                            self.triggerHandler('carouselactive');
                        }
                        break;
                    case 'mouseleave':
                        if (self.inactive) {
                            self.autoPlay();
                            self.inactive = false;
                            self.triggerHandler('carouseldeactive');
                        }
                        break;
                }
            });

            if (!self.options.pauseOnFocus) {
                return;
            }

            self.on('focusin focusout', function(e) {
                switch (e.type) {
                    case 'focusin':
                        if (moveHandle) {
                            self.off('mousemove', moveHandle);
                            moveHandle = null;
                        }

                        if (!self.inactive) {
                            //self.focussed = true;
                            self.autoPlay();
                            self.inactive = true;
                            self.triggerHandler('carouselactive');
                        }
                        break;
                    case 'focusout':
                        if (self.inactive && e.relatedTarget && !$.contains(self.$slider[0], e.relatedTarget)) {
                            //self.focussed = false;
                            self.autoPlay();
                            self.inactive = false;
                            self.triggerHandler('carouseldeactive');
                        }
                        break;
                }
            });

            /*var self = this,
                opt = self.options;

            self.$slider.off('focus.' + _N + ' blur.' + _N).on('focus.' + _N + ' blur.' + _N, '*', function (event) {

                // TODO: ?? event.stopImmediatePropagation();
            var $sf = $(this);
                console.log(event.type);
            setTimeout(function() {

              if (opt.pauseOnFocus) {
                self.focussed = $sf.is(':focus');
                self.autoPlay();
              }
            }, 0);
            });*/
        },
        getCurrent: function getCurrent() {

            var self = this,
                opt = self.options;
            return self.currentSlide;
        },
        getDotCount: function getDotCount() {

            var self = this,
                opt = self.options;

            var breakPoint = 0;
            var counter = 0;
            var pagerQty = 0;

            if (opt.infinite === true) {
                if (self.slideCount <= opt.slidesToShow) {
                    ++pagerQty;
                } else {
                    while (breakPoint < self.slideCount) {
                        ++pagerQty;
                        breakPoint = counter + opt.slidesToScroll;
                        counter += opt.slidesToScroll <= opt.slidesToShow ? opt.slidesToScroll : opt.slidesToShow;
                    }
                }
            } else if (opt.centerMode === true) {
                pagerQty = self.slideCount;
            } else if (!opt.asNavFor) {
                pagerQty = 1 + Math.ceil((self.slideCount - opt.slidesToShow) / opt.slidesToScroll);
            } else {
                while (breakPoint < self.slideCount) {
                    ++pagerQty;
                    breakPoint = counter + opt.slidesToScroll;
                    counter += opt.slidesToScroll <= opt.slidesToShow ? opt.slidesToScroll : opt.slidesToShow;
                }
            }

            return pagerQty - 1;
        },
        getLeft: function getLeft(slideIndex) {

            var self = this,
                opt = self.options,
                targetLeft,
                verticalHeight,
                verticalOffset = 0,
                targetSlide,
                coef;

            self.slideOffset = 0;
            verticalHeight = self.$slides.first().outerHeight(true);

            if (opt.infinite === true) {
                if (self.slideCount > opt.slidesToShow) {
                    self.slideOffset = self.slideWidth * opt.slidesToShow * -1;
                    coef = -1;

                    if (opt.vertical === true && opt.centerMode === true) {
                        if (opt.slidesToShow === 2) {
                            coef = -1.5;
                        } else if (opt.slidesToShow === 1) {
                            coef = -2;
                        }
                    }
                    verticalOffset = verticalHeight * opt.slidesToShow * coef;
                }
                if (self.slideCount % opt.slidesToScroll !== 0) {
                    if (slideIndex + opt.slidesToScroll > self.slideCount && self.slideCount > opt.slidesToShow) {
                        if (slideIndex > self.slideCount) {
                            self.slideOffset = (opt.slidesToShow - (slideIndex - self.slideCount)) * self.slideWidth * -1;
                            verticalOffset = (opt.slidesToShow - (slideIndex - self.slideCount)) * verticalHeight * -1;
                        } else {
                            self.slideOffset = self.slideCount % opt.slidesToScroll * self.slideWidth * -1;
                            verticalOffset = self.slideCount % opt.slidesToScroll * verticalHeight * -1;
                        }
                    }
                }
            } else {
                if (slideIndex + opt.slidesToShow > self.slideCount) {
                    self.slideOffset = (slideIndex + opt.slidesToShow - self.slideCount) * self.slideWidth;
                    verticalOffset = (slideIndex + opt.slidesToShow - self.slideCount) * verticalHeight;
                }
            }

            if (self.slideCount <= opt.slidesToShow) {
                self.slideOffset = 0;
                verticalOffset = 0;
            }

            if (opt.centerMode === true && self.slideCount <= opt.slidesToShow) {
                self.slideOffset = self.slideWidth * Math.floor(opt.slidesToShow) / 2 - self.slideWidth * self.slideCount / 2;
            } else if (opt.centerMode === true && opt.infinite === true) {
                self.slideOffset += self.slideWidth * Math.floor(opt.slidesToShow / 2) - self.slideWidth;
            } else if (opt.centerMode === true) {
                self.slideOffset = 0;
                self.slideOffset += self.slideWidth * Math.floor(opt.slidesToShow / 2);
            }

            if (opt.vertical === false) {
                targetLeft = slideIndex * self.slideWidth * -1 + self.slideOffset;
            } else {
                targetLeft = slideIndex * verticalHeight * -1 + verticalOffset;
            }

            if (opt.variableWidth === true) {

                if (self.slideCount <= opt.slidesToShow || opt.infinite === false) {
                    targetSlide = self.$slideTrack.children('.' + _V.SLIDE).eq(slideIndex);
                } else {
                    targetSlide = self.$slideTrack.children('.' + _V.SLIDE).eq(slideIndex + opt.slidesToShow);
                }

                if (opt.rtl === true) {
                    if (targetSlide[0]) {
                        targetLeft = (self.$slideTrack.width() - targetSlide[0].offsetLeft - targetSlide.width()) * -1;
                    } else {
                        targetLeft = 0;
                    }
                } else {
                    targetLeft = targetSlide[0] ? targetSlide[0].offsetLeft * -1 : 0;
                }

                if (opt.centerMode === true) {
                    if (self.slideCount <= opt.slidesToShow || opt.infinite === false) {
                        targetSlide = self.$slideTrack.children('.' + _V.SLIDE).eq(slideIndex);
                    } else {
                        targetSlide = self.$slideTrack.children('.' + _V.SLIDE).eq(slideIndex + opt.slidesToShow + 1);
                    }

                    if (opt.rtl === true) {
                        if (targetSlide[0]) {
                            targetLeft = (self.$slideTrack.width() - targetSlide[0].offsetLeft - targetSlide.width()) * -1;
                        } else {
                            targetLeft = 0;
                        }
                    } else {
                        targetLeft = targetSlide[0] ? targetSlide[0].offsetLeft * -1 : 0;
                    }

                    targetLeft += (self.$list.width() - targetSlide.outerWidth()) / 2;
                }
            }

            return targetLeft;
        },
        getOption: function getOption(option) {

            var self = this,
                opt = self.options;

            return opt[option];
        },
        getNavigableIndexes: function getNavigableIndexes() {

            var self = this,
                opt = self.options,
                breakPoint = 0,
                counter = 0,
                indexes = [],
                max;

            if (opt.infinite === false) {
                max = self.slideCount;
            } else {
                breakPoint = opt.slidesToScroll * -1;
                counter = opt.slidesToScroll * -1;
                max = self.slideCount * 2;
            }

            while (breakPoint < max) {
                indexes.push(breakPoint);
                breakPoint = counter + opt.slidesToScroll;
                counter += opt.slidesToScroll <= opt.slidesToShow ? opt.slidesToScroll : opt.slidesToShow;
            }

            return indexes;
        },
        getCarousel: function getCarousel() {

            return this;
        },
        getSlideCount: function getSlideCount() {

            var self = this,
                opt = self.options,
                slidesTraversed,
                swipedSlide,
                centerOffset;

            centerOffset = opt.centerMode === true ? self.slideWidth * Math.floor(opt.slidesToShow / 2) : 0;

            if (opt.swipeToSlide === true) {
                self.$slideTrack.find('.' + _V.SLIDE).each(function(index, slide) {
                    if (slide.offsetLeft - centerOffset + $(slide).outerWidth() / 2 > self.swipeLeft * -1) {
                        swipedSlide = slide;
                        return false;
                    }
                });

                slidesTraversed = Math.abs($(swipedSlide).attr('data-' + _V.INDEX) - self.currentSlide) || 1;

                return slidesTraversed;
            } else {
                return opt.slidesToScroll;
            }
        },
        goTo: function goTo(slide, dontAnimate) {

            var self = this,
                opt = self.options;

            self.changeSlide({
                data: {
                    message: 'index',
                    index: parseInt(slide)
                }
            }, dontAnimate);
        },
        init: function init(creation) {
            var self = this,
                opt = self.options;

            if (!$(self.$slider).hasClass(_V.INITIALIZED)) {

                $(self.$slider).addClass(_V.INITIALIZED);

                self.buildRows();
                self.buildOut();
                self.setProps();
                self.startLoad();
                self.loadSlider();
                self.initializeEvents();
                self.updateArrows();
                self.updateDots();
                self.checkResponsive(true);
                self.focusHandler();

                self.buildPlayButton();
                self.buildAccessbility();
            }

            if (creation) {
                self.triggerHandler(_N + 'init', [self]);
            }

            if (opt.accessibility === true) {
                self.initADA();
            }

            if (opt.autoplay) {

                self.paused = false;
                self.autoPlay();
                self.triggerHandler(_N + 'play', [self]);
            }

            if (creation) {
                if (opt.autoScrollActive && !opt.infinite) {
                    var index = self.$slides.filter(opt.autoScrollActive).index();
                    if (index > -1) {
                        self.changeSlide({
                            data: {
                                message: 'index',
                                index: index
                            }
                        }, true);
                    }
                }
            }
        },
        buildPlayButton: function buildPlayButton() {
            var self = this,
                opt = self.options;

            self.$playButon = self.$('.' + _V.PLAY);
            if (self.$playButon.length) {
                opt.pauseOnHover = true;

                self.$playButon.on('click', function(e) {
                    if (self.paused === false) {
                        self.pause();
                    } else {
                        self.play();
                    }
                });
            }
        },
        buildAccessbility: function buildAccessbility() {
            var self = this;

            if (self.$playButon.length) {
                self.$slider.on(_N + 'play ' + _N + 'stop destory', function(e) {
                    var $items = self.$playButon.find('[data-bind-text]');
                    var state = e.type === _N + 'play' ? 'stop' : 'play';

                    self.$playButon.removeClass('play stop').addClass(state);
                    $items.each(function() {
                        var $this = $(this),
                            data = $this.data('bindText');

                        $this.text(data[state]);
                    }); //
                });
            }

            if (self.$dots.length) {
                self.$slider.on(_N + 'afterchange', function(e, carousel, index) {
                    self.$dots.find('[data-bind-text]').text('');
                    self.$dots.eq(index).find('[data-bind-text]').text(function() {
                        return this.getAttribute('data-bind-text') || '';
                    });
                });
            }
        },
        initADA: function initADA() {
            var self = this,
                opt = self.options,
                numDotGroups = Math.ceil(self.slideCount / opt.slidesToShow),
                tabControlIndexes = self.getNavigableIndexes().filter(function(val) {
                    return val >= 0 && val < self.slideCount;
                }),
                $cloned = self.$slideTrack.find('.' + _V.CLONED);

            self.$slides.add($cloned).attr({
                'aria-hidden': 'true'
            }).find('a, input, button, select').attr({
                'tabindex': '-1'
            });

            if (self.$dots !== null) {

                self.$srOnly = self.$dots.find('.sr_only');
                if (!self.$srOnly.length) {
                    self.$srOnly = $('<span class="sr_only">선택됨</span>');
                }

                self.$slides.not($cloned).each(function(i) {
                    var slideControlIndex = tabControlIndexes.indexOf(i);

                    $(this).attr({
                        //TODO: 접근성에서 빼라고 함. 'role': 'option',
                        'id': _V.SLIDE + self.instanceUid + i //,
                        //aria: 'tabindex': -1
                    });

                    if (slideControlIndex !== -1) {
                        $(this).attr({
                            'aria-describedby': _V.SLIDE + '-control' + self.instanceUid + slideControlIndex
                        });
                    }
                });

                self.$dots.attr('role', 'tablist').find('li').each(function(i) {
                    var mappedSlideIndex = tabControlIndexes[i];

                    $(this).attr({
                        'role': 'presentation'
                    });

                    $(this).find('button, a').first().attr({
                        'role': 'button',
                        'id': _V.SLIDE + '-control' + self.instanceUid + i,
                        'aria-controls': _V.SLIDE + self.instanceUid + mappedSlideIndex,
                        'aria-selected': false,
                        'aria-label': numDotGroups + '개 슬라이드중에 ' + (i + 1) + '번째 슬라이드 보기' // (i + 1) + ' of ' + numDotGroups//,
                        //'tabindex': '-1'
                    });
                }).eq(self.currentSlide).find('button, a').attr('aria-selected', true) /*.append(self.$srOnly)*/ .end();
            }

            /*
            for (var i = self.currentSlide, max = i + opt.slidesToShow; i < max; i++) {
                self.$slides.eq(i).attr('tabindex', 0);
            }*/

            self.activateADA();
        },
        initArrowEvents: function initArrowEvents() {

            var self = this,
                opt = self.options;

            if (opt.arrows === true && self.slideCount > opt.slidesToShow) {
                self.$prevArrow.off('click.' + _N).on('click.' + _N, {
                    message: 'previous'
                }, self.changeSlide);
                self.$nextArrow.off('click.' + _N).on('click.' + _N, {
                    message: 'next'
                }, self.changeSlide);

                if (opt.accessibility === true) {
                    self.$prevArrow.on('keydown.' + _N, self.keyHandler);
                    self.$nextArrow.on('keydown.' + _N, self.keyHandler);
                }
            }
        },
        initDotEvents: function initDotEvents() {

            var self = this,
                opt = self.options;

            if (opt.dots === true) {
                $('li', self.$dots).on('click.' + _N, {
                    message: 'index'
                }, function(e) {
                    e.preventDefault();
                    self.changeSlide.apply(this, [].slice.call(arguments));
                });

                if (opt.accessibility === true) {
                    self.$dots.on('keydown.' + _N, self.keyHandler);
                }
            }

            if (opt.dots === true && opt.pauseOnDotsHover === true) {

                $('li', self.$dots).on('mouseenter.' + _N, $.proxy(self.interrupt, self, true)).on('mouseleave.' + _N, $.proxy(self.interrupt, self, false));
            }
        },
        initSlideEvents: function initSlideEvents() {

            var self = this,
                opt = self.options;

            if (opt.pauseOnHover) {

                self.$list.on('mouseenter.' + _N, $.proxy(self.interrupt, self, true));
                self.$list.on('mouseleave.' + _N, $.proxy(self.interrupt, self, false));
            }
        },
        initializeEvents: function initializeEvents() {

            var self = this,
                opt = self.options;

            self.initArrowEvents();

            self.initDotEvents();
            self.initSlideEvents();

            self.$list.on(addEventNS('touchstart mousedown'), {
                action: 'start'
            }, self.swipeHandler);
            self.$list.on(addEventNS('touchmove mousemove'), {
                action: 'move'
            }, self.swipeHandler);
            self.$list.on(addEventNS('touchend mouseup'), {
                action: 'end'
            }, self.swipeHandler);
            self.$list.on(addEventNS('touchcancel mouseleave'), {
                action: 'end'
            }, self.swipeHandler);

            self.$list.on(addEventNS('click'), self.clickHandler);

            $(document).on(self.visibilityChange, $.proxy(self.visibility, self));

            if (opt.accessibility === true) {
                self.$list.on(addEventNS('keydown'), self.keyHandler);
            }

            if (opt.focusOnSelect === true) {
                $(self.$slideTrack).children().on(addEventNS('click'), self.selectHandler);
            }

            $(window).on(addEventNS('orientationchange') + '-' + self.instanceUid, $.proxy(self.orientationChange, self));

            $(window).on(addEventNS('resize') + '-' + self.instanceUid, $.proxy(self.resize, self));

            $('[draggable!=true]', self.$slideTrack).on('dragstart', self.preventDefault);

            $(window).on(addEventNS('load') + '-' + self.instanceUid, self.setPosition);
            $(document).on(addEventNS('ready') + '-' + self.instanceUid, self.setPosition);
        },
        initUI: function initUI() {

            var self = this,
                opt = self.options;

            if (opt.arrows === true && self.slideCount > opt.slidesToShow) {
                self.$prevArrow.show();
                self.$nextArrow.show();
            }

            if (opt.dots === true && self.slideCount > opt.slidesToShow) {
                self.$dots.show();
            }
        },
        keyHandler: function keyHandler(event) {

            var self = this,
                opt = self.options;
            //Dont slide if the cursor is inside the form fields and arrow keys are pressed
            if (!event.target.tagName.match('TEXTAREA|INPUT|SELECT')) {
                if (event.keyCode === 37 && opt.accessibility === true) {
                    event.preventDefault();
                    self.changeSlide({
                        data: {
                            message: opt.rtl === true ? 'next' : 'previous'
                        }
                    });
                } else if (event.keyCode === 39 && opt.accessibility === true) {
                    event.preventDefault();
                    self.changeSlide({
                        data: {
                            message: opt.rtl === true ? 'previous' : 'next'
                        }
                    });
                }
            }
        },
        lazyLoad: function lazyLoad() {

            var self = this,
                opt = self.options,
                loadRange,
                cloneRange,
                rangeStart,
                rangeEnd;

            function loadImages(imagesScope) {

                $('img[data-lazy]', imagesScope).each(function() {

                    var image = $(this),
                        imageSource = $(this).attr('data-lazy'),
                        imageSrcSet = $(this).attr('data-srcset'),
                        imageSizes = $(this).attr('data-sizes') || self.$slider.attr('data-sizes'),
                        imageToLoad = document.createElement('img');

                    imageToLoad.onload = function() {

                        image.animate({
                            opacity: 0
                        }, 100, function() {

                            if (imageSrcSet) {
                                image.attr('srcset', imageSrcSet);

                                if (imageSizes) {
                                    image.attr('sizes', imageSizes);
                                }
                            }

                            image.attr('src', imageSource).animate({
                                opacity: 1
                            }, 200, function() {
                                image.removeAttr('data-lazy data-srcset data-sizes').removeClass(_V.LOADING);
                            });
                            self.triggerHandler(_N + 'lazyloaded', [self, image, imageSource]);
                        });
                    };

                    imageToLoad.onerror = function() {

                        image.removeAttr('data-lazy').removeClass(_V.LOADING).addClass(_N + '-lazyload-error');

                        self.triggerHandler(_N + 'lazyloadrrror', [self, image, imageSource]);
                    };

                    imageToLoad.src = imageSource;
                });
            }

            if (opt.centerMode === true) {
                if (opt.infinite === true) {
                    rangeStart = self.currentSlide + (opt.slidesToShow / 2 + 1);
                    rangeEnd = rangeStart + opt.slidesToShow + 2;
                } else {
                    rangeStart = Math.max(0, self.currentSlide - (opt.slidesToShow / 2 + 1));
                    rangeEnd = 2 + (opt.slidesToShow / 2 + 1) + self.currentSlide;
                }
            } else {
                rangeStart = opt.infinite ? opt.slidesToShow + self.currentSlide : self.currentSlide;
                rangeEnd = Math.ceil(rangeStart + opt.slidesToShow);
                if (opt.fade === true) {
                    if (rangeStart > 0) rangeStart--;
                    if (rangeEnd <= self.slideCount) rangeEnd++;
                }
            }

            loadRange = self.$slider.find('.' + _V.SLIDE).slice(rangeStart, rangeEnd);

            if (opt.lazyLoad === 'anticipated') {
                var prevSlide = rangeStart - 1,
                    nextSlide = rangeEnd,
                    $slides = self.$slider.find('.' + _N);

                for (var i = 0; i < opt.slidesToScroll; i++) {
                    if (prevSlide < 0) prevSlide = self.slideCount - 1;
                    loadRange = loadRange.add($slides.eq(prevSlide));
                    loadRange = loadRange.add($slides.eq(nextSlide));
                    prevSlide--;
                    nextSlide++;
                }
            }

            loadImages(loadRange);

            if (self.slideCount <= opt.slidesToShow) {
                cloneRange = self.$slider.find('.' + _V.SLIDE);
                loadImages(cloneRange);
            } else if (self.currentSlide >= self.slideCount - opt.slidesToShow) {
                cloneRange = self.$slider.find('.' + _V.CLONED).slice(0, opt.slidesToShow);
                loadImages(cloneRange);
            } else if (self.currentSlide === 0) {
                cloneRange = self.$slider.find('.' + _V.CLONED).slice(opt.slidesToShow * -1);
                loadImages(cloneRange);
            }
        },
        loadSlider: function loadSlider() {

            var self = this,
                opt = self.options;

            self.setPosition();

            self.$slideTrack.css({
                opacity: 1
            });

            self.$slider.removeClass(_V.LOADING);

            self.initUI();

            if (opt.lazyLoad === 'progressive') {
                self.progressiveLazyLoad();
            }
        },
        next: function next() {

            var self = this,
                opt = self.options;

            self.changeSlide({
                data: {
                    message: 'next'
                }
            });
        },
        orientationChange: function orientationChange() {

            var self = this,
                opt = self.options;

            self.checkResponsive();
            self.setPosition();
        },
        stop: function stop() {
            this.pause();
        },
        pause: function pause() {

            var self = this,
                opt = self.options;

            self.autoPlayClear();
            self.triggerHandler(_N + 'stop', [self]);
            self.paused = true;
        },
        play: function play() {

            var self = this,
                opt = self.options;

            self.autoPlay();
            self.triggerHandler(_N + 'play', [self]);
            opt.autoplay = true;
            self.paused = false;
            // self.focussed = false;
            self.inactive = false;
            self.interrupted = false;
        },
        postSlide: function postSlide(index) {

            var self = this,
                opt = self.options;

            if (!self.unbuilded) {

                self.triggerHandler(_N + 'afterchange', [self, index]);

                self.animating = false;

                if (self.slideCount > opt.slidesToShow) {
                    self.setPosition();
                }

                self.swipeLeft = null;

                if (opt.autoplay) {
                    self.autoPlay();
                }

                if (opt.accessibility === true) {
                    self.initADA();

                    if (opt.focusOnChange) {
                        var $currentSlide = $(self.$slides.get(self.currentSlide));
                        $currentSlide.attr('tabindex', 0).focus();
                    }
                }

                ////self.$slider.find('.' + _V.SLIDE).not('.' + _V.CURRENT).css('visibility', 'hidden');
            }
        },
        prev: function prev() {

            var self = this,
                opt = self.options;

            self.changeSlide({
                data: {
                    message: 'previous'
                }
            });
        },
        preventDefault: function preventDefault(event) {

            event.preventDefault();
        },
        progressiveLazyLoad: function progressiveLazyLoad(tryCount) {

            tryCount = tryCount || 1;

            var self = this,
                opt = self.options,
                $imgsToLoad = $('img[data-lazy]', self.$slider),
                image,
                imageSource,
                imageSrcSet,
                imageSizes,
                imageToLoad;

            if ($imgsToLoad.length) {

                image = $imgsToLoad.first();
                imageSource = image.attr('data-lazy');
                imageSrcSet = image.attr('data-srcset');
                imageSizes = image.attr('data-sizes') || self.$slider.attr('data-sizes');
                imageToLoad = document.createElement('img');

                imageToLoad.onload = function() {

                    if (imageSrcSet) {
                        image.attr('srcset', imageSrcSet);

                        if (imageSizes) {
                            image.attr('sizes', imageSizes);
                        }
                    }

                    image.attr('src', imageSource).removeAttr('data-lazy data-srcset data-sizes').removeClass(_V.LOADING);

                    if (opt.adaptiveHeight === true) {
                        self.setPosition();
                    }

                    self.triggerHandler(_N + 'lazyloaded', [self, image, imageSource]);
                    self.progressiveLazyLoad();
                };

                imageToLoad.onerror = function() {

                    if (tryCount < 3) {

                        /**
                         * try to load the image 3 times,
                         * leave a slight delay so we don't get
                         * servers blocking the request.
                         */
                        setTimeout(function() {
                            self.progressiveLazyLoad(tryCount + 1);
                        }, 500);
                    } else {

                        image.removeAttr('data-lazy').removeClass(_V.LOADING).addClass(_N + '-lazyload-error');

                        self.triggerHandler(_N + 'lazyloaderror', [self, image, imageSource]);

                        self.progressiveLazyLoad();
                    }
                };

                imageToLoad.src = imageSource;
            } else {

                self.triggerHandler(_N + 'allimagesloaded', [self]);
            }
        },
        refresh: function refresh(initializing) {

            var self = this,
                opt = self.options,
                currentSlide,
                lastVisibleIndex;

            lastVisibleIndex = self.slideCount - opt.slidesToShow;

            // in non-infinite sliders, we don't want to go past the
            // last visible index.
            if (!opt.infinite && self.currentSlide > lastVisibleIndex) {
                self.currentSlide = lastVisibleIndex;
            }

            // if less slides than to show, go to start.
            if (self.slideCount <= opt.slidesToShow) {
                self.currentSlide = 0;
            }

            currentSlide = self.currentSlide;

            self.destroy(true);

            $.extend(self, componentInitials, {
                currentSlide: currentSlide
            });

            self.init();

            if (!initializing) {

                self.changeSlide({
                    data: {
                        message: 'index',
                        index: currentSlide
                    }
                }, false);
            }
        },
        registerBreakpoints: function registerBreakpoints() {

            var self = this,
                opt = self.options,
                breakpoint,
                currentBreakpoint,
                l,
                responsiveSettings = opt.responsive || null;

            if ($.type(responsiveSettings) === 'array' && responsiveSettings.length) {

                self.respondTo = opt.respondTo || 'window';

                for (breakpoint in responsiveSettings) {

                    l = self.breakpoints.length - 1;

                    if (responsiveSettings.hasOwnProperty(breakpoint)) {
                        currentBreakpoint = responsiveSettings[breakpoint].breakpoint;

                        // loop through the breakpoints and cut out any existing
                        // ones with the same breakpoint number, we don't want dupes.
                        while (l >= 0) {
                            if (self.breakpoints[l] && self.breakpoints[l] === currentBreakpoint) {
                                self.breakpoints.splice(l, 1);
                            }
                            l--;
                        }

                        self.breakpoints.push(currentBreakpoint);
                        self.breakpointSettings[currentBreakpoint] = responsiveSettings[breakpoint].settings;
                    }
                }

                self.breakpoints.sort(function(a, b) {
                    return opt.mobileFirst ? a - b : b - a;
                });

                var r = self._getTargetBreakpoint();
                if (r) {
                    self.options.slidesToScroll = self.breakpointSettings[r].slidesToScroll;
                    self.options.slidesToShow = self.breakpointSettings[r].slidesToScroll;
                }
            }
        },
        reinit: function reinit() {

            var self = this,
                opt = self.options;

            self.$slides = self.$slideTrack.children(opt.slide).addClass(_V.SLIDE);

            self.slideCount = self.$slides.length;

            if (self.currentSlide >= self.slideCount && self.currentSlide !== 0) {
                self.currentSlide = self.currentSlide - opt.slidesToScroll;
            }

            if (self.slideCount <= opt.slidesToShow) {
                self.currentSlide = 0;
            }

            self.registerBreakpoints();

            self.setProps();
            self.setupInfinite();
            self.buildArrows();
            self.updateArrows();
            self.initArrowEvents();
            self.buildDots();
            self.updateDots();
            self.initDotEvents();
            self.cleanUpSlideEvents();
            self.initSlideEvents();

            self.checkResponsive(false, true);

            if (opt.focusOnSelect === true) {
                $(self.$slideTrack).children().on(addEventNS('click'), self.selectHandler);
            }

            self.setSlideClasses(typeof self.currentSlide === 'number' ? self.currentSlide : 0);

            self.setPosition();
            self.focusHandler();

            self.paused = !opt.autoplay;
            self.autoPlay();

            self.triggerHandler(_N + 'reinit', [self]);
        },
        resize: function resize() {

            var self = this,
                opt = self.options;

            if ($(window).width() !== self.windowWidth) {
                clearTimeout(self.windowDelay);
                self.windowDelay = window.setTimeout(function() {
                    self.windowWidth = $(window).width();
                    self.checkResponsive();
                    if (!self.unbuilded) {
                        self.setPosition();
                    }
                }, 50);
            }
        },
        removeSlide: function removeSlide(index, removeBefore, removeAll) {

            var self = this,
                opt = self.options;

            if (typeof index === 'boolean') {
                removeBefore = index;
                index = removeBefore === true ? 0 : self.slideCount - 1;
            } else {
                index = removeBefore === true ? --index : index;
            }

            if (self.slideCount < 1 || index < 0 || index > self.slideCount - 1) {
                return false;
            }

            self.unload();

            if (removeAll === true) {
                self.$slideTrack.children().remove();
            } else {
                self.$slideTrack.children(opt.slide).eq(index).remove();
            }

            self.$slides = self.$slideTrack.children(opts.slide);

            self.$slideTrack.children(opt.slide).detach();

            self.$slideTrack.append(self.$slides);

            self.$slidesCache = self.$slides;

            self.reinit();
        },
        setCSS: function setCSS(position) {

            var self = this,
                opt = self.options,
                positionProps = {},
                x,
                y;

            if (opt.rtl === true) {
                position = -position;
            }
            x = self.positionProp == 'left' ? Math.ceil(position) + 'px' : '0px';
            y = self.positionProp == 'top' ? Math.ceil(position) + 'px' : '0px';

            positionProps[self.positionProp] = position;

            if (self.transformsEnabled === false) {
                self.$slideTrack.css(positionProps);
            } else {
                positionProps = {};
                if (self.cssTransitions === false) {
                    positionProps[self.animType] = 'translate(' + x + ', ' + y + ')';
                    self.$slideTrack.css(positionProps);
                } else {
                    positionProps[self.animType] = 'translate3d(' + x + ', ' + y + ', 0px)';
                    self.$slideTrack.css(positionProps);
                }
            }
        },
        setDimensions: function setDimensions() {

            var self = this,
                opt = self.options;


            if (opt.vertical === false) {
                if (opt.centerMode === true) {
                    self.$list.css({
                        padding: '0px ' + opt.centerPadding
                    });
                }
            } else {
                self.$list.height(self.$slides.first().outerHeight(true) * opt.slidesToShow);
                if (opt.centerMode === true) {
                    self.$list.css({
                        padding: opt.centerPadding + ' 0px'
                    });
                }
            }

            //self.$slideTrack.css('width', '');
            self.listWidth = self.$list.width();
            self.listHeight = self.$list.height();

            if (opt.vertical === false && opt.variableWidth === false) {
                self.slideWidth = Math.ceil(self.listWidth / opt.slidesToShow);
                self.$slideTrack.width(Math.ceil(self.slideWidth * self.$slideTrack.children('.' + _V.SLIDE).length) + opt.additionWidth);
            } else if (opt.variableWidth === true) {
                self.$slideTrack.width((5000 * self.slideCount) + opt.additionWidth);
            } else {
                self.slideWidth = Math.ceil(self.listWidth);
                self.$slideTrack.height(Math.ceil(self.$slides.first().outerHeight(true) * self.$slideTrack.children('.' + _V.SLIDE).length));
            }

            if (opt.variableWidth === false) {
                var offset = self.$slides.first().outerWidth(true) - self.$slides.first().width();
                self.$slideTrack.children('.' + _V.SLIDE).width(self.slideWidth - offset);
            }
        },

        update: function() {
            this.setDimensions();
        },

        setFade: function setFade() {

            var self = this,
                opt = self.options,
                targetLeft;

            self.$slides.each(function(index, element) {
                targetLeft = self.slideWidth * index * -1;
                if (opt.rtl === true) {
                    $(element).css({
                        position: 'relative',
                        right: targetLeft,
                        top: 0,
                        zIndex: opt.zIndex - 2,
                        opacity: 0
                    });
                } else {
                    $(element).css({
                        position: 'relative',
                        left: targetLeft,
                        top: 0,
                        zIndex: opt.zIndex - 2,
                        opacity: 0
                    });
                }
            });

            self.$slides.eq(self.currentSlide).css({
                zIndex: opt.zIndex - 1,
                opacity: 1
            });
        },
        setHeight: function setHeight() {

            var self = this,
                opt = self.options;

            if (opt.slidesToShow === 1 && opt.adaptiveHeight === true && opt.vertical === false) {
                var targetHeight = self.$slides.eq(self.currentSlide).outerHeight(true);
                self.$list.css('height', targetHeight);
            }
        },
        setOption: function setOption() {

            /**
             * accepts arguments in format of:
             *
             *  - for changing a single option's value:
             *     .slick("setOption", option, value, refresh )
             *
             *  - for changing a set of responsive options:
             *     .slick("setOption", 'responsive', [{}, ...], refresh )
             *
             *  - for updating multiple values at once (not responsive)
             *     .slick("setOption", { 'option': value, ... }, refresh )
             */

            var self = this,
                opt = self.options,
                l,
                item,
                option,
                value,
                refresh = false,
                type;

            if ($.type(arguments[0]) === 'object') {

                option = arguments[0];
                refresh = arguments[1];
                type = 'multiple';
            } else if ($.type(arguments[0]) === 'string') {

                option = arguments[0];
                value = arguments[1];
                refresh = arguments[2];

                if (arguments[0] === 'responsive' && $.type(arguments[1]) === 'array') {

                    type = 'responsive';
                } else if (typeof arguments[1] !== 'undefined') {

                    type = 'single';
                }
            }

            if (type === 'single') {

                opt[option] = value;
            } else if (type === 'multiple') {

                $.each(option, function(opt, val) {

                    opt[opt] = val;
                });
            } else if (type === 'responsive') {

                for (item in value) {

                    if ($.type(opt.responsive) !== 'array') {

                        opt.responsive = [value[item]];
                    } else {

                        l = opt.responsive.length - 1;

                        // loop through the responsive object and splice out duplicates.
                        while (l >= 0) {

                            if (opt.responsive[l].breakpoint === value[item].breakpoint) {

                                opt.responsive.splice(l, 1);
                            }

                            l--;
                        }

                        opt.responsive.push(value[item]);
                    }
                }
            }

            if (refresh) {

                self.unload();
                self.reinit();
            }
        },
        setPosition: function setPosition() {

            var self = this,
                opt = self.options;

            if (!self.el || !self.$el.is(':visible')) {
                return;
            }

            self.setDimensions();

            self.setHeight();

            if (opt.fade === false) {
                self.setCSS(self.getLeft(self.currentSlide));
            } else {
                self.setFade();
            }

            self.triggerHandler(_N + 'setposition', [self]);
        },
        setProps: function setProps() {

            var self = this,
                opt = self.options,
                bodyStyle = document.body.style;

            self.positionProp = opt.vertical === true ? 'top' : 'left';

            if (self.positionProp === 'top') {
                self.$slider.addClass(_N + '-vertical');
            } else {
                self.$slider.removeClass(_N + '-vertical');
            }

            if (bodyStyle.WebkitTransition !== undefined || bodyStyle.MozTransition !== undefined || bodyStyle.msTransition !== undefined) {
                if (opt.useCSS === true) {
                    self.cssTransitions = true;
                }
            }

            if (opt.fade) {
                if (typeof opt.zIndex === 'number') {
                    if (opt.zIndex < 3) {
                        opt.zIndex = 3;
                    }
                } else {
                    opt.zIndex = self.defaults.zIndex;
                }
            }

            if (bodyStyle.OTransform !== undefined) {
                self.animType = 'OTransform';
                self.transformType = '-o-transform';
                self.transitionType = 'OTransition';
                if (bodyStyle.perspectiveProperty === undefined && bodyStyle.webkitPerspective === undefined) self.animType = false;
            }
            if (bodyStyle.MozTransform !== undefined) {
                self.animType = 'MozTransform';
                self.transformType = '-moz-transform';
                self.transitionType = 'MozTransition';
                if (bodyStyle.perspectiveProperty === undefined && bodyStyle.MozPerspective === undefined) self.animType = false;
            }
            if (bodyStyle.webkitTransform !== undefined) {
                self.animType = 'webkitTransform';
                self.transformType = '-webkit-transform';
                self.transitionType = 'webkitTransition';
                if (bodyStyle.perspectiveProperty === undefined && bodyStyle.webkitPerspective === undefined) self.animType = false;
            }
            if (bodyStyle.msTransform !== undefined) {
                self.animType = 'msTransform';
                self.transformType = '-ms-transform';
                self.transitionType = 'msTransition';
                if (bodyStyle.msTransform === undefined) self.animType = false;
            }
            if (bodyStyle.transform !== undefined && self.animType !== false) {
                self.animType = 'transform';
                self.transformType = 'transform';
                self.transitionType = 'transition';
            }
            self.transformsEnabled = opt.useTransform && self.animType !== null && self.animType !== false;
        },
        setSlideClasses: function setSlideClasses(index) {

            var self = this,
                opt = self.options,
                centerOffset,
                allSlides,
                indexOffset,
                remainder;

            allSlides = self.$slider.find('.' + _V.SLIDE)
                .removeClass(opt.activeClass + ' ' + _V.CENTER + ' ' + _V.CURRENT)
                .attr('aria-hidden', 'true');

            self.$slides.eq(index).addClass(_V.CURRENT);

            if (opt.centerMode === true) {

                var evenCoef = opt.slidesToShow % 2 === 0 ? 1 : 0;

                centerOffset = Math.floor(opt.slidesToShow / 2);

                if (opt.infinite === true) {

                    if (index >= centerOffset && index <= self.slideCount - 1 - centerOffset) {
                        self.$slides.slice(index - centerOffset + evenCoef, index + centerOffset + 1)
                            .addClass(opt.activeClass);
                    } else {

                        indexOffset = opt.slidesToShow + index;
                        allSlides.slice(indexOffset - centerOffset + 1 + evenCoef, indexOffset + centerOffset + 2)
                            .addClass(opt.activeClass);
                    }

                    if (index === 0) {

                        allSlides.eq(allSlides.length - 1 - opt.slidesToShow).addClass(_V.CENTER);
                    } else if (index === self.slideCount - 1) {

                        allSlides.eq(opt.slidesToShow).addClass(_V.CENTER);
                    }
                }

                self.$slides.eq(index).addClass(_V.CENTER);
            } else {

                if (index >= 0 && index <= self.slideCount - opt.slidesToShow) {

                    self.$slides.slice(index, index + opt.slidesToShow)
                        .addClass(opt.activeClass);
                } else if (allSlides.length <= opt.slidesToShow) {

                    allSlides.addClass(opt.activeClass);
                } else {

                    remainder = self.slideCount % opt.slidesToShow;
                    indexOffset = opt.infinite === true ? opt.slidesToShow + index : index;

                    if (opt.slidesToShow === opt.slidesToScroll && self.slideCount - index < opt.slidesToShow) {

                        allSlides.slice(indexOffset - (opt.slidesToShow - remainder), indexOffset + remainder)
                            .addClass(opt.activeClass);
                    } else {

                        allSlides.slice(indexOffset, indexOffset + opt.slidesToShow)
                            .addClass(opt.activeClass);
                    }
                }
            }

            if (opt.lazyLoad === 'ondemand' || opt.lazyLoad === 'anticipated') {
                self.lazyLoad();
            }
        },
        setupInfinite: function setupInfinite() {

            var self = this,
                opt = self.options,
                i,
                slideIndex,
                infiniteCount;

            if (opt.fade === true) {
                opt.centerMode = false;
            }

            if (opt.infinite === true && opt.fade === false) {

                slideIndex = null;

                if (self.slideCount > opt.slidesToShow) {

                    if (opt.centerMode === true) {
                        infiniteCount = opt.slidesToShow + 1;
                    } else {
                        infiniteCount = opt.slidesToShow;
                    }

                    for (i = self.slideCount; i > self.slideCount - infiniteCount; i -= 1) {
                        slideIndex = i - 1;
                        $(self.$slides[slideIndex]).clone(true).attr('id', '').attr('data-' + _V.INDEX, slideIndex - self.slideCount).prependTo(self.$slideTrack).addClass(_V.CLONED);
                    }
                    for (i = 0; i < infiniteCount; i += 1) {
                        slideIndex = i;
                        $(self.$slides[slideIndex]).clone(true).attr('id', '').attr('data-' + _V.INDEX, slideIndex + self.slideCount).appendTo(self.$slideTrack).addClass(_V.CLONED);
                    }
                    self.$slideTrack.find('.' + _V.CLONED).find('[id]').each(function() {
                        $(this).attr('id', '');
                    });
                }
            }
        },
        interrupt: function interrupt(toggle) {

            var self = this,
                opt = self.options;

            if (!toggle) {
                self.autoPlay();
            }
            self.interrupted = toggle;
        },
        selectHandler: function selectHandler(event) {

            var self = this,
                opt = self.options;

            var targetElement = $(event.target).is('.' + _V.SLIDE) ? $(event.target) : $(event.target).parents('.' + _V.SLIDE);

            var index = parseInt(targetElement.attr('data-' + _V.INDEX));

            if (!index) index = 0;

            if (self.slideCount <= opt.slidesToShow) {

                self.slideHandler(index, false, true);
                return;
            }

            self.slideHandler(index);
        },
        slideHandler: function slideHandler(index, sync, dontAnimate) {

            var targetSlide,
                animSlide,
                oldSlide,
                slideLeft,
                targetLeft = null,
                self = this,
                opt = self.options,
                navTarget;

            sync = sync || false;

            if (self.animating === true && opt.waitForAnimate === true) {
                return;
            }

            if (opt.fade === true && self.currentSlide === index) {
                return;
            }

            targetSlide = index;
            targetLeft = self.getLeft(targetSlide);
            slideLeft = self.getLeft(self.currentSlide);

            self.currentLeft = self.swipeLeft === null ? slideLeft : self.swipeLeft;

            if (opt.infinite === false && opt.centerMode === false && (index < 0 || index > self.getDotCount() * opt.slidesToScroll)) {
                if (opt.fade === false) {
                    targetSlide = self.currentSlide;
                    if (dontAnimate !== true) {
                        self.animateSlide(slideLeft, function() {
                            self.postSlide(targetSlide);
                        });
                    } else {
                        self.postSlide(targetSlide);
                    }
                }
                return;
            } else if (opt.infinite === false && opt.centerMode === true && (index < 0 || index > self.slideCount - opt.slidesToScroll)) {
                if (opt.fade === false) {
                    targetSlide = self.currentSlide;
                    if (dontAnimate !== true) {
                        self.animateSlide(slideLeft, function() {
                            self.postSlide(targetSlide);
                        });
                    } else {
                        self.postSlide(targetSlide);
                    }
                }
                return;
            }

            if (opt.autoplay) {
                clearInterval(self.autoPlayTimer);
            }

            if (targetSlide < 0) {
                if (self.slideCount % opt.slidesToScroll !== 0) {
                    animSlide = self.slideCount - self.slideCount % opt.slidesToScroll;
                } else {
                    animSlide = self.slideCount + targetSlide;
                }
            } else if (targetSlide >= self.slideCount) {
                if (self.slideCount % opt.slidesToScroll !== 0) {
                    animSlide = 0;
                } else {
                    animSlide = targetSlide - self.slideCount;
                }
            } else {
                animSlide = targetSlide;
            }

            self.animating = true;

            self.triggerHandler(_N + 'beforechange', [self, self.currentSlide, animSlide]);

            oldSlide = self.currentSlide;
            self.previousSlide = oldSlide;
            self.currentSlide = animSlide;

            self.setSlideClasses(self.currentSlide);

            if (opt.asNavFor) {

                navTarget = self.getNavTarget();
                navTarget = navTarget.vcCarousel('instance');

                if (navTarget.slideCount <= navTarget.options.slidesToShow) {
                    navTarget.setSlideClasses(self.currentSlide);
                }

                if (sync === false) {
                    self.asNavFor(self.currentSlide);
                }
            }

            self.updateDots();
            self.updateArrows();

            if (opt.fade === true) {
                if (dontAnimate !== true) {

                    self.fadeSlideOut(oldSlide);

                    self.fadeSlide(animSlide, function() {
                        self.postSlide(animSlide);
                    });
                } else {
                    self.postSlide(animSlide);
                }
                self.animateHeight();
                return;
            }

            if (dontAnimate !== true) {
                self.animateSlide(targetLeft, function() {
                    self.postSlide(animSlide);
                });
            } else {
                self.postSlide(animSlide);
            }
        },
        startLoad: function startLoad() {

            var self = this,
                opt = self.options;

            if (opt.arrows === true && self.slideCount > opt.slidesToShow) {
                self.$prevArrow.hide();
                self.$nextArrow.hide();
            }

            if (opt.dots === true && self.slideCount > opt.slidesToShow) {
                self.$dots.hide();
            }

            self.$slider.addClass(_V.LOADING);
        },
        swipeDirection: function swipeDirection() {

            var xDist,
                yDist,
                r,
                swipeAngle,
                self = this,
                opt = self.options;

            xDist = self.touchObject.startX - self.touchObject.curX;
            yDist = self.touchObject.startY - self.touchObject.curY;
            r = Math.atan2(yDist, xDist);

            swipeAngle = Math.round(r * 180 / Math.PI);
            if (swipeAngle < 0) {
                swipeAngle = 360 - Math.abs(swipeAngle);
            }

            if (swipeAngle <= 45 && swipeAngle >= 0) {
                return opt.rtl === false ? 'left' : 'right';
            }
            if (swipeAngle <= 360 && swipeAngle >= 315) {
                return opt.rtl === false ? 'left' : 'right';
            }
            if (swipeAngle >= 135 && swipeAngle <= 225) {
                return opt.rtl === false ? 'right' : 'left';
            }
            if (opt.verticalSwiping === true) {
                if (swipeAngle >= 35 && swipeAngle <= 135) {
                    return 'down';
                } else {
                    return 'up';
                }
            }

            if (self.options.preventVertical) {
                return xDist < 0 ? 'right' : 'left';
            }

            return 'vertical';
        },
        swipeEnd: function swipeEnd(event) {

            var self = this,
                opt = self.options,
                slideCount,
                direction;

            self.dragging = false;
            self.swiping = false;

            if (self.scrolling) {
                self.scrolling = false;
                return false;
            }

            self.interrupted = false;
            self.shouldClick = self.touchObject.swipeLength > 10 ? false : true;

            if (self.touchObject.curX === undefined) {
                return false;
            }

            if (self.touchObject.edgeHit === true) {
                self.triggerHandler(_N + 'edge', [self, self.swipeDirection()]);
            }

            if (self.touchObject.swipeLength >= self.touchObject.minSwipe) {

                direction = self.swipeDirection();

                switch (direction) {

                    case 'left':
                    case 'down':

                        slideCount = opt.swipeToSlide ? self.checkNavigable(self.currentSlide + self.getSlideCount()) : self.currentSlide + self.getSlideCount();

                        self.currentDirection = 0;

                        break;

                    case 'right':
                    case 'up':

                        slideCount = opt.swipeToSlide ? self.checkNavigable(self.currentSlide - self.getSlideCount()) : self.currentSlide - self.getSlideCount();

                        self.currentDirection = 1;

                        break;

                    default:

                }

                if (direction != 'vertical') {
                    self.slideHandler(slideCount);
                    self.touchObject = {};
                    self.triggerHandler(_N + 'swipe', [self, direction]);
                }
            } else {

                if (self.touchObject.startX !== self.touchObject.curX) {

                    self.slideHandler(self.currentSlide);
                    self.touchObject = {};
                }
            }
        },
        swipeHandler: function swipeHandler(event) {

            var self = this,
                opt = self.options;

            if (opt.swipe === false || 'ontouchend' in document && opt.swipe === false) {
                return;
            } else if (opt.draggable === false && event.type.indexOf('mouse') !== -1) {
                return;
            }

            self.touchObject.fingerCount = event.originalEvent && event.originalEvent.touches !== undefined ? event.originalEvent.touches.length : 1;

            self.touchObject.minSwipe = self.listWidth / opt.touchThreshold;

            if (opt.verticalSwiping === true) {
                self.touchObject.minSwipe = self.listHeight / opt.touchThreshold;
            }

            switch (event.data.action) {

                case 'start':
                    self.swipeStart(event);
                    break;

                case 'move':
                    self.swipeMove(event);
                    break;

                case 'end':
                    self.swipeEnd(event);
                    break;

            }
        },
        swipeMove: function swipeMove(event) {

            var self = this,
                opt = self.options,
                edgeWasHit = false,
                curLeft,
                swipeDirection,
                swipeLength,
                positionOffset,
                touches,
                verticalSwipeLength;

            touches = event.originalEvent !== undefined ? event.originalEvent.touches : null;

            if (!self.dragging || self.scrolling || touches && touches.length !== 1) {
                return false;
            }

            curLeft = self.getLeft(self.currentSlide);

            self.touchObject.curX = touches !== undefined ? touches[0].pageX : event.clientX;
            self.touchObject.curY = touches !== undefined ? touches[0].pageY : event.clientY;

            self.touchObject.swipeLength = Math.round(Math.sqrt(Math.pow(self.touchObject.curX - self.touchObject.startX, 2)));

            verticalSwipeLength = Math.round(Math.sqrt(Math.pow(self.touchObject.curY - self.touchObject.startY, 2)));


            if (!opt.verticalSwiping && !self.swiping && verticalSwipeLength > 4) {
                self.scrolling = true;
                return false;
            }

            if (opt.verticalSwiping === true) {
                self.touchObject.swipeLength = verticalSwipeLength;
            }

            swipeDirection = self.swipeDirection();

            if (opt.preventVertical && self.swiping) {
                event.stopPropagation();
                event.preventDefault();
            }

            if (event.originalEvent !== undefined && self.touchObject.swipeLength > 4) {
                self.swiping = true;
                event.preventDefault();
            }

            positionOffset = (opt.rtl === false ? 1 : -1) * (self.touchObject.curX > self.touchObject.startX ? 1 : -1);
            if (opt.verticalSwiping === true) {
                positionOffset = self.touchObject.curY > self.touchObject.startY ? 1 : -1;
            }

            swipeLength = self.touchObject.swipeLength;

            self.touchObject.edgeHit = false;

            if (opt.infinite === false) {
                if (self.currentSlide === 0 && swipeDirection === 'right' || self.currentSlide >= self.getDotCount() && swipeDirection === 'left') {
                    swipeLength = self.touchObject.swipeLength * opt.edgeFriction;
                    self.touchObject.edgeHit = true;
                }
            }

            if (opt.vertical === false) {
                self.swipeLeft = curLeft + swipeLength * positionOffset;
            } else {
                self.swipeLeft = curLeft + swipeLength * (self.$list.height() / self.listWidth) * positionOffset;
            }
            if (opt.verticalSwiping === true) {
                self.swipeLeft = curLeft + swipeLength * positionOffset;
            }
            self.triggerHandler(_N + 'swipemove', [self]);

            if (opt.fade === true || opt.touchMove === false) {
                return false;
            }

            if (self.animating === true) {
                self.swipeLeft = null;
                return false;
            }

            self.setCSS(self.swipeLeft);
        },
        swipeStart: function swipeStart(event) {

            var self = this,
                opt = self.options,
                touches;

            self.interrupted = true;

            if (self.touchObject.fingerCount !== 1 || self.slideCount <= opt.slidesToShow) {
                self.touchObject = {};
                return false;
            }

            if (event.originalEvent !== undefined && event.originalEvent.touches !== undefined) {
                touches = event.originalEvent.touches[0];
            }

            self.touchObject.startX = self.touchObject.curX = touches !== undefined ? touches.pageX : event.clientX;
            self.touchObject.startY = self.touchObject.curY = touches !== undefined ? touches.pageY : event.clientY;

            self.dragging = true;
            self.triggerHandler(_N + 'swipestart', [self]);
            /////self.$slider.find('.' + _V.SLIDE).css('visibility', '');
        },
        unfilterSlides: function unfilterSlides() {

            var self = this,
                opt = self.options;

            if (self.$slidesCache !== null) {

                self.unload();

                self.$slideTrack.children(opt.slide).detach();

                self.$slidesCache.appendTo(self.$slideTrack);

                self.reinit();
            }
        },
        unload: function unload() {

            var self = this,
                opt = self.options;

            $('.' + _V.CLONED, self.$slider).remove();

            if (self.$dots) {
                self.$dots.remove();
            }

            if (self.$prevArrow && self.htmlExpr.test(opt.prevArrow)) {
                self.$prevArrow.remove();
            }

            if (self.$nextArrow && self.htmlExpr.test(opt.nextArrow)) {
                self.$nextArrow.remove();
            }

            self.$slides.removeClass(_V.SLIDE + ' ' + opt.activeClass + ' ' + _V.VISIBLE + ' ' + _V.CURRENT)
                .attr('aria-hidden', 'true')
                .css('width', '');
        },
        unbuild: function unbuild(fromBreakpoint) {

            var self = this,
                opt = self.options;
            self.triggerHandler(_V.UNBUILD, [self, fromBreakpoint]);
            self.destroy();
        },
        updateArrows: function updateArrows() {

            var self = this,
                opt = self.options;

            //centerOffset = Math.floor(opt.slidesToShow / 2);

            if (opt.arrows === true && self.slideCount > opt.slidesToShow && !opt.infinite) {
                self._updateArrow(self.$prevArrow.attr('title', '이전 슬라이드 보기'), true);
                self._updateArrow(self.$nextArrow.attr('title', '다음 슬라이드 보기'), true);

                if (self.currentSlide === 0) {
                    self._updateArrow(self.$prevArrow.attr('title', '이전 슬라이드 보기 - 첫 슬라이드입니다.'), false);
                } else if (self.currentSlide >= self.slideCount - opt.slidesToShow && opt.centerMode === false) {
                    self._updateArrow(self.$nextArrow.attr('title', '다음 슬라이드 보기 - 마지막 슬라이드입니다.'), false);
                } else if (self.currentSlide >= self.slideCount - 1 && opt.centerMode === true) {
                    self._updateArrow(self.$nextArrow.attr('title', '다음 슬라이드 보기 - 마지막 슬라이드입니다.'), false);
                }
            }
        },
        _updateArrow: function($arrow, flag) {
            var self = this;
            var opts = self.options;

            switch (opts.arrowsUpdate) {
                case 'disabled':
                    $arrow[flag ? 'removeClass' : 'addClass'](_V.DISABLED)
                        .prop('disabled', !flag)
                        .attr('aria-disabled', (!flag).toString());
                    break;
                case 'toggle':
                    $arrow.toggle(flag);
                    break;
            }
        },
        updateDots: function updateDots() {

            var self = this,
                opt = self.options;

            if (self.$dots.length) {
                self.$dots.find('li').removeClass(opt.activeClass).eq(Math.floor(self.currentSlide / opt.slidesToScroll)).addClass(opt.activeClass);
            }
        },
        visibility: function visibility() {

            var self = this,
                opt = self.options;

            if (opt.autoplay) {
                self.interrupted = !!document[self.hidden];
            }
        }
    });

    return Carousel;
});
/*!
 * @module vcui.ui.CarVR
 * @license MIT License
 * @description VR 컴포넌트
 * @copyright VinylC UID Group
 */
define(
    'ui/carVR', ['jquery', 'vcui', 'helper/gesture', 'ui/smoothScroll'],
    function($, core) {
        "use strict";

        // size만큼 앞에 0으로 붙인다. core에 있는데(vcui.number.zeroPad(2, 3)) 왜 만들었을까..
        var pad = function(value, size, ch) {
            var result = String(Math.abs(value));

            ch || (ch = "0");
            size || (size = 2);

            if (result.length < size) {
                while (result.length < size) {
                    result = ch + result;
                }
            }
            return result;
        };

        /**
         * @class
         * @description Exterior 모듈
         * @name vcui.ui.CarVR
         * @extends vcui.ui.View
         */
        var CarVR = core.ui('CarVR', /** @lends vcui.ui.CarVR# */ {
            bindjQuery: true,
            defaults: {
                images: '', // 이미지 url의 포맷. ex: ..../bus_###.jpg
                // currentFrame : 0,
                ratio: 0.12, // 움직임 크기
                reverse: true // 역순여부 0 -> 59 or 59 -> 0
            },
            selectors: {
                container: '.ui_carvr_content', // 외부 이미지 컨테이너
                preloader: '.ui_carvr_preloader', // 로딩
                btnStart: '.ui_carvr_start' // 로드 버튼
            },

            initialize: function(el, options) {
                var self = this;

                if (self.supr(el, options) === false) {
                    return;
                }

                self.isLoaded = false; // 로드 여부
                self.currentFrame = 0; // 현재 프레임

                self._getImageInfo(self.$('.ui_carvr_list button:eq(0)'));
                self._build();
                self._bindEvent();
            },

            _bindEvent: function() {
                var self = this;
                var ratio = self.options.ratio;
                var keydownTimer;

                // 마크업에서 일일이 변경하기가 번거로워서 스크립트로 해버림...;;
                self.$btnStart.find('.hide').replaceClass('hide', 'sr_only');

                if (!core.detect.isTouch) {
                    // I hate 웹접근성 and ios
                    self.$btnStart.attr('title', '키보드 좌, 우 버튼으로 화면을 제어할 수 있습니다.')
                }

                // 좌우 스와이핑
                self.$('.align_cont')
                    .vcGesture({
                        gesture: function() {
                            var fx;
                            var startFx = 0;

                            return function(type, data) {
                                if (self.isHide || !self.isLoaded) {
                                    return;
                                }

                                switch (type) {
                                    case 'start':
                                        startFx = self.currentFrame;
                                    case 'move':
                                        if (!data.diff) {
                                            return;
                                        }

                                        fx = Math.round((data.diff.x * ratio) + startFx) % self.totalFrame;
                                        fx = fx < 0 ? fx + self.totalFrame : fx;
                                        fx = fx + self.startFrame;

                                        self._changeImage(fx);
                                        break;
                                    default:
                                        self.currentFrame = fx;
                                }
                            };
                        }()
                    });

                if (!core.detect.isMobileDevice) {
                    var isKeydown = false;
                    // pc에서는 키보드로도 컨트롤할 수 있도록 해준다.
                    self.on('keydown keyup', function(e) {
                        if (e.type === 'keydown') {
                            if (isKeydown) {
                                return;
                            }

                            isKeydown = true;
                            clearInterval(keydownTimer); // 누르고 있을 때 자동으로 재생되도록 하기 위한 타이머
                            switch (e.which) {
                                case core.keyCode.LEFT:
                                    keydownTimer = setInterval(function() {
                                        self.rotateLeft();
                                    }, 160);
                                    break;
                                case core.keyCode.RIGHT:
                                    keydownTimer = setInterval(function() {
                                        self.rotateRight();
                                    }, 160);
                                    break;
                            }
                        } else {
                            clearInterval(keydownTimer);
                            isKeydown = false;
                        }
                    });
                }

                // 시작 버튼
                self.on('click', '.ui_carvr_start', function(e) {
                    e.preventDefault();

                    self._start();

                    self.$('.img_wrap .align_cont').attr('tabindex', -1).focus();
                });

                // for 웹전근성
                self.$('.btn_next').attr('title', '다음 이미지 보기');
                self.$('.btn_prev').attr('title', '이전 이미지 보기');

                // 우로 재생
                self.on('click', '.btn_next', function(e) {
                    self.rotateLeft();
                });

                // 좌로 재생
                self.on('click', '.btn_prev', function(e) {
                    self.rotateRight();
                });

                // 색상변경
                self.on('click mousedown', '.colorchip_list button', function(e) {
                    e.preventDefault();

                    if (e.type === 'mousedown') {
                        return;
                    }

                    var $btn = $(this);
                    var breakpoint = window.breakpoint;

                    self.currentFrame = 0;

                    // for 접근성
                    $btn.parent().activeItem('on');
                    self.$('.ui_carvr_list .color_name').text($btn.attr('data-name'));

                    self._getImageInfo($btn);
                    self.update(self.images[breakpoint.name], self.currentFrame);
                    setTimeout(function() {
                        self.$('.img_wrap .align_cont').attr('tabindex', -1).focus();
                    }, 100);
                });


                // breakpoint 변경 체크
                self.winOn('breakpointchange', function(e, breakpoint) {
                    if (self.built) {
                        self.reset(self.images[breakpoint.name]);
                    }
                });
            },

            /**
             * 색상칩의 버튼으로부터 이미지 경로정보 추출
             * @param $btn
             * @private
             */
            _getImageInfo: function($btn) {
                var self = this,
                    images;

                self.images = {};
                if (images = $btn.data('mobileImages')) {
                    self.images.mobile = images;
                }

                if (images = $btn.data('pcImages')) {
                    self.images.pc = images;
                }
            },

            /**
             * 빌드
             * @private
             */
            _build: function() {
                var self = this;

                if (self.built) {
                    return
                }
                self.built = true;

                // 이미지 컨테이너 생성
                if (self.$container.length === 0) {
                    self.$container = $('<img class="ui_carvr_content" src="">');
                    self.$el.append(self.$container)
                }

                // preloader 생성
                if (self.$preloader.length === 0) {
                    self.$preloader = $(
                        '<div class="ui_carvr_preloader" style="width:0px; display:none;"></div>');
                    self.$el.append(self.$preloader)
                }

                // 로딩바 생성
                if (!self.$loading) {
                    self.$loading = $(
                        '<div class="ui_carvr_loading" style="position:absolute;width:84px;height:84px;border-radius:42px;opacity:0.6;background-color:#000;top:50%;left:50%;margin-top:-42px;margin-left:-42px;display:none;text-align:center;line-height:84px;color:#fff;font-size:16px;"></div>');
                    self.$el.find('.inner').append(self.$loading);
                }

                // 시작 버튼
                self.$btnStart.find('.hide').replaceClass('hide', 'sr_only').text('360 VR 이미지 보기');

                // 요소의 드래깅 방지
                self.$container.css({
                    '-moz-user-select': 'none',
                    '-ms-user-select': 'none',
                    'user-select': 'none',
                    '-webkit-user-select': 'none',
                    '-webkit-user-drag': 'none',
                    'user-drag': 'none',
                    '-webkit-touch-callout': 'none'
                });

                // 컬러칩이 다 로드되면 가로 스크롤 생성
                core.util.waitImageLoad(self.$('.colorchip_list img'), true).done(function() {
                    self.$('.colorchip_list')
                        .vcSmoothScroll({
                            center: true,
                            prevButton: self.$('.colorchip_wrap .btn_prev').attr('aria-label', '좌로 스크롤'),
                            nextButton: self.$('.colorchip_wrap .btn_next').attr('aria-label', '우로 스크롤'),
                        });
                });
            },

            /**
             * 이미지경로 파싱 ..modile-###.png|0-59 ->..mobile-000.png ~ ..mobile-059.png
             * @param src
             * @return {{path: (*|string|string), start: number, end: number}|*}
             * @private
             */
            _parsePath: function(src) {
                var self = this;
                var arr = src.split('|');
                var frames, result, path;

                if (!arr.length) {
                    console.error('"car-###.png|0-1000" 형식으로 넣어주세요.');
                    return;
                }

                path = arr[0] || '';
                if (!/#+/.test(path)) {
                    console.error('"car-###.png|0-1000" 형식으로 넣어주세요.');
                    return;
                }

                frames = arr[1].split('~');
                if (frames.length !== 2) {
                    console.error('"car-###.png|0-1000" 형식으로 넣어주세요.');
                    return;
                }

                result = {
                    path: path,
                    start: parseInt(frames[0], 10),
                    end: parseInt(frames[1], 10)
                };
                result.total = result.end - result.start + 1;

                return result;
            },

            /**
             * 이미지를 불러오고 준비함
             * @param imgPath
             * @param frame
             * @return {*}
             */
            update: function(imgPath, frame) {
                var self = this;
                var opts = self.options;

                // if (!self.isLoaded) return;
                var info = self._parsePath(imgPath),
                    path;

                if (typeof frame !== 'undefined') {
                    opts.currentFrame = frame;
                }

                self.path = info.path;
                self.startFrame = info.start;
                self.endFrame = info.end;
                self.totalFrame = info.total;

                path = self._numbering(self._getFrame(self.currentFrame));
                self.$container.attr('src', path);
                self.$preloader.empty();

                for (var i = self.startFrame; i <= self.endFrame; i++) {
                    path = self._numbering(i);
                    self.$preloader.append('<img data-src="' + path + '">');
                }

                self.isLoaded = false;
                self.$el.removeClass('loaded');
                self.$loading.text('0%').show();
                self.$btnStart.parent().hide();
                return core.util.loadImages(self.$preloader.find('img[data-src]'), true)
                    .done(function() {
                        // 이미지 전체가 로드됐을 때 실행
                        self.isLoaded = true;
                        self.$loading.hide();
                        self.$el.addClass('loaded');
                        self._changeImage(frame || 0); // 다 로드되면 첫번째 이미지 표시
                        self.triggerHandler('vrpreloadercomplete', {});
                    })
                    .progress(function(target, percent) {
                        // 한장씩 로드될 때 실행(퍼센테이지 표시)
                        self.$loading.text(percent.toFixed(0) + '%');
                        self.triggerHandler('vrpreloaderchange', {
                            percent: parseInt(percent)
                        });
                    });

            },


            /**
             * 시작 버튼 클릭시 호출
             * @return {*}
             * @private
             */
            _start: function() {
                var self = this;

                var brakpointName = window.breakpoint.name;
                return self.update(self.images[brakpointName]);
            },

            /**
             * 방향 옵션에 따라 프레임계산
             * @param frame
             * @return {*}
             * @private
             */
            _getFrame: function(frame) {
                var self = this;

                if (self.options.reverse && frame > 0) {
                    frame = self.endFrame - frame;
                }

                return frame;
            },

            /**
             * 프레임에 해당하는 이미지 표시
             * @param frame
             * @private
             */
            _changeImage: function(frame) {
                var self = this;

                frame = self._getFrame(frame);
                self.$container.attr('src', self._numbering(frame)).attr('alt', (frame + 1) + '번째 이미지. 좌우 키보드로 이미지를 돌려볼 수 있습니다.');
            },

            /**
             * 주어진 수를 세자리로 변경
             * @param no
             * @return {*}
             * @private
             */
            _numbering: function(no) {
                return this.path.replace(/#+/, function(value) {
                    return pad(Math.abs(no), value.length);
                });
            },

            /**
             * 현재 프레임 반환
             * @return {number|*}
             */
            getCurrentFrame: function() {
                var self = this;
                return self.currentFrame;
            },

            /**
             * 현재 프레임 설정
             * @param frame
             */
            setCurrentFrame: function(frame) {
                var self = this;
                self.$container.attr('src', self._numbering(frame));
                self.currentFrame = frame;
            },

            hide: function() {
                var self = this;
                self.$container.hide();
                self.isHide = true;

            },

            show: function() {
                var self = this;
                self.$container.show();
                self.isHide = false;

            },

            /**
             * 좌로 회전
             */
            rotateLeft: function() {
                var self = this;

                if (!self.isLoaded) {
                    return;
                }

                self.currentFrame++;
                if (self.currentFrame > self.endFrame) {
                    self.currentFrame = self.startFrame;
                }
                self._changeImage(self.currentFrame);
            },

            /**
             * 우로 회전
             */
            rotateRight: function() {
                var self = this;

                if (!self.isLoaded) {
                    return;
                }

                self.currentFrame--;
                if (self.currentFrame < 0) {
                    self.currentFrame = self.endFrame;
                }
                self._changeImage(self.currentFrame);
            },

            /**
             * 초기화
             * @param images
             */
            reset: function(images) {
                var self = this;
                var info = self._parsePath(images);

                self.currentFrame = 0;
                self.isLoaded = false;
                self.$el.removeClass('loaded');
                self.$container.attr('src', info.path.replace(/#+/, function(value) {
                    return pad(0, value.length);
                }));
                self.$loading.text('0%').hide();
                self.$preloader.empty();
                self.$btnStart.parent().show();
            }
        });
        ///////////////////////////////////////////////////////////////////////////////////////

        return CarVR;

    });
/*!
 * @module vcui.ui.Dropdown
 * @license MIT License
 * @description 드롭다운 컴포넌트: 이거 원래 드롭다운인데, 다른 개발자에 의해 셀렉트박스가 아닌 어설픈 셀렉트박스로 변질되어 버림..ㅠㅠ..
 * @copyright VinylC UID Group
 */
define('ui/dropdown', ['jquery', 'vcui'], function($, core) {
    "use strict";

    var prefixClass = '.ui_dropdown_';

    var Dropdown = core.ui('Dropdown', {
        bindjQuery: 'dropdown',
        defaults: {
            appendToBody: false, // 드롭다운 리스트를 body로 놂겨서 표시할 것인가..(내부 스크롤 안에 있을 때 사용)
            disabled: false, // disabled 여부
            itemHeight: null, // 리스트항목의 height
            enabledPosition: false, //
            autoHideClicked: true, // 리스트항목을 클릭하고 나서 자동으로 닫히게 할 것인가
            autoHideFocusout: true, // 포커스가 드롭다운에서 벗어났을 때 자동으로 닫히게 할 것인가
            selectedClass: 'on', // 선택된 항목에 넣을 css클래스
            keyField: 'value', // data-id=""
            nameField: 'text', // data-value=""
            list: [] // 리스트 데이타
        },
        templates: {
            label: '<span>{{label}}</span>{{text}}<ico class="ico"></ico>'
        },
        selectors: {
            toggle: '.ui_dropdown_toggle',
            list: '.ui_dropdown_list'
        },
        initialize: function initialize(el, options) {
            var self = this;

            if (self.supr(el, options) === false) {
                return;
            }

            // body에서 띄웠을 때, 닫히면 다시 원위치로 원복시켜야 되므로 바로 뒤에 holder를 삽입시킨다.
            if (self.options.appendToBody) {
                self.$list.after(self.$holder = $('<span style="display:none"></span>'));
            }

            self.label = self.$toggle.children().text();
            self.selectedValue = ''; // 선택된 항목의 value
            self.selectedText = ''; // 선택된 항목의 text

            //self._setting(); // 초기에 선택된 항목을 찾아서 UI에 반영해준다.
            self._bindEvents();
            self._buildARIA();

            if (!core.isEmpty(self.options.list)) { // 옵션으로 넘어온 리스트가 있을 경우 이를 바탕으로 드롭다운리스트를 그린다.
                self.update(self.options.list);
            }

            var $li = self.$list.children('.on');
            if (!$li.length) {
                $li = self.$list.children().first();
            }
            self._select($li);
        },

        _buildARIA: function() {
            var self = this;

            if (!self.$list.attr('id')) {
                self.$list.attr('id', self.cid + '_popup');
            }

            // 히든텍스트(이제 ios 버그땜에 히든텍스트는 지양해야 됨..;;;;)
            self.$srOnly = $('<span class="sr_only">선택됨</span>');

            self.$list.children('.on').children().append(self.$srOnly);
            self.$toggle.attr({
                'aria-controls': self.$list.attr('id'),
                'aria-haspopup': true,
                'aria-expanded': false
            });
        },

        /**
         * 초기에 선택된 항목을 찾아서 UI에 반영해준다.
         * @param $el
         * @private
         */
        _setting: function _setting($el) {

            var self = this;
            var $active =
                $el || self.$list.children('.' + self.options.selectedClass);

            self.selectedValue = $active.attr('data-value');
            self.selectedText = $active.attr('data-text');

            self.$toggle.html(self.tmpl('label', {
                label: self.label,
                text: self.selectedText
            }));
        },

        _bindEvents: function _bindEvents() {
            var self = this;
            var opt = self.options;
            var $dropdownList = self.$('.ui_dropdown_list');

            self
                .on('click', prefixClass + 'toggle', function(e) {
                    // 열기, 닫기 버튼 클릭시
                    e.stopPropagation();
                    e.preventDefault();

                    if (opt.disabled) {
                        return self.close();
                    }
                    self[self.$el.hasClass('open') ? 'close' : 'open']();

                })
                .on('click', prefixClass + 'list', function(e) {
                    // 드롭다운 리스트에 있는 항목을 클릭했을 때
                    e.preventDefault();

                    if (!core.dom.contains(self.$list[0], e.target)) {
                        return;
                    }

                    var $li = $(e.target).closest('li');

                    self._select($li);

                    if (opt.autoHideClicked) { // 리스트의 항목을 클릭했을 때 자동으로 닫히게 할 것인가
                        self.close();
                        setTimeout(function() {
                            self.$toggle.focus();
                        });
                    }
                });

            // 드롭다운 리스트에서 발생하는 스크롤 이벤트들 무효화
            $dropdownList.on('touchstart touchmove mousewheel DOMMouseScroll', function(e) {
                if (self.$toggle.is(':visible')) { // toggle이 보인다는건 드롭다운 형식으로 표시되고 있음을 의미하므로...
                    e.stopPropagation();
                }
            });
        },
        /**
         * 드롭다운 리스트가 표시될 때 관련이벤트 바인딩
         * @private
         */
        _bindEventsByOpen: function _bindEventsByOpen() {
            var self = this;
            var opt = self.options;

            self.on('keydown', self._unhandleKeydown = function(e) {
                // ESC키를 눌렀을 때 닫히게
                if (27 === e.keyCode) {
                    e.stopPropagation();
                    self.close();
                    self.$(':focusable:first').focus();
                }
            });

            self.docOn("focusin", self._unhandleFocus = function(e) {
                // 포커스가 드롭다운을 벗어났을 때 닫히게
                clearTimeout(self.focusTimer), self.focusTimer = null;

                if ($(e.target).is('body')) {
                    return;
                }
                if (!core.dom.contains(self.el, e.target, true)) {
                    self.focusTimer = setTimeout(function() {
                        self.close();
                    }, 100);
                }
            });

            self.winOne('breakpointchange', self._unhandleResize = function() {
                // 리사이징할 때 자동으로 닫히게.....(한번만 실행)
                self.close();
            });

            setTimeout(function() {
                // click 이벤트와 겹치지 않도록 한타임 늦게 바인딩한다.
                self.docOn("mousedown keydown touchstart",
                    self._unhandleDocEvents = function(e) {
                        if (e.type === 'mousedown') {
                            if (core.dom.contains(self.el, e.target, true)) {
                                e.stopPropagation();
                            } else {
                                if (self.$el.hasClass("open")) {
                                    self.close();
                                }
                            }
                        } else {
                            var $toggle = self.$(prefixClass + 'toggle');
                            if (27 === e.keyCode) {
                                self.close();
                                $toggle.focus();
                            }
                        }
                    });
            }, 10);
        },
        /**
         * 닫힐 때 필요없는 이벤트 OFF 시켜준다
         * @private
         */
        _unbindEventsByClose: function _unbindEventsByClose() {
            var self = this;

            self.off('keydown', self._unhandleKeydown);
            self.winOff('breakpointchange', self._unhandleResize);
            self.docOff("focusin", self._unhandleFocus);
            self.docOff('mousedown keydown touchstart', self._unhandleDocEvents);
        },
        /**
         * 선택한 항목의 Text를 반홤
         * @returns {string|*}
         */
        getText: function getText() {
            var self = this;
            return self.selectedText;
        },
        getValue: function getValue() {
            var self = this;
            return self.selectedValue;
        },
        /**
         * 선택한 항목을 반환
         * @returns {{value: string|*, text: string|*}}
         */
        getSelected: function() {
            return {
                value: this.selectedValue,
                text: this.selectedText
            };
        },
        /**
         * 선택한 헝목의 UI을 갱신해주고 이벤트를 발생시킨다.
         * @param $el
         * @param isTrigger
         * @returns {_select}
         * @private
         */
        _select: function($el, isTrigger) {
            var self = this;

            $el.addClass(self.options.selectedClass)
                .siblings()
                .removeClass(self.options.selectedClass);

            $el.children().append(self.$srOnly);

            self._setting($el);

            if (isTrigger !== false) {
                self.uiTrigger('change', {
                    value: self.selectedValue,
                    text: self.selectedText
                });
            }

            return self;
        },
        /**
         * id에  해당하는 항목을 선택해준다.
         * @param value
         * @returns {setSelected}
         */
        setSelected: function setSelected(value) {
            var self = this;
            var $el = self.$list.children('[data-value="' + value + '"]');

            $el.addClass(self.options.selectedClass)
                .siblings()
                .removeClass(self.options.selectedClass);

            $el.children().append(self.$srOnly);
            self._setting();

            return self;
        },
        /**
         *
         * @param i
         * @param isTrigger
         * @returns {}
         */
        selectByValue: function(i, isTrigger) {
            var self = this;
            var $el = self.$list.children('[data-value="' + value + '"]');
            this._select($el, isTrigger);
            return this;
        },
        /**
         * text에 해당하는 항목을 선택
         * @param text
         * @param isTrigger
         * @returns {}
         */
        selectByText: function(text, isTrigger) {
            this._select(this.$list.children('[data-text="' + text + '"]'), isTrigger);
            return this;
        },

        selectByIndex: function(index, isTrigger) {
            this._select(this.$list.children().eq(index), isTrigger);
            return this;
        },
        /**
         * UI을 갱신시켜 주는 함수
         * @param list
         * @param isTrigger
         * @param isNoIndex
         * @returns {update}
         */
        update: function update(list, isTrigger, isNoIndex) {
            var self = this;
            if (!core.isArray(list)) return;

            var html = '',
                selected = 0;

            self.$list.empty();
            self.$toggle.html(self.tmpl('label', {
                label: self.label,
                text: ""
            }));

            for (var i = 0; i < list.length; i++) {
                //value = vcui.string.unescapeHTML(list[i][self.options.valueField]); // template에서 {{=title}}로 해도 됨
                if (!('selected' in list[i])) {
                    list[i].selected = false;
                }

                html += self.tmpl('item', list[i]);
                if (list[i].selected) {
                    selected = i;
                }
            }
            self.$list.append(html).scrollTop(0);
            if (!isNoIndex) {
                self.selectByIndex(selected, isTrigger);
            }

            return self;
        },
        /**
         * 선택된 항목이 보이도록 스크롤
         * @private
         */
        _scrollToActive: function() {
            var self = this;
            var opt = self.options;


            if (opt.enabledPosition) {
                var $active = self.$list.children('.' + self.options.selectedClass);
                if ($active.length) {
                    // var listHeight = self.$list.height();
                    var scrollTop = self.$list.scrollTop();
                    var activeTop = $active.position().top + scrollTop; // item중에 두줄이나 세줄인 것도 있을 수 있기 때문에 실제 위치를 구해야 된다.

                    // 가시영역 밖에 있을 때만 할것인가?......
                    // if (activeTop > scrollTop + listHeight || activeTop < scrollTop) {
                    self.$list.scrollTop(activeTop);
                    //}
                }
            }
        },
        /**
         * 드롭다운 리스트를 오픈
         */
        open: function open() {
            var self = this;
            var opt = self.options;

            if (opt.appendToBody) {
                var $toggle = self.$(prefixClass + 'toggle');
                var offset = $toggle.offset();

                $('body')
                    .append(self.$list.css({
                        position: 'absolute',
                        left: offset.left,
                        top: offset.top + $toggle.outerHeight()
                    }).show());
            }

            self.$el.addClass('open');
            self.$toggle.attr('aria-expanded', true);
            self._bindEventsByOpen();
            self._scrollToActive();
        },
        /**
         * 드롭다운 리스트를 닫기
         */
        close: function close() {
            var self = this;
            var opt = self.options;

            if (opt.appendToBody) {
                self.$holder.before(
                    self.$list.css({
                        position: '',
                        left: '',
                        top: ''
                    }).hide());
            }

            self.$el.removeClass('open');
            self.$toggle.attr('aria-expanded', false);
            clearTimeout(self.focusTimer);
            self._unbindEventsByClose();
            self.uiTrigger('close', {
                value: self.selectedValue,
                text: self.selectedText
            });
        },

        destroy: function() {
            var self = this;

            self._unbindEventsByClose();
            self.supr();
        }
    });

    return Dropdown;
});
/**
 * DropodwnMenu
 */
define('ui/dropmenu', [
    'jquery',
    'vcui'
], function($, core) {

    var Dropmenu = core.ui('Dropmenu', {
        bindjQuery: true,
        defaults: {
            hover: false, // 호버일때 열리게 할 것인가
            activeClass: 'open', // 활성화 클래스
            autoHide: true //
        },
        initialize: function(el, options) {
            var self = this;

            if (self.supr(el, options) === false) {
                return;
            }

            self._buildARIA();
            self._bindEvents();
        },

        /**
         * aria 설정
         * @private
         */
        _buildARIA: function() {
            var self = this;
            var $list = self.$('.ui_dropmenu_list');

            if (!$list.attr('id')) {
                $list.attr('id', self.cid + '_popup');
            }

            self.$('.ui_dropmenu_toggle, .ui_dropmenu_close')
                .filter('a')
                .attr('role', 'button')
                .filter('.ui_dropmenu_toggle')
                .attr({
                    'aria-controls': $list.attr('id'),
                    'aria-expanded': false,
                    'aria-haspopup': true
                });

            /*$list
                .children().attr('role', 'menu')
                .children().attr('role', 'presentation')
                .children().attr('role', 'menuItem');*/
        },

        _bindEvents: function() {
            var self = this;

            // 토글 버튼
            self.on('click', '.ui_dropmenu_toggle', function(e) {
                e.preventDefault();

                self.toggle();
            });

            // 닫기 버튼
            self.on('click', '.ui_dropmenu_close', function(e) {
                e.preventDefault();

                self.close();
            });

            // 호버일 때 호버관련 이벤트 바인딩
            if (self.options.hover) {
                self.on('mouseenter mouseleave', function(e) {
                    self[e.type === 'mouseenter' ? 'open' : 'close']()
                });
            }
        },

        /**
         * 토글 함수
         */
        toggle: function() {
            this[this.$el.is('.on, .open') ? 'close' : 'open']();
        },

        /**
         * 열기 메소드
         */
        open: function() {
            var self = this;

            self.$el.addClass(self.options.activeClass); //.find('.ui_dropmenu_list a:first').focus();
            self.$('.ui_dropmenu_toggle')
                .attr('aria-expanded', true)
                .find('.sr_only').text('닫기');

            self.options.autoHide && setTimeout(function() {
                // 다른 곳을 클릭하면 닫히게 해준다.
                self.docOn('click keydown', function(e) {
                    if (e.type === 'click') {
                        if (core.dom.contains(self.$el[0], e.target)) {
                            setTimeout(function() {
                                self.close();
                            }, 100);
                            return;
                        }
                        self.close();
                    } else {
                        if (e.which === core.keyCode.ESCAPE) {
                            self.close();
                        }
                    }
                });

                if (core.detect.isTouch) {
                    return;
                }
                // 포커스가 빠져나가면 자동으로 닫히도록 해준다..
                var thread;
                self.on('focusin focusout', function(e) {
                    switch (e.type) {
                        case 'focusin':
                            clearTimeout(thread);
                            break;
                        case 'focusout':
                            clearTimeout(thread);
                            thread = setTimeout(function() {
                                self.close();
                            }, 100);
                            break;
                    }
                });
            });
        },

        /**
         * 닫기
         */
        close: function() {
            var self = this;

            self.$el.removeClass(self.options.activeClass);
            self.$('.ui_dropmenu_toggle')
                .attr('aria-expanded', false)
                .find('.sr-only, .sr_only').text('열기');
            self.docOff('click keydown');
            self.off('focusin focusout');
        }
    });

    /*$(document).on('click', '.ui_dropmenu_toggle', function (e) {
        e.preventDefault();

        var $btn = $(this),
            $menuWrap = $btn.parent();

        if ($menuWrap.data('ui_dropdown_initialized')) {
            return;
        }

        $menuWrap.data('ui_dropdown_initialized', true);
        new Dropmenu($menuWrap, $menuWrap.data()).open();
    }).on('mouseenter', '.ui_dropmenu[data-hover=true]', function () {
        var $menuWrap = $(this);

        if ($menuWrap.data('ui_dropdown_initialized')) {
            return;
        }

        $menuWrap.data('ui_dropdown_initialized', true);
        new Dropmenu($menuWrap, $menuWrap.data()).open();
    });*/

    return Dropmenu;
});
/**
 * 푸터 컴포넌트
 *
 */
define('ui/footerSeoMenu', ['jquery', 'vcui'], function($, core) {
    return core.ui('FooterSeoMenu', {
        initialize: function(el, options) {
            var self = this;

            if (self.supr(el, options) === false) {
                return null;
            }

            self._buildARIA();
            self._bindEvents();
        },
        _bindEvents: function() {
            var self = this;

            // 토글 버튼 클릭시 - only mobile
            self.on('click', '.btn_open', function() {
                var breakpoint = window.breakpoint;

                if (breakpoint.isMobile) {
                    var $btn = $(this);
                    var $wrap = $btn.closest('.menu_list_wrap');
                    var isOpen = $wrap.toggleClass('open').hasClass('open');

                    $btn.attr({
                        'aria-expanded': isOpen,
                        'aria-label': function() {
                            var a = isOpen ? '열기' : '닫기';
                            var b = isOpen ? '닫기' : '열기';

                            return (this.getAttribute('aria-label') || '').trim().replace(a, b);
                        }
                    });
                }
            });

            // breakpoint가 바뀌면 전부 닫아준다.
            self.winOn('breakpointchange', function(e, data) {
                self.$('.menu_list_wrap').removeClass('open').find('.btn_open').each(function() {
                    // 부하를 생각해서 네이티브를 사용
                    this.setAttribute('aria-expanded', 'false');
                    this.setAttribute('aria-label', (this.getAttribute('aria-label') || '').trim().replace('열기', '닫기'));
                });

                self._buildARIA();
            });
        },

        _buildARIA: function() {
            var self = this;

            setTimeout(function() {
                self.$('.btn_open').attr({
                    'aria-expanded': false,
                    'aria-label': function() {
                        return (this.parentNode.firstChild.textContent || '').trim().replace(/\n/g, '') + ' 열기';
                    }
                });
            }, 100);
        }
    });
});
/*!
 * @module vcui.ui.Gnb
 * @license MIT License
 * @description Gnb 컴포넌트
 * @copyright VinylC UID Group
 */
define(
    'ui/gnb', ['jquery', 'vcui', 'ui/dropdown', 'helper/gesture', 'ui/panelFlicker'],
    function($, core, Dropdown, Gesture, PanelFlicker) {
        "use strict";

        var filterOne = core.array.filterOne;
        var include = core.array.include;
        var filterArray = core.array.filter;

        // 데이타 최적화
        function normalizeData(json) {
            var data = [];
            core.each(json.product, function(item, key) {
                data.push({
                    value: item.classification,
                    text: item.name,
                    children: renameKeys(item.children)
                });
            });

            return data;

            // 드롭다운에서 인식할 수 있도록 필드명 변경: code -> value, name -> text로 변경
            function renameKeys(list) {
                core.each(list, function(item) {
                    item.value = item.code;
                    item.text = item.name;

                    if (item.children) {
                        renameKeys(item.children);
                    }
                });

                return list;
            }
        }

        // 모델구분 필터링
        function filterModelType(list, type) {
            if (!type) {
                return list;
            }

            return filterArray(list, function(item) {
                // type이 item.type에 포함된 것만 필터링
                return include(item.type, type);
            });
        }

        // 모델리스트: 각 항목의 children을 합해서 반환
        function getModals(list) {
            var result = [];
            core.each(list, function(item) {
                result = result.concat(item.children);
            });
            return result;
        }


        return core.ui('Gnb', {
            templates: {
                // 아이템 템플릿
                modelItem: '{{#each item in list}}' +
                    '<li class="item {{#if item.url_name === curModel}}on{{/if}}" style="{{item.style}}">' +
                    ' <a href="{{=item.url}}">' +
                    '  <div class="module{{#if item.font_white_yn === "Y"}} dark{{/if}}">' +
                    '   <div class="txt_wrap">' +
                    '    <div class="title">{{item.name}}' +
                    '     {{#if item.upcoming}}' +
                    '      <p class="flag_wrap"><span>Upcoming</span></p>' +
                    '     {{/if}}' +
                    '    </div>' +
                    '   </div>' +
                    '   <div class="img_wrap">' +
                    '     <div class="inner" style="background-image: url(\'{{item.background}}\')">' +
                    '       <div class="align_cont">' +
                    '         <img src="{{item.thumb}}" alt="">' +
                    '       </div>' +
                    '     </div>' +
                    '   </div>' +
                    '  </div>' +
                    ' </a>' +
                    '</li>{{/each}}',
                // 메뉴가 홀수개로 배치된 패널에다 채울 요소
                oddItem: '<li class="item odd">' +
                    ' <div class="module">' +
                    '  <div class="img_wrap">' +
                    '   <div class="inner"><img src="/kr/images/common/gnb-odd.svg" alt="" aria-hidden="true"></div>' +
                    '  </div>' +
                    ' </div>' +
                    '</li>'
            },
            defaults: {
                url: ''
            },
            selectors: {
                root: $('html'),
                depth1Wrap: '.depth1_wrap',
                ddDepth1: '.ui_dropdown_depth1', // 1depth 드롭다운
                ddDepth2: '.ui_dropdown_depth2', // 2depth 드롭다
                depth2Wrap: '.depth2_wrap',
                ddDepth3: '.prod_depth3', // 3depth 드롭다운
                scrollWraps: '.depth2_menu>.scroll_wrap',
                modelList: '.ui_model_list', // 모델 리스트
                panels: '.depth2_wrap>.depth2_menu',
                navs: '.depth1_wrap .depth1_list a:not(.ui_link)'
            },
            initialize: function initialize(el, options) {
                var self = this;

                if (self.supr(el, options) === false) {
                    return;
                }

                self.currentIndex = 0;
                self.paths = location.pathname.split('/').slice(2);

                self._buildARIA();
                self._resizeScrollWrap = core.delayRun(self._resizeScrollWrap, 100);
                self._bindEvents();
                self._buildDropdown();
            },

            /**
             * aria 속성들 설정
             * @private
             */
            _buildARIA: function _buildARIA() {
                var self = this,
                    breakpoint = window.breakpoint;

                self.$navs.each(function(i) {
                    this.setAttribute('aria-controls', $(this).attr('href').replace(/^#/, ''));
                });

                self._updateARIA();
            },

            /**
             * pc / mobile 에 따른 aria속성 변경
             * @private
             */
            _updateARIA: function() {
                var self = this,
                    breakpoint = window.breakpoint;

                if (breakpoint.isPc) {
                    // pc에서는 일반모드
                    self.$navs.attr({
                        'role': 'button',
                        'aria-haspopup': true,
                        'aria-expanded': false
                    });
                } else {
                    // 모바일때는 탭버튼 모드
                    self.$navs.removeAttr('aria-haspopup aria-expanded');
                    self.$navs.removeAttr('title').each(function() {
                        if ($(this.parentNode).hasClass('active')) {
                            $(this).attr('title', '선택됨');
                        }
                    });
                }
            },

            /**
             * 이벤트 바인딩
             * @private
             */
            _bindEvents: function _bindEvents() {
                var self = this;

                // 대메뉴 클릭시
                self.on('click', '.gnb_wrap a:not(.ui_link)', function(e) {
                    e.preventDefault();

                    var breakpoint = window.breakpoint;
                    if (breakpoint.isPc) {
                        self._handlePc(e)
                    } else if (breakpoint.isMobile) {
                        self._handleMobile(e);
                    }
                });

                // esc를 누르면 닫는다.
                if (!core.detect.isMobileDevice) {
                    self.docOn('keyup', function(e) {
                        if (e.which === core.keyCode.ESCAPE && self.$root.hasClass('gnb_open')) {
                            var $a = self.$navs.filter('[aria-expanded=true]');
                            var index = $a.parent().index();

                            self.close(index);
                            $a.focus();
                        }
                    });
                }
                
                /* 190729 추가 */
                self.docOn('click', '#skipnavi a', function (e) {
                   var $a = self.$navs.filter('[aria-expanded=true]');
                   var index = $a.parent().index();

                   self.close(index);
                   $a.focus();
                });
                /* // 190729 추가 */
                
                self.winOn('breakpointchange', function(e, breakpoint) {
                    self._buildPanelFlicker();
                    self._updateARIA();
                });
                self._buildPanelFlicker();

                self.winOn('resize', function(e) {
                    self._resizeScrollWrap();
                });
                self._resizeScrollWrap();
            },

            /**
             * pc해상도에서 1depth메뉴를 클릭시
             * @param e
             * @private
             */
            _handlePc: function _handlePc(e) {
                var self = this;
                var $li = $(e.currentTarget).parent();
                var isOpened = self.$root.hasClass('gnb_open');
                var index = $li.index();

                if (isOpened && $li.hasClass('active')) {
                    // 열려있으면 닫는다.
                    self.close(index);
                } else {
                    // 닫햐있으면 열어준다.
                    self.open(index);
                }
            },

            /**
             * mobile해상도에서 1depth메뉴를 클릭시
             * @param e
             * @private
             */
            _handleMobile: function _handleMobile(e) {
                var self = this,
                    $a = $(e.currentTarget);

                var index = self.$navs.parent().index($a.parent());
                self.panelFlicker.movePanel(index, {
                    focusPanel: true
                });
            },

            /**
             * 모바일 모드일 때 패널을 플리킹할 수 있도록 모듈을 빌드하고 pc일땐 제거
             * @private
             */
            _buildPanelFlicker: function() {
                var self = this,
                    breakpoint = window.breakpoint;

                if (breakpoint.isMobile) {
                    self.panelFlicker = new PanelFlicker(self.el, {
                        lazyLoad: false
                    });
                } else if (breakpoint.isPc) {
                    if (self.panelFlicker) {
                        self.panelFlicker.destroy();
                        self.panelFlicker = null;
                    }
                }
            },

            /**
             * 패널의 사이즈를 창 사이즈에 맞게 조절
             * @private
             */
            _resizeScrollWrap: function _resizeScrollWrap() {
                var self = this;

                var top = self.$depth2Wrap.offset().top;
                self.$scrollWraps.css({
                    height: window.innerHeight - top
                });

                if (self.panelFlicker) {
                    self.panelFlicker.resize();
                }
            },

            updateSize: function updateSize() {
                this._resizeScrollWrap();
            },

            /**
             * 닫힐 때 활성화되어 있던 메뉴로 포커싱해준다...
             */
            focusActive: function() {
                var self = this;

                self.$('.depth1_list.active a:first').focus();
            },

            // 특장 여부
            _isStrongPoint: function _isStrongPoint(type) {
                type = type.toLowerCase();
                return type === 'truck' || type === 'bus';
            },

            /**
             *
             * @param type
             * @return {*}
             * @private
             */
            _getDepth3Data: function _getDepth3Data(type) {
                if (!type) {
                    return null;
                }

                type = type.toLowerCase();
                if (this._isStrongPoint(type)) {
                    return this.ddDepth3[type].getSelected();
                } else {
                    return null;
                }
            },

            /**
             * 3, 4단계 드롭다운 빌드
             * @private
             */
            _buildDropdown: function _buildDropdown() {
                var self = this;

                self.ddDepth3 = {};

                // 전체, 버스, 트럭
                self.ddDepth1 = new Dropdown(self.$ddDepth1, {
                    templates: {
                        label: '<span>{{text}}</span>',
                        item: '<li class="prodDepth1_list" ' +
                            'data-value="{{value}}" ' +
                            'data-text="{{text}}"><a href="#" role="button">{{text}}</a></li>'
                    }
                });

                // 특장
                self.ddDepth2 = new Dropdown(self.$ddDepth2, {
                    templates: {
                        label: '<span>{{text}}</span>',
                        item: '<li class="prodDepth2_list" ' +
                            'data-value="{{value}}" ' +
                            'data-text="{{text}}"><a href="#" role="button">{{text}}</a></li>'
                    }
                });

                self.ddDepth3.truck = new Dropdown(
                    self.$ddDepth3.filter('.truck'), {
                        templates: {
                            label: '{{text}}<i class="ico"></i>'
                        }
                    });

                self.ddDepth3.bus = new Dropdown(
                    self.$ddDepth3.filter('.bus'), {
                        templates: {
                            label: '{{text}}<i class="ico"></i>'
                        }
                    });

                ////////////////////////////////////////////////////////////////////////////////
                self.ddDepth1.on('dropdownchange', function(e, data) {
                    // 1depth 아이템에 해당하는 데이타로 렌더링
                    self._updateDepth2(data);
                    init3Depth(data.value);

                    self.ddDepth2.$el.show();

                    self._renderModels({
                        depth1: data,
                        depth2: self.ddDepth2.getSelected(),
                        depth3: self._getDepth3Data(data.value)
                    })
                });

                self.ddDepth2.on('dropdownchange', function(e, data) {
                    // 2depth 아이템에 해당하는 데이타로 렌더링
                    self.ddDepth3.truck.selectByIndex(0, false);
                    self.ddDepth3.bus.selectByIndex(0, false);

                    self._renderModels({
                        depth1: self.ddDepth1.getSelected(),
                        depth2: data,
                        depth3: self._getDepth3Data(self.ddDepth1.getSelected().value)
                    });
                });

                self.ddDepth3.truck.on('dropdownchange', function(e, data) {
                    // 트럭 아이템에 해당하는 데이타로 렌더링
                    self._renderModels({
                        depth1: self.ddDepth1.getSelected(),
                        depth2: self.ddDepth2.getSelected(),
                        depth3: data
                    });
                });

                self.ddDepth3.bus.on('dropdownchange', function(e, data) {
                    // 버스 아이템에 해당하는 데이타로 렌더링
                    self._renderModels({
                        depth1: self.ddDepth1.getSelected(),
                        depth2: self.ddDepth2.getSelected(),
                        depth3: data
                    })
                });

                self._fetchMenu();

                function init3Depth(type) {
                    // 트럭, 버스 드롭다운을 초기화
                    self.ddDepth3.truck.selectByIndex(0, false);
                    self.ddDepth3.bus.selectByIndex(0, false);
                    self.$ddDepth3.removeClass('on');
                    if (type) {
                        self.$ddDepth3.filter('.' + type.toLowerCase()).addClass('on');
                    }
                }
            },

            /**
             * 메뉴 데이타 로딩
             * @return {*}
             * @private
             */
            _fetchMenu: function _fetchMenu() {
                var self = this;
                return $.ajax({
                        url: self.options.url,
                        dataType: 'json'
                    })
                    .done(function(json) {
                        self.carData = normalizeData(json);
                        self._updateOnceProduct();
                    });
            },

            /**
             * 2뎁스 메뉴 업데이트
             * @param data
             * @private
             */
            _updateDepth2: function _updateDepth2(data) {
                var self = this;
                var finded = filterOne(self.carData,
                    function(item) {
                        return item.value == data.value;
                    });


                if (finded) {
                    self.$ddDepth2.show();
                    self.ddDepth2.update(
                        [{
                            value: '',
                            text: '특장 전체'
                        }].concat(finded.children),
                        false);
                }
            },

            /**
             * 차량 모델 렌더링
             * @param data
             * @private
             */
            _renderModels: function _renderModels(data) {
                var self = this;
                var breakpoint = window.breakpoint;

                var list = filterOne(self.carData, function(item) {
                        return item.value === data.depth1.value;
                    }),
                    html = '';

                if (data.depth2) {
                    list = !data.depth2.value ? getModals(list.children) :
                        filterOne(list.children, function(item) {
                            return item.value === data.depth2.value;
                        });
                }

                // 특장 (only 버스, 트럭)
                if (data.depth3) {
                    list = !data.depth3.value ?
                        list :
                        filterModelType(list.children || list, data.depth3.value)
                }

                if (list.children) {
                    list = list.children;
                }

                // 중복데이타 제거
                list = core.array.unique(list, function(item) {
                    return item.code;
                });

                // 정렬
                list.sort(function(a, b) {
                    return parseInt(a.no, 10) - parseInt(b.no, 10);
                });

                // 템플릿으로 마크업 생성
                html += self.tmpl('modelItem', {
                    list: list,
                    curModel: self.paths[0] === 'products' ? self.paths[2] : ''
                });

                if (breakpoint.isPc) {
                    if (list.length > 0 && list.length % 2 !== 0) {
                        html += self.tmpl('oddItem');
                    }
                }

                self.$modelList.html(html);
                self._animateItems(self.$panels.filter('.product_menu'), true);
                self._resizeScrollWrap();

                // core.PubSub.trigger('common:activeMenu');
            },

            /**
             * 메뉴 애니메이셔닝
             * @param $panel
             * @param isForce
             * @private
             */
            _animateItems: function($panel, isForce) {
                if ($panel.data('opened') && isForce !== true) {
                    return;
                }

                var self = this;
                var $items = $panel.find('.depth2_list .item');

                if (hcgCommon.useEffect) {
                    $items.css({
                        opacity: 0,
                        y: 50,
                        duration: 300,
                        easing: 'easeOutQuad'
                    });

                    // 애니메이션 시작시간 설정
                    $items.each(function(i) {
                        $(this)
                            .transition({
                                opacity: 1,
                                y: 0,
                                duration: 300,
                                easing: 'easeOutQuad',
                                delay: (i + 1) * 150
                            });
                    });
                }

                $panel.data('opened', true);
            },

            /**
             * 처음에 열었을 때 비로소 데이타를 UI에 갱신(딱 한번만 실행)
             * @private
             */
            _updateOnceProduct: function() {
                var self = this;

                if (!self.isFirstLoaded) {
                    self.isFirstLoaded = true;
                    self.ddDepth1.update(self.carData); // 무조건 불러오지 않고 gnb를
                    // 여는 순간에 모델리스트를
                    // 불러온다.
                    self._activeProductMenu();
                }
            },

            /**
             * 현재 페이지가 products이고, 최초 오픈이면 해당 메뉴들을 찾아서 active
             * 해준다.
             * @private
             */
            _activeProductMenu: function() {
                var self = this;

                if (self.paths[0] !== 'products') {
                    return;
                }

                // track, bus 드롭다운 선택
                self.$ddDepth1.find('li').each(function(i) {
                    if ($(this).data('value').toLowerCase() === self.paths[1]) {
                        self.ddDepth1.selectByIndex(i);
                        return false;
                    }
                });

                if (self.panelFlicker && window.breakpoint.isMobile) {
                    self.panelFlicker.movePanel(1); // product 패널로 이동
                }
            },

            _activeOnceMobileMenu: function() {
                var self = this;

                // 모바일인 경우 active는 처음에만 실행
                if (!self.isDoneActive) {
                    self.isDoneActive = true;
                    if (self.paths[0]) {
                        var $li = self.$navs.parent().filter('[data-menu-name="' + self.paths[0] + '"]');
                        if ($li.length) {
                            self.panelFlicker.movePanel(self.$navs.index($li.children()));
                        }
                    }
                }
            },

            /**
             * 열림 체크
             * @return {*|boolean}
             */
            isOpened: function() {
                return this.$root.hasClass('gnb_open');
            },

            /**
             * pc모드로 오픈
             * @param index
             * @private
             */
            _openPc: function(index) {
                var self = this;
                var $a;

                self.uiTriggerHandler('beforeopen'); // trigger: gnbbeforeopen

                self.$navs.removeAttr('title').parent().removeClass('on');

                if (core.isNumber(index)) {
                    $a = self.$navs.eq(index);

                    self.$navs.attr('aria-expanded', false);
                    $a.attr('aria-expanded', true).attr('title', '선택됨')
                        .parent().activeItem('active');

                    self._animateItems(self.$panels.eq(index).activeItem('on'));
                    setTimeout(function() {
                        // comahead: self.$panels.eq(index).find('a:first').focus();
                        if (core.detect.isIOS) {
                            // ios에서는 엘리먼트가 포커싱이 안된다..ios10이전에는 됐었음...
                            self.$panels.eq(index).find('a:first').focus();
                        } else {
                            self.$panels.eq(index).attr('tabindex', -1).focus().removeAttr('tabindex');
                        }
                    }, 80);
                }

                self.$root.addClass('gnb_open');
                self._resizeScrollWrap();
                self.uiTriggerHandler('open'); // trigger: gnbopen
            },

            _openMobile: function(index) {
                var self = this;

                if (self.$root.hasClass('gnb_open')) {
                    return;
                }

                self.uiTriggerHandler('beforeopen'); // trigger: gnbbeforeopen
                self._updateOnceProduct();
                self.$root.addClass('gnb_open');
                self._resizeScrollWrap();
                self._activeOnceMobileMenu();
                self.uiTriggerHandler('open'); // trigger: gnbopen
            },

            _closePc: function(index) {
                var self = this;

                self.uiTriggerHandler('beforeclose'); // trigger: gnbbeforeclose
                self.$navs.removeAttr('title').attr('aria-expanded', false);
                self.$panels.removeClass('on');
                self.$root.removeClass('gnb_open');
                self.uiTriggerHandler('close'); // trigger: gnbclose
            },

            _closeMobile: function(index) {
                var self = this;

                if (!self.$root.hasClass('gnb_open')) {
                    return;
                }

                self.uiTriggerHandler('beforeclose'); // trigger: gnbbeforeclose
                self.$root.removeClass('gnb_open');
                self.uiTriggerHandler('close'); // trigger: gnbclose
            },

            /*
            only mobile
             */
            open: function open(index) {
                var self = this;

                if (self.activeIndex === index && self.isOpen) {
                    return;
                }

                self.activeIndex = index;
                self.isOpen = true;
                if (window.breakpoint.isMobile) {
                    self._openMobile(index);
                } else {
                    self._openPc(index);
                }
            },

            /*
            only mobile
             */
            close: function close(index) {
                var self = this;

                if (!self.isOpen) {
                    return;
                }

                self.activeIndex = -1;
                self.isOpen = false;
                if (window.breakpoint.isMobile) {
                    self._closeMobile(index);
                } else {
                    self._closePc(index);
                }
            }
        })

    });
/*!
 * @module vcui.ui.Header
 * @license MIT License
 * @description Header
 * @copyright VinylC UID Group
 */
define(
    'ui/header', [
        'jquery',
        'vcui',
        'ui/gnb',
        'libs/raphael.min',
        'ui/topBanner',
        'ui/scrollview'
    ],
    function($, core, Gnb, Raphael, TopBanner) {
        "use strict";
        /**
         * pc모드일 때 표시되는 전체메뉴를 담당하는 컴포넌트
         */
        var PcAllmenu = core.ui('PcAllmenu', {
            selectors: {
                root: $('html')
            },
            initialize: function(el, options) {
                var self = this;

                if (self.supr(el, options) === false) {
                    return;
                }

                self.$allmenuWrap = self.$('.allMenu_wrap');
                self.$scrollWrap = self.$('.scroll_wrap');
            },

            updateSize: function() {
                var self = this;

                var top = self.$allmenuWrap.offset().top;
                self.$scrollWrap.css({
                    height: window.innerHeight - top,
                    overflow: 'hidden'
                });
            },

            toggle: function(flag) {
                var self = this;
                self[flag ? 'open' : 'close']();
            },

            isOpened: function() {
                return this.$root.hasClass('allmenu_open');
            },

            open: function() {
                var self = this;

                if (self.$root.hasClass('allmenu_open')) {
                    self.updateSize();
                    return;
                }

                self.uiTriggerHandler('beforeopen');

                self.$root.addClass('allmenu_open');
                self.$el.addClass('open').find('.scroll_wrap').scrollTop(0); // 스크롤을 처음위치로 옮김
                self.$('.search_area input').focus();

                if (!hcgCommon.useEffect) {
                    self.$el.addClass('no_motion');
                } else {
                    self.$el.addClass('motion');
                }

                self.uiTriggerHandler('open');

                self.winOn('resizeend', function() {
                    self.updateSize();
                });
                self.updateSize();

                setTimeout(function() {
                    self.docOn('keydown', function(e) {
                        if (e.which === core.keyCode.ESCAPE) {
                            self.close();
                        }
                    });
                }, 100);
            },

            close: function() {
                var self = this;

                if (!self.$root.hasClass('allmenu_open')) {
                    return;
                }

                self.uiTriggerHandler('beforeclse');
                self.$root.removeClass('allmenu_open');
                self.$el.removeClass('open motion no_motion');
                self.docOff();
                self.winOff();
                self.uiTriggerHandler('close');
            }
        });

        /**
         * 햄버거 메뉴의 렌더링 및 애니메이션 담당
         * @type {void | *}
         */
        var Hambuger = core.BaseClass.extend({
            initialize: function($el) {
                var self = this;

                self.$el = $el;
                self.openSvgs = [];
                self.closeSvgs = [];

                self.draw();
            },

            draw: function() {
                
             // 스마트 기기이면 app.css 추가
                if (!IEUA.SMART) {

                    var self = this;

                    self.originPaths = [
                        "M97 57.5L17 57.5L17 53.5L97 53.5Z",
                        "M97 46.5L17 46.5L17 42.5L97 42.5Z",
                        "M97 35.5L17 35.5L17 31.5L97 31.5Z"
                    ];
                    self.paths = [
                        "M85 75.5L23.171 13.5L28.83 13.5L90.83 75.5Z",
                        "M119 46.5L118 46.5L118 42.5L119 42.5Z",
                        "M90.83 13.5L28.83 75.5L23.171 75.5L85.172 13.5Z"
                    ];

                    var closeSvg = Raphael(0, 0, '100%', '100%');
                    closeSvg.setViewBox(0, 0, 115, 90);
                    self.closeSvgs = core.array.map(self.originPaths, function(item) {
                        return closeSvg.path(item).attr({
                            fill: '#ffffff',
                            stroke: 'none'
                        });
                    });

                    closeSvg.canvas.setAttribute('class', 'ui_close_svg');
                    closeSvg.canvas.setAttribute('focusable', 'false');
                    self.$el.find('.btn_close .ui_allmenu_toggle').append(closeSvg.canvas)
                        .find('.hide').replaceClass('hide', 'sr_only');

                    var openSvg = Raphael(0, 0, '100%', '100%');
                    openSvg.setViewBox(0, 0, 115, 90);
                    self.openSvgs = core.array.map(self.originPaths, function(item) {
                        return openSvg.path(item).attr({
                            fill: "#37729F",
                            stroke: 'none'
                        });
                    });

                    openSvg.canvas.setAttribute('class', 'ui_open_svg');
                    openSvg.canvas.setAttribute('focusable', 'false');
                    self.$el.find('.btn_open .ui_allmenu_toggle').append(openSvg.canvas)
                        .find('.hide').replaceClass('hide', 'sr_only');
                } 
                
            },

            changeClose: function(color) {
                var self = this;

                for (var i = 0; i < self.closeSvgs.length; i++) {
                    if (color) {
                        self.closeSvgs[i].attr({
                            fill: color
                        });
                    }

                    if (!hcgCommon.useEffect) {
                        self.closeSvgs[i].attr({
                            'path': self.paths[i]
                        });
                    } else {
                        self.closeSvgs[i].animate({
                            'path': self.paths[i]
                        }, i === 1 ? 200 : 300, '<>');
                    }
                }
            },

            changeOpen: function() {
                var self = this;

                for (var i = 0; i < self.closeSvgs.length; i++) {
                    self.closeSvgs[i].attr({
                        'path': self.originPaths[i]
                    });
                }
            }
        });

        /**
         * url 파싱
         * @returns {Array}
         */
        function parsePathname() {
            var paths = location.pathname.substr(1).split('/');
            var results = [];

            for (var i = 1; i < paths.length; i++) {
                results.push(paths[i]);
            }

            return results;
        }

        return core.ui('Header', {
            defaults: {},
            selectors: {
                root: $('html'),
                navs: '.depth1_list>a:not(.ui_link)' // 페이지 이동 링크는 제외
            },
            initialize: function initialize(el, options) {
                var self = this;

                if (self.supr(el, options) === false) {
                    return;
                }

                // 현재 url 파싱
                self.paths = parsePathname();

                self._activeMenu();
                self._build();
                self._bindEvents();
                self._buildARIA();
            },

            _buildARIA: function() {
                var self = this;

                /*self.$('.ui_allmenu_toggle').attr({
                    'aria-haspopup': true,
                    'aria-expanded': false
                });*/
            },

            /**
             * 헤더에 포함된 TopBanner, Hamberger, GNB, AllMenu 컴포넌트 빌드
             * @private
             */
            _build: function _build() {
                var self = this;

                // 탑배너 빌드(쿠키 등을 체크하여 오픈할 상황일 때만 빌드)
                (function(self, $topBanner) {
                    if (!TopBanner.checkOpen($topBanner)) {
                        return;
                    }

                    self.topBanner = new TopBanner($topBanner, {
                        onClose: function() {
                            if (self.gnb.isOpened()) {
                                self.gnb.updateSize();
                            }

                            if (self.allmenu.isOpened()) {
                                self.allmenu.updateSize();
                            }
                        }
                    });
                })(self, $('#uiTopBanner'));

                self.hambuger = new Hambuger(self.$el); // 햄버그 버튼
                self.gnb = new Gnb('#uiGnb', {}); // GNB
                self.allmenu = new PcAllmenu('#uiAllMenu'); // 전체 메뉴

                core.PubSub.trigger('common:loadedHeader'); // 헤더가 완료되었음을 헤더 바깥으로 알려준다.

                setTimeout(function() {
                    self._buildScrollviews();
                });
            },
            _bindEvents: function _bindEvent() {
                var self = this;

                // 전체 메뉴 이벤트에 따라 주요작업 처리
                self.allmenu.on(
                    'pcallmenubeforeopen pcallmenuopen pcallmenuclose',
                    function(e) {
                        switch (e.type) {
                            case 'pcallmenubeforeopen': // 전체메뉴가 열리기전
                                core.PubSub.trigger('common:preventScroll', true);
                                break;

                            case 'pcallmenuopen': // 전체메뉴가 열렸을 때
                                self.hambuger.changeClose('#ffffff');
                                self.triggerHandler('headeropen');
                                break;

                            case 'pcallmenuclose': // 전체메뉴가 닫혔을 때
                                core.PubSub.trigger('common:preventScroll', false);
                                self._restoreActive1Depth();
                                self.hambuger.changeOpen();
                                self.triggerHandler('headerclose');

                                self.$('.btn_open .ui_allmenu_toggle').focus();
                                break;
                        }
                    });

                // gnb 이벤트에 따라 주요작업 처리
                self.gnb.on('gnbbeforeopen gnbopen gnbclose', function(e) {
                    switch (e.type) {
                        case 'gnbbeforeopen': // gnb가 열리기 전
                            core.PubSub.trigger('common:preventScroll', true); // 본문 스크롤을 막는다.
                            break;

                        case 'gnbopen': // gnb가 열렸을 때
                            var breakpoint = window.breakpoint;
                            setTimeout(function() {
                                if (breakpoint.isPc) {
                                    self.hambuger.changeClose('#37729F');
                                } else {
                                    self.hambuger.changeClose('#ffffff');
                                }
                            });

                            //
                            if (self.topBanner) {
                                self.topBanner.updateSize();
                            }
                            //self.$el.attr('tabindex', -1).focus();
                            self.triggerHandler('headeropen');
                            break;

                        case 'gnbclose': // gnb가 닫혔을 때
                            core.PubSub.trigger('common:preventScroll', false); // 본문 스크롤을 푼다.
                            self._restoreActive1Depth();
                            setTimeout(function() {
                                self.hambuger.changeOpen();
                            });
                            self.triggerHandler('headerclose');
                            break;
                    }
                });

                // pc 일땐 전체메뉴 모바일일 땐 gnb메뉴 토글
                self.on('click', '.ui_allmenu_toggle', function(e) {
                    e.preventDefault();

                    var type = $(this).data('type');
                    var breakpoint = window.breakpoint;
                    var isOpenGnb = self.$root.hasClass('gnb_open');
                    //var isOpenAllmenu = self.$root.hasClass('allmenu_open');

                    if (breakpoint.isPc) {
                        if (type === 'close') {
                            // 이넘의 접근성....;;
                            if (isOpenGnb) {
                                self.gnb.focusActive();
                            }
                        }

                        self.gnb.close();
                        self.allmenu[type]();
                    } else {
                        // mobile
                        self.allmenu.close();
                        self.gnb[type]();
                        // 열릴 때 첫번째 메뉴에 포커싱
                        if (type === 'open') {
                            setTimeout(function() {
                                self.$('.depth1_list.active a').focus(); // 첫번째 메뉴
                            });
                        }
                    }
                });

                // breakpoint를 지날 때 열려있던 것들을 모두 닫아버린다.
                self.winOn('breakpointchange', function(e, breakpoint) {
                    self.gnb.close();
                    self.allmenu.close();
                    self._restoreActive1Depth();
                });


                self._bindSearchForm();
            },

            // 검색 입력폼 밸리데이션 체크 //////////////////////////////////
            _bindSearchForm: function() {
                var self = this;
                var $search_area = self.$('.search_area');
                var $search_input = self.$('.search_area :text').attr('title', '검색어를 입력해 주세요.');

                // 검색 버튼 클릭시
                self.on('click', '.search_area .btn_search', function(e) {
                    if ($.trim($search_input.val()).length == 0) {
                        //$search_area.addClass('blank');
                        alert('한 글자 이상 입력해 주세요.');
                        $search_input.focus();
                        e.preventDefault();
                    }
                });

                // 에러메세지 클릭시
                self.on('click', '.search_area .error_msg', function(e) {
                    $search_area.removeClass('blank');
                    $search_input.focus();
                    e.preventDefault();
                });

                // 인풋에서 엔터키 입력시 밸리데이션 체크
                self.on('keypress', '.search_area input', function(e) {
                    if (e.which === core.keyCode.ENTER) {
                        if ($.trim($search_input.val()).length == 0) {
                            //$search_area.addClass('blank');
                            alert('한 글자 이상 입력해 주세요.');
                            e.preventDefault();
                        }
                    } else {
                        if ($search_area.hasClass('blank')) {
                            $search_area.removeClass('blank');
                        }
                    }
                });

                // 포커스아웃일 때 빈칸 제거
                self.on('focusout', '.search_area input', function(e) {
                    if (!core.string.trim(this.value)) {
                        this.value = '';
                    }
                });
            },

            /**
             * 내부에 있는 모든 커스텀 스크롤바 빌드
             * @private
             */
            _buildScrollviews: function() {
                var self = this;

                // 스크롤뷰 적용
//                if (!core.detect.isAndroid) {
//                    self.$('.scroll_wrap:has(>.scroll_inner)').vcScrollview();
//                } else {
//                    self.$('.scroll_wrap>.scroll_bar').hide();
//                }
                self.$('.scroll_wrap:has(>.scroll_inner)').vcScrollview();
            },

            /**
             * 현재 페이지에 해당하는 메뉴들을 활성화 처리(data-menu-name 속성를 체크)
             * @private
             */
            _activeMenu: function() {
                var self = this;

                //TODO :  뉴스일경우
                if(location.href.replace(/#$/g, '').indexOf("/news") != -1){
                    $('[data-menu-name="experience"]').addClass('on');
                    $('[data-menu-name="뉴스"]').addClass('on');
                }else{
                    core.each(self.paths, function(path) {
                        $('[data-menu-name="' + path + '"]').addClass('on');
                    });
                }

            },

            /**
             * 메뉴가 닫힐 때 원래 활성화돼 있던 1depth 메뉴를 활성화
             * 시켜준다.(pc에만 해당)
             * @private
             */
            _restoreActive1Depth: function() {
                var self = this,
                    breakpoint = window.breakpoint;

                if (!self.paths.length) {
                    return;
                }

                if (breakpoint.isPc) {
                    self.$navs.parent()
                        .removeClass('on active')
                        .filter('[data-menu-name="' + self.paths[0] + '"]')
                        .addClass('on');
                } else {
                    self.$('.btn_open .ui_allmenu_toggle').focus();
                }
            }
        })

    });
// 히스토리 드롭다운
define('ui/historyDropdown', ['jquery', 'vcui'], function($, core) {
    return core.ui('HistoryDropdown', {
        bindjQuery: true,
        defaults: {},
        selectors: {
            list: '.list'
        },
        initialize: function(el, options) {
            var self = this;

            if (self.supr(el, options) === false) {
                return;
            }

            self.$srOnly = $('<span class="sr_only">선택됨</span>');

            self._buildARIA();
            self._bindEvents();
            self._scrollToContent();
        },

        _buildARIA: function() {
            var self = this;

            self.$list.attr('id', 'historyDropdown_' + core.string.random(6));
            self.$('.tab_open')
                .attr({
                    'role': 'button',
                    'aria-controls': self.$list.attr('id'),
                    'aria-haspopup': true,
                    'aria-expanded': false
                });

            self.$('.item.on').children().attr('aria-current', 'page').append(self.$srOnly);
        },

        _bindEvents: function() {
            var self = this;

            // 열기 버튼 클릭시
            self.on('click', '.tab_open', function(e) {
                e.preventDefault();

                self.toggle();
            });

            self.winOn('breakpointchange', function(e) {
                self.close();
            });
        },

        /**
         * 타겟 위치로 스크롤
         * @private
         */
        _scrollToContent: function() {
            if (location.hash.length > 1) {
                $(window).load(function() {
                    var $content = $(location.hash);
                    if ($content.length) {
                        $('html, body').animate({
                            scrollTop: Math.ceil($content.offset().top) - 50
                        }, 200);

                        $content.attr('tabindex', 0).focus().removeAttr('tabindex');
                    }
                });
            }
        },

        /**
         * 토글
         */
        toggle: function() {
            var self = this;

            if (self.$el.hasClass('open')) {
                self.close();
            } else {
                self.open();
            }
        },

        /**
         * 열기
         */
        open: function() {
            var self = this;

            self.$el.addClass('open');
            self.$list.scrollTop(self.$list.scrollTop() + self.$list.children('.on').position().top);
            self.$('.tab_open').attr('aria-expanded', true);
            self.docOn('click', self._closeHandle = function(e) {
                if (core.dom.contains(self.el, e.target)) {
                    return;
                }
                self.close();
            });
        },

        /**
         * 닫기
         */
        close: function() {
            var self = this;

            self.$el.removeClass('open');
            self.$('.tab_open').attr('aria-expanded', false);
            self.docOff('click', self._closeHandle);
        }
    });
});
define('ui/hyundaiNetwork', ['jquery', 'vcui', 'helper/geolocation', 'ui/naverMap'], function($, core, Geolocation, NaverMap) {
    return {
        defaults: {
            defaultPoint: {
                lng: '127.1072383',
                lat: '37.423104',
                address: ''
            },
            zoom: 10,
            pageSize: 20,
            getSource: function() {
                return $.Deferred().reject();
            }
        },
        init: function(options) {
            var self = this;

            self.options = core.extend({}, self.defaults, options);
            self.geo = Geolocation.getInstance(); // geolocation 헬퍼
            self.map = self._getMap(); // 지도 생성
            self.tmplItem = core.template($('#tmplItem').html()); // 아이템 템플릿 파싱
            self.lastPosition = null; // 마지막에 클릭한 위치값
            self.permissionState = 'prompt'; // geolocation 권한 상태값

            self.$listWrap = $('#uiListWrap'); // 스크롤 영역(only pc)
            self.$list = $('#uiList'); // 아이템들이 삽입될 리스트
            self.$listNoResult = $('#uiListNoResult'); // 결과없음 요소
            self.$currentAddr = $('#uiCurrentAddr'); // 현재 주소 표시 요소
            self.$resultInfo = $('#uiResultInfo'); // 리스트 카운트 표시 요소
            self.$txtSearchKeyword = $('#txtSearchkeyword'); // 검색어 인풋
            self.$btnMore = $('#btnMore'); // 더보기 버튼
            self.$tooltip = $('#uiGeoTooltip'); // 툴팁
            self.$srOnly = $('<span class="sr_only">선택됨</span>'); // screen read only
            self.positions = []; // 리스트에 있는 위치값들

            self._setCurrentPosition(self.options.defaultPoint);
            //self.getList();
            self._checkPermission();
            self._bindEvents();
            self._getMap();
        },

        /**
         * 위치설정의 기설정 여부 체크
         * @private
         */
        _checkPermission: function() {
            var self = this;

            self.geo.queryPermission().then(function(permission) {
                self.permissionState = permission.state;

                switch (self.permissionState) {
                    case 'prompt': // 아직 아무것도 설정이 안 되어 있을 경우
                    case 'unknown': // 기설정여부는 지원 안하지만 geolocation는 지원할 경우(only ios safari)
                        self.showTooltip('현재 위치와 가장 가까운 지점을 확인하시려면<br>현재 위치 설정 버튼을 선택해 현재 위치를 허용해 주세요.');
                        self.getList();
                        break;
                    case 'granted': // 이미 허용한 경우
                        self._getCurrentPosition(function(position) {
                            // success and get address
                            self._getCoord2Addr(position, function(info) {
                                position.address = info.address;

                                self.isCurrentPosition = true;
                                self._setCurrentPosition(position);
                                self.getList();

                                self.showTooltip('사용자의 현재 위치가 설정되었습니다.');
                            });
                        }, function() {
                            // error
                            self._setCurrentPosition(self.options.defaultPoint);
                            self.getList();
                        });
                        break;
                    default:
                        self.getList();
                        break;
                }
            });
        },

        /**
         * 툴팁 표시
         * @param msg
         * @param options
         */
        showTooltip: function(msg, options) {
            this.$tooltip.find('.inner>span').html(msg);
            this.$tooltip.fadeIn(120);

            if (options && options.autohide) {
                setTimeout(function() {
                    this.$tooltip.fadeOut(120);
                }.bind(this), options.autohide);
            }
        },

        /**
         * 툴팁 숨김
         */
        hideTooltip: function() {
            this.$tooltip.fadeOut(120);
        },

        /**
         * 이벤트 바인딩
         * @private
         */
        _bindEvents: function() {
            var self = this;

            $(window).on('breakpointchange', function() {
                var map = self.map = self._getMap();

                self.$listWrap.scrollTop(0);

                if (self.lastPosition) {
                    // pc -> mobile로 전환시, 마지막으로 클릭한 지점에 지도를 표시
                    if (window.breakpoint.isMobile) {
                        self._moveMapElement(self.$list.children('.on'));
                    }
                    // 마지막에 클릭한 지점으로 포인트 이동(사용자가 만지면서 위치가 옮겨졌을 수도 있기에)
                    map.setCenter(self.lastPosition);
                }
            }).on('resize', function() {
                if (window.breakpoint.isMobile && self._miniMap) {
                    // 모바일 일 때 지도의 세로사이즈를 가로사이즈의 0.8비율로 리사이징
                    self._miniMap.getElement().css({
                        minHeight: self.$list.width() * 0.8
                    });
                }
            });

            // 툴팁
            self.$tooltip.on('click', '.close', function(e) { // 툴팁 닫기
                e.preventDefault();

                self.hideTooltip();
                self.$currentAddr.parent().find('.ui_find_current').focus();
            });

            // 위치 재설정
            self.$currentAddr.parent().on('click', '.ui_find_current', function(e) {
                e.preventDefault();

                var $btn = $(this);

                self.hideTooltip();
                self.updateCurrentPosition(function() {
                    $btn.focus();
                });
            });

            // 더보기
            self.$btnMore.click(function() {
                self.getList(true).done(function() {
                    // 새로 추가된 항목 중에 첫번째 항목에 포커싱
                    self.$list.find('.ui_new_item a:first').focus();
                });
            });

            // 지도 포인트 움직이기
            self.$list.on('click', '>li', function(e) {
                if ($(e.target).parent().is('h2')) {
                    e.preventDefault();                   
                }

                var $li = $(this);
                if ($li.hasClass('on')) {
                    // 이미 활성화 돼 있을 경우
                    $li.find('.map_view').addClass('open');
                    self._getMap().setCenter($li.data());
                    //self._getMap().setZoom(self.options.zoom);
                } else {
                    self._selectItem($li);
                }

                // 선택한 요소로 스크롤링
                self._scrollTo($li);
            });       

            // 주소 복사
            self.$list.on('click', '.ui_copy_url', function(e) {
                e.preventDefault();

                core.dom.copyToClipboard(core.string.unescapeHTML($(this).data('addr')), {
                    onSuccess: function() {
                        alert('주소가 복사되었습니다.');
                    },
                    onError: function() {
                        //alert('해당 브라우저에서는 복사기능이 지원하지 않습니다.')
                    }
                });
            });
        },

        /**
         * 클릭한 요소로 스크롤
         * @param $li
         * @private
         */
        _scrollTo: function($li) {
            var self = this;

            setTimeout(function() {

                if (window.breakpoint.isMobile) {
                    $('html, body').animate({
                        scrollTop: $li.offset().top - 5
                    }, 200);
                } else {
                    // 스크롤뷰 밖에 위치한 요소는 스크롤뷰 내에 보이도록 스크롤링
                    var height = $li.outerHeight(true);
                    var scrollTop = self.$listWrap.scrollTop();
                    var top = $li.position().top + scrollTop;
                    var bottom = top + height;
                    var wrapHeight = self.$listWrap.height();
                    var limit = scrollTop + wrapHeight;

                    if (bottom > limit) {
                        // 밑으로 벗어나 있을 경우
                        self.$listWrap.stop().animate({
                            scrollTop: scrollTop + (bottom - limit)
                        }, 140);
                    } else if (top < scrollTop) {
                        // 위로 벗어나 있을 경우
                        self.$listWrap.stop().animate({
                            scrollTop: top
                        }, 140);
                    }
                }
            }, 60);
        },

        /**
         * 현재 위치 표시
         * @param position
         * @private
         */
        _setCurrentPosition: function(position) {
            var self = this;

            self.currentPosition = position;
            self.$currentAddr.text(position.address || '주소 정보를 알 수 없습니다.');
        },

        /**
         * 프로세스를 거쳐 현재 위치 반환
         * @param callback
         */
        doProcess: function(callback) {
            var self = this;

            if (core.detect.isMobileDevice) {
                $('#uiDefaultModal, #uiRequestModal, #uiDenyModal').find('.ui_browser').text('디바이스');
            }

            // 비동기로는 현재 위치 추척 기능을 사용할 수 없음...ㅠㅠ
            switch (self.permissionState) {
                case 'denied': // 차단되어 있을 경우
                case 'error': // geolocation을 지원하지 않을 경우
                    showDefaultModal(callback);
                    break;
                case 'granted': // 허용되어 있을 경우
                case 'unknown': // 기설정 상태를 알 수 없음. but geolocation은 지원하는 경우
                    self._getCurrentPosition(function(position) {
                        $('#uiDenyModal').vcModal({
                            effect: 'none'
                        }).on('modalok', function() {
                            callback(position, true);
                        });
                    }, function(err) {
                        showDefaultModal(callback);
                    });
                    break;
                case 'prompt': // 아직 아무것도 설정이 안 되어 있을 경우
                    $('#uiRequestModal').vcModal({
                        effect: 'none'
                    }).on('modalallow', function() {
                        // 허용 버튼
                        self._getCurrentPosition(function(position) {
                            callback(position, true);
                            self.showTooltip('사용자의 현재 위치가 설정되었습니다.');
                        }, function(err) {
                            showDefaultModal(callback);
                        });
                    }).on('modaldeny', function(e) {
                        // 차단 버튼
                        showDefaultModal(callback);
                    });
                    break;
            }

            function showDefaultModal(callback) {
                // 기본 지점으로 설정함을 알리는 모달창
                $('#uiDefaultModal').vcModal({
                    effect: 'none'
                }).on('modalok', function(e) {
                    callback(self.options.defaultPoint);
                });
            }
        },

        /**
         * 현재 위치 조회
         * @param callback
         * @param failure
         * @private
         */
        _getCurrentPosition: function(callback, failure) {
            var self = this;

            self.geo.getCurrentPosition().then(function(position) {
                self.permissionState = 'granted';

                callback({
                    lng: position.lng,
                    lat: position.lat
                });
            }).fail(function(err) {
                switch (err.code) {
                    case 0:
                    case 2:
                        self.permissionState = 'error';
                        break;
                    case 1:
                        self.permissionState = 'denied';
                        break;
                    case 3:
                        self.permissionState = 'granted';
                        break;
                }

                // 시스템 오류로 인한 차단인 경우
                if (failure) {
                    failure(err);
                }
            });
        },

        /**
         * 현재 위치 업데이트
         */
        updateCurrentPosition: function(callback) {
            var self = this;

            // 현재 위치의 주소를 조회
            self.doProcess(function(position, isCurrentPosition) {
                self.currentPosition = position;
                self.isCurrentPosition = !!isCurrentPosition;

                if (isCurrentPosition) {
                    // 현재 위치가 조회됐을 때만 주소 조회
                    self._getCoord2Addr(position, function(info) {
                        self.currentPosition.address = info.address;
                        self._setCurrentPosition(self.currentPosition);

                        if (callback) {
                            callback();
                        }
                        self.getList(); // 현재 위치가 설정됐을 경우 현재 위치를 기준으로 한 리스트를 새로 불러옴.
                    });
                } else {
                    self._setCurrentPosition(self.currentPosition);
                    if (callback) {
                        callback();
                    }
                    self.getList();
                }
            });
        },

        /**
         * 좌표에 해당하는 주소 반환
         * @param position
         * @param callback
         */
        _getCoord2Addr: function(position, callback) {
            naver.maps.Service.reverseGeocode({
                location: new naver.maps.LatLng(position.lat, position.lng)
            }, function(status, response) {
                if (status === naver.maps.Service.Status.ERROR) {
                    callback({
                        error: true,
                        address: '현재 위치의 주소 정보가 없습니다.',
                        point: {
                            x: position.lng,
                            y: position.lat
                        }
                    });
                    return;
                }

                callback(response.result.items[0]);
            });
        },

        /**
         * 항목을 선택
         * @param $li
         * @return {boolean}
         * @private
         */
        _selectItem: function($li) {
            var self = this;
            var position;
            var map;
            var $wrap;
            var zoomData;

            if ($li.hasClass('on')) {
                return false;
            }

            $li.siblings().filter('.on').find('.h4_tit>a').attr('aria-selected', 'false'); // 기존에 선택돼 있던 아이템을 초기화

            position = $li.data(); // 현재 선택된 아이템의 데이타를 data속성에서 가져옴
            map = self._getMap(); // 현재 해상도에 맞는 지도를 가져옴
            $wrap = $li.find('.map_view');
            zoomData = $("#" + map.$el[0].id).data("zoom");

            $li.activeItem('on'); // 활성화
            $li.find('.h4_tit a').attr('aria-selected', 'true').append(self.$srOnly); // aria, 히든텍스트 갱신
            $wrap.addClass('open');
            self.$list.find('.map_view.open').not($wrap[0]).removeClass('open');

            if (window.breakpoint.isMobile) {
                map.clearMarkers().addMarkers([position]); // 모바일용 지도는 포인트를 하나만 설정
                self._moveMapElement($li); // 지도를 현재 활성화되어 있는 위치로 옮김
            }

            map.setCenter(self.lastPosition = position); // 지도 좌표를 포인트위치로 이동

            if (typeof zoomData === 'undefined') {
                map.setZoom(self.options.zoom); // 기본 줌사이즈로 설정
            }else{
                map.setZoom(zoomData); // 기본 줌사이즈로 설정
            }
            map.update(); // 지도 크기 갱신
            return true;
        },

        /**
         * 모바일용 지도를 해당 li로 이동
         * @param $li
         * @private
         */
        _moveMapElement: function($li) {
            var self = this;

            if (window.breakpoint.isMobile) {
                self._getMap().clearMarkers().addMarkers([$li.data()]);
                self._getMap()
                    .getElement()
                    .css({
                        minHeight: self.$list.width() * 0.8
                    }) // 세로 사이즈를 가로사이즈의 80%로 설정
                    .show()
                    .appendTo($li.find('.map_location'))
            }
        },

        /**
         * 리스트 조회
         * @param isMore 더보기 인 경우 true이 넘어옴
         * @returns {*}
         */
        getList: function(isMore) {
            if (this.isFetching) {
                return $.Deferred();
            }

            var self = this;
            var attr = self.options.getSource(); // ajax설정은 외부에서 받도록 한다.
            var map = self._getMap();
            var lastid = isMore ? self.$list.children('li').last().attr('data-id') || 0 : 0; // 리스트에 있는 마지막 li에서 data-id를 추출해서 ajax 파라미터로 던진다.

            var options = core.extend(true, {
                data: {
                    lat: self.currentPosition.lat, // 현재 y 좌표
                    lng: self.currentPosition.lng, // 현재 x 좌표
                    lastid: lastid, // 기존에 로드된 항목중에 마지막 항목의 id값
                    page_size: self.options.pageSize // 페이지 사이즈
                }
            }, attr);

            self.isFetching = true; // 로딩 중인가
            return $.ajax(options).done(function(res) {
                var list = res.resultData.data;
                var totalCount = res.resultData.total_count | 0;
                var positions, $tmp;

                if (totalCount === 0) {
                    // 결과가 없을 경우
                    self._setNoResult();
                    return;
                }

                // 바깥에서 데이타를 가공
                if (self.options.mapItems) {
                    list = self.options.mapItems(list);
                }

                // 길찾기를 위한 추가정보 추가
                list = self._appendCurrentParams(list);

                // 위치 정보만 추출
                positions = core.array.map(list, function(item) {
                    var _item = {
                        lat: item.lat,
                        lng: item.lng,
                        title: item.name,
                        events: {
                            click: self._handleMarker(item)
                        }
                    };

                    if (item.icon) {
                        _item.icon = item.icon;
                    }
                    return _item;
                });

                // 새로 추가된 것들 중에 첫번째 항목을 알아내기 위해 메모리상에서 먼저 렌더링
                if (isMore) {
                    self.positions = self.positions.concat(positions);
                    map.addMarkers(positions);

                    $tmp = $('<ul>').append(self.tmplItem({
                        list: list
                    }));
                    $tmp.children().first().addClass('ui_new_item'); // 포커싱 처리를 위해 포커싱대상에 클래스를 추가해놓는다.
                    $tmp.find('.h4_tit>a').attr({
                        'role': 'button',
                        'aria-selected': 'false'
                    }); // 새로 추가된 요소에 aria 속성추가(템플릿에서 추가하면 될것을 내가 왜 여기에서 처리했지?...;;)
                    self.$list.find('.ui_new_item').removeClass('ui_new_item'); // 기존 항목에 있던 ui_new_item클래스는 제거
                    self.$list.append($tmp.children());
                } else {
                    map.clearMarkers().addMarkers(positions);

                    // empty 하기전에 모바일 지도는 리스트 밖으로 빼놓는다. 안 그러면 가비지 콜렉터의 대상이 돼버린다.
                    if (self._miniMap) {
                        self.$listWrap.append(self._miniMap.getElement().hide());
                    }

                    $tmp = $('<ul>').append(self.tmplItem({
                        list: list
                    }));
                    $tmp.find('.h4_tit>a').attr({
                        'role': 'button',
                        'aria-selected': 'false'
                    });

                    self._setResultInfo(totalCount);
                    self.positions = positions;
                    self.$listWrap.scrollTop(0).show(); // scroll to 0
                    self.$listNoResult.hide(); // hide no result element
                    self.$list
                        .empty()
                        .append($tmp.children());

                    //시승네트워크&구매상담신청은 첫번째항목 선택 제외
                    if( attr.data.type != "trialrun"){
                        if(attr.data.type == "purchase" && typeof self.isCurrentPosition === 'undefined'){
                            // 마지막인지 체크하여 더보기 버튼 토글
                            if (self.$list[0].children.length >= totalCount) {
                                self.$btnMore.parent().hide();
                            } else {
                                self.$btnMore.parent().show();
                            }
                            return;
                        }
                        // 첫번째 항목 선택
                        self._selectItem(self.$list.children().first());
                    }
                }
                $tmp = null;

                // 마지막인지 체크하여 더보기 버튼 토글
                if (self.$list[0].children.length >= totalCount) {
                    self.$btnMore.parent().hide();
                } else {
                    self.$btnMore.parent().show();
                }
            }).fail(function() {
                // 에러가 났을 경우
                if (!isMore) {
                    self._setNoResult();
                }
            }).always(function() {
                // 로드 완료
                self.isFetching = false;
            });
        },

        /**
         * 지도상의 마커를 클릭시, 리스트에서 해당 요소를 활성화시키고 스크롤.(only pc)
         * @param item
         * @return {Function}
         * @private
         */
        _handleMarker: function(item) {
            var self = this;
            var id = item.data_id;

            return function() {
                if (window.breakpoint.isMobile) {
                    return;
                }

                var $li = self.$list.children('[data-id="' + id + '"]');

                if ($li.hasClass('on')) {
                    return;
                }

                $li.click();
                self._scrollTo($li);
            };
        },

        /**
         * 길찾기 url에 현재 위치를 설정(현재 위치가 설정된 경우에만...)
         * @param list
         * @returns {*}
         * @private
         */
        _appendCurrentParams: function(list) {
            var self = this;

            core.each(list, function(item) {
                if (self.isCurrentPosition) {
                    item.appendParameter = '&slat=' + self.currentPosition.lat + '&slng=' + self.currentPosition.lng + '&sText=' + encodeURIComponent(self.currentPosition.address);
                } else {
                    item.appendParameter = '';
                }
            });

            return list;
        },

        /**
         * 검색결과 정보 표시
         * @param totalCount
         * @private
         */
        _setResultInfo: function(totalCount) {
            var self = this;

            if (self.$txtSearchKeyword.trimVal()) {
                // 검색어가 있을 경우
                self.$resultInfo.html("<strong>'" + core.string.toEntities(self.$txtSearchKeyword.trimVal()) + "'</strong>에 대한 검색 결과 <strong>총 " + totalCount + "건</strong>");
            } else {
                self.$resultInfo.html('<strong>총 ' + totalCount + '개의 지점이 검색되었습니다.</strong>');
            }
        },

        /**
         * 검색결과가 없을 경우 '검색결과 없음'을 표시
         * @private
         */
        _setNoResult: function() {
            var self = this;
            // empty 하기전에 모바일 지도는 리스트 밖으로 빼놓는다. 안 그러면 가비지 콜렉터의 대상이 돼버린다.
            if (self._miniMap) {
                self.$listWrap.append(self._miniMap.getElement().hide());
            }
            self.$list.empty().parent().hide();
            self.$listNoResult.show();
            self.positions = [];
            self._setResultInfo(0);
            self._getMap().clearMarkers();
        },

        /**
         * 모바일용, pc용 지도를 따로 두고 구현함...
         * @returns {*}
         * @private
         */
        _getMap: function() {
            var self = this;
            if (window.breakpoint.isMobile) {
                // 모바일용 지도
                return self._miniMap || (self._miniMap = new NaverMap('#uiMobileMap', {
                    zoom: self.options.zoom,
                    icon: {
                        src: '/kr/images/network/map_point.png',
                        size: [28, 40]
                    },
                    map: {
                        zoomControl: true,
                        draggable: false,
                        scrollWheel: false
                    },
                    markers: self.positions,
                    center: self.lastPosition
                }));
            } else {
                // pc용 지도
                return self._map || (self._map = new NaverMap('#uiPcMap', {
                    zoom: self.options.zoom,
                    icon: {
                        src: '/kr/images/network/map_point.png',
                        size: [44, 57]
                    },
                    map: {
                        zoomControl: true,
                        scrollWheel: false
                    },
                    markers: self.positions,
                    center: self.lastPosition
                }));
            }
        }
    };
});

/**
 * 현재 위치 조회
 */
define('ui/currentPosition', ['jquery', 'vcui', 'helper/geolocation', 'ui/naverMap'], function($, core, Geolocation, NaverMap) {
    return {
        defaults: {
            defaultPoint: {
                lng: '126.839071',
                lat: '37.518877',
                address: '서울특별시 양천구 남부순환로 563'
            },
            zoom: 4
        },
        init: function(options) {
            var self = this;

            self.options = core.extend({}, self.defaults, options);
            self.geo = Geolocation.getInstance(); // geolocation 헬퍼
            self.permissionState = options.permissionState; // geolocation 권한 상태값
        },
        
        /**
         * 현재 위치 조회
         * @param callback
         * @param failure
         * @private
         */
        _getCurrentPosition: function(callback, failure) {
            var self = this;

            self.geo.getCurrentPosition().then(function(position) {
                self.permissionState = 'granted';

                callback({
                    lng: position.lng,
                    lat: position.lat
                });
                
            }).fail(function(err) {
                switch (err.code) {
                    case 0:
                    case 2:
                        self.permissionState = 'error';
                        break;
                    case 1:
                        self.permissionState = 'denied';
                        break;
                    case 3:
                        self.permissionState = 'granted';
                        break;
                }

                // 시스템 오류로 인한 차단인 경우
                if (failure) {
                    failure(err);
                }
            });
        },
    
        /**
         * 프로세스를 거쳐 현재 위치 반환
         * @param callback
         */
        doProcess: function(callback) {
            var self = this;
            
            self._getCurrentPosition(function(position) {
                callback(position, true);
            }, function(err) {
                callback(self.options.defaultPoint, false);
            });
        },

        /**
         * 현재 위치 반환;
         */
        updateCurrentPosition: function(callback) {
            var self = this;

            // 현재 위치의 주소를 조회
            self.doProcess(function(position, success) {
                callback(position, success, self.permissionState);
            });
        }
    };
});

/*!
 * @module vcui.helper.InviewScroll
 * @license MIT License
 * @description InviewScroll 컴포넌트
 * @copyright VinylC UID Group
 */
define('ui/inviewScroll', ['jquery', 'vcui'], function($, core) {
    "use strict";

    var getRect = core.dom.getRect;

    /**
     * inview 여부 감시자
     * @type {void | *}
     */
    var Watcher = core.BaseClass.extend({
        initialize: function initialize(elements, options) {
            var self = this;
            var opt;

            self.elements = elements;
            self.options = opt =
                $.extend(true, {
                        allowInScroll: false,
                        delay: 200,
                        offset: {
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0
                        },
                        threshold: 0 // 0, 0.5, 1
                    },
                    options);

            self.handlers = {
                enter: [],
                move: [],
                leave: []
            };
            self.singles = {
                enter: [],
                move: [],
                leave: []
            };

            if (opt.throttle !== false) {
                if (opt.delay && !opt.throttle) {
                    self.check = core.delayRun(self.check, opt.delay, self);
                } else if (!opt.delay && opt.throttle) {
                    self.check = core.throttle(self.check, opt.throttle, self);
                }
            }

            self._bindEvents();
        },
        _bindEvents: function _bindEvents() {
            var self = this;
            var opt = self.options;

            if (opt.on) {
                core.each(opt.on, function(handler, name) {
                    self.on(name, handler);
                });
            }

            if (opt.once) {
                core.each(opt.once, function(handler, name) {
                    self.once(name, handler);
                });
            }
        },
        /**
         * 인뷰 핸들러 클리어
         */
        clear: function clear() {
            this.handlers.enter = this.handlers.move = this.handlers.leave = [];
            this.singles.enter = this.handlers.move = this.singles.leave = [];
        },
        /**
         * 인뷰 핸들러 등록
         * @param name
         * @param handler
         * @returns {Watcher}
         */
        on: function on(name, handler) {
            var self = this;

            self.handlers[name].push(handler);

            return self;
        },
        /**
         * 인뷰클리어 일회성 핸들러 등록
         * @param name
         * @param handler
         * @returns {Watcher}
         */
        once: function once(name, handler) {
            var self = this;

            self.singles[name].push(handler);

            return self;
        },
        /**
         * 등록된 핸들러 실행
         * @param name
         * @param el
         * @param top
         * @returns {Watcher}
         */
        emit: function emit(name, el, top) {
            var self = this,
                args = [].slice.call(arguments, 1);

            self.handlers[name].forEach(function(handler) {
                handler.apply(self, args);
            });

            while (self.singles[name].length) {
                self.singles[name].pop().apply(self, args);
            }

            return self;
        },
        /**
         * 인뷰 여부 체크해서 이벤트 실행
         */
        check: function check() {
            var self = this;

            self.elements.forEach(function(el) {
                var status = el.getAttribute('data-inview-state');
                if (self.inview(el)) {
                    self.emit('move', el, getRect(el));
                    if (status !== 'in') {
                        el.setAttribute('data-inview-state', 'in');
                        self.emit('enter', el);
                    }
                } else {
                    if (status === 'in') {
                        el.setAttribute('data-inview-state', 'out');
                        self.emit('leave', el);
                    }
                }
            });
        },
        /**
         * 주어진 el이 인뷰인가
         * @param el
         * @returns {*}
         */
        is: function is(el) {
            return this.inview(el);
        },
        /**
         * el의 인뷰 체크
         * @param el
         * @returns {boolean}
         */
        inview: function inview(el) {
            var self = this;
            var options = self.options;

            var _core$dom$getDimensio = core.dom.getDimensions(el),
                top = _core$dom$getDimensio.top,
                right = _core$dom$getDimensio.right,
                bottom = _core$dom$getDimensio.bottom,
                left = _core$dom$getDimensio.left,
                width = _core$dom$getDimensio.width,
                height = _core$dom$getDimensio.height;

            var scrollTop = core.dom.getScrollTop();

            var intersection = {
                top: bottom,
                right: window.innerWidth - left,
                bottom: window.innerHeight - top,
                left: right
            };

            var threshold = {
                x: options.threshold * width,
                y: options.threshold * height
            };

            return (scrollTop > top && options.allowInScroll ||
                    intersection.top > options.offset.top + threshold.y) &&
                intersection.right > options.offset.right + threshold.x &&
                intersection.bottom > options.offset.bottom + threshold.y &&
                intersection.left > options.offset.left + threshold.x;
        }
    });

    var watchers = [];
    var watcherHandler;
    $(window)
        .on('resize.inview scroll.inview load.inview', watcherHandler = function(e) {
            watchers.forEach(function(watcher) {
                watcher.check();
            });
        });

    /**
     * 인뷰 컴포넌트
     */
    var InviewScroll = core.ui('InviewScroll', {
        bindjQuery: 'inviewScroll',
        defaults: {},
        initialize: function initialize(el, options) {
            var self = this;

            if (self.supr(el, options) === false) {
                return;
            }

            self.start();
        },
        start: function start() {
            var self = this;
            var opt = self.options;
            var elements = [self.el];

            watchers.push(self.watcher = new Watcher(elements, self.options));
            watcherHandler();
        },
        clear: function clear() {
            this.watcher.clear();
        },
        destroy: function destroy() {
            core.array.remove(watchers, this.watcher);
            this.watcher.clear();
        }
    });

    return InviewScroll;
});
/**
 * 메인의 텍스트 모션 컴포넌트
 */
define('ui/mainTextMotion', ['jquery', 'vcui', 'ui/inviewScroll'],
    function($, core) {

        return core.ui('MainTextMotion', {
            bindjQuery: true,
            initialize: function(el, options) {
                var self = this;

                if (self.supr(el, options) === false) {
                    return;
                }
                self.isDisabled = false;
                self._bindEvents();
            },
            _bindEvents: function() {
                var self = this;
                var data = window.breakpoint;
                var height = 104,
                    rate = 0.5;

                update();

                // 인뷰 등록
                self.$el.vcInviewScroll({
                    throttle: false,
                    on: {
                        move: function(el, rect) {
                            if (self.isDisabled) return;
                            var per = ((rect.top + height - core.dom.getScrollTop()) /
                                    window.innerHeight) *
                                100;
                            el.style.letterSpacing = ((per * rate) + 10) + 'px';
                        }
                    }
                });

                var fn;
                self.winOn('resizeend', fn = function() {
                    if (window.innerWidth < 1280) {
                        self.isDisabled = true;
                    } else {
                        self.isDisabled = false;
                    }
                });
                fn();

                self.winOn('breakpointchange', function(e, data) {
                    update();
                });

                function update() {
                    return;
                    if (data.name === 'mobile') {
                        height = self.$el.height();
                        rate = 0.1;
                    }
                }
            }
        })
    });
/*!
 * @module vcui.ui.Modal
 * @license MIT License
 * @description 모달 컴포넌트
 * @copyright VinylC UID Group
 */
define('ui/modal', ['jquery', 'vcui'], function($, core) {
    "use strict";

    var $doc = $(document),
        $win = $(window),
        detect = core.detect,
        ui = core.ui,
        isTouch = detect.isTouch,
        _zIndex = 9000;

    var ModalManager = {
        templates: {
            wrap: '<div class="ui_modal_wrap" style="position:fixed;top:0;left:0;right:0;bottom:0;overflow:auto;"></div>',
            dim: '<div class="ui_modal_dim" style="position:fixed;top:0;left:0;bottom:0;right:0;background:#000;"></div>',
            modal: '<div class="ui_modal ui_modal_ajax" style="display:none"></div>'
        },
        options: {
            opacity: 0.6
        },
        init: function init(options) {
            var self = this;

            self.options = core.extend(self.options, options);
            self.stack = [];
            self.active = null;

            self._bind();
        },

        _bind: function _bind() {
            var self = this;

            $win.on('resizeend.modalmanager', function() {
                for (var i = -1, modal; modal = self.stack[++i];) {
                    modal.isShown && modal.center();
                }
            });

            $doc.on('modalshow.modalmanager', '.ui_modal_container', self._handleModalShow.bind(self))
                .on('modalhidden.modalmanager', '.ui_modal_container', self._handleModalHidden.bind(self))
                .on('modalhide.modalmanager', '.ui_modal_container', self._handleModalHide.bind(self))
                .on('focusin.modalmanager', self._handleFocusin.bind(self))
                .on('click.modalmanager', '[data-control=modal]', self._handleClick.bind(self))
                .on('click.modalmanager', '.ui_modal_dim', self._handleDimClick.bind(self));
        },
        _handleModalHide: function _handleModalHide(e) {
            var self = this;

            // 모달이 전부 닫힐 때 document에 알린다.
            if (self.stack.length === 1) {
                $(document).triggerHandler('modallastbeforeclose');
            }
        },
        _handleModalShow: function _handleModalShow(e) {
            var self = this,
                $modal = $(e.currentTarget),
                modal = $modal.vcModal('instance'),
                zIndex = self.nextZIndex();

            if (!modal.$el.parent().hasClass('ui_modal_wrap')) {
                modal.$el.wrap(self.templates.wrap);
                modal.$el.before($(self.templates.dim).css(modal.options.dimStyle));
            }
            modal.$el && modal.$el.parent().css('zIndex', zIndex++);

            self.active = modal;
            self.add(modal);
            if (self.stack.length === 1) {
                $(document).triggerHandler('modalfirstopen');
            }
        },
        _handleModalHidden: function _handleModalHidden(e) {
            var self = this,
                $modal = $(e.currentTarget),
                modal = $modal.vcModal('instance');

            modal.$el.siblings('.ui_modal_dim').remove();
            modal.$el.unwrap();
            self.revertZIndex();
            self.remove(modal);

            if (self.stack.length) {
                self.active = self.stack[self.stack.length - 1];
            } else {
                self.active = null;
                $(document).triggerHandler('modallastclose');
            }
        },
        _handleFocusin: function _handleFocusin(e) {
            var self = this;

            if (!self.active) {
                return;
            }
            if (self.active.$el[0] !== e.target && !$.contains(self.active.$el[0], e.target)) {
                //self.active.$el.find(':focusable').first().focus();
                self.active.$el.focus();
                e.stopPropagation();
            }
        },
        _handleClick: function _handleClick(e) {
            e.preventDefault();

            var self = this,
                $el = $(e.currentTarget),
                target = $el.attr('href') || $el.attr('data-href'),
                $modal;

            if (target) {
                // ajax형 모달인 경우
                if (!/^#/.test(target)) {
                    if ($el.data('fetching')) {
                        return;
                    }

                    $el.data('fetching', true);
                    if (self.ajaxModalXHR) {
                        self.ajaxModalXHR.abort();
                        self.ajaxModalXHR = null;
                    }

                    self.ajaxModalXHR = $.ajax({
                        url: target
                    }).done(function(html) {
                        $modal = ModalManager.getRealModal(html);

                        $modal.addClass('ui_modal_ajax').hide().appendTo('body').vcModal(core.extend({
                                removeOnClose: true,
                                opener: $el[0]
                            }, $el.data()))
                            .on('modalhidden', function(e) {
                                $modal.off('modalhidden');
                            });
                    }).always(function() {
                        self.ajaxModalXHR = null;
                        $el.removeData('fetching');
                    });
                } else {
                    // 인페이지 모달인 경우
                    $(target)
                        .vcModal(core.extend({
                            opener: $el[0]
                        }, $el.data()))
                        .vcModal('open')
                        .on('modalhidden', function(e) {
                            $(this).off('modalhidden');
                        });
                }
            }
        },
        _handleDimClick: function _handleDimClick(e) {
            var $dim = $(e.currentTarget);
            if ($dim.hasClass('ui_modal_dim')) {
                var modal = $dim.siblings('.ui_modal_container').vcModal('instance');
                if (modal.getOption('closeByDimmed') === true) {
                    modal.close();
                }
            }
        },
        add: function add(modal) {
            this.stack.push(modal);
        },
        remove: function remove(modal) {
            this.stack = core.array.remove(this.stack, modal);
        },
        nextZIndex: function nextZIndex() {
            var zi = _zIndex;
            _zIndex += 2;
            return zi;
        },
        revertZIndex: function revertZIndex() {
            _zIndex -= 2;
        },
        getRealModal: function(html) {
            var $tmp = $(html);

            if ($tmp.length > 1) {
                for (var i = 0, len = $tmp.length; i < len; i++) {
                    if ($tmp[i].nodeType === Node.ELEMENT_NODE) {
                        return $tmp.eq(i).hide();
                    }
                }
            }
            return $tmp.hide();
        }
    };
    ModalManager.init();


    function setVoiceOverFocus(element) {
        var focusInterval = 10; // ms, time between function calls
        var focusTotalRepetitions = 10; // number of repetitions

        element.setAttribute('tabindex', '0');
        element.blur();

        var focusRepetitions = 0;
        var interval = window.setInterval(function() {
            element.focus();
            focusRepetitions++;
            if (focusRepetitions >= focusTotalRepetitions) {
                window.clearInterval(interval);
            }
        }, focusInterval);
    }

    // Modal
    // ////////////////////////////////////////////////////////////////////////////
    /**
     * 모달 클래스
     * @class
     * @name vcui.ui.Modal
     * @extends vcui.ui.View
     */
    var Modal = ui('Modal', /** @lends vcui.ui.Modal# */ {
        bindjQuery: 'modal',
        defaults: {
            overlay: true,
            clone: true,
            closeByEscape: true,
            removeOnClose: false,
            closeByDimmed: true,
            draggable: true,
            dragHandle: 'header h1',
            show: true,
            fullMode: false,
            effect: 'fade', // slide | fade
            cssTitle: '.ui_modal_title',
            useTransformAlign: true,
            variableWidth: true,
            variableHeight: true,
            dimStyle: {
                opacity: 0.6,
                backgroundColor: '#000'
            }
        },

        events: {
            'click button[data-role], a[data-role]': function clickButtonDataRole(e) {
                var self = this,
                    $btn = $(e.currentTarget),
                    role = $btn.attr('data-role') || '',
                    ev;

                e.preventDefault();

                if (role) {
                    self.trigger(ev = $.Event('modal' + role), [self]);
                    if (ev.isDefaultPrevented()) {
                        return;
                    }
                }

                this.close();
            },
            'click .ui_modal_close': function clickUi_modal_closeui_modal_close(e) {
                e.preventDefault();
                e.stopPropagation();

                this.close();
                if(typeof(lastFocus) == 'object') {
                    $(lastFocus).focus(); // 20190703
                    lastFocus = '';
                }
            }
        },
        /**
         * 생성자
         * @param {String|Element|jQuery} el
         * @param {Object} options
         * @param {Boolean}  options.overlay:true 오버레이를 깔것인가
         * @param {Boolean}  options.clone: true    복제해서 띄울 것인가
         * @param {Boolean}  options.closeByEscape: true    // esc키를 눌렀을 때 닫히게 할 것인가
         * @param {Boolean}  options.removeOnClose: false   // 닫을 때 dom를 삭제할것인가
         * @param {Boolean}  options.draggable: true                // 드래그를 적용할 것인가
         * @param {Boolean}  options.dragHandle: 'h1.title'     // 드래그대상 요소
         * @param {Boolean}  options.show: true                 // 호출할 때 바로 표시할 것인가...
         */
        initialize: function initialize(el, options) {
            var self = this;
            if (self.supr(el, options) === false) {
                return;
            }

            self.$el.addClass('ui_modal_container').attr('role', 'document');

            self.isShown = false;
            self.originalStyle = self.$el.attr('style');
            self._originalDisplay = self.$el.css('display');

            if (/[0-9]+px/.test(self.$el[0].style.left)) {
                self.options.variableWidth = false;
            }

            if (/[0-9]+px/.test(self.$el[0].style.top)) {
                self.options.variableHeight = false;
            }

            if (self.options.show) {
                setTimeout(function() {
                    core.util.waitImageLoad(self.$('img'), true).done(function() {
                        self.show();
                    });
                });
            }

            if (!self.options.opener) {
                self.options.opener = document.activeElement;
            }

            self._bindAria(); // aria 셋팅
        },

        _bindAria: function _bindAria() {
            var self = this;
            // TODO
            self.$el.attr({
                'role': 'dialog',
                'aria-hidden': 'false',
                'aria-describedby': self.$('section').attr('id') || self.$('section').attr('id', self.cid + '_content').attr('id'),
                'aria-labelledby': self.$('h1').attr('id') || self.$('h1').attr('id', self.cid + '_title').attr('id')
            });
        },
        /**
         * zindex때문에 모달을 body바로 위로 옮긴 후에 띄우는데, 닫을 때 원래 위치로 복구시켜야 하므로,
         * 원래 위치에 임시 홀더를 만들어 놓는다.
         * @private
         */
        _createHolder: function _createHolder() {
            var self = this;

            if (self.$el.parent().is('body')) {
                return;
            }

            self.$holder = $('<span class="ui_modal_holder" style="display:none;"></span>').insertAfter(self.$el);
            self.$el.appendTo('body');
        },
        /**
         * 원래 위치로 복구시키고 홀더는 제거
         * @private
         */
        _replaceHolder: function _replaceHolder() {
            var self = this;

            if (self.$holder) {
                self.$el.insertBefore(self.$holder);
                self.$holder.remove();
            }
        },

        getOpener: function getOpener() {
            return $(this.options.opener);
        },

        /**
         * 토글
         */
        toggle: function toggle() {
            var self = this;

            self[self.isShown ? 'hide' : 'show']();
        },

        /**
         * 표시
         */
        show: function show() {
            if (this.isShown) {
                this.layout();
                return;
            }

            var self = this,
                opts = self.options,
                showEvent = $.Event('modalshow');


            // 열릴때 body로 옮겼다가, 닫힐 때 다시 원복하기 위해 임시요소를 넣어놓는다.
            self._createHolder();
            self.trigger(showEvent);
            if (showEvent.isDefaultPrevented()) {
                self._replaceHolder();
                return;
            }

            self.isShown = true;
            self.layout();

            if (opts.title) {
                self.$(opts.cssTitle).html(opts.title || '알림');
            }

            var defer = $.Deferred();
            if (opts.effect === 'fade') {
                setTimeout(function() {
                    self.$el.stop().fadeIn('slow', function() {
                        defer.resolve();
                    });
                });
            } else if (opts.effect === 'slide') {
                self.$el.stop().css('top', -self.$el.height()).animate({
                    top: '50%'
                }, function() {
                    defer.resolve();
                });
            } else {
                self.$el.show();
                defer.resolve();
            }

            defer.done(function() {
                self.layout();

                self.trigger('modalshown', {
                    module: self
                });

                //////$('body').attr('aria-hidden', 'true');    // body를 비활성화(aria)
                self._draggabled(); // 드래그 기능 빌드
                self._escape(); // esc키이벤트 바인딩

                self.on('mousewheel DOMMouseScroll wheel', function(e) {
                    e.stopPropagation();
                });

                var $focusEl = self.$el.find('[data-autofocus=true]');

                // 레이어내에 data-autofocus를 가진 엘리먼트에 포커스를 준다.
                if ($focusEl.length > 0) {
                    $focusEl.eq(0).focus();
                } else {
                    self.$el.attr('tabindex', 0).focus();
                }

                // 버튼
                /**************if (me.options.opener) {
                    var modalid;
                    if (!(modalid = me.$el.attr('id'))) {
                        modalid = 'modal_' + core.getUniqId(16);
                        me.$el.attr('id', modalid);
                    }
                    $(me.options.opener).attr('aria-controls', modalid);
                }**********/
            });
        },

        /**
         * 숨김
         */
        hide: function hide(e) {
            if (e) {
                e.preventDefault();
            }

            var self = this;
            var isAjaxModal = self.$el.hasClass('ui_ajax_modal');

            e = $.Event('modalhide');
            self.trigger(e);
            if (!self.isShown || e.isDefaultPrevented()) {
                return;
            }

            var defer = $.Deferred();
            self.isShown = false;
            if (self.options.effect === 'fade') {
                self.$el.fadeOut('fast', function() {
                    defer.resolve();
                });
            } else if (self.options.effect === 'slide') {
                self.$el.animate({
                    top: -self.$el.outerHeight()
                }, function() {
                    defer.resolve();
                });
            } else {
                self.$el.hide();
                defer.resolve();
            }

            defer.done(function() {
                self.trigger('modalhidden');
                self.docOff();
                self.winOff();
                self.$el.off()
                    .removeData('ui_modal')
                    .attr('style', self.originalStyle)
                    .removeAttr('ui-modules aria-hidden role tabindex')
                    .removeClass('ui_modal_container');

                self._escape(); // esc 키이벤트 제거
                self._replaceHolder(); // body밑으로 뺀 el를 다시 원래 위치로 되돌린다.

                if (self.options.removeOnClose) {
                    self.$el.remove(); // 닫힐 때 dom에서 삭제하도록 옵션이 지정돼있으면, dom에서 삭제한다.
                }
                if (self.options.opener) {
                    $(self.options.opener).removeAttr('aria-controls').focus(); // 레이어팝업을 띄운 버튼에 포커스를 준다.
                }
                //:if (self.$overlay) {
                //:    self.$overlay.remove(), self.$overlay = null;    // 오버레이를 제거
                //:}
                ////// $('body').removeAttr('aria-hidden');    // 비활성화를 푼다.
                if (isAjaxModal) {
                    self.destroy();
                }
            });
        },

        _scrollHeight: function() {
            var self = this;
            var scrollHeight = Math.round(self.$el.css('min-height', '').prop('scrollHeight'));
            if (scrollHeight % 2 !== 0) {
                scrollHeight += 1;
            }
            return scrollHeight;
        },

        /**
         * 도큐먼트의 가운데에 위치하도록 지정
         */
        layout: function layout() {
            if (!this.isShown) {
                return;
            }

            var self = this,
                width,
                height,
                css,
                isOverHeight,
                isOverWidth,
                winHeight = core.dom.getWinHeight(),
                winWidth = core.dom.getWinWidth(),
                scrollHeight = self._scrollHeight();

            width = self.$el.outerWidth();
            height = self.$el.outerHeight();
            isOverHeight = height > winHeight;
            isOverWidth = width > winWidth;
            css = {
                //display: 'block',
                position: 'absolute',
                //backgroundColor: '#ffffff',
                //outline: 'none',
                minHeight: scrollHeight,
                backgroundClip: 'padding-box' //,
                //top: top = isOverHeight ? '0%' : '50%'//,
                //left: left = isOverWidth ? '0%' : '50%'
            };

            css.transform = '';
            if (self.options.variableWidth !== false) {
                css.left = isOverWidth ? '0%' : '50%';
                if (self.options.useTransformAlign) {
                    css.transform += 'translateX(-' + css.left + ') ';
                } else {
                    css.marginLeft = isOverWidth ? '' : Math.ceil(width / 2) * -1;
                }
            }

            if (self.options.variableHeight !== false) {
                if (self.options.alignTop) {
                    css.top = '0%';
                } else {
                    css.top = isOverHeight ? '0%' : '50%';
                    if (self.options.useTransformAlign) {
                        css.transform += 'translateY(-' + css.top + ') ';
                    } else {
                        css.marginTop = isOverHeight ? '' : Math.ceil(height / 2) * -1;
                    }
                }
            }

            self.$el.stop().css(css);
        },

        /**
         * 타이틀 영역을 드래그기능 빌드
         * @private
         */
        _draggabled: function _draggabled() {
            var self = this,
                options = self.options;

            if (!options.draggable || self.bindedDraggable) {
                return;
            }
            self.bindedDraggable = true;

            if (options.dragHandle) {
                self.$el.css('position', 'absolute');
                core.css3.prefix('user-select') && self.$(options.dragHandle).css(core.css3.prefix('user-select'), 'none');
                self.on('mousedown touchstart', options.dragHandle, function(e) {
                    e.preventDefault();

                    var isMouseDown = true,
                        pos = self.$el.position(),
                        oriPos = {
                            left: e.pageX - pos.left,
                            top: e.pageY - pos.top
                        },
                        _handler;

                    $doc.on(self.makeEventNS('mousemove mouseup touchmove touchend touchcancel'), _handler = function handler(e) {
                        switch (e.type) {
                            case 'mousemove':
                            case 'touchmove':
                                if (!isMouseDown) {
                                    return;
                                }
                                self.$el.css({
                                    left: e.pageX - oriPos.left,
                                    top: e.pageY - oriPos.top
                                });
                                break;
                            case 'mouseup':
                            case 'touchend':
                            case 'touccancel':
                                isMouseDown = false;
                                $doc.off(self.getEventNS(), _handler);
                                break;
                        }
                    });
                });

                self.$(options.dragHandle).css('cursor', 'move');
            }
        },

        /**
         * esc키를 누를 때 닫히도록
         * @private
         */
        _escape: function _escape() {
            if (isTouch) {
                return;
            }
            var self = this;

            if (self.isShown && self.options.closeByEscape) {
                self.docOff('keyup');
                self.docOn('keyup', function(e) {
                    if (e.which === 27) {
                        e.stopPropagation();
                        self.hide();
                    }
                });
            } else {
                self.docOff('keyup');
            }
        },

        /**
         * 모달의 사이즈가 변경되었을 때 가운데위치를 재조절
         * @example
         * $('...').modal(); // 모달을 띄운다.
         * $('...').find('.content').html( '...');  // 모달내부의 컨텐츠를 변경
         * $('...').modal('center');    // 컨텐츠의 변경으로 인해 사이즈가 변경되었으로, 사이즈에 따라 화면가운데로 강제 이동
         */
        center: function center() {
            this.layout();
        },

        /**
         * 열기
         */
        open: function open() {
            this.show();
        },

        /**
         * 닫기
         */
        close: function close() {
            this.hide();
        },

        /**
         *
         */
        destroy: function destroy() {
            var self = this;

            self.supr();
        }
    });

    /**
     * 열려 있는 레이어팝업을 가운데에 위치시키는 글로벌이벤트
     * @example
     * vcui.PubSub.trigger('resize:modal')
     */
    /*core.PubSub.on('resize:modal', function() {
     if(Modal.active){
     Modal.active.center();
     }
     });*/

    //윈도우가 리사이징 될때 가운데에 자동으로 위치시킴
    /*$(window).on('resize.modal', function() {
     if(Modal.active){
     Modal.active.center();
     }
     });*/

    core.modal = function(el, options) {
        $(el).vcModal(options);
    };

    /**
     * @class
     * @name vcui.ui.AjaxModal
     * @description ajax로 불러들인 컨텐츠를 모달로 띄워주는 모듈
     * @extends vcui.ui.View
     */
    var fetchingUrls = {};
    core.ui.ajaxModal = function(ajaxOptions, options) {
        if (typeof ajaxOptions === 'string') {
            ajaxOptions = {
                url: ajaxOptions
            };
        }

        if (!options) {
            options = {};
        }

        if (!options.opener) {
            if ($(document.activeElement).is('a, button')) {
                options.opener = document.activeElement;
            } else {
                options.opener = document.body;
            }
        }

        if (fetchingUrls[ajaxOptions.url]) {
            return fetchingUrls[ajaxOptions.url];
        }

        fetchingUrls[ajaxOptions.url] = $.ajax(ajaxOptions).then(function(html) {
            var $modal = ModalManager.getRealModal(html).appendTo('body').data('removeOnClose', true);
            return $modal.vcModal(core.extend({}, options, {
                removeOnClose: true,
                events: {
                    modalshown: function() {
                        delete fetchingUrls[ajaxOptions.url];
                    },
                    modalhidden: function() {
                        $(options.opener).focus();
                    }
                }
            }));
        });

        return fetchingUrls[ajaxOptions.url];
    };

    core.ui.alert = function() {
        /**
         * 얼럿레이어
         * @memberOf vcui.ui
         * @name alert
         * @function
         * @param {string} msg 얼럿 메세지
         * @param {Object} options 모달 옵션
         * @example
         * vcui.ui.alert('안녕하세요');
         */
        return function(msg, options) {
            if (typeof msg !== 'string' && arguments.length === 0) {
                options = msg;
                msg = '';
            }
            var el = $(core.ui.alert.tmpl).appendTo('body').find('div.ui_modal_content').html(msg).end();
            var modal = $(el).vcModal(core.extend({
                removeOnClose: true
            }, options)).vcModal('instance');
            modal.getElement().buildUIControls();
            modal.on('modalhidden', function() {
                el = null;
                modal = null;
            });
            return modal;
        };
    }();
    core.ui.alert.tmpl = ['<div class="layer_popup small ui_alert" role="alert" style="display:none">', '<h1 class="title ui_modal_title">알림창</h1>', '<div class="cntt">', '<div class="ui_modal_content">&nbsp;</div>', '<div class="wrap_btn_c">', '<button type="button" class="btn_emphs_small" data-role="ok"><span><span>확인</span></span></button>', '</div>', '</div>', '<button type="button" class="ui_modal_close"><span>닫기</span></button>', '<span class="shadow"></span>', '</div>'].join('');
    ///////////////////////////////////////////////////////////////////////////////////////

    return Modal;
});
/*!
 * @module vcui.ui.MoreLoader
 * @license MIT License
 * @description MoreLoader 컴포넌트
 * @copyright VinylC UID Group.
 */
define(
    'ui/moreLoader', ['jquery', 'vcui', 'helper/responsiveImage'],
    function($, core, ResponsiveImage) {
        "use strict";

        //  사용법
        /*$('#btnMoreLoad').vcMoreLoader({ // 더보기 버튼에 빌드
            list: '#uiBoardList',       // 리스트 요소
            dataSource: function () {   // ajax 를 직접 컨트롤. 결과로 받은 html
        문자열을 list에 append 해준다.
                return $.ajax({
                    url: 'GR3.4_ajax_01.html',
                    data: {
                        categoty: $('#uiCategoryTab').vcTab('getSelectedValue'),
                        lastid: $('#uiBoardList>li:last').data('id'),
                        keyword: $('#search_txt').val()
                    }
                });
            }
        });*/

        var evenItem = '<li class="item empty_item">' +
            '<div class="module">' +
            '<div class="img_wrap">' +
            '<div class="inner">' +
            '<div class="align_cont">' +
            '<!-- 이미지가 없을 때 -->' +
            '<img src="/kr/images/common/borad-list-no-image.png" alt="">' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</li>';

        return core.ui('MoreLoader', {
            bindjQuery: true,
            selectors: {},
            defaults: {
                type: 'html',
                dataSource: null, // ajax 객체를 받을 콜백함수
                //autofillEven: false,
                list: '.ui_moreloader_list', // 리스트 요소
                onBeforeSend: core.noop,
                onSuccess: core.noop, // 성공적으로 로드됐을 때 호출되는 콜백함수
                onRendered: core.noop, // list 에 append한 후에 호출
                onError: core.noop, // ajax가 에러가 났을 때
                onComplete: core.noop, // ajax가 에러여부에 상관없이 완료됐을 때
                onLoading: core.noop, // ajax가 로딩중일 때
                onToggle: core.noop //
            },
            initialize: function(el, options) {
                var self = this;

                if (self.supr(el, options) === false) {
                    return;
                }

                self.disabled = false;
                self.$list = $(self.options.list);
                self.$el.attr('role', 'button').attr('aria-label', '더보기');
                self.$evenItem = $(evenItem);

                self._bindEvents();
                self.load();
            },
            _bindEvents: function() {
                var self = this,
                    o = self.options;

                // 더보기 클릭시
                self.on('click', function(e) {
                    e.preventDefault();

                    self.load(true).then(function() {
                        if (self.$newFirst[0]) {
                            self.$newFirst.attr('tabindex', -1).focus();
                            setTimeout(function() {
                                self.$newFirst.removeAttr('tabindex');
                            });
                        }
                    });
                });

                self.winOn('breakpointchange', function(e, data) {
                    if (self.getItems().length) {
                        self._renderEvenItem();
                    }
                });

                core.PubSub.on('common:toggleBoardType', function(e, data) {
                    if (data.type === 'grid') {
                        self._renderEvenItem();
                    } else {
                        self.$evenItem.remove();
                    }
                });
            },
            _fetch: function(isMore) {
                var self = this,
                    o = self.options;

                if (self.xhr || self.disabled) {
                    return self.xhr;
                }

                o.onBeforeSend.call(self, isMore);
                self.loading = true;
                return self.xhr =
                    o.dataSource.call(self, isMore)
                    .done(function(html) {
                        var $html = $('<ul>').append(html);
                        var isBlank = $html.children().length === 0;

                        if (isBlank) {
                            self._renderButton(false);
                            self.setEnabled(false);
                            !isMore && o.onToggle.call(self, false);
                            return;
                        }

                        if (o.onSuccess.apply(self, core.toArray(arguments)) === false) {
                            $html = null;
                            return;
                        }

                        if (!isMore) {
                            self.$list.empty();
                        }

                        ResponsiveImage.run($html);
                        self.$newFirst = $html.children().first(); // 접근성. 새로 추가된 항목에 포커싱
                        self.$list.children('.empty_item').remove();
                        self.$list.append($html.children()).buildCommonUI();

                        self._renderEvenItem();
                        self._renderButton();
                        self.setEnabled(true);

                        o.onRendered.apply(self, core.toArray(arguments));
                        !isMore && o.onToggle.call(self, true);
                    })
                    .error(function() {
                        o.onError.apply(self, core.toArray(arguments));
                    })
                    .always(function() {
                        o.onComplete.apply(self, core.toArray(arguments));
                        self.loading = false;
                        self.xhr = null;
                    });
            },
            /**
             * pc 에서 홀수 건일 때 빈 아이템 하나 추가
             * @private
             */
            _renderEvenItem: function() {
                var self = this;
                var isGrid = self.$el.closest('.thumb_boardlist').hasClass('view_grid');
                var count = self.getItems().length;

                if (!isGrid) {
                    self.$evenItem.remove();
                    return;
                }

                if (window.breakpoint.isPc && count > 0 && count % 2 !== 0) {
                    var $last = self.getItems().last();
                    self.$evenItem.attr({
                        'data-id': $last.attr('data-id'),
                        'data-total': $last.attr('data-id')
                    });
                    self.$list.append(self.$evenItem);
                } else {
                    self.$evenItem.remove();
                }
            },
            /**
             * 상황에 따라 더보기 토글
             * @param flag
             * @private
             */
            _renderButton: function(flag) {
                if (arguments.length) {
                    this.$el.parent().toggle(flag);
                    return;
                }

                var self = this;
                var $items = self.getItems();
                var $last;

                if ($items.length) {
                    $last = $items.last();
                    var loadedCount = $items.length;
                    var totalCount = $last.data('total') || 0;

                    self.$el.parent().toggle(loadedCount < totalCount);
                } else {
                    self.$el.parent().hide()
                }
            },
            /**
             * 아이템 조회
             * @return {*}
             */
            getItems: function() {
                return this.$list.children('[data-id]');
            },
            /**
             * 마지막 아이템의 id 추출
             * @return {*}
             */
            getLastId: function() {
                return this.getItems().last().data('id');
            },
            /**
             * 리스트 조회
             * @param isMore
             * @return {*}
             */
            load: function(isMore) {
                var self = this,
                    opts = self.options;

                if (self.disabled) {
                    return;
                }

                return self._fetch(isMore);
            },
            /**
             * 기존 데이타 지우고 새로 리스트를 불러옴
             */
            cleanAndLoad: function() {
                this.setEnabled(true);
                this.load();
            },
            setEnabled: function(flag) {
                this.disabled = !flag;
            }
        });
    });
/*!
 * @module vcui.ui.SkbGnb
 * @license MIT License
 * @description GNB 컴포넌트
 * @copyright VinylC UID Group.
 */
define('ui/naverMap', ['jquery', 'vcui'], function($, core) {
    "use strict";

    /*if(typeof nhn === 'undefined') {
        throw new Error('네이버 지도API를 포함시켜 주세요.');
    }*/

    /*
     point : Coord // 지도 중심점의 좌표
     zoom : Number // 지도의 축척 레벨
     boundary : Array // 지도 생성 시 주어진 array 에 있는 점이 모두 보일 수 있도록 지도를 초기화한다.
     boundaryOffset : Number // boundary로 지도를 초기화 할 때 지도 전체에서 제외되는 영역의 크기.
     enableWheelZoom : Boolean // 마우스 휠 동작으로 지도를 확대/축소할지 여부
     enableDragPan : Boolean // 마우스로 끌어서 지도를 이동할지 여부
     enableDblClickZoom : Boolean // 더블클릭으로 지도를 확대할지 여부
     mapMode : Number // 지도 모드(0 : 일반 지도, 1 : 겹침 지도, 2 : 위성 지도)
     activateTrafficMap : Boolean // 실시간 교통 활성화 여부
     activateBicycleMap : Boolean // 자전거 지도 활성화 여부
     minMaxLevel : Array // 지도의 최소/최대 축척 레벨
     size : Size // 지도의 크기
     detectCoveredMarker : Boolean // 겹쳐 있는 마커를 클릭했을 때 겹친 마커 목록 표시 여부
     */

    var _map = (window.naver && naver.maps) || {};
    var Position = {
        BOTTOM_CENTER: 11,
        BOTTOM_LEFT: 10,
        BOTTOM_RIGHT: 12,
        CENTER: 0,
        LEFT_BOTTOM: 6,
        LEFT_CENTER: 4,
        LEFT_TOP: 5,
        RIGHT_BOTTOM: 9,
        RIGHT_CENTER: 8,
        RIGHT_TOP: 7,
        TOP_CENTER: 2,
        TOP_LEFT: 1,
        TOP_RIGHT: 3
    };

    function isUnefinedNaver() {
        return typeof naver === 'undefined';
    }

    var loadStatus = '';

    /**
     * @class
     * @name axl.ui.NaverMap
     * @extends axl.ui.View
     */
    var NaverMap = core.ui('NaverMap', /** @lends axl.ui.NaverMap */ {
        bindjQuery: true,
        $statics: {
            callbacks: $.Callbacks()
        },
        defaults: {
            apiKey: '',
            zoom: 10,
            onCreated: core.noop,
            icon: { // 지점아이콘
                src: 'http://static.naver.com/maps2/icons/pin_spot2.png',
                size: [28, 37],
                offset: [14, 37]
            },
            map: { // naver map api 옵션
                zoom: 8,
                baselayer: 'default', // satellite:위성,
                markers: '',
                zoomControl: false,
                minZoom: 1,
                maxZoom: 14,
                zoomControlOptions: { //줌 컨트롤의 옵션
                    position: Position.TOP_RIGHT
                },
                disableKineticPan: false,
                scaleControl: false,
                logoControl: false,
                mapDataControl: false,
                mapTypeControl: false,
                draggable: 'onmousedown' in document,
                pinchZoom: true,
                scrollWheel: false, // 'onmousedown' in document,
                keyboardShortcuts: false,
                disableDoubleTapZoom: true,
                disableDoubleClickZoom: true,
                disableTwoFingerTapZoom: true
            },
            infoWindow: { // 지점 정보레이어 마크업
                show: true,
                tmpl: '<div></div>',
                position: {
                    right: 5,
                    top: 20
                } // 상대위치
            },
            markers: []
        },
        /**
         * 생성자
         * @param {Element|jQuery|String} 엘리먼트
         * @param {Object} options 옵션
         */
        initialize: function(el, options) {
            var self = this;
            if (self.supr(el, options) === false) {
                return;
            }

            self.markerList = [];

            self._loadMapApi();
        },

        _loadMapApi: function() {
            var self = this,
                fn;

            NaverMap.callbacks.add(fn = function() {
                loadStatus = 'complete';
                _map = naver.maps;

                self._createMap();
                self._bindMapEvents();

                this.remove(fn);
                fn = null;
            });

            if (typeof naver === 'undefined' && loadStatus !== 'complete') {
                if (loadStatus === 'waiting') {
                    return;
                }
                loadStatus = 'waiting';

                core.loadJs('https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=' +
                    self.options.apiKey + '&submodules=geocoder',
                    function() {
                        NaverMap.callbacks.fire();
                    });
            } else if (typeof naver !== 'undefined' || loadStatus === 'complete') {
                NaverMap.callbacks.fire();
            }
        },

        /**
         * 네이버지도 생성
         */
        _createMap: function() {
            var self = this,
                opts = self.options,
                mapOptions = core.extend(true, {}, opts.map);

            mapOptions.zoom = opts.zoom || opts.map.zoom;

            if (opts.lat && opts.lng) {
                mapOptions.center = {
                    lat: opts.lat,
                    lng: opts.lng
                };
            }

            if (opts.center) {
                mapOptions.center = {
                    lat: opts.center.lat,
                    lng: opts.center.lng
                };
            }

            if (mapOptions.center) {
                opts.markers.push(mapOptions.center);
            }


            // 지도 생성
            self.map = new _map.Map(self.$el[0], mapOptions);

            if (opts.markers && opts.markers.length) {
                self.addMarkers(opts.markers);
            }

            self._bindAccessibilityEvents();

            setTimeout(function() {
                self.triggerHandler('navermapready', {
                    map: self,
                    naverMap: self.map
                });
            });
        },

        /**
         * 네이버 지도에 있는 줌컨트롤이 접근성에 맞지 않아,
         * 강제로 접근성에 맞춤.
         * TODO: 네이버지도가 접근성에 맞게 수정되었으면 이 부분을 제거해야 함
         * @private
         */
        _bindAccessibilityEvents: function() {
            var self = this;
            var map = self.map;

            self.on('keydown', function(e) {
                //e.preventDefault();

                if (e.keyCode === 13) {
                    if (e.target && e.target.children) {
                        switch (e.target.children[0].alt) {
                            case '지도 확대':
                                map.setZoom(Math.min(14, map.zoom + 1))
                                break;
                            case '지도 축소':
                                map.setZoom(Math.max(map.zoom - 1, 1))
                                break;
                        }
                    }
                } else if (e.keyCode === 38 || e.keyCode === 40) {
                    if (e.target && e.target.children && e.target.children[0].alt === '지도 확대/축소 슬라이더') {
                        e.preventDefault();
                        switch (e.keyCode) {
                            case 38:
                                map.setZoom(Math.min(14, map.zoom + 1))
                                break;
                            case 40:
                                map.setZoom(Math.max(map.zoom - 1, 1))
                                break;
                        }
                    }

                }
            });
        },

        /**
         * 이벤트 바인딩
         */
        _bindMapEvents: function() {
            var self = this,
                opts = self.options;

        },

        /**
         * InfoWindow 추가
         * @private
         */
        _setInfoWindow: function(marker, options, maxWidth) {
            var self = this;
            var content = "";

            var tmpl = options["infoWindow"];
            if (tmpl) {
                content = core.template(tmpl["content"], marker.get('data'));
            } else if (self.infoTmpl) {
                content = self.infoTmpl(marker.get('data'));
            } else {
                return;
            }


            var infoWindow = new _maps.InfoWindow({
                content: content,
                maxWidth: self.infoWindowWidth
            });

            marker.addListener('click', function() {
                infoWindow.open(marker.get('map'), marker);
                self.infoWindows.push(infoWindow);
            });

        },

        _normalizeIconInfo: function(o) {
            var self = this;
            var newIconInfo = {};
            var obj = core.extend({}, self.options.icon);

            if (core.isString(o)) {
                obj.src = o;
            } else {
                core.extend(obj, o);
            }

            if (obj["url"]) newIconInfo["url"] = newIconInfo['src'] = obj["url"];
            if (obj["src"]) newIconInfo["url"] = newIconInfo['src'] = obj["src"];
            if (obj["size"]) newIconInfo["size"] = new _map.Size(obj["size"][0], obj["size"][1]);
            if (obj["size"]) newIconInfo["scaledSize"] = new _map.Size(obj["size"][0], obj["size"][1]);
            if (obj["origin"]) newIconInfo["origin"] = new _map.Point(obj["origin"][0], obj["origin"][1]);
            if (obj["anchor"]) newIconInfo["anchor"] = new _map.Point(obj["anchor"][0], obj["anchor"][1]);

            return Object.keys(newIconInfo).length ? newIconInfo : null;
        },


        _convertPoint: function(oPoint) {
            if (!(oPoint instanceof _map.LatLng)) {
                oPoint = new _map.LatLng(oPoint.y || oPoint.lat, oPoint.x || oPoint.lng);
            }
            return oPoint;
        },


        setMarker: function(obj, flag) {
            var self = this;
            var opts = self.options;
            var iconObj;
            var markerOpts = {
                position: self._convertPoint(obj),
                title: obj["title"] || '',
                label: obj["label"] || '',
                map: self.map
            };

            if (obj["icon"]) {
                iconObj = self._normalizeIconInfo(obj["icon"]);
                markerOpts["icon"] = iconObj;
            } else if (opts.icon) {
                markerOpts["icon"] = self._normalizeIconInfo(opts.icon);
            }

            var marker = new _map.Marker(markerOpts);
            if (obj.events) {
                core.each(obj.events, function(fn, name) {
                    naver.maps.Event.addListener(marker, name, fn);
                });
            }
            self.markerList.push(marker);

            return self;
        },

        /**
         * 지도사이즈 설정
         * @param {Object} size.height 높이
         * @param {Object} size.width 너비
         */
        setSize: function(size) {
            this.map.setSize(new _map.Size(size.width, size.height));
            return this;
        },

        /**
         * 지정한 좌표로 중심을 이동
         * @param {Object} oPoint.x x좌표
         * @param {Object} oPoint.y y좌표
         */
        setCenter: function(oPoint, options) {
            this.map.setCenter(this._convertPoint(oPoint), core.extend({
                useEffect: false
            }, options));
            return this;
        },

        setZoom: function(level) {
            this.map.setZoom(level);
            return this;
        },

        /**
         * 기존에 추가된 지점마커들을 제거
         */
        clearMarkers: function() {
            var self = this;
            for (var i = 0; i < self.markerList.length; i++) {
                self.markerList[i].setMap(null);
            }
            self.markerList = [];
            return self;
        },

        /**
         * 다중 지점마커 추가
         * @param {Array} list 지점정보 배열
         */
        addMarkers: function(markers) {
            var self = this;

            if (!markers || !markers.length) {
                return self;
            }

            for (var i = 0; i < markers.length; i++) {
                self.setMarker(markers[i]);
            }

            return self;
        },


        setMarkerPosition: function(idx, pos) {
            var self = this;
            self.map.setZoom(self.markerList[idx]["zoom"] || 10);
            self.map.panTo(self._convertPoint(self.markerList[idx]), {
                duration: 0
            });

            if (pos) {
                setTimeout(function() {
                    self.map.panBy(pos);
                }, 300);
            }
            return self;
        },

        /**
         * 마커들을 리셋
         */
        resetMarkers: function(list) {
            var self = this;
            self.clearMarkers();

            if (core.isArray(list)) {
                self.addMarkers(list);
            } else {
                self.setMarker(list);
                self.map.setZoom(self.options.map.zoom);
                self.map.setCenter(list, {
                    useEffect: false
                });
            }
            return self;
        },

        update: function() {
            var event;

            if (typeof(Event) === 'function') {
                event = new Event('resize');
            } else {
                event = document.createEvent('Event');
                event.initEvent('resize', true, true);
            }
            window.dispatchEvent(event);
            return self;
        },

        destroy: function() {
            var self = this;

            self.clearMarkers();
            self.map.destroy();
            self.supr();
        }

    });

    return NaverMap;
});
define(
    'ui/navForCarousel', ['jquery', 'vcui', 'ui/carousel', 'ui/smoothScroll'],
    function($, core) {
        // 썸네일네비 + 캐로우셀(배너)을 연동시켜 상호간 서로 해당하는 위치로
        // 이동시켜 주는 컴포넌트(갤러리에서 이용)
        return core.ui('NavForCarousel', {
            bindjQuery: true,
            defaults: {
                asNavFor: '' // 썸네일네비
            },
            initialize: function(el, options) {
                var self = this;

                if (self.supr(el, options) === false) {
                    return;
                }

                self._build();
            },
            _build: function() {
                var self = this;

                // 썸네일 네비
                self.$nav = $(self.options.asNavFor);

                self.$nav.on('click', '.item', function(e) {
                    e.preventDefault();

                    // 썸네일 네비를 클릭시 index를 알아내서 이에 해당하는
                    // 배너로 슬라이딩 시켜준다.
                    var index = $(this).index();

                    self._slideByIndex(index);
                }).css({
                    'white-space': 'nowrap'
                });

                self.$nav.on('dragstart selectstart', function(e) {
                    // 마우스로 드래그할 때 이미지나 링크가 드래그되지 않도록 이벤트
                    // 무효화
                    e.preventDefault();
                });

                // 네비를 커스텀스크롤 컴포넌트를 이용
                self.scrollNav = self.$nav.vcSmoothScroll({
                    prevButton: self.$nav.parent().find('.ui_carousel_prev'), // 이전 버튼
                    nextButton: self.$nav.parent().find('.ui_carousel_next') // 다음 버튼
                }).vcSmoothScroll('instance');

                // 캐로유셀 배너
                self.carousel = self.$el.vcCarousel({
                        slidesToShow: 1,
                        slidesToScroll: 1,
                        infinite: true, // 무한롤링
                        speed: 400
                    })
                    .on('carouselafterchange', function(e, carousel) {
                        if (carousel.currentScale === carousel.previousSlide) {
                            return;
                        }

                        // 배너가 슬라이딩된 후에 해당하는 썸네일 nav를 활성화
                        var index = carousel.currentSlide;
                        self._navByIndex(index);
                    })
                    .vcCarousel('instance');
            },
            /**
             * index에 해당하는 네비로 이동
             * @param index
             * @private
             */
            _navByIndex: function(index) {
                var self = this;

                // 활성화 된 네비가 보이도록 스크롤
                self.scrollNav.scrollToElement(self.$nav.find('.item').eq(index).activeItem('on').get(0), 300);
            },

            /**
             * index 에 해당하는 배너로 이동
             * @param index
             * @private
             */
            _slideByIndex: function(index) {
                var self = this;

                self.carousel.slideHandler(index);
            }
        })
    });
define('ui/notifyManager', ['jquery', 'vcui'], function($, core) {

    return {
        init: function() {
            this._useCookie();
        },

        _useCookie: function() {
            // 쿠키 사용 안내
            var $cookie = $('.use_cookie');
            if (core.Cookie.get("isCookieChk") !== 'Y') {
                setTimeout(function() {

                    $cookie.attr({
                        'ui-modules': 'NotifyManager',
                        'aria-hidden': 'false'
                    }).addClass('open');
                    $cookie.one('click', '.ui_noti_accept', function(e) {
                        e.preventDefault();

                        $cookie.removeClass('open');
                        setTimeout(function() {
                            $cookie.remove();
                            if (core.detect.isIOS) {
                                $('#skipnavi a').focus();
                            } else {
                                window.focus();
                            }
                        }, 1000);

                        core.Cookie.set("isCookieChk", 'Y', {
                            path: '/',
                            expires: '+5y'
                        });
                    });
                }, 1000);
            } else {
                $cookie.remove();
            }
        }
    };

});
/*!
 * @module vcui.ui.PanelFlicker
 * @license MIT License
 * @description PanelFlicker 컴포넌트
 * @copyright VinylC UID Group
 */
define(
    'ui/panelFlicker', [
        'jquery',
        'vcui',
        'helper/gesture',
        'ui/smoothScroll',
        'libs/jquery.transit'
    ],
    function($, core, Gesture, SmoothScroll, Transit) {

        var propX = 'x';
        // ie9 이하에서는 트랜지션이 좀 불안해서 left로 움직이게 함
        if (core.detect.isIE && core.detect.version < 10) {
            propX = 'left';
            $.fn.transition = $.fn.animate;
        }

        var useNativeScroll = core.detect.isAndroid || core.detect.isIOS;

        /**
         * 해상도가 모바일일 때 gnb의 플리킹을 담당하는 컴포넌트.(
         * mobile인 경우 빌드되고
         * pc로 변경되는 경우 destroy 해버림. 자원을 아끼지 위해
         * 이는 breakpoint 이벤트에서 처리)
         */
        var PanelFlicker = core.ui('PanelFlicker', {
            bindjQuery: 'panelFlicker',
            defaults: {
                lazyLoad: true
            },
            selectors: {
                navs: '.depth1_list a:not(.ui_link)',
                navWrap: '.gnb_wrap',
                depth1Wrap: '.depth1_wrap',
                depth2Wrap: '.depth2_wrap',
                scrollWraps: '.depth2_menu .scroll_wrap',
                flickContainer: '.depth2_wrap'
            },
            initialize: function initialize(el, options) {
                var self = this;

                if (self.supr(el, options) === false) {
                    return;
                }

                // 플리킹 중일땐 앞,중앙,뒤 이렇게 세개로 컨트롤하기 때문에
                // 나머지패널을 담고 있을 공간을 만들어 둔다.
                self.$depth2Wrap.parent().append(
                    self.$tmp = $('<div style="display:none" id="ui_tmp_panels_wrap"></div>')
                );

                self.panelNodes = {}; // 패널들 저장소
                self.panelIndex = 0; // 현재 인덱스

                self.$panels = self.$flickContainer.children().addClass('on'); // 패널들
                self.$panels.first().before(self.$panels.last()); // 좌우로 플리킹되기 때문에 마지막에 있는 걸 맨앞으로 옮김
                self.$navWrap.css('overflow', 'visible');

                self.panelCount = self.$panels.length;
                self.resize = self.resize.bind(self);

                self._buildARIA();
                self._bindEvents();
                self.movePanel(0);
            },

            /**
             * aria속성 설정
             * @private
             */
            _buildARIA: function _buildARIA() {
                var self = this;

                self.$navs.attr({
                    'role': 'button'
                });
                self.$navs.removeAttr('aria-expanded').removeAttr('title').eq(0).attr('title', '선택됨');
            },

            _unbuildARIA: function _unbuildARIA() {
                var self = this;

            },

            _bindEvents: function _bindEvents() {
                var self = this;
                var opt = self.options;
                var $fc = self.$flickContainer;
                var startX = void 0,
                    wrapWidth = void 0;

                // 처음로딩때 resize를 한번 실행해준다.
                self.winOn('resizeend', self.resize);
                setTimeout(self.resize);


                // 좌우 플리킹 바인딩
                self.gesture = new Gesture($fc);
                self.gesture.on('gesturestart gesturemove gestureend gesturecancel', function(e, data) {
                    switch (e.type) {
                        case 'gesturestart':
                            if (self.flicking) {
                                e.preventDefault();
                                return;
                            }

                            startX = core.dom.getTranslateXY($fc.get(0)).x;
                            wrapWidth = self.wrapWidth;
                            break;

                        case 'gesturemove':
                            $fc.css(propX, startX + data.diff.x);
                            break;

                        default:
                            var diffX = data.diff.x;
                            var newX, dir;

                            self.flicking = true;
                            // 이동크기가 80보다 큰 경우에 플리킹 처리
                            if (80 < Math.abs(diffX)) {
                                if (diffX > 0) {
                                    newX = startX + wrapWidth;
                                    dir = 'right';
                                } else {
                                    newX = startX - wrapWidth;
                                    dir = 'left';
                                }

                                // 이동
                                var props = {};
                                props[propX] = newX;
                                $fc.transition(props, function() {
                                    var index;

                                    self.flicking = false;

                                    if (dir === 'left') {
                                        index = self._getNextIndex();
                                        self.$flickContainer.css(propX, newX + self.wrapWidth);
                                    } else {
                                        index = self._getPrevIndex();
                                        self.$flickContainer.css(propX, newX - self.wrapWidth);
                                    }

                                    self.movePanel(index, {
                                        focusLink: true
                                    });
                                });
                            } else {
                                // 이동크기가 80보다 작은 경우 원복
                                var props = {};
                                props[propX] = startX;
                                $fc.transition(props, function() {
                                    self.flicking = false;
                                });
                            }

                            break;
                    }
                });

                if (!useNativeScroll) {
                    // 안드로이드에선 접근성 이슈로 인해 네이티브스크롤을 사용하고,
                    // 나머지 것들은 커스텀스크롤을 사용한다.
                    self.navScroll = self.$navWrap.vcSmoothScroll({
                        scrollX: true,
                        eventPassthrough: 'vertical'
                    }).vcSmoothScroll('instance');
                }
            },

            /**
             * 이전 네비의 인덱스
             * @returns {number}
             * @private
             */
            _getPrevIndex: function _getPrevIndex() {
                var self = this;
                return self.panelIndex === 0 ?
                    self.$navs.length - 1 :
                    self.panelIndex - 1;
            },

            /**
             * 다음 네비의 인덱스
             * @returns {number}
             * @private
             */
            _getNextIndex: function _getNextIndex() {
                var self = this;
                return self.panelIndex === self.$navs.length - 1 ?
                    0 :
                    self.panelIndex + 1;
            },

            /**
             * 원래 활성화돼있던 패널을 활성화
             */
            activeMenu: function() {
                this.movePanel(this.panelIndex);
            },

            /**
             * index에 해당하는 패널을 표시
             * 패널들을 임시공간(self.$tmp)에 갖고 있다가
             * $flickContainer에 index에 해당하는 패널과 앞뒤 패널을 좌우에 삽입해서 플리킹시킨다.
             * 플리킹이 끝나면 패널을 재배치.
             * @param index
             */
            movePanel: function(index, options) {
                var self = this;
                var $panels = self.$panels.addClass('on');
                var last = $panels.length - 1;
                var $fc = self.$flickContainer;
                var $prev, $curr, $next;

                options = core.extend({
                    focusPanel: false,
                    focusLink: false
                }, options);

                self.panelIndex = index;
                self.$tmp.append($panels); // 일단 패널 전체를 $tmp에 보관

                $fc.css(propX, -self.wrapWidth);
                // 실제 플리킹할 때는 세개만 사용. 나머지는 $tmp에 보관
                $fc.append($prev = $panels.eq(index < 0 ? last : index - 1).attr('aria-hidden', true)); // 이전 페널
                $fc.append($curr = $panels.eq(index).removeAttr('aria-hidden')); // 현재 표시되는 패널
                $fc.append($next = $panels.eq(index >= last ? 0 : index + 1).attr('aria-hidden', true)); // 이후 패넣0

                $prev.find('a, button').attr('tabindex', -1);
                $curr.find('a, button').removeAttr('tabindex');
                $next.find('a, button').attr('tabindex', -1);

                var left = self.$navs.parent()
                    .removeClass('on active')
                    .eq(index)
                    .addClass('active')
                    .position()
                    .left;

                self.$navs.removeAttr('title').eq(index).attr('title', '선택됨');

                // 접근성 이슈로 인해 분기
                if (useNativeScroll) {
                    // 안드로이드에선 네이티브스크롤을 이용함
                    left = self.$el.stop(true).scrollLeft() + left;
                    self.$el.animate({
                        scrollLeft: left
                    }, 120);
                } else {
                    left = Math.max(self.navScroll.x - left, self.navScroll.maxScrollX);
                    self.navScroll.scrollTo(left, 0, 400);
                }

                if (options.focusPanel) {
                    // 1depth메뉴를 클릭했을 때 패널에 포커싱
                    //setTimeout(function () {
                    if (!core.detect.isAndroid) {
                        $curr.children().vcScrollview('update', true);
                    }
                    $curr.children().find('a:first, button:first').eq(0).focus();
                } else if (options.focusLink) {
                    // 플리킹을 통해 움직인거면 1depth메뉴에 포커싱
                    setTimeout(function() {
                        if (self.el) {
                            self.$navs.eq(index).focus();
                        }
                    }, 400);
                }
            },

            /**
             * 1depth메뉴들의 총 너비를 구함
             * @return {number}
             * @private
             */
            _getMenusWidth: function() {
                var self = this;

                var w = 0;
                self.$depth1Wrap.children().each(function() {
                    w += $(this).outerWidth(true);
                });
                return w + 5;
            },

            /**
             * 리사이징 핸들러
             */
            resize: function() {
                var self = this;

                if (!self.el || !self.$flickContainer) {
                    return;
                }

                if (useNativeScroll) {
                    // 네이티브 스크롤이 가능하도록 스타일들을 설정
                    var width = self._getMenusWidth();

                    self.$depth1Wrap.css('min-width', width);
                    self.$navWrap.css('min-width', width);
                    self.$el.css('overflow-x', 'auto');
                }

                self.wrapWidth = window.innerWidth; //self.$el.css('width', '').width();
                self.$flickContainer
                    .css(propX, -self.wrapWidth)
                    .css('width', self.wrapWidth * 3); // flickContainer은 패널이 세개가 들어가므로 3배로 설정
                self.$panels.css('width', self.wrapWidth); // wrap요소의 너비에 맞춰 패널의 너비를 설정
            },

            destroy: function destroy() {
                if (this.navScroll) {
                    this.navScroll.destroy();
                    this.navScroll = null;
                }
                if (this.gesture) {
                    this.gesture.destroy();
                    this.gesture = null;
                }
                this.$el[0].style.cssText = '';
                if (this.$navWrap) {
                    this.$navWrap[0].style.cssText = '';
                }
                if (this.$depth1Wrap) {
                    this.$depth1Wrap[0].style.cssText = '';
                    this.$depth1Wrap.off();
                }
                if (this.$scrollWraps) {
                    this.$scrollWraps[0].style.cssText = '';
                }
                if (this.$flickContainer) {
                    this.$flickContainer[0].style.cssText = '';
                }
                if (this.$flickContainer) {
                    this.$flickContainer.append(this.$panels);
                }
                if (this.$panels) {
                    this.$panels.removeClass('on').css('width', '');
                }
                if (this.$tmp) {
                    this.$tmp.remove();
                    this.$tmp = null;
                }
                this._unbuildARIA();
                this.supr();
            }
        });

        return PanelFlicker;
    });
define('ui/productExpander', ['jquery', 'vcui'], function($, core) {
    return core.ui('ProductExpander', {
        bindjQuery: true,
        initialize: function(el, options) {
            var self = this;

            if (self.supr(el, options) === false) {
                return;
            }

            self._buildARIA();
            self._bindEvents();
        },

        _buildARIA: function() {
            var self = this;

            self.$('>li>a').attr({
                'role': 'button',
                'aria-haspopup': 'true',
                'aria-expanded': 'false'
            });
        },


        ///* 20190628 */
        _bindEvents: function() {
            var self = this;

            // 제품 버튼을 클릭시 해당 레이어 오픈
            self.on('click', '>li>a', function(e) {
                e.preventDefault();

                var $btn = $(this);
                var $li = $btn.parent();
                var isExpand = !$li.hasClass('down');

                self.$('>li.down').toggleClass('down', !isExpand)
                    .children('a').attr('aria-expanded', !isExpand);

                $btn.attr('aria-expanded', isExpand);
                $li.toggleClass('down', isExpand);

                if (isExpand) {
                    setTimeout(function() {
                        var _hgt = $btn.siblings('.lay_wrap').find('.down_wrap').outerHeight(); /* 20190628 */
                        $btn.siblings('.lay_wrap').css({ 'height' : _hgt }); /* 20190628 */
                        // 레이어가 열릴 때 상단으로 스크롤
                        var done = false;
                        $('html, body').stop().animate({
                            scrollTop: $li.offset().top
                        }, 180, function() {
                            if (!done) {
                                done = true;
                                //$btn.next('.lay_wrap').find(':focusable:visible:first').focus();
                            }
                        });
                    }, 100);
                }

            });

            // 닫기 버튼 클릭시
            self.on('click', '.btn_close button', function(e) {
                e.preventDefault();

                $(this).closest('li').removeClass('down')
                    .children('a').attr('aria-expanded', 'false').focus();
            });
        }
    });
});
/*!
 * @module vcui.ui.ProgressCarousel
 * @license MIT License
 * @description ProgressCarousel 컴포넌트
 * @copyright VinylC UID Group.
 */
define(
    'ui/progressCarousel', ['jquery', 'vcui', 'ui/carousel', 'ui/inviewScroll'],
    function($, core, Carousel, InviewScroll) {
        "use strict";

        return core.ui('ProgressCarousel', {
            bindjQuery: true,
            defaults: {
                duration: 4000,
                autoplay: true, //!(vcui.detect.isIOS || vcui.detect.isAndroid),
                inviewPlay: false
            },
            initialize: function(el, options) {
                var self = this;

                if ($(el).find('.ui_carousel_track>*').length <= 1) {
                    $(el)
                        .find('.ui_carousel_dots, .ui_carousel_next, .ui_carousel_prev, .btn_control_wrap')
                        .remove();
                    return;
                }

                if ($(el).hasClass('ui_carousel_initialized')) {
                    return;
                }

                if (self.supr(el, options) === false) {
                    return;
                }

                self.$el.addClass('ui_progress_carousel');

                self.tick = null;
                self.pausing = false;
                self.autoplay = self.options.autoplay;
                self.options.autoplay = false;
                self.carousel = new Carousel(self.$el, self.options);
                self.startPercent = 0;
                self.$indicator = self.$('.indicate');
                self.$progressbars = self.$('.ui_carousel_dots>*');
                self.$bannerContent = self.$('.ui_carousel_list');
                self.$bars = self.$progressbars.find('.bar');
                self.count = self.$progressbars.length;
                self.progressBarIndex = self.carousel.currentSlide;
                self.$currentBar = self.$bars.eq(self.progressBarIndex);
                self.percent = self.startPercent;

                self.$currentBar.closest('li').addClass('active');
                self.$bars.css({
                    'width': '',
                    'paddingLeft': '0%'
                }).eq(0).css('paddingLeft', self.startPercent + '%');

                if (self.options.sync) {
                    self.$sync = $(self.options.sync);
                    self.$sync.children().hide().eq(0).show();
                }

                if (self.count <= 1) {
                    self.$indicator.hide();
                    return;
                }

                core.util.waitImageLoad(self.$('img'))
                    .done(function() {
                        self._renderControl();
                        self._toggleDark(self.progressBarIndex);
                        if (self.autoplay) {
                            //$(window).on('load', function () {
                            if (self.options.inviewPlay) {
                                self._inviewPlay();
                            } else {
                                self.startProgressbar();
                            }
                            //});
                        } else {
                            self._updateBarsSize();
                        }
                    });

                self._bindEvents();

            },

            /**
             * 재생/정지 버튼 렌더링
             * @private
             */
            _renderControl: function() {
                if (!this.$indicator.find('.btn_control_wrap').length) {
                    this.$indicator.prepend('<div class="btn_control_wrap"><button type="button" class="pause" title="일시정지"></button></div>');
                }

                setTimeout(function() {
                    if (this.carousel.$slides.eq(0).find('.cover_img').length) {
                        this.$el.addClass('cover_layer');
                    }
                }.bind(this));
            },

            /**
             * 화면에 들어왔을 때만 자동 재생
             * @private
             */
            _inviewPlay: function() {
                var self = this;
                self.inview = new InviewScroll(self.$el, {
                    on: {
                        enter: function() {
                            self.resume();
                        },
                        leave: function() {
                            self.pause();
                        }
                    }
                });
            },

            /**
             * 배너의 색상에 따른 dark클래스 토글
             * @param index
             * @private
             */
            _toggleDark: function(index) {
                var self = this;

                self.$el.toggleClass('dark', self.carousel.$slides.eq(index).hasClass('dark'));
            },

            _toggleControl: function(flag) {
                var self = this;
                var $btn = self.$('.btn_control_wrap button');

                if (flag) {
                    $btn.replaceClass('pause', 'play').attr('title', '재생');
                } else {
                    $btn.replaceClass('play', 'pause').attr('title', '일시정지');
                }
            },

            _bindEvents: function() {
                var self = this;

                self.$('.btn_arrow').on('blur focusout mouseout', function(e) {
                    e.stopPropagation();
                });

                self.on('click', '.btn_control_wrap button', function(e) {
                    e.preventDefault();

                    var $el = $(this);
                    if ($el.hasClass('pause')) {
                        self.isStopAutoplay = true;
                        self._toggleControl(true);
                        self.stopProgress();
                    } else {
                        self.isStopAutoplay = false;
                        self._toggleControl(false);

                        if (core.detect.isMobileDevice) {
                            self.startProgress();
                        }
                    }
                });

                //  클릭했을 때는 20%위치에서 시작하랜다....
                self.on('click', '.ui_carousel_dots a', function() {
                    self.clickedIndex = $(this).parent().index();
                });

                //  클릭했을 때는 20%위치에서 시작하랜다....
                self.on('click', '.ui_carousel_next', function() {
                    self.clickedIndex = self.carousel.currentSlide + 1;
                    if (self.clickedIndex >= self.carousel.slideCount) {
                        self.clickedIndex = 0;
                    }
                });

                //  클릭했을 때는 20%위치에서 시작하랜다....
                self.on('click', '.ui_carousel_prev', function() {
                    self.clickedIndex = self.carousel.currentSlide - 1;
                    if (self.clickedIndex < 0) {
                        self.clickedIndex = self.carousel.slideCount - 1;
                    }
                });

                self.on(
                    'carouselbeforechange carouselafterchange' + (core.detect.isMobileDevice ? ' carouselswipe' : ' carouselactive carouseldeactive') +
                    '',
                    function(e, carousel, index1, index2) {
                        switch (e.type) {
                            case 'carouselswipe':
                                self.stop();
                                break;
                            case 'carouselbeforechange':
                                if (self.isStopAutoplay) {
                                    return;
                                }
                                if (index1) {
                                    self.$bars.slice(0, index1).css('paddingLeft', '100%');
                                }
                                self.stopProgress();
                                break;
                            case 'carouselactive':
                                self.inactive = true;
                                self.$bannerContent.addClass('hover');
                                self.pause();
                                break;
                            case 'carouselafterchange':
                                self.$bars.closest('li').removeClass('active');

                                self.progressBarIndex = index1;
                                self.$currentBar = self.$bars.eq(index1).css('paddingLeft', (self.clickedIndex > -1 ? 20 : self.startPercent) + '%');
                                self.$currentBar.closest('li').addClass('active');
                                self.percent = self.startPercent;
                                self.clickedIndex = -1;

                                /* 20200113 */
                                if ($('.list_slide_content').length) {
                                    afterInfo('.list_slide_content', index1);/* 20200113_1 */
                                }
                                /* //20200113 */
                                self._toggleDark(self.progressBarIndex);
                                if (self.isStopAutoplay) {
                                    self._updateBarsSize();
                                    return;
                                }
                                self._updateBarsSize();
                                self.startProgressbar();

                                if (self.options.sync) {
                                    self.$sync.children().hide().eq(self.progressBarIndex).show();
                                }
                                break;
                            case 'carouseldeactive':
                                self.inactive = false;
                                self.$bannerContent.removeClass('hover');
                                self.resume();
                                break;
                        }
                    });

                var fn;
                self.winOn('breakpointchange', fn = function(e, data) {
                    if (data.isMobile) {
                        self.carousel.setOption('speed', 400);
                    } else {
                        self.carousel.setOption('speed', 800);
                    }
                });
                fn(null, window.breakpoint);
            },

            pause: function() {
                this.stopProgress();
            },

            resume: function() {
                if (this.isStopAutoplay) {
                    return;
                }
                this.startProgress();
            },

            play: function() {
                var self = this;

                self.carousel.setPosition();
                self.isStopAutoplay = false;
                self._toggleControl(false);
                self.startProgressbar();
            },

            stop: function() {
                var self = this;

                self.isStopAutoplay = true;
                self._toggleControl(true);
                self.stopProgress();
            },
            /**
             * 진행바 초기화
             */
            startProgressbar: function() {
                var self = this;

                if (!self.autoplay || self.isStopAutoplay) {
                    return;
                }

                self.percent = self.startPercent;
                self.startProgress();
            },
            /**
             * 진행바 시작
             */
            startProgress: function() {
                var self = this;

                if (!self.autoplay || self.inactive || self.isStopAutoplay) {
                    return;
                }

                var dur = self.options.duration;

                if (self.progressBarIndex > 0) {
                    self.$bars.slice(0, self.progressBarIndex).css('paddingLeft', '100%');
                }

                self.$bars.stop();
                self.$currentBar.stop().animate({
                    paddingLeft: '100%'
                }, {
                    easing: 'linear',
                    duration: dur - (dur * (self.percent / 100)),
                    step: function(fx) {
                        self.percent = fx;
                    },
                    complete: function() {
                        self.carousel.next();
                    }
                });
            },
            /**
             * 진행바 정지
             */
            stopProgress: function() {
                var self = this;

                self.$bars.stop();
            },
            /**
             * 진행바 사이즈 반영
             * @private
             */
            _updateBarsSize: function() {
                var self = this;
                var index = self.carousel.currentSlide;

                self.$bars.not(self.$currentBar).stop().css('paddingLeft', '0%');
                if (self.autoplay) {
                    self.$bars.slice(0, index).css({
                        paddingLeft: '100%'
                    });
                } else {
                    if(index == (self.count - 1)) {
                        self.$bars.slice(0, self.count).css({
                            paddingLeft: '100%'
                        });
                    } else {
                        self.$bars.slice(0, Math.min(self.count - 1, index + 1)).css({
                            paddingLeft: '100%'
                        });
                    }
                }
            },
            resetProgressbar: function() {
                var self = this;

                self.clearInterval();
            },
            update: function() {
                this.carousel.refresh();
            }
        });
    });
// 검색폼 입력 체크
define('ui/requireSearchInput', ['jquery', 'vcui'], function($, core) {
    return core.ui('RequireSearchInput', {
        bindjQuery: true,
        defaults: {
            preventSubmit: false,
            wrapper: '.search_wrap',
            onSubmit: core.noop
        },
        initialize: function(el, options) {
            var self = this;

            if (self.supr(el, options) === false) {
                return;
            }

            self.$wrapper = self.$el.closest(self.options.wrapper);
            self._bindEvents();
        },

        _bindEvents: function() {
            var self = this;
            var $form = $(self.$el[0].form);


            $form.on('submit', function(e) {
                if (!self.$el.val()) {
                    alert('한 글자 이상을 입력해주세요.');
                    //self.$wrapper.addClass('blank');
                    self.$el.focus();
                    e.preventDefault();
                    return;
                }

                if (self.options.preventSubmit) {
                    e.preventDefault();
                    self.options.onSubmit();
                }
            });

            // deprecated: 필요가 없음
            self.$wrapper.on('click', '.error_msg', function(e) {
                self.$wrapper.removeClass('blank');
                self.$el.focus();
                e.preventDefault();
            });

            self.on('keydown', function(e) {
                if (e.which !== core.keyCode.ENTER) {
                    self.$wrapper.removeClass('blank');
                }
            });
        }
    });
});
define('ui/responseCarousel', ['jquery', 'vcui', 'ui/carousel'],
    function($, core) {
        /**
         * 반응형 배너
         */
        return core.ui('ResponseCarousel', {
            bindjQuery: true,
            initialize: function(el, options) {
                var self = this;

                // 이미 배너가 빌드되어 있으면 무시
                if ($(el).hasClass('ui_carousel_initialized')) {
                    return;
                }

                if (self.supr(el, options) === false) {
                    return;
                }

                self._build();
            },
            _build: function() {
                var self = this;
                var o = self.options;
                var mobileSettings = {};
                var pcSettings = {};

                if (o.pc) {
                    // pc모드일 때의 배너옵션
                    if (isNaN(o.pc)) {
                        if (o.pc.variableWidth) {
                            pcSettings.slidesToShow = 1;
                        }
                        core.extend(pcSettings, o.pc);
                    } else {
                        pcSettings = {
                            infinite: true,
                            slidesToShow: o.pc,
                            slidesToScroll: o.pc
                        };
                    }
                    delete o.pc;
                }
                pcSettings.speed = 800;
                core.extend(pcSettings, o);

                if (o.mobile) {
                    // 모바일 모드일 때의 배너 옵션
                    if (isNaN(o.mobile)) {
                        if (o.mobile.variableWidth) {
                            mobileSettings.slidesToShow = 1;
                        }
                        core.extend(mobileSettings, {
                                centerMode: true,
                                centerPadding: 0,
                                slidesToShow: 1,
                                slidesToScroll: 1
                            },
                            o.mobile);
                    } else {
                        mobileSettings = {
                            infinite: true,
                            centerMode: o.mobile === 1,
                            centerPadding: o.mobile === 1 ? '40px' : '',
                            slidesToShow: o.mobile,
                            slidesToScroll: o.mobile,
                        }
                    }
                    delete o.mobile;
                }
                mobileSettings.speed = 400;
                core.extend(mobileSettings, o);

                // 좌우 버튼 생성. 접근성 이슈.
                // 마크업에서 일일이 넣기가 어려워 스크립트에서 동적으로 생성(버튼이 없을 때만...)
                if (!self.$('.btn_arrow').length) {
                    var $list = self.$('.ui_carousel_list');

                    $list.append('<div class="mobile_btns">' +
                        '<div class="btn_arrow right">' +
                        '<button type="button" class="btn_next ui_carousel_next"><i class="ico"></i></button>' +
                        '</div>' +
                        '<div class="btn_arrow left">' +
                        '<button type="button" class="btn_prev ui_carousel_prev"><i class="ico"></i></button>' +
                        '</div>' +
                        '</div>');
                }

                // 배너 생성
                self.$el.vcCarousel(core.extend({
                        // arrows: false,
                        dots: false,
                        responsive: [{
                                breakpoint: 99999,
                                settings: pcSettings
                            },
                            {
                                breakpoint: 768,
                                settings: mobileSettings
                            }
                        ]
                    },
                    o));
            }
        });
    });
/*!
 * @module vcui.ui.Scrollview
 * @license MIT License
 * @description 커스텀스크롤 컴포넌트
 * @copyright VinylC UID Group
 */
define('ui/scrollview', ['jquery', 'vcui'], function($, core) {
    "use strict";

    $.easing.smooth = function(x, t, b, c, d) {
        var ts = (t /= d) * t,
            tc = ts * t;
        return b + c * (-1 * ts * ts + 4 * tc + -6 * ts + 4 * t);
    };

    var cssTransform = core.css3.prefix('transform');
    var isTouch = core.detect.isTouch;


    /**
     * 커스텀 스크롤
     */
    var Scrollview = core.ui('Scrollview', {
        bindjQuery: 'scrollview',
        selectors: {
            wrapper: '>.ui_scrollarea',
            vscrollbar: '>.ui_scrollbar'
        },
        defaults: {
            duration: 600,
            speedLimit: 1.2,
            moveThreshold: 100,
            offsetThreshold: 30,
            startThreshold: 5,
            acceleration: 0.1,
            accelerationT: 250,
            watch: true,
            watchInterval: 400,
            preventScroll: true
        },
        initialize: function initialize(el, options) {
            var self = this;

            if (self.supr(el, options) === false) {
                return;
            }

            self.$el.addClass('scrollviewed');

            self.maxScrollY = 0;
            self.scrollHeight = 0;
            self.wrapperHeight = 0;
            self.visibleScroll = false;

            if (self.$vscrollbar.length === 0) {
                // 스크롤바가 없으면 자동 생성해 준다.
                self.$vscrollbar = $('<div class="scroll ui_scrollbar">' +
                    '<span class="bg_top"></span><span class="bg_mid"></span>' +
                    '<span class="bg_btm"></span></div>');
                self.$el.append(self.$vscrollbar);
            }

            self.$el.css('overflow-y', 'hidden');
            self.$wrapper.css({
                'overflow-y': 'hidden',
                'height': '100%'
            });

            self.scrollbarStyle = self.$vscrollbar[0].style;
            self.scrollbarStyle.display = 'none';
            self.$vscrollbar.css('transition', 'transform 0.1s');

            //me.$el.addClass('strack');
            self.$el.attr('tabindex', -1);
            self.$vscrollbar.attr('role', 'scrollbar');

            self._bindEvents();
        },
/* 20190628 */
        _bindEvents: function _bindEvents() {
            var self = this;

            if (self.$vscrollbar.length) {
                self.$wrapper.on('scroll', function() {
                    var rate = (self.wrapperHeight - self.scrollbarHeight) / (self.scrollHeight - self.wrapperHeight);
                    self._moveScrollbar(self.$wrapper[0].scrollTop * rate);
                });

                if (self.options.watch === true) {
                    // 사이즈 변화 감시
                    var totalTime = 0,
                        dur = self.options.watchInterval;
                    self.updateTimer = setInterval(function() {
                        if (!self.$el) {
                            clearInterval(self.updateTimer);
                            return;
                        }

                        if (!self.$el.is(':visible')) {
                            return;
                        }

                        // 40초에 한번씩 dom에서 제거 됐건지 체크해서 타이머를 멈춘다.
                        if (totalTime > 40000) {
                            totalTime = 0;
                            if (!core.dom.contains(document, self.$el[0])) {
                                clearInterval(self.updateTimer);
                                self.updateTimer = null;
                                return;
                            }
                        } else {
                            totalTime += dur;
                        }
                        self.update();
                    }, dur);
                }
            }
        },

        _watchStart: function _watchStart() {
            var self = this;
        },
        /**
         * 터치기반 디바이스에서 터치로 컨텐츠를 스크롤할 수 있도록 바인딩
         * @private
         */
        _bindContentScroll: function _bindContentScroll() {
            var self = this,
                times = {},
                multiplier = 1,
                dom = core.dom,
                distance,
                startY,
                startX,
                acc,
                scrollableY,
                wrapHeight,
                maxScrollY,
                startScrollTop,
                pos,
                isScrolling;

            self.on('touchstart touchmove touchend touchcancel', function(e) {
                var isMove, touchTime, maxOffset, offset, scrollTop, duration, pointY;
                times[e.type] = e.timeStamp;

                pos = dom.getEventPoint(e);
                pointY = pos.y;
                switch (e.type) {
                    case 'touchstart':
                        wrapHeight = self.wrapperHeight;
                        maxScrollY = self.$wrapper[0].scrollHeight - wrapHeight;
                        scrollableY = maxScrollY > 0;

                        if (!scrollableY) {
                            return;
                        }

                        startScrollTop = self.$wrapper[0].scrollTop;
                        startX = pos.x;
                        startY = pos.y;
                        multiplier = 1;
                        isScrolling = false;

                        if (self.$wrapper.is(":animated") && times['touchstart'] - times['touchend'] < self.options.accelerationT) {
                            multiplier += self.options.acceleration;
                        } else {
                            multiplier = 1;
                        }

                        self.$wrapper.stop(true, false).data('scrollTop', self.$wrapper.scrollTop());

                        break;
                    case 'touchmove':
                        if (!isScrolling && Math.abs(startX - pos.x) > Math.abs(startY - pos.y)) {
                            scrollableY = false;
                        }
                        if (!scrollableY) {
                            return;
                        }

                        if (self.options.preventScroll) {
                            e.preventDefault();
                        } else {
                            if (startY < pointY && startScrollTop === 0) {
                                return;
                            }
                            if (startY > pointY && startScrollTop === maxScrollY) {
                                return;
                            }
                            e.preventDefault();
                        }

                        distance = startY - pointY;
                        acc = Math.abs(distance / (times['touchmove'] - times['touchstart']));
                        scrollTop = self.$wrapper.data('scrollTop') + distance;
                        duration = 0;
                        multiplier = 1;
                        isScrolling = true;

                        if (scrollTop < 0) {
                            scrollTop = 0;
                        } else if (scrollTop > maxScrollY) {
                            scrollTop = maxScrollY;
                        }
                        self.$wrapper.stop(true, false).scrollTop(scrollTop);

                        e.stopPropagation();
                        break;
                    case 'touchend':
                    case 'touchcancel':
                        if (!scrollableY || !isScrolling) {
                            return;
                        }
                        isMove = Math.abs(startY - pointY) > self.options.startThreshold;
                        if (isMove) {
                            touchTime = times['touchend'] - times['touchmove'];
                            maxOffset = wrapHeight * self.options.speedLimit;
                            offset = Math.pow(acc, 2) * wrapHeight;
                            offset = offset > maxOffset ? maxOffset : multiplier * offset;
                            offset = multiplier * offset * (distance < 0 ? -1 : 1);

                            if (touchTime < self.options.moveThreshold && offset !== 0 && Math.abs(offset) > self.options.offsetThreshold) {
                                scrollTop = self.$wrapper.data('scrollTop') + distance + offset;
                                duration = self.options.duration;

                                if (scrollTop < 0) {
                                    scrollTop = 0;
                                } else if (scrollTop > maxScrollY) {
                                    scrollTop = maxScrollY;
                                }

                                self.$wrapper.stop(true, false).animate({
                                    scrollTop: scrollTop
                                }, {
                                    duration: duration,
                                    easing: 'smooth',
                                    complete: function complete() {
                                        multiplier = 1;
                                    }
                                });
                            }
                        }
                        break;
                }
            });
        },

        /**
         * pc에서 상하키로 스크롤할 수 있도록 바인딩
         * @private
         */
        _bindKeys: function _bindKeys() {
            var self = this;

            self.on('keydown', function(e) {
                var keyCode = e.keyCode || e.which,
                    wrapperHeight = self.$wrapper.innerHeight(),
                    scrollTop = self.$wrapper.prop('scrollTop'),
                    maxScrollY = self.$wrapper.prop('scrollHeight') - wrapperHeight,
                    newY;

                switch (keyCode) {
                    case 38:
                        // up
                        e.preventDefault();
                        if (scrollTop <= 0) {
                            return;
                        }
                        newY = scrollTop - wrapperHeight;
                        break;
                    case 40:
                        // down
                        e.preventDefault();
                        if (scrollTop >= maxScrollY) {
                            return;
                        }
                        newY = scrollTop + wrapperHeight;
                        break;
                    default:
                        return;
                }
                if (newY) {
                    self.$wrapper.stop(true, false).animate({
                        scrollTop: newY
                    }, {
                        duration: self.options.duration,
                        easing: 'smooth'
                    });
                }
            });
        },

        /**
         * pc에서 스크롤바로 컨텐츠를 스크롤할 수 있도록 바인딩
         * @private
         */
        _bindScrollbar: function _bindScrollbar() {
            var self = this,
                currY,
                downY,
                moveY;

            function getY(e) {
                if (isTouch && e.originalEvent.touches) {
                    e = e.originalEvent.touches[0];
                }
                return e.pageY;
            }

            self.$vscrollbar.on('mousedown touchstart', function(e) {
                e.preventDefault();
                if (isTouch) {
                    e.stopPropagation();
                }

                self.isMouseDown = true;
                currY = core.css3.position(self.$vscrollbar).y;
                downY = getY(e);

                self.docOn('mouseup mousecancel touchend mousemove.' + self.cuid + ' touchmove touchcancel', function(e) {
                    if (!self.isMouseDown) {
                        self.docOff();
                        return;
                    }

                    switch (e.type) {
                        case 'mouseup':
                        case 'touchend':
                        case 'mousecancel':
                        case 'touchcancel':
                            self.isMouseDown = false;
                            if (!self.isScrollbarActive) {
                                self.$vscrollbar.removeClass('active');
                            }
                            moveY = 0;
                            self.docOff();
                            break;
                        case 'mousemove':
                        case 'touchmove':
                            moveY = getY(e);

                            var top = currY - (downY - moveY),
                                scrollHeight = self.wrapperHeight - self.scrollbarHeight,
                                y;

                            self.scrollbarStyle.top = top = Math.max(0, Math.min(top, scrollHeight));
                            y = (self.scrollHeight - self.wrapperHeight) * (top / scrollHeight);
                            self.$wrapper.scrollTop(y);
                            e.preventDefault();
                            break;
                    }
                });
                return false;
            }).on('mouseenter mouseleave', function(e) {
                self.isScrollbarActive = e.type === 'mouseenter';
                self.$vscrollbar.toggleClass('active', self.isScrollbarActive || self.isMouseDown);
            });
        },

        /**
         * pc에서 마우스로 스크롤할 수 있도록 바인딩
         * @private
         */
        _bindWheel: function _bindWheel() {
            var self = this;
            self.$wrapper.on('mousewheel DOMMouseScroll wheel', function(ev) {
                var e = ev.originalEvent;
                var delta = core.dom.getDeltaY(e) * 100,
                    scrollTop = self.$wrapper[0].scrollTop;

                self.$wrapper.scrollTop(scrollTop - delta); // -: down +: up
                if (self.options.preventScroll) {
                    ev.preventDefault();
                    ev.stopPropagation();
                } else {
                    if (self.$wrapper[0].scrollTop !== scrollTop) {
                        ev.preventDefault();
                        ev.stopPropagation();
                    }
                }
            });
        },

        /**
         * 스크롤바를 움직여주는 함수
         * @param top
         * @param height
         * @private
         */
        _moveScrollbar: function _moveScrollbar(top, height) {
            var self = this;

            if (!self.visibleScroll) {
                return;
            }
            if (isNaN(top)) {
                top = 0;
            }
            if (height !== undefined && self.scrollbarHeight !== height) {
                height = Math.max(height, 18);
                self.scrollbarStyle.height = height + 'px';
                self.scrollbarHeight = height;
            } else {
                height = self.scrollbarHeight;
            }
            if (self.wrapperHeight < height + top) {
                top = self.wrapperHeight - height;
            }
            if (core.css3.support) {
                self.scrollbarStyle[cssTransform] = 'translate(0px, ' + top + 'px)';
            } else {
                self.scrollbarStyle.top = top + 'px';
            }
        },

        /**
         * 사이즈 변화에 따른 UI 갱신
         */
        update: function update(isForce) {
            var self = this,
                wrapperHeight,
                scrollHeight,
                visibleScroll,
                rate;

            if (!self.el || !self.$el.is(':visible') || !self.$wrapper || !self.$wrapper[0]) {
                return;
            }

            wrapperHeight = self.$wrapper[0].offsetHeight;
            if (wrapperHeight === 0) {
                self.wrapperHeight = 0;
                return;
            }

            scrollHeight = self.$wrapper[0].scrollHeight;
            visibleScroll = wrapperHeight < scrollHeight - 1;
            if (visibleScroll && !self._bindedEventOver) {
                self._bindedEventOver = true;
                // 실질적으로 컨텐츠가 래퍼를 오버했을 때만 스크롤을 붙인다.
                if (isTouch) {
                    self._bindContentScroll();
                }
                self._bindScrollbar();
                self._bindKeys();
                self._bindWheel();
            }
            // 160217 - 영역보다 내용이 작을 경우 스크롤바 감추기
            self.scrollbarStyle.display = visibleScroll ? '' : 'none';
            if (visibleScroll !== self.visibleScroll) {
                self.visibleScroll = visibleScroll;
                self.$el.toggleClass('track_visible', visibleScroll);
            }
            if (isForce === true ||
                (visibleScroll && (scrollHeight !== self.scrollHeight || wrapperHeight !== self.wrapperHeight))) {
                self.wrapperHeight = wrapperHeight;
                self.scrollHeight = scrollHeight;
                self.scrollRate = wrapperHeight / scrollHeight;
                rate = (self.wrapperHeight - self.scrollbarHeight) / (self.scrollHeight - self.wrapperHeight);
                self._moveScrollbar(self.$wrapper[0].scrollTop * rate, wrapperHeight * self.scrollRate);
            }
        },

        /**
         * scrollTop 설정
         * @param top
         * @returns {*}
         */
        scrollTop: function scrollTop(top) {
            var self = this;
            if (arguments.length > 0) {
                self.$wrapper.scrollTop(top);
                self.update();
            } else {
                return self.$wrapper.scrollTop();
            }
        },

        destroy: function destroy() {
            var self = this;

            self.updateTimer && (clearInterval(self.updateTimer), self.updateTimer = null);
            self.$wrapper.off();
            self.$vscrollbar.off();
            self.$el.removeClass('scrollviewed');
            self.supr();
        }
    });

    return Scrollview;
});
/*!
 * @module vcui.ui.SmoothScroll
 * @license MIT License
 * @description SmoothScroll 컴포넌트
 * @copyright VinylC UID Group
 */
define('ui/smoothScroll', ['jquery', 'vcui'], function($, core) {
    "use strict";
    /*! iScroll v5.1.2 ~ (c) 2008-2014 Matteo Spinelli ~ http://cubiq.org/license
     */
    var rAF = window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame || window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame || function(callback) {
            window.setTimeout(callback, 1000 / 60);
        };
    var _elementStyle = document.createElement('div').style;
    var _vendor = function() {
        var vendors = ['t', 'webkitT', 'MozT', 'msT', 'OT'],
            transform, i = 0,
            l = vendors.length;

        for (; i < l; i++) {
            transform = vendors[i] + 'ransform';
            if (transform in _elementStyle) {
                return vendors[i].substr(0, vendors[i].length - 1);
            }
        }

        return false;
    }();

    function _prefixStyle(style) {
        if (_vendor === false) return false;
        if (_vendor === '') return style;
        return _vendor + style.charAt(0).toUpperCase() + style.substr(1);
    }

    var _transform = _prefixStyle('transform');

    var getTime = Date.now || function getTime() {
        return new Date().getTime();
    };

    var momentum = function momentum(current, start, time, lowerMargin,
        wrapperSize, deceleration) {
        var distance = current - start,
            speed = Math.abs(distance) / time,
            destination, duration;

        deceleration = deceleration === undefined ? 0.0006 : deceleration;

        destination =
            current + speed * speed / (2 * deceleration) * (distance < 0 ? -1 : 1);
        duration = speed / deceleration;

        if (destination < lowerMargin) {
            destination = wrapperSize ?
                lowerMargin - wrapperSize / 2.5 * (speed / 8) :
                lowerMargin;
            distance = Math.abs(destination - current);
            duration = distance / speed;
        } else if (destination > 0) {
            destination = wrapperSize ? wrapperSize / 2.5 * (speed / 8) : 0;
            distance = Math.abs(current) + destination;
            duration = distance / speed;
        }

        return {
            destination: Math.round(destination),
            duration: duration
        };
    };

    var browser = {
        hasTransform: _transform !== false,
        hasPerspective: _prefixStyle('perspective') in _elementStyle,
        hasTouch: 'ontouchstart' in window,
        hasPointer: window.PointerEvent || window.MSPointerEvent, // IE10 is prefixed
        hasTransition: _prefixStyle('transition') in _elementStyle
    };

    var easingType = {
        quadratic: {
            style: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            fn: function fn(k) {
                return k * (2 - k);
            }
        },
        circular: {
            style: 'cubic-bezier(0.1, 0.57, 0.1, 1)', // Not properly "circular" but this looks better, it should be (0.075, 0.82, 0.165, 1)
            fn: function fn(k) {
                return Math.sqrt(1 - --k * k);
            }
        },
        back: {
            style: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            fn: function fn(k) {
                var b = 4;
                return (k = k - 1) * k * ((b + 1) * k + b) + 1;
            }
        },
        bounce: {
            style: '',
            fn: function fn(k) {
                if ((k /= 1) < 1 / 2.75) {
                    return 7.5625 * k * k;
                } else if (k < 2 / 2.75) {
                    return 7.5625 * (k -= 1.5 / 2.75) * k + 0.75;
                } else if (k < 2.5 / 2.75) {
                    return 7.5625 * (k -= 2.25 / 2.75) * k + 0.9375;
                } else {
                    return 7.5625 * (k -= 2.625 / 2.75) * k + 0.984375;
                }
            }
        },
        elastic: {
            style: '',
            fn: function fn(k) {
                var f = 0.22,
                    e = 0.4;

                if (k === 0) {
                    return 0;
                }
                if (k === 1) {
                    return 1;
                }

                return e * Math.pow(2, -10 * k) *
                    Math.sin((k - f / 4) * (2 * Math.PI) / f) +
                    1;
            }
        }
    };

    var eventType = {
        touchstart: 1,
        touchmove: 1,
        touchend: 1,

        mousedown: 2,
        mousemove: 2,
        mouseup: 2,

        pointerdown: 3,
        pointermove: 3,
        pointerup: 3,

        MSPointerDown: 3,
        MSPointerMove: 3,
        MSPointerUp: 3
    };

    var style = {
        transform: _transform,
        transitionTimingFunction: _prefixStyle('transitionTimingFunction'),
        transitionDuration: _prefixStyle('transitionDuration'),
        transitionDelay: _prefixStyle('transitionDelay'),
        transformOrigin: _prefixStyle('transformOrigin')
    };

    var $doc = $(document);

    var SmoothScroll = core.ui('SmoothScroll', {
        bindjQuery: 'smoothScroll',
        defaults: {
            startX: 0,
            startY: 0,
            scrollX: true,
            scrollY: true,
            directionLockThreshold: 5,
            mouseWheelSpeed: 20,
            notWheel: true,
            momentum: true,
            center: false,
            prevButton: '',
            nextButton: '',
            gapWidth: 0,
            toggleButton: 'show',
            bounce: true,
            bounceTime: 600,
            bounceEasing: '',

            preventDefault: false,
            preventDefaultException: {
                tagName: /^(INPUT|TEXTAREA|BUTTON|SELECT)$/i
            },

            HWCompositing: true,
            useTransition: true,
            useTransform: true,
            resizeRefresh: true
        },
        selectors: {
            scroller: '>*:first'
        },
        initialize: function initialize(el, options) {
            var self = this;

            if (self.supr(el, options) === false) {
                return;
            }

            var opts = self.options;

            self.$wrapper = self.$el.css('user-select', 'none');
            self.isBadAndroid = /Android /.test(window.navigator.appVersion) && !/Chrome\/\d/.test(window.navigator.appVersion);
            self.translateZ = opts.HWCompositing && browser.hasPerspective ? ' translateZ(0)' : '';
            opts.useTransition = browser.hasTransition && opts.useTransition;
            opts.useTransform = browser.hasTransform && opts.useTransform;
            opts.eventPassthrough = opts.eventPassthrough === true ? 'vertical' : opts.eventPassthrough;
            opts.preventDefault = !opts.eventPassthrough && opts.preventDefault;
            opts.scrollY = opts.eventPassthrough === 'vertical' ? false : opts.scrollY;
            opts.scrollX = opts.eventPassthrough === 'horizontal' ? false : opts.scrollX;
            opts.freeScroll = opts.freeScroll && !opts.eventPassthrough;
            opts.directionLockThreshold = opts.eventPassthrough ? 0 : opts.directionLockThreshold;
            opts.bounceEasing = typeof opts.bounceEasing === 'string' ? easingType[opts.bounceEasing] || easingType.circular : opts.bounceEasing;
            opts.resizePolling = opts.resizePolling === undefined ? 60 : opts.resizePolling;
            opts.invertWheelDirection = opts.invertWheelDirection ? -1 : 1;

            self.x = 0;
            self.y = 0;
            self.directionX = 0;
            self.directionY = 0;

            self.$el.css('overflow', 'hidden').addClass('ui_smoothscroll_initialized');
            self.scrollerStyle = self.$scroller[0].style;

            self._initEvents();
            self.refresh();
            self.enable();

            if ('autoCenterScroll' in opts) {
                opts.center = opts.autoCenterScroll;
            }

            if (opts.center) {
                setTimeout(function() {
                    self.scrollToActive(100);
                }, 100);
            } else {
                self.scrollTo(opts.startX, opts.startY);
            }

            self.triggerHandler('smoothscrollinit', this)
        },

        _calcScrollerWidth: function _calcScrollerWidth() {
            if (!this.$scroller) {
                return;
            }

            var self = this,
                opts = self.options,
                width = 0,
                paddingWidth = self.$scroller.outerWidth() - self.$scroller.width(),
                style = self.$scroller[0].style;

            style.setProperty('width', '100000px');
            self.$items = self.$scroller.children(); //
            self.$items.each(function() {
                width += $(this).outerWidth(true);
            });
            style.setProperty('width', 'auto', 'important');
            self.$scroller.css('min-width', width + paddingWidth + opts.gapWidth);
        },

        _activateButtons: function _activateButtons() {
            var self = this,
                opt = self.options;

            if (self.$prevButton) {
                self.$prevButton.prop('disabled', self.x === 0);
                if (self.x === 0) {
                    self.$prevButton.addClass('disabled');
                } else {
                    self.$prevButton.removeClass('disabled');
                }
            }

            if (self.$nextButton) {
                self.$nextButton.prop('disabled', self.x === self.maxScrollX);

                if (self.x === self.maxScrollX) {
                    self.$nextButton.addClass('disabled');
                } else {
                    self.$nextButton.removeClass('disabled');
                }
            }
        },

        enable: function enable() {
            this.enabled = true;
        },

        _initEvents: function _initEvents() {
            var self = this;
            var opt = self.options;

            if (opt.prevButton && opt.nextButton) {
                (self.$prevButton = $(opt.prevButton)).addClass('disabled')
                    .on('click' + self.eventNS, function(e) {
                        e.preventDefault();
                        self.prevPage();
                    });

                (self.$nextButton = $(opt.nextButton)).addClass('disabled')
                    .on('click' + self.eventNS, function(e) {
                        e.preventDefault();
                        self.nextPage();
                    });

                self.on('smoothscrollend',
                    function(e, data) {
                        self._activateButtons();
                    });
            }

            self._handle(self.$wrapper, 'mousedown');
            self._handle(self.$wrapper, 'touchstart');
            self._handle(self.$wrapper, 'focusin');
            self._handle(self.$wrapper, 'selectstart');
            self._handle(self.$wrapper, 'click');

            if (self.options.useTransition) {
                self._handle(self.$scroller, 'transitionend');
                self._handle(self.$scroller, 'webkitTransitionEnd');
            }

            if (!self.options.notWheel) {
                self._initWheel();
            }

            if (self.options.resizeRefresh) {
                self.winOn('resize', core.delayRun(function() {
                        if (self.el) {
                            self.refresh();
                        }
                    },
                    self.options.resizePolling));
            }

            self.winOne('load', function() {
                self._activateButtons();
            })
        },

        _initWheel: function _initWheel() {
            var self = this;

            self._handle(self.$wrapper, 'wheel');
            self._handle(self.$wrapper, 'mousewheel');
            self._handle(self.$wrapper, 'DOMMouseScroll');
        },

        moveFirst: function() {
            this.scrollTo(0, 0, 200);
        },

        moveLast: function() {
            this.scrollTo(this.maxScrollX, 0, 200);
        },

        /**
         * ���̺�Ʈ ó��
         * @param e
         * @private
         */
        _wheel: function _wheel(e) {
            var self = this;
            if (!self.enabled) {
                return;
            }

            e.preventDefault ? e.preventDefault() : e.returnValue = false;
            e.stopPropagation ? e.stopPropagation() : e.cancalBubble = true;

            var wheelDeltaX, wheelDeltaY, newX, newY;

            if (self.wheelTimeout === undefined) {
                self.triggerHandler('smoothscrollstart', {
                    x: self.x,
                    y: self.y
                });
            }

            // Execute the scrollEnd event after 400ms the wheel stopped scrolling
            clearTimeout(self.wheelTimeout);
            self.wheelTimeout = setTimeout(function() {
                self.triggerHandler('smoothscrollend', {
                    x: self.x,
                    y: self.y,
                    isStart: self.x === 0,
                    isEnd: self.x === self.maxScrollX
                });
                self.wheelTimeout = undefined;
            }, 400);

            e = e.originalEvent || e;
            if ('deltaX' in e) {
                if (e.deltaMode === 1) {
                    wheelDeltaX = -e.deltaX * self.options.mouseWheelSpeed;
                    wheelDeltaY = -e.deltaY * self.options.mouseWheelSpeed;
                } else {
                    wheelDeltaX = -e.deltaX;
                    wheelDeltaY = -e.deltaY;
                }
            } else if ('wheelDeltaX' in e) {
                wheelDeltaX = e.wheelDeltaX / 120 * self.options.mouseWheelSpeed;
                wheelDeltaY = e.wheelDeltaY / 120 * self.options.mouseWheelSpeed;
            } else if ('wheelDelta' in e) {
                wheelDeltaX = wheelDeltaY =
                    e.wheelDelta / 120 * self.options.mouseWheelSpeed;
            } else if ('detail' in e) {
                wheelDeltaX = wheelDeltaY = -e.detail / 3 * self.options.mouseWheelSpeed;
            } else {
                return;
            }

            wheelDeltaX *= self.options.invertWheelDirection;
            wheelDeltaY *= self.options.invertWheelDirection;

            if (!self.hasVerticalScroll) {
                wheelDeltaX = wheelDeltaY;
                wheelDeltaY = 0;
            }

            newX = self.x + Math.round(self.hasHorizontalScroll ? wheelDeltaX : 0);
            newY = self.y + Math.round(self.hasVerticalScroll ? wheelDeltaY : 0);

            if (newX > 0) {
                newX = 0;
            } else if (newX < self.maxScrollX) {
                newX = self.maxScrollX;
            }

            if (newY > 0) {
                newY = 0;
            } else if (newY < self.maxScrollY) {
                newY = self.maxScrollY;
            }

            self.scrollTo(newX, newY, 0);
        },

        _handle: function _handle($el, eventName, isBind) {
            var self = this;
            if (isBind !== false) {
                $el.on(eventName + '.' + self.cid, self.handleEvent.bind(self));
            } else {
                $el.off(eventName + '.' + self.cid);
            }
        },

        handleEvent: function handleEvent(e) {
            var self = this;

            switch (e.type) {
                case 'mousedown':
                case 'touchstart':
                    self._start(e);
                    break;
                case 'selectstart':
                    e.preventDefault ? e.preventDefault : e.returnValue = false;
                    break;
                case 'mousemove':
                case 'touchmove':
                    self._move(e);
                    break;
                case 'focusin':
                    self._focusin(e);
                    break;
                case 'mouseup':
                case 'mousecancel':
                case 'touchend':
                case 'touchcancel':
                    self._end(e);
                    break;
                case 'transitionend':
                case 'webkitTransitionEnd':
                case 'oTransitionEnd':
                case 'MSTransitionEnd':
                    self._transitionEnd(e);
                    break;
                case 'wheel':
                case 'mousewheel':
                case 'DOMMouseScroll':
                    self._wheel(e);
                    break;
                    // case 'click':
                    //    me._click(e);
                    //    break;
            }
        },

        _focusin: function(e) {
            var self = this;
            var $target = $(e.target);

            self.$scroller.children().each(function() {
                if ($.contains(this, $target[0])) {
                    var pos = $target.position();
                    var itemLeft = Math.abs(self.x) + pos.left;
                    var width = $target.outerWidth(true);

                    if (itemLeft >= Math.abs(self.x) && itemLeft + width < Math.abs(self.x) + self.wrapperWidth) {
                        return;
                    }

                    self.scrollToElement(this, 200, self.options.center);
                    return false;
                }
            });
        },

        prevPage: function prevPage() {
            var self = this;

            self.scrollTo(Math.min(0, self.x + self.wrapperWidth), 0, 200);
        },

        nextPage: function nextPage() {
            var self = this;

            self.scrollTo(Math.max(self.maxScrollX, self.x - self.wrapperWidth), 0,
                200);
        },

        getPosition: function getPosition() {
            var matrix = this.scrollerStyle,
                x, y;

            if (this.options.useTransform) {
                matrix = matrix[style.transform].match(/-?[\d.]+/g);
                x = +matrix[0];
                y = +matrix[1];
            } else {
                x = +matrix.left.replace(/[^-\d.]/g, '');
                y = +matrix.top.replace(/[^-\d.]/g, '');
            }

            return {
                x: x,
                y: y
            };
        },

        _animate: function _animate(destX, destY, duration, easingFn) {
            var self = this,
                startX = this.x,
                startY = this.y,
                startTime = getTime(),
                destTime = startTime + duration;

            function step() {
                var now = getTime(),
                    newX, newY, easing;

                if (now >= destTime) {
                    self.isAnimating = false;
                    self._translate(destX, destY);

                    if (!self.resetPosition(self.options.bounceTime)) {
                        self.triggerHandler('smoothscrollend', {
                            x: self.x,
                            y: self.y,
                            isStart: self.x === 0,
                            isEnd: self.x === self.maxScrollX
                        });
                    }

                    return;
                }

                now = (now - startTime) / duration;
                easing = easingFn(now);
                newX = (destX - startX) * easing + startX;
                newY = (destY - startY) * easing + startY;
                self._translate(newX, newY);

                if (self.isAnimating) {
                    rAF(step);
                }
            }

            this.isAnimating = true;
            step();
        },

        _transitionTime: function _transitionTime(time) {
            time = time || 0;

            this.scrollerStyle[style.transitionDuration] = time + 'ms';

            /*if ( !time && utils.isBadAndroid ) {
             this.scrollerStyle[style.transitionDuration] = '0.001s';
             }*/
        },

        _transitionTimingFunction: function _transitionTimingFunction(easing) {
            this.scrollerStyle[style.transitionTimingFunction] = easing;
        },

        _translate: function _translate(x, y) {
            var self = this;

            if (self.options.useTransform) {
                self.scrollerStyle[style.transform] =
                    'translate(' + x + 'px,' + y + 'px)' + self.translateZ;
            } else {
                x = Math.round(x);
                y = Math.round(y);
                self.scrollerStyle.left = x + 'px';
                self.scrollerStyle.top = y + 'px';
            }

            self.x = x;
            self.y = y;
            self.triggerHandler('smoothscrollmove', {
                x: self.x,
                y: self.y
            });
        },

        resetPosition: function resetPosition(time) {
            var self = this,
                x = self.x,
                y = self.y;

            time = time || 0;

            if (!self.hasHorizontalScroll || self.x > 0) {
                x = 0;
            } else if (self.x < self.maxScrollX) {
                x = self.maxScrollX;
            }

            if (!self.hasVerticalScroll || self.y > 0) {
                y = 0;
            } else if (self.y < self.maxScrollY) {
                y = self.maxScrollY;
            }

            if (x == self.x && y == self.y) {
                return false;
            }

            self.scrollTo(x, y, time, self.options.bounceEasing);
            return true;
        },

        scrollTo: function scrollTo(x, y, time, easing) {
            var self = this;
            easing = easing || easingType.circular;

            self.isInTransition = self.options.useTransition && time > 0;

            if (!time || self.options.useTransition && easing.style) {
                self._transitionTimingFunction(easing.style);
                self._transitionTime(time);
                self._translate(x, y);
                self.triggerHandler('smoothscrollend', {
                    x: self.x,
                    y: self.y,
                    isStart: self.x === 0,
                    isEnd: self.x === self.maxScrollX
                });
            } else {
                self._animate(x, y, time, easing.fn);
            }
        },

        scrollToElement: function scrollToElement(el, time, offsetX, offsetY,
            easing) {
            var self = this;
            el = el.nodeType ? el : self.$scroller.find(el);

            if (!el) {
                return;
            }

            var $el = $(el);
            var xy = core.dom.getTranslateXY(self.$scroller[0]);
            var pos = $el.position();
            var maxX = Math.abs(self.maxScrollX);
            var maxY = Math.abs(self.maxScrollY);
            var width = $el.outerWidth();
            var itemLeft = Math.abs(self.x) + pos.left;

            if (!self.options.center && itemLeft >= Math.abs(self.x) && itemLeft + width < Math.abs(self.x) + self.wrapperWidth) {
                return;
            }

            pos.left += Math.abs(xy.x);
            pos.top += Math.abs(xy.y);

            pos.left -= parseInt($el.parent().css('paddingLeft'), 10);
            pos.top -= parseInt($el.parent().css('paddingTop'), 10);

            if (offsetX === true) {
                offsetX = Math.round(el.offsetWidth / 2 - self.$wrapper[0].offsetWidth / 2);
            }
            if (offsetY === true) {
                offsetY = Math.round(el.offsetHeight / 2 - self.$wrapper[0].offsetHeight / 2);
            }

            pos.left += offsetX || 0;
            pos.top += offsetY || 0;
            pos.left = Math.min(maxX, pos.left < 0 ? 0 : pos.left);
            pos.top = Math.min(maxY, pos.top < 0 ? 0 : pos.top);

            time = time === undefined || time === null || time === 'auto' ? Math.max(Math.abs(self.x - pos.left), Math.abs(self.y - pos.top)) : time;

            self.scrollTo(-pos.left, -pos.top, time, easing);


        },

        scrollToActive: function(time, easing) {
            var $item = this.$scroller.children().filter('.on');
            if ($item.length) {
                this.scrollToElement($item[0], time == undefined ? 200 : time, this.options.center);
            }
        },


        preventDefaultException: function preventDefaultException(el) {
            var self = this;

            if (el && el.tagName &&
                self.options.preventDefaultException.tagName.test(el.tagName)) {
                return true;
            } else {
                return false;
            }
        },

        /***
         _isDownable: function(el){
            if(el && el.tagName &&
        this.options.preventDefaultException.tagName.test(el.tagName)){
                return true;
            } else {
                return false;
            }
        },
         _click: function(e) {
            var me = this,
                point = e.touches ? e.touches[0] : e;
              if(!(me.downX === point.pageX && me.downY === point.pageY)) {
                console.log('prevent click', me.downX, me.downY, e.pageX, e.pageY);
                e.preventDefault ? e.preventDefault() : e.returnValue = false;
            }
        },
         ***/
        _start: function _start(ev) {
            var self = this;
            var opt = self.options;
            var e = ev.originalEvent || ev;

            if (eventType[e.type] != 1) {
                if (e.button !== 0) {
                    return;
                }
            }

            if (!self.enabled ||
                self.initiated && eventType[e.type] !== self.initiated) {
                return;
            }

            if ( /*!self.isBadAndroid && */ self.preventDefaultException(e.target)) {
                e.preventDefault();
            }

            var point = e.touches ? e.touches[0] : e,
                pos;

            /***if(!me._isDownable($(e.target).closest(':focusable').get(0))) {
                e.preventDefault ? e.preventDefault() : e.returnValue = false;
            }***/
            self._handle(self.$wrapper, 'mousemove');
            self._handle(self.$wrapper, 'touchmove');
            self._handle($doc, 'touchend');
            self._handle($doc, 'mouseup');
            self._handle($doc, 'mousecancel');
            self._handle($doc, 'tocuchcancel');

            self.initiated = eventType[e.type];
            self.moved = false;
            self.distX = 0;
            self.distY = 0;
            self.directionX = 0;
            self.directionY = 0;
            self.directionLocked = 0;

            self._transitionTime();

            self.startTime = getTime();
            if (opt.useTransition && self.isInTransition) {
                self.isInTransition = false;
                pos = self.getPosition();
                self._translate(Math.round(pos.x), Math.round(pos.y));
                self.triggerHandler('smoothscrollend', {
                    x: self.x,
                    y: self.y,
                    isStart: self.x === 0,
                    isEnd: self.x === self.maxScrollX
                });
            } else if (!opt.useTransition && self.isAnimating) {
                self.isAnimating = false;
                self.triggerHandler('smoothscrollend', {
                    x: self.x,
                    y: self.y,
                    isStart: self.x === 0,
                    isEnd: self.x === self.maxScrollX
                });
            }

            self.startX = self.x;
            self.startY = self.y;
            self.absStartX = self.x;
            self.absStartY = self.y;
            self.pointX = self.downX = point.pageX;
            self.pointY = self.downY = point.pageY;
        },

        _move: function _move(ev) {
            var self = this;
            var opt = self.options;
            var e = ev.originalEvent || ev;

            if (!self.enabled || eventType[e.type] !== self.initiated) {
                return;
            }

            if (opt.preventDefault) {
                // increases performance on Android? TODO: check!
                e.preventDefault ? e.preventDefault() : e.defaultValue = false;
            }

            var point = e.touches ? e.touches[0] : e,
                deltaX = point.pageX - self.pointX,
                deltaY = point.pageY - self.pointY,
                timestamp = getTime(),
                newX, newY,
                absDistX, absDistY;

            self.pointX = point.pageX;
            self.pointY = point.pageY;

            self.distX += deltaX;
            self.distY += deltaY;
            absDistX = Math.abs(self.distX);
            absDistY = Math.abs(self.distY);

            // We need to move at least 10 pixels for the scrolling to initiate
            if (timestamp - self.endTime > 300 && absDistX < 10 && absDistY < 10) {
                return;
            }

            // If you are scrolling in one direction lock the other
            if (!self.directionLocked && !opt.freeScroll) {
                if (absDistX > absDistY + opt.directionLockThreshold) {
                    self.directionLocked = 'h'; // lock horizontally
                } else if (absDistY >= absDistX + opt.directionLockThreshold) {
                    self.directionLocked = 'v'; // lock vertically
                } else {
                    self.directionLocked = 'n'; // no lock
                }
            }

            if (self.directionLocked == 'h') {
                if (opt.eventPassthrough == 'vertical') {
                    e.preventDefault ? e.preventDefault() : e.defaultValue = false;
                } else if (opt.eventPassthrough == 'horizontal') {
                    self.initiated = false;
                    return;
                }

                deltaY = 0;
            } else if (self.directionLocked == 'v') {
                if (opt.eventPassthrough == 'horizontal') {
                    e.preventDefault ? e.preventDefault() : e.defaultValue = false;
                } else if (opt.eventPassthrough == 'vertical') {
                    self.initiated = false;
                    return;
                }

                deltaX = 0;
            }

            deltaX = self.hasHorizontalScroll ? deltaX : 0;
            deltaY = self.hasVerticalScroll ? deltaY : 0;

            newX = self.x + deltaX;
            newY = self.y + deltaY;

            // Slow down if outside of the boundaries
            if (newX > 0 || newX < self.maxScrollX) {
                newX =
                    opt.bounce ? self.x + deltaX / 3 : newX > 0 ? 0 : self.maxScrollX;
            }
            if (newY > 0 || newY < self.maxScrollY) {
                newY =
                    opt.bounce ? self.y + deltaY / 3 : newY > 0 ? 0 : self.maxScrollY;
            }

            self.directionX = deltaX > 0 ? -1 : deltaX < 0 ? 1 : 0;
            self.directionY = deltaY > 0 ? -1 : deltaY < 0 ? 1 : 0;

            if (!self.moved) {
                self.triggerHandler('smoothscrollstart', {
                    x: self.x,
                    y: self.y
                });
            }
            self.moved = true;
            self._translate(newX, newY);

            if (timestamp - self.startTime > 300) {
                self.startTime = timestamp;
                self.startX = self.x;
                self.startY = self.y;
            }
        },

        _end: function _end(e) {
            var self = this;

            if (!self.enabled || eventType[e.type] !== self.initiated) {
                return;
            }

            var $doc = $(document),
                opt = self.options,

                // point = e.changedTouches ? e.changedTouches[0] : e,
                momentumX, momentumY, duration = getTime() - self.startTime,
                newX = Math.round(self.x),
                newY = Math.round(self.y),

                // distanceX = Math.abs(newX - me.startX),
                // distanceY = Math.abs(newY - me.startY),
                time = 0,
                easing = '';

            $doc.off('.' + self.cid);

            self.isInTransition = 0;
            self.initiated = 0;
            self.endTime = getTime();

            // reset if we are outside of the boundaries
            if (self.resetPosition(self.options.bounceTime)) {
                return;
            }

            self.scrollTo(newX, newY); // ensures that the last position is rounded

            if (!self.moved) {
                return;
            }

            // start momentum animation if needed
            if (opt.momentum && duration < 300) {
                momentumX =
                    self.hasHorizontalScroll ?
                    momentum(self.x, self.startX, duration, self.maxScrollX,
                        opt.bounce ? self.wrapperWidth : 0, opt.deceleration) : {
                        destination: newX,
                        duration: 0
                    };
                momentumY = self.hasVerticalScroll ?
                    momentum(self.y, self.startY, duration, self.maxScrollY,
                        opt.bounce ? self.wrapperHeight : 0,
                        opt.deceleration) : {
                        destination: newY,
                        duration: 0
                    };
                newX = momentumX.destination;
                newY = momentumY.destination;
                time = Math.max(momentumX.duration, momentumY.duration);
                self.isInTransition = 1;
            }

            if (newX != self.x || newY != self.y) {
                // change easing function when scroller goes out of the boundaries
                if (newX > 0 || newX < self.maxScrollX || newY > 0 ||
                    newY < self.maxScrollY) {
                    easing = easingType.quadratic;
                }

                self.scrollTo(newX, newY, time, easing);
                return;
            }

            self.triggerHandler('smoothscrollend', {
                x: self.x,
                y: self.y,
                isStart: self.x === 0,
                isEnd: self.x === self.maxScrollX
            });
        },

        refresh: function refresh() {
            // var rf = this.$wrapper[0].offsetHeight;           // Force reflow
            var self = this;

            self.update();
            self.triggerHandler('smoothscrollrefresh', self);
        },

        update: function() {
            var self = this;
            var opt = self.options;

            self._calcScrollerWidth();

            self.wrapperWidth = opt.getWrapperWidth ? opt.getWrapperWidth.call(self) : self.$wrapper.innerWidth();
            self.wrapperHeight = opt.getWrapperHeight ? opt.getWrapperHeight.call(self) : self.$wrapper.innerHeight();

            var style = window.getComputedStyle ?
                getComputedStyle(self.$wrapper[0], null) :
                self.$wrapper[0].currentStyle;
            self.wrapperWidth -= ((parseInt(style.paddingLeft) || 0) +
                (parseInt(style.paddingRight) || 0));
            self.wrapperHeight -= ((parseInt(style.paddingTop) || 0) +
                (parseInt(style.paddingBottom) || 0));
            self.wrapperOffset = self.$wrapper.offset();

            self.scrollerWidth = opt.getScrollerWidth ? opt.getScrollerWidth.call(self) : self.$scroller.innerWidth();
            self.scrollerHeight = opt.getScrollerHeight ?
                opt.getScrollerHeight.call(self) :
                self.$scroller.innerHeight();

            self.maxScrollX = self.wrapperWidth - self.scrollerWidth;
            self.maxScrollY = self.wrapperHeight - self.scrollerHeight;

            self.hasHorizontalScroll = opt.scrollX && self.maxScrollX < 0;
            self.hasVerticalScroll = opt.scrollY && self.maxScrollY < 0;

            if (!self.hasHorizontalScroll) {
                self.maxScrollX = 0;
                self.scrollerWidth = self.wrapperWidth;
            }

            if (!self.hasVerticalScroll) {
                self.maxScrollY = 0;
                self.scrollerHeight = self.wrapperHeight;
            }

            self.endTime = 0;
            self.directionX = 0;
            self.directionY = 0;

            self.resetPosition();
            self._activateButtons();
            self.triggerHandler('smoothscrollupdate');
        },

        _transitionEnd: function _transitionEnd(e) {
            if (e.target != this.$scroller[0] || !this.isInTransition) {
                return;
            }

            this._transitionTime();
            if (!this.resetPosition(this.options.bounceTime)) {
                this.isInTransition = false;
                this.triggerHandler('smoothscrollend', {
                    x: this.x,
                    y: this.y,
                    isStart: this.x === 0,
                    isEnd: this.x === this.maxScrollX
                });
            }
        },

        getMaxScrollX: function getMaxScrollX() {
            return this.maxScrollX;
        },
        getMaxScrollY: function getMaxScrollY() {
            return this.maxScrollY;
        },
        destroy: function destroy() {
            var self = this;

            if (self.$prevButton) {
                self.$prevButton.off(self.eventNS);
            }
            if (self.$nextButton) {
                self.$nextButton.off(self.eventNS);
            }

            self.$el.removeClass('ui_smoothscroll_initialized');

            self._handle(self.$wrapper, 'mousemove', false);
            self._handle(self.$wrapper, 'touchmove', false);
            self._handle(self.$wrapper, 'mousedown', false);
            self._handle(self.$wrapper, 'touchstart', false);
            self._handle(self.$wrapper, 'focusin', false);
            self._handle(self.$wrapper, 'selectstart', false);
            self._handle(self.$wrapper, 'click', false);
            self._handle($doc, 'touchend', false);
            self._handle($doc, 'mouseup', false);
            self._handle($doc, 'mousecancel', false);
            self._handle($doc, 'tocuchcancel', false);
            self._handle(self.$scroller, 'transitionend', false);
            self._handle(self.$scroller, 'webkitTransitionEnd', false);
            self.winOff('resize');

            this.supr();
        }
    });

    return SmoothScroll;
});
/*!
 * @module vcui.ui.SpyScroll
 * @license MIT License
 * @description SpyScroll 컴포넌트
 * @copyright VinylC UID Group
 */
define('ui/spyScroll', ['jquery', 'vcui', 'ui/smoothScroll'], function($, core) {
    "use strict";

    /**
     * 스크롤 위치에 따라 fixed 처리
     * @class
     * @name vcui.ui.SpyScroll
     * @extends vcui.ui.View
     */
    var SpyScroll = core.ui('SpyScroll', {
        bindjQuery: 'spyScroll',
        defaults: {
            topOffset: 0, // top  offset
            disabledOn: false, //
            startPos: null, //
            enabledFixed: true,
            onToggleFixed: core.noop,
            smoothScroll: false,
            waitImages: '',
            watch: true,
            watchInterval: 6000
        },
        selectors: {
            links: 'a'
        },
        initialize: function(el, options) {
            var self = this;

            if (self.supr(el, options) === false) {
                return;
            }
            self.$fixedDOM = self.$el;
            self.fixedDOMStyle = self.$fixedDOM[0].style; // 리플로우 속도 개선을 위해
            self.enabledFixed = self.options.enabledFixed; // 171102 fixed 외부설정으로 변경
            self.$srOnly = $('<span class="sr_only">선택됨</span>');

            self.items = [];
            self.$links.each(function() {
                var href = $(this).attr('href');
                if (href.length > 1 && href.substr(0, 1) === '#') {
                    var $target = $(href);
                    if ($target.length) {
                        self.items.push({
                            $link: $(this),
                            $target: $target
                        });
                    }
                }
            });
            if (!self.options.disabledOn) {
                self.$links.parent().removeClass('on');
            }

            // self.$activeLink = self.$links.eq(0);

            if (self.options.smoothScroll) {
                self.$smoothScroll = self.$(self.options.smoothScroll).vcSmoothScroll();
            }
            self._calclinksPos();
            self._bindEvents();
        },

        /**
         * 이벤트 바인딩
         * @private
         */
        _bindEvents: function() {
            var self = this,
                scrollCallback,
                opt = self.options;

            // 리사이즈에 따라 재계산
            self.winOn('resizeend', function() {
                self._calclinksPos();
                self._toggleFixed(core.dom.getScrollTop(), true);
            });


            // 스크롤에 따라 재계산
            self.winOn('scroll', scrollCallback = function() {
                var top = core.dom.getScrollTop();
                self.scrollTop = top;

                self._toggleFixed(top);
                self._activeLink(top);
            });

            // 리사이즈에 따라 재계산
            self.winOn('breakpointchange', function() {
                self._toggleFixed(core.dom.getScrollTop(), true);
            });

            self.winOne('load', function() {
                scrollCallback();
            });


            // 링크클릭시
            self.$el.on('click', self.selectors.links, function(e) {
                var href = $(this).attr('href');
                var linkEl = this;

                if (href.substr(0, 1) !== '#') { // #이 없는 일반 링크이므로 무시
                    return;
                }

                e.preventDefault();

                // 클릭한 링크의 index 추출
                var index = core.array.indexOf(self.items, function(item) {
                    if (item.$link[0] === linkEl) {
                        return true;
                    }
                });

                if (index < 0) {
                    return;
                }

                self._calclinksPos();

                if (opt.autoScroll === false) {
                    return;
                }

                var newPos = self.items[index].start - self.totalOffset;

                // 해당 요소로 스크롤
                $('html, body').animate({
                    'scrollTop': newPos + 2
                }, 'fast', function() {
                    var $target = self.items[index].$target;
                    var evt = $.Event('spyscrollmoved');

                    self.trigger(evt, $(linkEl), $target);

                    if (evt.isDefaultPrevented()) {
                        return;
                    }

                    // 앵커를 클릭했을 때에 대한 처리를 외부에서 했을 경우(false가 반환되면 아래에 있는 기본 처리 무효화)
                    if (opt.onSelect && opt.onSelect.call(self, $target, index) === false) {
                        return;
                    }

                    if (opt.targetFocus !== false) {
                        $target.attr('tabindex', -1).focus();
                        setTimeout(function() {
                            $target.removeAttr('tabindex');
                        });
                    }
                });
            });

            if (opt.waitImages) {
                // 본문에 있는 이미지들이 다 로딩되면 업데이트
                core.util.waitImageLoad($(opt.waitImages))
                    .done(function() {
                        self._calclinksPos();
                        self._activeLink(core.dom.getScrollTop());
                        self._watchStart();
                    });
            }
        },

        /**
         * 페이지의 레이아웃이 반응형이기에 언제 어떻게 바귈지 모르므로
         * 주기적으로 사이즈를 감시해서 업데이트 해준다
         * @private
         */
        _watchStart: function() {
            var self = this;

            if (self._isWatchStart) {
                return;
            }
            self._isWatchStart = true;

            var fn;
            setTimeout(fn = function() {
                self._calclinksPos();
                if (self.changedMeasure) {
                    self.update();
                }
                setTimeout(fn, self.options.watchInterval);
            }, 1000);
        },

        /**
         * 스크롤 위치에 따라 fixed 토글
         * @param {string} top 스크롤값
         * @param {boolean} isForce
         * @private
         */
        _toggleFixed: function(top, isForce) {
            var self = this;

            if (top >= self.navTop - self.topOffset) {
                if (!self.isFixed ||
                    isForce) { // fixed 가 안돼있을 때만 fixed 설정(리플로우 최소화).
                    self._calclinksPos();
                    self.isFixed = true;

                    if (self.enabledFixed) {
                        self.$fixedDOM.addClass('fixed');
                        self._calclinksPos();
                    }

                    self.options.onToggleFixed.call(self, true);
                }
            } else {
                if (self.isFixed ||
                    isForce) { // fixed 가 돼있을 때만 fixed 해제(리플로우 최소화)
                    self.isFixed = false;

                    if (self.enabledFixed) {
                        self.$fixedDOM.removeClass('fixed');
                    }
                    self.options.onToggleFixed.call(self, false);
                }
            }
        },

        /**
         * 현재 스크롤위치에 해당하는 링크를 활성화
         * @param {number} top 스크롤값
         * @private
         */
        _activeLink: function(top) {
            var self = this;

            if (self.options.disabledOn) return;

            var $link;
            var startPos = self.options.startPos;
            var sy;

            if (!self.items.length) {
                return;
            }

            top = top + self.totalOffset;

            for (var i = 0; i < self.items.length; i++) {
                sy = (startPos != undefined && i === 0) ? startPos : self.items[i].start;
                if (sy <= top && top < self.items[i].end) {
                    $link = self.items[i].$link;

                    if ($link[0] !== self.activeLink) {
                        self.$links.parent().removeClass('on');
                        self._scrollTo($link.append(self.$srOnly).parent().addClass('on').get(0));
                        self.activeLink = $link[0];
                        self.triggerHandler('spyscrollactive', [$link]);
                    }
                    return;
                }
            }

            self.activeLink = null;
            self.$links.parent().removeClass('on');
        },

        /**
         * el의 우치로 스크롤롤
         * @param el
         * @private
         */
        _scrollTo: function(el) {
            var self = this;

            if (self.$smoothScroll) {
                self.$smoothScroll.vcSmoothScroll('scrollToElement', el);
            } else {
                // native scroll
            }
        },

        /**
         * 리사이징 될 때 top값들을 재계산
         * @private
         */
        _calclinksPos: function() {
            var self = this;

            self.navTop = self.$el.offset().top; // nav top 값
            self.topOffset = core.isFunction(self.options.topOffset) ?
                self.options.topOffset() :
                self.options.topOffset;
            self.totalOffset =
                self.topOffset + self.$el.outerHeight(); // 헤더랑 nav 두께 총합*/

            if (!self.items.length) {
                return;
            }

            self.changedMeasure = false;
            core.each(self.items, function(item) {
                var $target, start, end, offset;

                $target = item.$target;
                offset = $target.offset();
                if (!offset) {
                    return;
                }

                start = offset.top;
                end = start + $target.outerHeight();

                if (item.start !== start || item.end !== end) {
                    // 변경이 생겼을 때 watch함수에서 update하도록 플래그를 true로 설전
                    self.changedMeasure = true;
                }

                item.start = start;
                item.end = end;
            });
        },
        /**
         * 현재 스크롤, 위치에 따라 활성화 처리
         */
        update: function() {
            var self = this;

            self._calclinksPos();
            self._activeLink(core.dom.getScrollTop());
        }
    });

    return SpyScroll;
});
/*!
 * @module vcui.ui.TabCtrl
 * @license MIT License
 * @description 탭 컴포넌트
 * @copyright VinylC UID Group
 */
define('ui/tabCtrl', ['jquery', 'vcui', 'ui/smoothScroll'], function($, core) {
    "use strict";

    var name = 'tab',
        eventBeforeChange = name + 'beforechange',
        eventChanged = name + 'change',
        selectedClass = 'on';

    var prefixClass = '.ui_tab_';
    /**
     * @class
     * @name vcui.ui.Tab
     * @description 페이징모듈
     * @extends vcui.ui.View
     */
    var Tab = core.ui('TabCtrl', /** @lends vcui.ui.TabCtrl# */ {
        bindjQuery: 'tabCtrl',
        $statics: /** @lends vcui.ui.TabCtrl */ {
            ON_CHANGE: eventBeforeChange,
            ON_CHANGED: eventChanged
        },
        defaults: {
            selectedIndex: 0,
            selectedClass: selectedClass,
            allowHScroll: false,
            selectedText: '선택됨',
            tabsSelector: '>ul>li'
        },

        selectors: {},
        /**
         * 생성자
         * @param {string|Element|jQuery} el 해당 엘리먼트(노드, id, jQuery 어떤
         * 형식이든 상관없다)
         * @param {object} [options] 옵션값
         * @param {number} [options.selectedIndex = 0]  초기선택값
         * @param {string} [options.selectedClass = 'on'] 활성 css클래스명
         * @param {string} [options.tabType = 'inner'] 탭형식(inner | outer)
         */
        initialize: function initialize(el, options) {
            var self = this;
            if (self.supr(el, options) === false) {
                return;
            }

            self.$srOnly = $('<em class="sr_only">' + self.options.selectedText + '</em>');

            if (self.options.allowHScroll) {
                var $child = self.$el.children().first();
                self.options.tabsSelector =
                    '>' + $child[0].tagName.toLowerCase() + self.options.tabsSelector;
                if ($child.css('overflow') === 'hidden') {
                    $child.vcSmoothScroll();
                }
            }

            self.update();
            self._bindEvents();

            var index = self.$tabs.filter('.' + selectedClass).index();
            if (index >= 0) {
                self.options.selectedIndex = index;
            }
            self.select(self.options.selectedIndex);
        },

        update: function update() {
            var self = this;

            self._findControls();
            self._buildARIA();
        },

        _findControls: function _findControls() {
            var self = this;

            self.$tabs = self.$(self.options.tabsSelector);
            self.$contents = $();

            // 탭버튼의 href에 있는 #아이디 를 가져와서 컨텐츠를 조회
            self.$tabs.each(function() {
                var $tab = $(this),
                    $panel, href = $tab.find('a').attr('href');

                if (href && /^(#|\.)\w+/.test(href)) {
                    if (($panel = $tab.find('>div, >.ui_tab_panel')).length) {
                        self.$contents = self.$contents.add($panel);
                    } else {
                        self.$contents = self.$contents.add($(href));
                    }
                }
            });

            if (!self.$contents.length) {
                self.$contents = self.$('>' + prefixClass + 'panel');
            }
        },

        /**
         * @private
         */
        _bindEvents: function _bindEvents() {
            var self = this;

            self.on(
                'click keydown', self.options.tabsSelector + '>a, ' +
                self.options.tabsSelector + '>button',
                function(e) {

                    switch (e.type) {
                        case 'click':
                            e.preventDefault();

                            self.select($(e.currentTarget).parent().index());
                            break;
                        case 'keydown':
                            var index = $(e.currentTarget).parent().index(),
                                newIndex;

                            switch (e.which) {
                                case core.keyCode.RIGHT:
                                    e.preventDefault();
                                    newIndex = Math.min(self.$tabs.length - 1, index + 1);
                                    break;
                                case core.keyCode.LEFT:
                                    e.preventDefault();
                                    newIndex = Math.max(0, index - 1);
                                    break;
                                default:
                                    return;
                            }
                            self.select(newIndex);
                            self.$tabs.eq(self.selectedIndex).find('>a, >button').focus();
                            break;
                    }
                });
        },

        /**
         * aria 속성 빌드
         * @private
         */
        _buildARIA: function _buildARIA() {
            var self = this,
                tablistid = self.cid;

            self.$tabs.children().each(function(i) {
                var $panel = self.$contents.eq(i);

                if (!$panel.attr('id')) {
                    $panel.attr('id', tablistid + '_panel_' + i);
                }

                $(this)
                    .attr({
                        'id': tablistid + '_' + i,
                        'aria-controls': $panel.attr('id')
                    });


                $panel.attr({
                    'aria-labelledby': tablistid + '_' + i,
                    'aria-hidden': 'true'
                });
            });
        },

        /**
         * index에 해당하는 탭을 활성화
         * @param {number} index 탭버튼 인덱스
         * @fires vcui.ui.Tab#tabbeforechange
         * @fires vcui.ui.Tab#tabchange
         * @example
         * $('#tab').tab('select', 1);
         * // or
         * $('#tab').tab('instance').select(1);
         */
        select: function select(index) {
            var self = this,
                e;
            if (index < 0 || self.$tabs.length && index >= self.$tabs.length) {
                throw new Error('index 가 범위를 벗어났습니다.');
            }

            if (arguments.length === 0) {
                return self.selectedIndex;
            }

            /**
             * 탭이 바뀌기 직전에 발생. e.preventDefault()를 호출함으로써 탭변환을
             * 취소할 수 있다.
             * @event vcui.ui.Tab#tabbeforechange
             * @type {object}
             * @property {number} selectedIndex 선택된 탭버튼의 인덱스
             */
            self.triggerHandler(e = $.Event(eventBeforeChange), {
                selectedIndex: index,
                relatedTarget: self.$tabs.get(index),
                button: self.$tabs.eq(self.selectedIndex).find('>a'),
                content: self.$contents.eq(self.selectedIndex)

            });
            if (e.isDefaultPrevented()) {
                return;
            }

            self.selectedIndex = index;

            var $a, $hide;
            $a = self.$tabs.removeClass(selectedClass)
                .eq(index)
                .addClass(selectedClass);

            if (($hide = $a.find('.sr_only')).length) {
                self.$tabs.not(self.$tabs.eq(index)).find('>a .sr_only').text("");
                $hide.text(self.options.selectedText);
            } else {
                $a.children().append(self.$srOnly);
            }

            // 컨텐츠가 li바깥에 위치한 탭인 경우
            self.$contents.hide().attr('aria-hidden', true)
                .eq(index).attr('aria-hidden', false).show();

            /**
             * 탭이 바뀌기 직전에 발생. e.preventDefault()를 호출함으로써 탭변환을
             * 취소할 수 있다.
             * @event vcui.ui.Tab#tabchange
             * @type {object}
             * @property {number} selectedIndex 선택된 탭버튼의 인덱스
             */
            self.triggerHandler(eventChanged, {
                selectedIndex: index,
                button: self.$tabs.eq(index).find('>a'),
                content: self.$contents.eq(index)
            });
        }
    });
    ///////////////////////////////////////////////////////////////////////////////////////

    return Tab;
});

/*!
 * @module vcui.ui.Tab
 * @license MIT License
 * @description Tab 컴포넌트
 * @copyright VinylC UID Group
 */
define('ui/tab', ['jquery', 'vcui', 'ui/tabCtrl'], function($, core) {
    "use strict";

    function isLink(href) {
        return !href || !/^#.+/.test(href);
    }

    /**
     * 해상도에 따라 탭, 드롭다운 모양으로 변환되는 컴포넌트
     *
     * 각 항목의 태그에 data-value="" data-text="" 속성이 있어야 한다.
     * ex) <li data-value="0" data-text="첫번째"><a...>...</a></li>
     */
    return core.ui('Tab', {
        bindjQuery: true,
        defaults: {
            type: 'tab' // tab: 일반탭, moveAnchor: 페이지내 앵커 이동, movePage: 페이지 이동
        },
        selectors: {
            selectButton: '>.btn_open button',
            tabList: '>.tab'
        },
        initialize: function(el, options) {
            var self = this;

            if (self.supr(el, options) === false) {
                return;
            }

            self._bindEvents();
            if (self.options.type === 'tab') { // 페이지 이동형이 아니면 탭을 빌드함
                self._buildTabCtrl();
            }
            self.updateLabel();
            self._buildARIA();
        },

        _buildARIA: function() {
            var self = this;

            if (!self.$tabList.attr('id')) {
                self.$tabList.attr('id', self.cid + '_popup');
            }

            if (window.breakpoint.isMobile) {
                self.$tabList.attr('aria-hidden', true);
            }

            self.$selectButton.attr({
                'aria-expanded': false,
                'aria-haspopup': true,
                'aria-controls': self.$tabList.attr('id')
            });
        },
        _bindEvents: function() {
            var self = this;

            self
                .on('click', '>.btn_open>button', function(e) {
                    // 열기, 닫기 버튼
                    self.toggle(!self.$el.hasClass('tab_open'));
                })
                .on('click', '>.tab>li>a', function(e) {
                    // 드롭다운 모드일 때 드롭다운 리스트에 있는 항목을 클릭했을 때
                    if (self.options.type !== 'tab') {
                        var $a = $(this),
                            $tab = $(this).parent(),
                            index = $tab.index();

                        // 이벤트를 발생시켜서 외부에서 탭이 클릭됐을 때 컨트롤할 수
                        // 있도록 해준다.
                        self.triggerHandler('tabchange', {
                            anchorEvent: e,
                            selectedIndex: index,
                            button: $a,
                            value: $a.data('value')
                        });
                    }

                    self.close();
                });

            self.winOn('breakpointchange', function(data) {
                if (data.isMobile) {
                    self.$tabList.attr('aria-hidden', false);
                } else {
                    self.$tabList.removeAttr('aria-hidden');
                }
            });
        },
        /**
         * 기본 탭컴포넌트 빌드
         * @private
         */
        _buildTabCtrl: function() {
            var self = this;

            self.$el.vcTabCtrl();
            self.on('tabchange', function(e, data) {
                if (self.el !== this) {
                    return;
                }

                self.updateLabel();
            });
        },
        /**
         * 드롭다운 모드일 땐 선택된 항목의 텍스트를 레이블에 표시한다,
         */
        updateLabel: function() {
            var self = this;
            self.$selectButton.find('span').text(self._getTabLabel());
        },
        /**
         * 선택한 항목의 텍스트를 추출
         * @returns {Promise<string> | * | USVString}
         * @private
         */
        _getTabLabel: function() {
            var self = this;

            return self.$tabList.find('>li.on>a>span').text();
        },
        /**
         * 드롭다운 모드일 때 리스트를 표시
         */
        open: function() {
            var self = this;

            self.$el.addClass('tab_open');
            setTimeout(function() {
                self.docOn('click', function(e) {
                    if (!core.dom.contains(self.$el[0], e.target)) {
                        self.close();
                    }
                });
            });
            self.triggerHandler('tabopen');
        },
        /**
         * 드롭다운 리스트 닫기
         */
        close: function() {
            var self = this;
            self.$el.removeClass('tab_open');
            self.docOff('click');
            self.triggerHandler('tabclose');
        },
        toggle: function(flag) {
            var self = this;

            self.$selectButton.attr('aria-expanded', flag);
            self.$tabList.attr('aria-hidden', !flag);
            self[flag ? 'open' : 'close']();
        },
        select: function(index) {
            if (arguments.length) {
                return this.$el.vcTabCtrl('select', index);
            } else {
                return this.$el.vcTabCtrl('select');
            }
        },
        /**
         * 선택된 값 반환
         * @returns {string}
         */
        getSelectedValue: function() {
            return this.$tabList.find('>li.on a').data('value') || '';
        }
    });

});
/*!
 * @module vcui.ui.TextAnimate
 * @license MIT License
 * @description 아코디온 컴포넌트
 * @copyright VinylC UID Group
 */
define('ui/textAnimate', ['jquery', 'vcui'], function($, core) {
    "use strict";

    $.extend($.easing, {
        easeNone: function(k) {
            return k;
        },
        easeInQuad: function(k) {
            return k * k;
        },
        easeOutQuad: function(k) {
            return k * (2 - k);
        },
        easeInOutQuad: function(k) {
            if ((k *= 2) < 1) return 0.5 * k * k;
            return -0.5 * (--k * (k - 2) - 1);
        },
        easeInQuart: function(k) {
            return k * k * k * k;
        },
        easeOutQuart: function(k) {
            return 1 - (--k * k * k * k);
        },
        easeInOutQuart: function(k) {
            if ((k *= 2) < 1) return 0.5 * k * k * k * k;
            return -0.5 * ((k -= 2) * k * k * k - 2);
        },
        easeInQuint: function(k) {
            return k * k * k * k * k;
        },
        easeOutQuint: function(k) {
            return --k * k * k * k * k + 1;
        },
        easeInOutQuint: function(k) {
            if ((k *= 2) < 1) return 0.5 * k * k * k * k * k;
            return 0.5 * ((k -= 2) * k * k * k * k + 2);
        }
    });

    //<span class="ui_txt_ani" data-value="110" data-zero="0" data-decimals="-1"
    //data-unit="원"  data-comma="false" data-duration="1000">10</span>

    /**
     * @class
     * @description 텍스트 애니메이션 컴포넌트
     * @name vcui.ui.TextAnimate
     * @extends vcui.ui.View
     */
    var TextAnimate = core.ui('TextAnimate', /**@lends vcui.ui.TextAnimate# */ {
        bindjQuery: true,
        defaults: {
            type: 'number', // number, string
            duration: 2000, // 애니메이션 시간
            unit: null, // 표시할 단위
            decimals: -1, // 표시할 소수점
            zero: 0, // 숫자 앞 0표시 갯수
            comma: false,
            autoplay: false, //빌드할 때 바로 실행시킬것인가
            ease: 'easeInOutQuart' // easeInQuad, easeOutQuad, easeInOutQuad
        },

        /**
         * 생성자
         * @param el 모듈 요소
         * @param {object} [options] 옵션(기본값: defaults 속성 참조)
         * @param {number} [options.duration = 200] 애니메이션 속도
         */
        initialize: function initialize(el, options) {
            var self = this;

            if (self.supr(el, options) === false) {
                return;
            }

            if (self.options.autoplay) {
                self.play();
            }
        },

        _build: function _build() {
            var self = this;

            self.endTxt = self.$el.attr('data-value'); // 마지막값
            self.startTxt = self.$el.text().toString(); // 시작값
            self.decimals = self.options.decimals; // 소수점 갯수
            self.zero = self.options.zero; // 숫자앞 0의 갯수
            var endTxt = self.endTxt.replace(/\d/g, ''); // 단위 추출
            self.endNum = self.endTxt.replace(/\D/g, ''); // 마지막 숫자 추출
            self.startNum = self.startTxt.replace(/\D/g, ''); // 시작 숫자 추출
            self.unit = self.options.unit || endTxt.replace('.', '').replace(',', ''); // 단위

            if (!hcgCommon.useEffect) { // 애니메이션 사용여부
                self.$el.text(self.endTxt);
            }
        },

        play: function play() {
            var self = this;
            var $inview;

            self._build();

            if (!hcgCommon.useEffect) {
                return;
            }

            if (!self.$el.is(':visible')) {
                return;
            }

            $inview = self.$el.closest('.ui_inview');
            if ($inview.length) {
                if ($inview.attr('data-inview-state') !== 'in') {
                    return;
                }
            }

            self.numObj = {
                current: self.startNum // 시작값
            };

            $(self.numObj)
                .clearQueue() // 이전 큐 제거
                .stop()
                .animate({
                    current: self.endNum // 마지막 값
                }, {
                    duration: self.options.duration,
                    easing: 'easeOutQuad',
                    step: function(now, fx) {

                        var val = "" + parseInt(now);

                        if (self.zero > 0) {
                            val = core.number.zeroPad(val, val.length > self.zero ? val.length : self.zero);
                        }

                        if (self.decimals > -1 && val.length > self.decimals) {
                            val = val.slice(0, val.length - self.decimals) + "." +
                                val.slice(val.length - self.decimals);
                        }

                        if (self.options.comma) {
                            val = core.number.addComma(val);
                        }

                        self.$el.text(val + self.unit);

                    }
                });
        }

    });

    return TextAnimate;
});
define('ui/thumbSwitcher', ['jquery', 'vcui'], function($, core) {
    /**
     * Thumb스위처
     */
    return core.ui('ThumbSwitcher', {
        bindjQuery: true,
        selectors: {
            imgWrap: '.img_wrap', // 이미지 영역
            target: '.ui_thumbswitcher_target', // 이미지표시 영역
            list: '.ui_thumbswitcher_list' // 썸네일 위치
        },
        initialize: function(el, options) {
            var self = this;

            if (self.supr(el, options) === false) {
                return;
            }


            self._buildARIA();
            self._bindEvents();
        },

        _buildARIA: function _buildARIA() {
            var self = this;
            var $btns = self.$list.find('a').attr('role', 'button');

            self.$srOnly = $('<span class="sr_only">선택됨</span>'); // 히든텍스트

            // 원래 마크업에서 title을 넣어줘야 되는데, 일정 사정상 스크립트에서 차리해버림
            if (!$btns.first().attr('title')) {
                var title = self.$el.find('.h4_tit').text();
                $btns.each(function(i) {
                    i = i + 1;
                    var $a = $(this);

                    $a.attr('title', title + '의 ' + i + '번째 ' + ($a.attr('data-youtube') ? '동영상' : '이미지'));
                });
            }

            // 현재 활성화된 버튼의 타이틀을 가져와서 히든텍스트에 설정
            self.$el.find('.movie_cont .sr_only').text($btns.first().attr('title') + ' 보기');
            // 이미지 영역에 포커스가 가도록 tabindex 설정
            self.$imgWrap.attr('tabindex', -1).attr('title', $btns.first().attr('title'));
        },

        _bindEvents: function _bindEvents() {
            var self = this;

            // 첫번째 버튼에 선택됨 히든텍스트 삽입
            self.$('.ui_thumbswitcher_list a:first').append(self.$srOnly);

            // 썸네일 버튼 클릭시
            self.on('click', '.ui_thumbswitcher_list a', function(e) {
                e.preventDefault();

                var $btn = $(this);
                var src = $btn.data('src'); // data-src에서 이미지 경로 추출
                var youtube = $btn.data('youtube'); // 동영상인 경우 data-youtube에서 유튜브 주소 추출
                var $wrap = self.$target.parent();

                $wrap.find('iframe').remove(); // 기존 유튜브 프레임 제거
                self.$target.show();
                $btn.parent().addClass('on').siblings().removeClass('on'); // 현재 버튼 활성화
                $btn.append(self.$srOnly); // 현재 버튼으로 선택됨 히든텍스트를 옮김

                if (youtube) { // 동영상 썸네일 클릭시
                    // 썸네일 클릭시 유투브 동영상 모달이 안뜨도록 버블링 무효화
                    e.stopPropagation();

                    // 유투브 모듈이 동작하도록 data-youtube 속성 설정
                    $wrap.attr('data-youtube', youtube).siblings().show();
                    // 히든텍스트 설정
                    self.$el.find('.movie_cont .sr_only').text($btn.attr('title') + ' 보기');
                    // 포커싱
                    setTimeout(function() {
                        self.$imgWrap.find('.ui_youtube_button').focus();
                    });
                } else { // 이미지 썸네일 클릭시

                    $wrap.removeAttr('data-youtube').siblings().hide();
                    // 포커싱
                    setTimeout(function() {
                        self.$imgWrap.attr('title', $btn.attr('title')).focus();
                    });
                }

                self.$target.attr('src', src);

                self.uiTriggerHandler('change', { // fire thumbswitcherchange event
                    src: src
                });
            });
        }
    })
});
define('ui/topBanner', ['jquery', 'vcui'], function($, core) {

    /**
     * 탑배너 담당 컴포넌트(쿠키설정)
     * @type {void | *}
     */
    return core.ui.View.extend({
        $statics: {
            // static함수: top배너를 열어야 되는지 쿠키를 체크하여 반환
            checkOpen: function($topBanner) {
                if (!$topBanner.length) {
                    return false;
                }
                if ($topBanner.attr('data-page') === 'main' && !$('.main_wrap').length) {
                    return false;
                }

                var key = core.Cookie.get('hiddenTopBanners') || '';
                var keys = key.split(','); // top 배너는 여러개가 있을 수 있으므로 ,를 구분자로 하여 조회
                var curKey = $topBanner.attr('data-key');

                for (var i = 0; i < keys.length; i++) {
                    if (keys[i] && keys[i] === curKey) {
                        return false;
                    }
                }
                return true;
            }
        },
        defaults: {
            onClose: core.noop,
            autoOpen: true
        },
        initialize: function(el, options) {
            var self = this;

            if (self.supr(el, options) === false) {
                return;
            }

            self.$win = $(window);
            self.$header = $('#header');
            self.$depth2Wrap = $('.depth2_wrap', self.$header); // top배너가 닫힐 때 gnb가 재계산하도록 하기 위함
            self.$scrollWrap = $('.depth2_wrap > .scroll_wrap', self.$header); // top배너가 닫힐 때 gnb가 재계산하도록 하기 위함

            if (self.options.autoOpen) {
                self.open();
            }
            self._bindEvents();
        },

        _bindEvents: function() {
            var self = this;

            self.winOn('resize', function() {
                self.updateSize();
            });

            // 닫기 버튼
            self.$el.on('click', '.ui_banner_close', function(e) {
                // self.$el.removeClass('open');
                /*self.$el.slideUp({
                    duration:'fast',
                    step: function () {
                        self.updateSize();
                        self.options.onClose();
                    }
                });*/
                self.close();
                self.updateSize();
                self.options.onClose();

                var cookie = $(this).data('cookie'),
                    $cookie;

                if (cookie) {
                    $cookie = $(cookie);
                    if ($cookie[0].checked) {
                        var curKey = self.$el.attr('data-key');
                        var keys = (core.Cookie.get('hiddenTopBanners') || '').split(',');

                        if (keys[0] === '') {
                            keys.shift();
                        }
                        keys.push(curKey);
                        // top 배너는 여러개가 있을 수 있으므로 ,를 구분자로 하여 쿠키에 저장
                        vcui.Cookie.set('hiddenTopBanners', keys.join(','), {
                            path: '/',
                            expires: (function() {
                                var d = new Date();
                                d.setHours(23, 59, 59); // 오늘 밤 23:59.59까지 표시 안함
                                return d;
                            })()
                        });
                    }
                }
            });
        },

        updateSize: function() {
            var self = this;

            // 해상도에 따라 top 위치 재계산
            if (window.breakpoint.isMobile) {
                var headerTop = self.$header.offset().top;
                self.$depth2Wrap.css({
                    top: headerTop + 119
                });

                self.prevMode = 'mobile';
            } else {
                if (self.prevMode !== 'pc') {
                    self.$depth2Wrap.css('top', '');
                }
                self.prevMode = 'pc';
            }
        },

        open: function() {
            this.$el.addClass('open');
        },

        close: function() {
            this.$el.removeClass('open');
        }
    });

});
/*!
 * @module vcui.ui.YoutubePlayer
 * @license MIT License
 * @description YoutubePlayer 컴포넌트
 * @copyright VinylC UID Group
 */
define('ui/youtubePlayer', ['jquery', 'vcui'], function($, core) {
    "use strict";
    var loadStatus = '';
    var YoutubePlayer = core.ui('YoutubePlayer', {
        bindjQuery: 'YoutubePlayer',
        $statics: {
            callbacks: $.Callbacks()
        },
        defaults: {
            url: '',
            cover: '',
            playerVars: {
                autoplay: 1,
                controls: 1,
                modestbranding: 1,
                rel: 0,
                showinfo: 0
            },
            onReady: core.noop
        },
        selectors: {
            play: '.ui_youtube_play',
            placeholder: ''
        },
        initialize: function initialize(el, options) {
            var self = this;
            if (self.supr(el, options) === false) {
                return;
            }
            if (!self.$el.attr('id')) {
                self.$el.attr('id', self.cid);
            }
            self.videoId = self.options.videoId || self.getId(self.options.url);
            self.currentTime = 0;
            self._loadApi();
        },
        _bindEvents: function _bindEvents() {
            var self = this;
            self.on('click', '.ui_youtube_play', function(e) {
                e.preventDefault();
                self.play();
            });
        },
        _loadApi: function _loadApi() {
            var self = this;
            var _fn = void 0;
            YoutubePlayer.callbacks.add(_fn = function fn() {
                self.build(self.options.onReady);
                self._bindEvents();
                this.remove(_fn);
            });
            if (loadStatus !== 'complete') {
                if (loadStatus === 'waiting') {
                    return;
                }
                loadStatus = 'waiting';
                core.loadJs('//www.youtube.com/iframe_api');
                window.onYouTubeIframeAPIReady = function() {
                    loadStatus = 'complete';
                    YoutubePlayer.callbacks.fire();
                };
            } else if (loadStatus === 'complete') {
                YoutubePlayer.callbacks.fire();
            }
        },
        build: function build(callback) {
            var self = this;
            var opt = self.options;
            var autoplay = 0; // core.detect.isMobile ? 0 : self.options.autoplay *
            // 1;
            /*let embedUrl =
            `//www.youtube.com/embed/${self.videoId}?autoplay=${autoplay}&rel=0&showinfo=0
            &enablejsapi=1&wmode=opaque&iv_load_policy=3&color=white&probably_logged_in=0`;
              if (core.detect.isGecko) {
                embedUrl += '&html5=1';
            }*/
            // self.$placeholder.append('<div id="' + self.cid + '">');
            // self.$iframe = $(`<iframe id="youtubePlayer${self.cid}"
            // type="text/html" width="100%" height="100%" src="${embedUrl}"
            // frameborder="0" webkitAllowFullScreen mozallowfullscreen
            // allowFullScreen></iframe>`);
            // self.$placeholder.append(self.$iframe);
            self.player = new YT.Player(self.cid, {
                width: '100%', // opt.width || self.$el.width(),
                height: '100%', // opt.height || self.$el.height(),
                videoId: self.videoId,
                playerVars: opt.playerVars,
                /*
                                                   {
                                                   autoplay: 1,
                                                   controls: 0,
                                                   modestbranding: 1,
                                                   rel: 0,
                                                   showinfo: 0
                                                   }
                                                   */
                events: {
                    onStateChange: function onStateChange(event) {
                        var player = event.target;
                        switch (event.data) {
                            case 0:
                                self._trigger('ended');
                                break;
                            case 2:
                                if (player.getCurrentTime() !== player.getDuration()) {
                                    // tracking pause
                                }
                                break;
                            case YT.PlayerState.PLAYING:
                                // self._trigger('pause', {videoId: self.videoId});
                                self._trigger('play', {
                                    videoId: self.videoId
                                });
                                setTimeout(self._onPlayerPercent.bind(self), 1000);
                        }
                    },
                    onReady: function onReady() {
                        callback && callback(self.player);
                        self.ready();
                    }
                }
            });
        },
        changeMode: function changeMode(mode) {
            var self = this;
            self.$play.toggle(mode !== 'player');
            self.$placeholder.toggle(mode === 'player');
        },
        ready: function ready() {
            var self = this;
            self.changeMode('player');
            self._trigger('ready');
            self.winOn('resize', self.onResize.bind(self));
        },
        play: function play() {
            var self = this;
            var player = self.player;
            if (player) {
                player.playVideo();
            } else {
                self.build(function(player) {
                    self.changeMode('player');
                    player.playVideo();
                }); // autoplay video
            }
        },
        pause: function pause() {
            var self = this;
            var player = self.player;
            if (player && player.pauseVideo) {
                var currentState = player.getPlayerState();
                if (currentState !== YT.PlayerState.PLAYING && currentState !== YT.PlayerState.BUFFERING) {
                    return;
                }
                player.pauseVideo();
            }
        },
        getVolume: function getVolume() {
            var self = this;
            var player = self.player;
            if (player && player.getVolume) {
                return player.getVolume();
            }
        },
        setVolume: function setVolume(vol) {
            if (!this.player) {
                return;
            }
            var self = this;
            var player = self.player;
            if (player && player.setVolume) {
                player.setVolume(vol);
            }
        },
        setCurrentTime: function setCurrentTime(t) {
            if (!this.player) {
                return;
            }
            this.player.seekTo(t);
        },
        setMute: function setMute(flag) {
            if (!this.player) {
                return;
            }
            if (typeof flag === 'undefined') {
                flag = !this.player.isMuted();
            }
            this.player[flag ? 'mute' : 'unMute']();
        },
        _onPlayerPercent: function _onPlayerPercent() {
            if (!this.player) {
                return;
            }
            var self = this;
            var player = self.player;
            if (player.getPlayerState() === YT.PlayerState.PLAYING) {
                var currentTime = player.getCurrentTime();
                var duration = player.getDuration();
                var t = duration - currentTime <= 1.5 ? 1 : (Math.floor(currentTime / duration * 4) / 4)
                    .toFixed(2);
                if (!player.lastP || t > player.lastP) {
                    player.lastP = t;
                    if (t > 0) {
                        if (t * 100 === 100) {
                            // at the end of the video, reset the lastP var
                            delete player.lastP;
                        }
                    }
                }
                if (player.lastP !== 1) {
                    setTimeout(self._onPlayerPercent.bind(self), 1000);
                }
            }
        },
        onResize: function onResize(force) {
            var self = this;
            /*$('.playerWrapper', this.$element).css({'height': 'auto', 'width':
            'auto'});
              var outerWidth = this.$element.width();
            var outerHeight = this.$element.height();
            var playerHeight = Math.ceil(outerWidth / this._aspectRatio);
            var playerWidth = 'auto';
              //if the height is allowed to be completely dynamic (player will expand
            to max possible width), then skip the following
            //if player should fit within max possible width and height
            if(this.options.expandToWidthOnly===false) {
                //if the player height is too tall for the available area, calculate
            the width based on the height (as an aspect ratio)
                if(playerHeight > outerHeight) {
                    playerHeight = outerHeight;
                    playerWidth = Math.ceil(outerHeight * this._aspectRatio);
                }
            }
              $('.playerWrapper', this.$element).css({'height': playerHeight, 'width':
            playerWidth});*/
        },
        _trigger: function _trigger(event, data) {
            this.triggerHandler('youtubeplayer' + event, data);
        },
        getId: function getId(url) {
            var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#&?]*).*/;
            var match = url.match(regExp);
            if (match && match[2].length === 11) {
                return match[2];
            }
        }
    });
    return YoutubePlayer;
});
$.fn.buildCommonUI = function() {
    // $('body').buildCommonUI()로 호출하면 해당요소 안에 있는
    // 아래에 기술된 모듈들이 한번에 빌드된다.(자주 쓰이는 UI모듈은 이렇게 하는게 효율적이다)
    vcui.require(['ui/accordion', 'ui/tab', 'ui/dropmenu', 'ui/dropdown'], function() {
        // dropdown은 호출안해도 됨

        this.find('.ui_accordion').vcAccordion();
        this.find('.ui_tab').vcTab();
        this.find('.ui_dropmenu').vcDropmenu();
        this.find('.ui_dropdown').vcDropdown();
    }.bind(this));
    return this;
};
