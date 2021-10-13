vcui.require.config({
  paths: {
      // jquery, vcui는 vcui.js에서 정의돼 있습니다
  },
  waitSeconds: 0
});

window.vcuiConfigs = $.extend({
//    mapKey: 'gdcOfDkv34yyUByaPvKC',
  mapKey: 'bb75ztx13y',
  useEffect: true
}, window.vcuiConfigs);

$.holdReady(true); // $.ready실행을 잠시 중지
var hcgCommon = {
  // 설정 변수: to.개발팀: 여기에 실제 값으로 넣어주세요.
  title: 'HyundarCar Korea',
  isDev: window.location.hostname.indexOf('jsdebug=true') > -1,
  naverMapApiKey: window.vcuiConfigs.mapKey,
  // 반응형 breakpoints
  breakpoints: {
      mobile: 768,
      pc: 10000000
  },
  useEffect: String(window.vcuiConfigs.useEffect) === 'true', // 'true', true 둘 중에서 뭐가 올지 몰라서...
  $hiddenElements: $('#skipnavi, .notificationBars, #container, #footer, .btnTop_wrap'),
  /**
   * 페이지에 진입하자마자 실행
   */
  init: function() {
      var $html = $('html');
      var isPortrait;
      var resizeHandler;
      var isMobile = window.innerWidth < this.breakpoints.mobile;

      $(window)
          .data('breakpoint', window.breakpoint = { // 처음에만
              isMobile: isMobile,
              isPc: !isMobile,
              name: isMobile ? 'mobile' : 'pc'
          })
          .on('resize.orientation orientationchange.orientation', resizeHandler = function() {
              if (window.innerWidth < window.innerHeight) {
                  if (!isPortrait) { // 퍼포먼스를 위해 실제로 가로x세로가 바뀔때만 처리..유남쌩?
                      $html.addClass('portrait');
                      isPortrait = true;
                  }
              } else {
                  if (isPortrait) { // 퍼포먼스를 위해 실제로 가로x세로가 바뀔때만 처리
                      $html.removeClass('portrait');
                      isPortrait = false;
                  }
              }
          });
      resizeHandler();

      $html.toggleClass('win_scroll', vcui.detect.isAndroid);

      if (!vcui.detect.isMobileDevice) {
          // 전화걸기는 모바일기기에서만 동작하도록....
          $(document).on('click', 'a[href^="tel"]', function(e) {
              e.preventDefault();
          });
      }
  },
  /**
   * DOMContentLoaded에서 호출
   */
  ready: function() {
      var self = this;

      vcui.Env.set('mapApiKey', self.naverMapApiKey);
      vcui.translate.locale('en');

      // 모듈 사전 로드
      self._.preload.call(self, function() {
          self._.init.call(self);
      });

      // gnb가 다 빌드되면 a[href=#]을 클릭했을 위로 못가게 했던 핸들러를 제거(appready 로 검색해보세요.)
      vcui.PubSub.one('common:loadedHeader', function() {
          trigger('appready');

          function trigger(eventName) {
              var event;
              if (document.createEvent) {
                  event = document.createEvent('HTMLEvents');
                  event.initEvent(eventName, true, true);
              } else if (document.createEventObject) { // IE < 9
                  event = document.createEventObject();
                  event.eventType = eventName;
              }
              event.eventName = eventName;

              if (document.dispatchEvent) {
                  document.dispatchEvent(event);
              } else if (document.fireEvent) { // IE < 9
                  document.fireEvent('on' + event.eventType, event); // can trigger only real event (e.g. 'click')
              }
          }
      });
      //self._.showWidthLog.call(self);
  },

  log: function() {
      if (!this.$log) {
          this.$log = $('<div style="position:fixed;left:0;bottom:0;background:pink;z-index: 99999;"></div>').appendTo('body');
      }
      this.$log.text(vcui.toArray(arguments).join(', '));
  },

  /**
   * privates
   */
  _: {
      init: function() {
          var self = this;

          $('body').buildCommonUI();

          this._.bindGlobalEvents.call(this);
          this._.bindSpyScroll.call(this);
          this._.header.call(this);
          this._.footer.call(this);
          this._.snsShare.call(this);
          this._.youtube.call(this);

          this._.bindWAModal();
      },

      bindSpyScroll: function() {

          vcui.require(['ui/spyScroll'], function() {
              var $el = $('.ui_spyscroll'),
                  isProductDetail = $el.parent().parent().hasClass('prdDetail_wrap'), // 제품 상세 페이지는 예외로 처리할 게 많음. because 접근성
                  $label = $el.find('.tab_open span');

              $el.on('spyscrollactive', function(e, $anchor) {
                  // 페이지가 스크롤되면서 화면에 들어오는 요소가 바뀔 때 발생

                  // 스크롤 위치에 있는 해당하는 문구를 레이블에 표시
                  $label.text($anchor.children().first().text());
              }).on('spyscrollmoved', function(e, anchor, target) {
                  // 앵커를 클릭시 해당요소로 스크롤함과 동시에 해당 요소안에 있는 타이틀에 포커스가 가도록 함
                  if (isProductDetail) { // 제품 상세에서만 실행해야 유효
                      $($(anchor).attr('href')).find('.h3_tit, .h2_tit').first().attr('tabindex', -1).focus();
                  }
              }).vcSpyScroll({
                  waitImages: '.img_wrap img',
                  targetFocus: !isProductDetail
              });
          });
      },
      /**
       * 전역 이벤트 바인딩
       */
      bindGlobalEvents: function() {
          // prevent scroll
          // 모달이나 gnb처럼 무언가가 표시될 때 본문의 스크롤을 막고자 할 경우
          // vcuiPubSub.trigger('common:preventScroll', true);를 호출해주면 된다.(false는 해제)
          vcui.PubSub.on('common:preventScroll', function(e, flag) {
              hcgCommon.preventPageScroll(flag);
          });

          // 언제 어느곳에서나 vcui.PubSub.trigger('common:youtubeStop')를 호출하면
          // 현재 재생중인 유투브 전체를 정지시킨다.
          vcui.PubSub.on('common:youtubeStop', function(e, data) {
              $('.ui_player').each(function(i, ifrm) {
                  if (data && data.ignore === ifrm) {
                      return;
                  }

                  if (ifrm.contentWindow) {
                      ifrm.contentWindow.postMessage('{"event": "command", "func": "pauseVideo"}', 'https://www.youtube.com')
                  }
              });
          });

          // vcui.PubSub.trigger('common:carouselStop');를 호출하면
          // 모든 Carousel의 자동재생을 정지시킨다.
          vcui.PubSub.on('common:carouselStop', function(e, data) {
              vcui.each(vcui.ui.View._instances, function(item) {
                  if (item instanceof vcui.ui.Carousel ||
                      item instanceof vcui.ui.ProgressCarousel) {

                      if (data && data.ignore === item) {
                          return;
                      }

                      item.stop();
                  }
              });
          });

          // app 링크 분기(현대 상용차 앱 링크를 디바이스에 따라 분기)
          $(document).on('click', '.ui_app_link', function(e) {
              e.preventDefault();

              var $appLink = $(this);

              if (vcui.detect.isIOS) {
                  window.open($appLink.attr('data-ios-link'), '_blank');
              } else {
                  window.open($appLink.attr('href'), '_blank');
              }
          });
      },

      /**
       * 웹접근성 인증서 레이어 팝업
       */
      bindWAModal: function() {
          var binded;

          vcui.require([
              'helper/responsiveImage'
          ], function (ResponsiveImage) {

              // 푸터의 웹접근성 링크 클릭시
              $('#footer .ui_wa_modal').on('click', function (e) {
                  e.preventDefault();

                  var html = '<div class="layer_wrap wa" id="uiWAModal">' +
                      '<div class="layer_cont">' +
                      '<p class="title">웹접근성 품질 인증서</p>' +
                      '<div class="cont_wrap">' +
                      '<img src="/kr/images/common/web-accessibility' + (window.breakpoint.isMobile ? '-m' : '') + '.jpg" data-src-mobile="/kr/images/common/web-accessibility-m.jpg" data-src-pc="/kr/images/common/web-accessibility.jpg" class="ui_responsive_image" alt="">' +
                      '</div>' +
                      '</div>' +
                      '<p class="btn_close">' +
                      '<button type="button" class="ui_modal_close"><span class="sr_only">닫기</span></button>' +
                      '</p>' +
                      '</div>';

                  var mobileAlt = '제 2018-538호 웹 접근성 품질 인증서 – 업체명: 현대자동차㈜, 주소: 서울특별시 서초구 헌릉로 12, 웹 사이트: http://www-trucknbus.com, 유효기간: 현대 트럭&버스 모바일 웹, ' +
                      '국가정보화 기본법 제 32조의 2제1항 및 같은 법 시행규칙 제3조의 4제2항에 따라 위와 같이 웹 접근성 품질을 인증합니다. ' +
                      '2018년 07월 27일, 사단법인 한국장애인단체총연합회(korea federation of organizations of the disabled) 한국웹접근성인증평가원(Korea institute of web Accessibility certification and value)';

                  var pcAlt = '제 2018-537호 웹 접근성 품질 인증서 – 업체명: 현대자동차㈜, 주소: 서울특별시 서초구 헌릉로 12, 웹 사이트: http://www-trucknbus.com, 인증범위: 현대 트럭&버스 홈페이지, ' +
                      '국가정보화 기본법 제 32조의 2제1항 및 같은 법 시행규칙 제3조의 4제2항에 따라 위와 같이 웹 접근성 품질을 인증합니다. ' +
                      '2018년 07월 27일, 사단법인 한국장애인단체총연합회(korea federation of organizations of the disabled) 한국웹접근성인증평가원(Korea institute of web Accessibility certification and value)';

                  // 모달 생성
                  var $modal = $(html).appendTo('body').hide();
                  var $img = $modal.find('img');

                  // 해상도에 따라 alt 변경
                  var handler = function () {
                      if (window.breakpoint.isMobile) {
                          $img.attr('alt', mobileAlt);
                      } else {
                          $img.attr('alt', pcAlt);
                      }
                  };

                  // 모달 띄움
                  $modal.on('modalshow modalhidden', function (e) {
                      if (e.type === 'modalshow') {
                          // 해상도에 따른 이미지 소스 변경
                          ResponsiveImage.run($modal);
                          // 모달이 뜬 상태에서 리사이징하면 alt 변경 해줌.
                          $(window).on('breakpointchange', handler);
                          handler();
                      } else {
                          $modal = null;
                          $(window).off('breakpointchange', handler);
                      }
                  });

                  // 이미지 불러오는데 오래걸릴 경우 다 로드되면 모달위치를 다시 잡아준다.
                  // 모달 크기를 기준으로 배치되므로...
                  vcui.util.waitImageLoad($modal.find('img')).done(function () {
                      $modal.vcModal({
                          effect: 'none',
                          removeOnClose: true,
                          opener: this
                      });
                  });
              });
          });
      },
      /* 190729 수정 */
      /**
       * 헤더 빌드
       */
      header: function() {
          vcui.require([
              'ui/header'
          ], function(Header) {
              var header = new Header('#header', {});

              header.on('headeropen headerclose', function(e) {
                  // gnb가 열리거나 닫힐 때 본문이나 푸터를 숨김처리 한다.
                 $('.notificationBars:not(.open), #container, #footer, .btnTop_wrap')
                      .css('visibility', e.type === 'headeropen' ? 'hidden' : '');
              });

          });
      },
      /* // 190729 수정 */
      /**
       * 푸터 빌드
       */
      footer: function() {
          vcui.require([
              'ui/footerSeoMenu'
          ], function(FooterSeoMenu) {
              new FooterSeoMenu('#uiSeoMenu');
          });

          // top 버튼
          var $btnTop = $('.btnTop_wrap a').click(function(e) {
              e.preventDefault();

              $('html, body').animate({
                  scrollTop: 0
              }, 'fast', function() {
                  $('#header .logo a').focus();
              });
          });

          if ($btnTop.length) {
              var scrollHandler;
              $(window).on('scroll', scrollHandler = function() {
                  $btnTop.toggle(vcui.dom.getScrollTop() > 300);
              });
              scrollHandler();
          }
      },
      /**
       * 미리 로드해놓아야 하는 모듈들을 로드한다.
       * @private
       */
      preload: function(callback) {
          var $doc = $(document),
              $win = $(window),
              self = this;

          vcui.require([
              'ui/notifyManager',
              'helper/responsiveImage',
              'helper/breakpointDispatcher',
              'ui/youtubePlayer',
              'ui/modal',
              'ui/accordion',
              'ui/tab',
              'ui/scrollview',
              'ui/carousel'
          ], function(NotifyManager, ResponsiveImage, BreakpointDispatcher) {
              NotifyManager.init();

              // 반응형 breakpoint 이벤트 발생기 실행 /////////////////////////////////

              $('body').attr('ui-modules', 'BreakpointDispatcher');
              new BreakpointDispatcher({
                  matches: {
                      '(max-width: 767px)': function(mq) {
                          var data;
                          if (mq.matches) {
                              // mobile
                              data = {
                                  name: 'mobile',
                                  min: 0,
                                  max: 767,
                                  isMobile: true,
                                  isPc: false,
                                  prev: window.breakpoint || {}
                              };
                          } else {
                              // pc
                              data = {
                                  name: 'pc',
                                  min: 768,
                                  max: 999999,
                                  isMobile: false,
                                  isPc: true,
                                  prev: window.breakpoint || {}
                              };
                          }

                          window.breakpoint = data;
                          $win.data('breakpoint', data).trigger('breakpointchange', data);
                      }
                  }
              }).start();
              ///////////////////////////////////////////////////////////////////////

              // 반응형 이미지 로드 적용: data-mobile-src, data-pc-src ///////////////
              new ResponsiveImage('body', self.breakpoints);
              ///////////////////////////////////////////////////////////////////////


              // 각 컴포넌트의 기본옵션값을 변경 /////////////////////////////////////
              vcui.ui.setDefaults('Accordion', {
                  useAnimate: self.useEffect
              });

              vcui.ui.setDefaults('Modal', {
                  effect: vcui.detect.isMobileDevice ? 'none' : 'fade',
                  useTransformAlign: false, // 모달창의 위치를 transform이 아닌 margin으로 잡도록 함
                  dimStyle: {
                      opacity: 0.9,
                      backgroundColor: '#fff'
                  },
                  events: {
                      'modalshow': function(e) {
                          var $title = $(e.target).find('.h5_tit, .title').first();
                          if (vcui.detect.isIOS) { // 이넘의 웹접근성에 ios포커싱 이슈...아 울고 싶다
                              setTimeout(function() {
                                  if ($title.length && $title[0].childNodes.length > 1) {
                                      $(e.target).find('iframe, a, button').first().focus();
                                  } else {
                                      $title.attr('tabindex', -1).focus();
                                  }
                              }, 100);
                          } else {
                              if ($title.attr('data-autofocus') !== 'true') {
                                  $title.attr({
                                      'tabindex': -1,
                                      'data-autofocus': 'true'
                                  });
                              }
                          }
                      }
                  }
              });

              vcui.ui.setDefaults('Scrollview', {
                  selectors: {
                      wrapper: '.scroll_inner',
                      vscrollbar: '.scroll_bar .bg'
                  }
              });

              vcui.ui.setDefaults('Carousel', {
                  autoplay: false, //!(vcui.detect.isIOS || vcui.detect.isAndroid),
                  pauseOnFocus: !(vcui.detect.isIOS || vcui.detect.isAndroid),
                  events: {
                      carouselinit: function(e, carousel) {
                          // 배너 안에 있는 반응형 이미지 처리
                          ResponsiveImage.run(carousel.$el);
                      },
                      carouselafterchange: function(e, carousel) {
                          var index = carousel.currentSlide,
                              $player;

                          // 화면에서 벗어나버리면 유투브를 제거해버린다.
                          if (($player = carousel.$slides.eq(carousel.previousSlide).find('iframe')).length) {
                              var $wrap = $player.parent();
                              $player.remove();
                              $wrap.children().show();
                          }
                      }
                  }
              });

              vcui.ui.setDefaults('NaverMap', {
                  apiKey: self.naverMapApiKey
              });

              vcui.ui.setDefaults('Tab', {
                  events: {
                      tabclose: function(e) {
                          if (window.breakpoint.isMobile) {
                              setTimeout(function() {
                                  $(e.target).find('.btn_open button').focus();
                              });
                          }
                      }
                  }
              })
              //////////////////////////////////////////////////////////////////////

              $.holdReady(false);
              callback();


              // 모달이 열렸을 때 페이지 스크롤을 막기 위함 ////////////////////////////
              $doc
                  .on('modalfirstopen modallastclose', function(e) {
                      self.preventPageScroll(e.type === 'modalfirstopen');

                      $('body>*:not(.ui_modal_wrap, script)').attr('aria-hidden', e.type === 'modalfirstopen' ? 'true' : 'false');
                  })
                  .on('modalshown', function(e) {
                      // 모달이 뜰때 모달내부에 있는 공통 컴포넌트 빌드
                      $(e.target).buildCommonUI();
                  });
              //////////////////////////////////////////////////////////////////////

              // 아코디온이 펼쳐지거나 닫힐 때 레이아웃 사이즈가 변하기 때문에 resize이벤트를 강제로 발생시킨다.
              $doc.on('accordionexpand accordioncollapse', vcui.delayRun(function(e) {
                  $(window).triggerHandler('resize');
              }, 200));
              ///////////////////////////////////////////////////////////////////////

          });
      },

      /**
       * 공유하기 기능 빌드
       */
      snsShare: function() {
          var html = '<div class="layer_wrap snsShare_wrap">' +
              ' <div class="layer_cont">' +
              '  <p class="title" tabindex="-1" data-autofocus="true">Share</p>' +
              '  <div class="snsList_wrap">' +
              '   <ul class="list_wrap">' +
              '    <li class="item">' +
              '     <a href="#" class="kakao" target="_blank" title="새창열림 카카오톡으로 공유 합니다. "><span class="hide">카카오톡으로 공유하기</span></a>' + //2019.05.24 수정
              '    </li>' +
              '    <li class="item">' +
              '     <a href="#" class="band" target="_blank" title="새창열림 밴드로 공유 합니다. "><span class="hide">밴드로 공유하기</span></a>' + //2019.05.24 수정
              '    </li>' +
              '    <li class="item">' +
              '     <a href="#" class="facebook" target="_blank" title="새창열림 페이스북으로 공유 합니다. "><span class="hide">Facebook으로 공유하기</span></a>' + //2019.05.24 수정
              '    </li>' +
              '    <li class="item">' +
              '     <a href="#" class="copy_url" role="button" title="현 페이지 주소를 복사합니다."><span class="hide">URL 복사</span></a>' +
              '    </li>' +
              '   </ul>' +
              '  </div>' +
              '  <div class="copyUrl_msg">' +
              '   <p>URL이 복사되었습니다.<br>원하는 위치에 (Ctrl+V) URL을 붙여 넣으세요.</p>' +
              '  </div>' +
              ' </div>' +
              ' <p class="btn_close">' +
              '  <button type="button" class="ui_modal_close" title="공유하기 레이어가 닫힙니다"><span class="hide">Shere창 닫기</span></button>' +
              ' </p>' +
              '</div>';

          // 공유하기 버튼을 클릭하면 공유모달을 띄운다.
          $('.btn_share').on('click', function(e) {
              e.preventDefault();

              $(html).appendTo('body').vcModal({
                  removeOnClose: true,
                  opener: this
              });
          });

          vcui.require([
              'helper/sharer'
          ], function(Sharer) {
              // 공유하기 헬퍼 빌드
              Sharer.init({
                  selector: '.snsShare_wrap .item a',
                  attr: 'class', // sns서비스명을 가져올 속성
                  metas: {
                      image: { // 공식 메타태그가 아닌 메타태그에 있는 이미지를 공유하고자 할 경우 이 옵션 설정
                          pinterest: 'pinterest:image'
                      }
                  },
                  // 공유하기 직전에
                  onBeforeShare: function($btn, data) {
                      if ($btn.hasClass('copy_url')) {
                          // url 복사하기 인 경우
                          vcui.dom.copyToClipboard(location.href, {
                              container: $('.snsShare_wrap')[0],
                              onSuccess: function() {
                                  //alert('Copied!');
                                  $('.snsShare_wrap').addClass('url_copy');
                                  $('.snsShare_wrap .copyUrl_msg').attr('role', 'alert').attr('tabindex', 0).focus();
                              },
                              onError: function() {
                                  alert('알 수 없는 이유로 복사가 취소되었습니다.\n주소창에서 복사해주세요.');
                              }
                          });
                          // false를 반환하면 공유를 위한 팝업을 안띄운다.
                          return false;
                      }
                  },
                  // 공유를 했을 때 서버 로그 페이지에 관련데이타를 보내준다.
                  onShrered: function($btn, data) {
                      var typeCode = {
                              'facebook': '00001',
                              'twitter': '00002',
                              'googleplus': '00003',
                              'pinterest': '00004',
                              'kakao': '00005',
                              'band': '00006'
                      };
                      //mtdt_sn=1234&sns_type_cd=0001
                      $.ajax({
                          url: '/kr/log/saveShareLog',
                          data: {
                              mtdt_sn: $('.btn_share').data('pagecode') || '',
                              sns_type_cd: typeCode[data.service] || ''
                          }
                      });
                  }
              });
          });
      },

      /**
       * 유투브 빌드
       */
      youtube: function() {
          // 버블링을 이용.
          $(document).on('click', '[data-youtube]', function(e) {
              // 유투브 div 요소 클릭시
              e.preventDefault();

              // 어휴 이 넘의 접근성
              var title = $(this).find('.h2_tit, .sr_only').first().text();

              createModal($(this), $(this).find('a'), title);
          }).on('click', '.ui_youtube_button', function(e) {
              // 유투브 플레이 버튼 클릭시
              e.preventDefault();
              e.stopPropagation();

              var $btn = $(this);
              var title = $btn.find('.sr_only').text().replace(/보기$/, '');

              createModal($btn.attr('href'), $btn, title);
          });

          function getId(url) {
              var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#&?]*).*/;
              var match = url.match(regExp);
              if (match && match[2].length === 11) {
                  return match[2];
              }
          }

          // 모달 생성
          function createModal($wrap, $btn, title) {
              if (vcui.isString($wrap)) {
                  $wrap = $($wrap);
              }

              var src = $wrap.data('youtube');
              var subtitle;
              if (!src) {
                  return;
              }

              src = '//www.youtube.com/embed/' + getId(src) + '?controls=1&autoplay=1&showinfo=0';
              title = title.replace(/동영상/, '').replace(/보기$/, '').replace(/\s+$/, '');
              subtitle = $wrap.data('subtitle') || (title + ' 소개 영상.');

              //switch ($wrap.data('mode')) {
              //    case 'modal':
              // 유투브를 모달로 띄울 때

              if ($('#uiYoutubeModal').length) {
                  $('#uiYoutubeModal').vcModal('close');
              }

              var $modal = $('<div id="uiYoutubeModal" class="layer_wrap layer_movie" role="dialog">' +
                  ' <div class="movie_wrap">' +
                  '  <p class="btn_close">' +
                  '   <button type="button" class="ui_modal_close" data-autofocus="true"><span class="sr_only">동영상 닫기</span></button>' +
                  '  </p>' +
                  '  <iframe src="' + src + '" class="ui_player" frameborder="0" allowfullscreen data-autofocus="true" title="' + title + ' 동영상 프레임"></iframe>' +
                  '  <textarea style="display:none;" readonly="readonly" title="동영상 자막"></textarea>' +
                  '  </div>' +
                  '</div>');

              if (subtitle) {
                  $modal.find('textarea').val(subtitle).show();
              }

              $modal.css({
                  'width': '100%',
                  'height': '100%'
              }).appendTo('body').vcModal({
                  removeOnClose: true,
                  opener: $btn
              });
              //        break;
              //}
          }
      }
  },

  /**
   * 전역 함수 위치
   * 모달이 열렸을 때 페이지 스크롤은 막는다.
   * @param flag
   */
  preventPageScroll: function(flag) {
      var $wrap = $('html');
      var css = {};

      if (flag) {
          hcgCommon.preventedScroll = true;
          $(document).triggerHandler('preventscroll', true);

          css.top = -$(window).scrollTop();
          $wrap.css(css).addClass('ui_prevent_scroll');
      } else {
          var top = parseInt($wrap.css('top'), 10) || 0;

          $wrap.css({
              'top': ''
          }).removeClass('ui_prevent_scroll');
          $('html, body').scrollTop(-top);

          hcgCommon.preventedScroll = false;
          $(document).triggerHandler('preventscroll', false);
      }

      // gnb, 모달 등이 열릴 때는 본문에 포커스가 안가도록 aria-hidden 를 토글
      this.$hiddenElements.attr('aria-hidden', flag);
  }
};

hcgCommon.init();

// ready holding 대상에서 제외되도록 네이티브이벤트에 바인딩.
$(document).on('DOMContentLoaded', function() {
  hcgCommon.ready();
});
