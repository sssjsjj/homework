var MobileUA = (function(){
	var ua = navigator.userAgent.toLowerCase();
	var mua = {
		IE: /msie/.test(ua)
	};
	mua.IE = mua.IE;
	return mua;
}());
var _trans = false;
var _winWid = _winWid = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
	_winHgt = $(window).height();
$(window).resize(function(){
	_winWid = _winWid = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
	_winHgt = $(window).height();
})
$(function(){
	if (MobileUA.IE){
		_trans = false;
	} else {
		_trans = true;
	}
	$("#header").load("/eng/html/header.jsp"); 
	$("#footer").load("/eng/html/footer.jsp"); 
	// main visual
	var MAINVISUAL = (function(){
		var $visual = $('.main_visual > ul'),
			$arrow = $('.box_arrow_main_1 a');
			$li = $visual.find(' > li '),
			_rate = 0.5203125,
			_rate_mo = 2.71875,
			_size = $li.size();
		if (_winWid < 380 ){
			_hgt = _winWid * _rate_mo;
		} else {
			_hgt = _winWid * _rate;
		}
		var _old = 0,
			_cur = 0,
			_dir = -1,
			_left = 0;
		var $page = $('.main_visual .page li');
		if ($('.main_visual').length){
			visualWid();
			swipeMain();
			$(window).resize(function(){
				if (_winWid < 380 ){
					_hgt = _winWid * _rate_mo;
				} else {
					_hgt = _winWid * _rate;
				}
				visualWid();
			});
			// 좌우 화살표
			$arrow.eq(0).css({ display : 'none' });
			$arrow.bind('click',function(){
				var $this = $(this),
					_idx = $this.attr('class');
				visualRoll(_idx);
				return false;
			})
			$page.find('a').bind('click',function(){
				var $this = $(this),
					_idx = $this.parent().index();
				visualRoll(_idx);
				return false;
			})
			viewItem(0);
		}
		function viewItem(idx,type){
			var $txt = $li.eq(idx).find('.txt_01'),
				$photo = $li.eq(idx).find('.main_movie_area li'),
				_size = $photo.size(),
				_delay = 0;
			if (type == 'delItem'){
				$txt.stop().fadeOut(100);
				$photo.stop().slideUp(100);
			} else {
				$txt.stop().fadeIn(300);
				for (var i = 0; i < _size; i++){
					_delay = 100 + (100 * i);
					$photo.eq(i).stop().delay(_delay).slideDown(300);
				}
			}
		}
		function visualRoll(idx){
			_old = _cur;
			switch(idx){
				case 'btn_prev':
					_cur--;
				break;
				case 'btn_next':
					_cur++;
				break;
				default:
					_cur = idx;
				break;
			}
			if (_cur > _size - 1 ){
				_cur = _size - 1;
				return false;
			} else if (_cur < 0 ){
				_cur = 0;
				return false;
			}
			viewItem(_old,'delItem');
			_left = _cur * _winWid * _dir;
			if (_trans){
				$visual.css({'-webkit-transform' : 'translateX(' + _left + 'px)', '-o-transform' : 'translateX(' + _left + 'px)' , '-moz-transform' : 'translateX(' + _left + 'px)' , 'transform' : 'translateX(' + _left + 'px)', '-webkit-transition' : 'all 0.3s ease-out' , '-o-transition' : 'all 0.3s ease-out' , '-moz-transition' : 'all 0.3s ease-out' , '-ms-transition' : 'all 0.3s ease-out' , 'transition' : 'all 0.3s ease-out' });
				$visual.one('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd', function(){
					viewItem(_cur);
				});
			} else {
				$visual.animate({ left : _left + 'px' },function(){
					viewItem(_cur);
				});
			}
			$page.find('a').removeClass('on');
			$page.eq(_cur).find('a').addClass('on');
			if (_cur == 0){
				$arrow.eq(0).css({ display : 'none'});
			} else if (_cur == _size - 1){
				$arrow.eq(1).css({ display : 'none'})
			} else {
				$arrow.css({ display : 'block'});
			}
		}
		function visualWid(){
			$arrow.css({ top : (_hgt / 2) + 44 + 'px' });
			$visual.css({ width : _winWid * _size + 'px' });
			$li.css({ width : _winWid + 'px' , height : _hgt + 'px' });
		}
		function viewContent(idx,direct){
			switch(direct){
				case 'right':
					$arrow.eq(0).trigger('click');
				break;
				case 'left':
					$arrow.eq(1).trigger('click');
				break;
			}
		}
		function swipeMain(){
			if ( $B.ua.TOUCH_DEVICE ) {
				var contentGesture = new ixBand.mobile.Gesture ( '.main_visual > ul', 'horizontal', {
					onSwipe: function (e) {
						viewContent('swipe',e.swipe);
					}
				} );
			}
		}
	}());
	// history_main
	var HISTORYMAIN = (function(){
		var $base = $('.histroy_list_1'),
			$li = $base.find(' > li'),
			$link = $li.find('a');
		$link.bind('mouseenter mouseleave',function(e){
			if (_winWid < 800 ){
				return;
			}
			var $this = $(this),
				$img1 = $this.find('.img_1 img');
				$img2 = $this.find('.img_2 img');
			switch(e.type){
				case 'mouseenter':
					$img1.delay(100).animate({ top : '-100%'},300);
					$img2.animate({ top : '-100%'},300);
				break;
				case 'mouseleave':
					$img1.animate({ top : '0'},300);
					$img2.delay(100).animate({ top : '0'},300);
				break;
			}
		})
	}());
	// history tab
	var HISTORYTAB = (function(){
		var $base = $('.tab_menu'),
			$tab = $base.find(' > li > a');
		if (_winWid < 380 ){
			$tab.bind('click',function(){
				var _link = $(this).attr('href');
				if ($base.hasClass('on')){
					location.href = _link;
				} else {
					$base.css({ height : '120px' }).queue(function(){
						$base.addClass('on');
						$tab.parent().slideDown(100);
					});
					return false;
				}
			});
		}
	}());
	//h1 등장
	var HEADING = (function(){
		var $heading = $('.sub_visual h1');
		if ($('.sub_visual').length){
			if (_winWid > 380 ){
				$heading.css({ display : 'block' , opacity : '0' }).delay(500).animate({  opacity : '1' });
			}
		}
	}());
	// 사진
	var PHOTOLIST = (function(){
		var $base = $('.img_navi_area'),
			$ul = $base.find(' .tab_btn_area'),
			$li = $ul.find(' > li'),
			$content = $('.dream_cont_list'),
			_size = $li.size(),
			_wid = 248;
		var $arrow = $base.find(' > p a '),
			_old = 0,
			_current = 0,
			_cur = 0,
			_gap = 1240;
		if ($('.img_navi_area').length){
			scrollWid();
			$( window ).resize(function(){
				scrollWid();
			});
		}
		$arrow.bind('click',function(){
			var _idx = $(this).index();
			switch(_idx){
				case 0:
					moveArrow('left');
				break;
				case 1:
					moveArrow('right');
				break;
			}
			return false;
		})
		$li.find('a').bind('click',function(){
			var _idx = $(this).parent().index();
			if (_cur == _idx){
				return false;
			}
			_old = _cur;	
			_cur = _idx;
			viewContent(_idx);
			return false;
		})
		function scrollWid(){
			if (_winWid <= 600){
				_wid = 175;
			} else {
				_wid = 248;
			}
			// 좌우 화살표 보이기 숨기기
			if (_winWid > _size * _wid || _winWid < 700){
				$arrow.css({ display : 'none' });
			} else {
				$arrow.css({ display : 'block' });
			}
			$ul.css({ width : _wid * _size + 'px' });
		}
		function viewContent(idx){
			var _left = 0;
			if (_winWid < 1240 ){
				_gap = _winWid;
			} else {
				_gap = 1240;
			}
			_left = -1 * _gap;
			$content.find(' > li').eq(_cur).addClass('on').css({ position : 'absolute' , left : '100%' });
			if (_trans){
				$content.css({'-webkit-transform' : 'translateX(' + _left + 'px)' , '-o-transform' : 'translateX(' + _left + 'px)' , '-moz-transform' : 'translateX(' + _left + 'px)' , '-ms-transform' : 'translateX(' + _left + 'px)' , 'transform' : 'translateX(' + _left + 'px)' , '-webkit-transition' : 'all 0.3s ease-out', '-o-transition' : 'all 0.3s ease-out', '-moz-transition' : 'all 0.3s ease-out', '-ms-transition' : 'all 0.3s ease-out', 'transition' : 'all 0.3s ease-out' });
				$content.one('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd', function(){
					$content.css({'-webkit-transform' : 'translateX(0)' , '-o-transform' : 'translateX(0)' , '-moz-transform' : 'translateX(0)' , '-ms-transform' : 'translateX(0)' , 'transform' : 'translateX(0)' , '-webkit-transition' : 'all 0s ease-out', '-o-transition' : 'all 0s ease-out', '-moz-transition' : 'all 0s ease-out', '-ms-transition' : 'all 0s ease-out', 'transition' : 'all 0s ease-out' });
					$content.find(' > li').eq(_cur).css({ position : 'relative' , left : '0' });
					$content.find(' > li').eq(_old).removeClass('on');
				});
			} else {
				$content.animate({ left : _left + 'px' },function(){
					$content.css({ left : '0'});
					$content.find(' > li').eq(_cur).css({ position : 'relative' , left : '0' });
					$content.find(' > li').eq(_old).removeClass('on');
				});
			}
		}
		function moveArrow(direct){
			var $this = $('.img_navi_area .tab_btn_area'),
				_direct = -1;
			switch (direct){
				case 'left':
					_direct = 1;
				break;
				case 'right':
					_direct = -1;
				break;
			}
			_current = _current + (_wid * _direct);
			if (_winWid < 1240 ){
				_gap = _winWid;
			} else {
				_gap = 1240;
			}
			if (_current < (-1 * _wid * _size) + _gap ){
				_current = (-1 * _wid * _size) + _gap ;
			} else if (_current > 0 ){
				_current = 0;
			}
			$this.animate({ left : _current },function(){
				_temp = false;
			});
		}
	}());
		// echo ajax
	var ECHOAJAX = (function(){
		var $base = $('.echo_ajax'),
			$more = $base.next('.btn_more_view');
		var _page = 12,
			_old = 0,
			_cur = 0,
			_max,
			_temp = false;
		var _arr = [],
			_old_1 = 0,
			_cur_1 = 0,
			_temp = false;
		// 더보기 버튼
		if ($('.echo_ajax').length){
			if (_winWid < 380 ){
				moMore();
			}
			$(window).resize(function(){
				if (_winWid > 380 ){
					return;
				} else {
					moMore();
				}
			});
		}
		function moMore(){
			$( window ).bind('scroll',function(){
				if (_temp){
					return;
				}
				var _scrollTop = $(window).scrollTop() + _winHgt,
					_docHgt = $('body, html').height();
				if ((_docHgt - 70) <= _scrollTop ){
					echoAjax('more');		
				}
			});
		}
		$more.bind('click',function(){
			echoAjax('more');
			return false;
		});
		function echoAjax(type){
			$('body').append('<p class="p_loading"><img src="/SPA-2001/asan/kor/images/common/ajax-loader.gif" alt="loading" /></p>');
			_temp = true;
			$.ajax({
				type:"GET",
				url:'echo.jsp',
				dataType : 'json',
				success:function(json){
					$('.p_loading').remove();
					$base.find('.li_first').remove();
					_old = _cur;
					_max = _old + _page;
					var ajax_list = json.ECHO_LIST,
						ajax_counter = ajax_list.length;
					_size = ajax_counter;
					// 20150604 수정 S
					if (type == 'more'){
						_max = ajax_counter;
						$more.remove();
						_temp = true;
					}
					/*
					if (_max > ajax_counter){
						_max = ajax_counter;
						$more.remove();
						_temp = true;
					}
					*/
					// 20150604 수정 E
					for (var i = _old; i < _max; i++){
						var echo_list = ajax_list[i],
							echo_type = echo_list.type,
							echo_category = echo_list.category,
							echo_tit = echo_list.tit,
							echo_subtit = echo_list.subtit,
							echo_content = echo_list.content;
						if (echo_type == 'category_tit'){
							$base.append('<li class="category_' + echo_category + '"><div class="box_wrap"><h3>' + echo_tit + '</h3></div></li>');
						} else {
							$base.append('<li><div class="box_wrap"><div class="li_div"><h4><strong>' + echo_tit + '</strong></h4><span class="span_subtit">' + echo_subtit + '</span><p class="txt_area">' + echo_content + '</p><a href="#wrap" class="openMask"><strong>Read more</strong></a></div></div></li>');
						}
						$base.find('li').eq(i).css({ opacity : ' 0' });
						$base.find('li').eq(i).animate({ opacity : '1'});
					}
					if (type == 'more'){
						$base.find('li').eq(_old).find(' > div.box_wrap > div > a').focus();
					}
					_cur = _cur + _page;
					_temp = false;
					// url 바로확인
					urlView();
				}
			});
		};
		if ($('.echo_ajax').length){
			echoAjax();
		}
		function urlView(){
			// url 바로 확인
			var _url = location.href.split('?')[1];
			if (typeof _url != 'undefined'){
				_url = _url.split('=')[1];
				viewContent(_url);
			}
		}
		//  레이어 열기
		$(document).on('click','.echo_ajax .openMask',function(){
			var _idx = $(this).closest('li').index();
			viewContent(_idx);
			return false;
		});
		// 닫기 버튼
		$(document).on('click','.echo_ajax .btn_close a',function(){
			delLayer('close');
			return false;
		});
		$(document).on('click','.echo_ajax .btn_arrow a',function(){
			var $this = $(this),
				_class = $this.attr('class');
			switch(_class){
				case 'btn_prev':
					_cur_1--;
				break;
				case 'btn_next':
					_cur_1++;
				break;
			}
			if(_cur_1 > _size - 1){
				_cur_1 = _size - 1;
				return false;
			} else if (_cur_1 < 0 ){
				_cur_1 = 0;
				return false;
			}
			viewContent(_cur_1,'on');
			return false;
		})
		// 레이어 종료
		function delLayer(type){
			var $li = $('.echo_ajax li .layer_part').filter(':visible').closest('li');
			$('.echo_ajax li .layer_part').filter(':visible').fadeOut(function(){
				$(this).remove();
			});
			if (type == 'close'){
				$li.find(' > div.box_wrap > div > a').focus();
			}
		}
		// 레이어 팝업
		function viewContent(idx){
			delLayer();
			_cur_1 = idx;
			// 현재 불러온 페이지 이외의 레이어 호출 시
			var _div = $base.find(' > li').size();
			if (_div <= idx || _div <= _cur_1) {
				var _num = Math.ceil(idx / _page);
				for (var i = 0; i < _num; i++){
					echoAjax('more');
				}
			}
			var _hgt = $(window).height() - 80;
			var $target = $('.echo_ajax li').eq(idx),
				_tit = $target.find('h4 strong').html(),
				_subtit = $target.find('.span_subtit').html(),
				_content = $target.find('.txt_area').html();
//			$target.append('<div id="mask" class="layer_part"></div><div class="layer_echo_pop layer_part"><div class="content_pop"><h4><strong>' +  _tit + '</strong></h4><p class="p_subtit">' +  _subtit + '<span></span></p><p class="txt_area">' +  _content + '</p><p class="sns_area_w"><a href="#wrap" class="sns_1"><span lass="blind">페이스북</span></a><a href="#wrap" class="sns_2"><span class="blind">트위터</span></a><a href="#wrap" class="sns_3"><span class="blind">인스타그램</span></a><a href="#wrap" class="sns_4"><span class="blind">글플러스</span></a><a href="#wrap" class="sns_5"><span class="blind">핀터레스트</span></a></p><p class="btn_close"><a href="#wrap">레이어 팝업 닫기</a></p></div></div>')
			$target.append('<div id="mask" class="layer_part"></div><div class="layer_echo_pop layer_part"><p class="btn_arrow"><a href="#wrap" class="btn_prev"><span class="blind">이전</span></a><a href="#wrap" class="btn_next"><span class="blind">다음</span></a></p><div class="content_pop"><h4><strong>' +  _tit + '</strong></h4><p class="p_subtit">' +  _subtit + '<span></span></p><p class="txt_area">' +  _content + '</p><p class="sns_area_w"><a href="#wrap" class="sns_1" onclick="javascript:shareFB(' + idx + ', \'echo\');"><span lass="blind">페이스북으로 공유하기</span></a><a href="#wrap" class="sns_2" onclick="javascript:shareTwitter(' + idx + ', \'echo\');"><span class="blind">트위터으로 공유하기</span></a><a href="#wrap" class="sns_3" onclick="javascript:shareGooglePlus(' + idx + ', \'echo\');"><span class="blind">인스타그램으로 공유하기</span></a><a href="#wrap" class="sns_4" onclick="javascript:shareKakaoStory(' + idx + ', \'echo\');"><span class="blind">구글플러스으로 공유하기</span></a><a href="#wrap" class="sns_5" onclick="javascript:sharePinterest(' + idx + ', \'echo\');"><span class="blind">핀터레스트으로 공유하기</span></a></p><p class="btn_close"><a href="#wrap">레이어 팝업 닫기</a></p></div></div>');
			if (_winWid < 380 ){
				$target.find('.layer_echo_pop').css({ height : _hgt , marginTop : (-1 * (_hgt / 2)) + 30 + 'px' });
			}
			$target.find('.layer_part').css({ opacity : ' 0' });
			$target.find('#mask').animate({ opacity : '0.7'});
			$target.find('.layer_echo_pop').animate({ opacity : '1'});
		}
	}());
	// history ajax
	var HISTORYAJAX = (function(){
		var $base = $('.history_ajax'),
			$ul = $base.find(' > ul '),
			$li = $ul.find(' > li'),
			$view = $base.find('.openMask'),
			_size = $li.size(),
			_cur = 0;
		//  레이어 열기
		$view.bind('click',function(){
			var $this = $(this),
				_idx = $(this).closest('li').index();
			if ($this.hasClass('on')){
				delLayer();
				$this.removeClass('on').text('View more');
			} else {
				historyAjax(_idx);
				$li.find('.openMask').filter('.on').removeClass('on').text('View more');
				$this.addClass('on').text('Close');
			}
			_cur = _idx;
			return false;
		});
		function historyAjax(idx,type){
			$('body').append('<p class="p_loading"><img src="/SPA-2001/asan/kor/images/common/ajax-loader.gif" alt="loading" /></p>');
			$.ajax({
				type:"GET",
				url:'history.jsp',
				dataType : 'json',
				success:function(json){
					$('.p_loading').remove();
					var ajax_list = json.HISTORY_LIST,
						ajax_counter = ajax_list.length;
					var history_list = ajax_list[idx],
						history_tit = history_list.tit,
						history_img = history_list.img,
						history_content = history_list.content;
					var _hgt = $(window).height() - 100;
					delLayer();
					$li.eq(idx).find('.btn_view').before('<div id="mask" class="layer_part"></div><div class="layer_history_pop layer_part window"><p class="btn_arrow"><a href="#" class="btn_prev"><span class="blind">Prev</span></a><a href="#" class="btn_next"><span class="blind">Next</span></a></p><div class="content_pop"><h4>' + history_tit +'</h4><p class="img"><img src="/SPA-2001/asan/kor/images/history/' + history_img + '.jpg" alt="'+ history_tit +'" /></p><p class="txt_area">' + history_content + '</p><p class="btn_close"><a href="#wrap">레이어 팝업 닫기</a></p></div></div>')
					if (_winWid > 380){
						$li.eq(idx).find('.layer_history_pop').css({ height : _hgt , marginTop : -1 * (_hgt / 2) + 'px' });
						$li.eq(idx).find('.layer_history_pop .content_pop').css({ height : _hgt - 120 + 'px' });
						$li.eq(idx).find('.layer_history_pop .txt_area').css({ height : _hgt - 460 + 'px' });
						if (type != 'on'){
							$li.eq(idx).find('.layer_part').css({ opacity : ' 0' });
							$li.eq(idx).find('#mask').animate({ opacity : '0.7'});
						} else {
							$li.eq(idx).find('#mask').css({ opacity : '0.7'});
						}
					} else {
						$li.eq(idx).find('.layer_history_pop').css({ display : 'none' });
						$li.eq(idx).find('.layer_history_pop').slideDown(200);
					}
					$li.eq(idx).find('.layer_history_pop').animate({ opacity : '1'});
				}
			});
		};
		// 닫기 버튼
		$(document).on('click','.history_ajax .btn_close a',function(){
			delLayer('close');
			$li.find('.openMask').filter('.on').removeClass('on').text('View more');
			return false;
		});
		// 레이어 종료
		function delLayer(type){
			var $li = $('.history_ajax li .layer_part').filter(':visible').closest('li');
			$('.history_ajax li .layer_part').fadeOut(function(){
				$(this).remove();
			});
			if (type == 'close'){
				$li.find(' > div > a').focus();
			}
		}
		// 좌우 화살표
		$(document).on('click','.history_ajax .btn_arrow a',function(){
			var $this = $(this),
				_class = $this.attr('class');
			switch(_class){
				case 'btn_prev':
					_cur--;
				break;
				case 'btn_next':
					_cur++;
				break;
			}
			if(_cur > _size - 1){
				_cur = _size - 1;
				return false;
			} else if (_cur < 0 ){
				_cur = 0;
				return false;
			}
			historyAjax(_cur,'on');
			return false;
		})
	}());
	// book ajax
	var BOOKAJAX = (function(){
		var $base = $('.tbl_book_1'),
			$more = $base.next('.btn_more_view');
		var _page = 10,
			_old = 0,
			_cur = 0,
			_max;
		// tbl용 변수
		var _tblTemp = 'off';
		$( window ).bind('resize',function(e){
			clearTimeout(resizeEvt);
			var resizeEvt = setTimeout(function() {
				startResize(_winWid);
			}, 50);
		});
		// table type1 일반형태 및 tbody에 th 있는경우
		function startResize(width){
			if (width <= 380 ) {
				replaceTd(380);
			} else {
				replaceTd(800);
			}
		}
		// 테이블 모바일 변환
		function replaceTd(width) {
			var _tblSize = $('.tb_list').size();
			for (var i = 0; i < _tblSize; i++){
				var $this = $('.tb_list').eq(i),
					$arrTh = [],
					$arrTh1 = [],
					$th = $this.find('thead th'),
					$tr = $this.find('tbody tr'),
					$tf = $this.find('tfoot tr'),
					$tbodyTh = $this.find('tbody th'),
					$tfootTh = $this.find('tfoot th'),
					$td = $tr.find('td');
					$tfootTd = $this.find('tfoot td');
					_sizeTh = $th.size();
					_sizeTr = $tr.size();
				for (var j = 0; j < _sizeTh; j++){
					$arrTh.push($th.eq(j).text());
				}
				// tbody에 th 있을 경우 thead 첫번째 th 삭제
				if (typeof $tbodyTh.html() != 'undefined'){
					$arrTh.splice(0,1);
				}
				for (var j = 0; j < _sizeTr; j++){
					if ($tbodyTh.eq(j).attr('rowspan')){
						var $rowSpan = $tbodyTh.eq(j).attr('rowspan');
						for (var k = 0; k < $rowSpan; k++){
							$arrTh1.push($tbodyTh.eq(j).text());
						}
					} else {
						$arrTh1.push($tbodyTh.eq(j).text());
					}
				}
				if (width == 380 && _tblTemp == 'off'){
					for (var j = 0; j < _sizeTr; j++){
						var $td = $tr.eq(j).find('td');
						if (!$td.find('.th_span').length){
							$td.prepend('<span class="th_span"></span>');
							for (var k = 0; k < _sizeTh; k++){
								$td.eq(k).find('.th_span').append($arrTh1[j]).append(' ' + $arrTh[k]);
							}
						}
					}
					if (i + 1 == _tblSize){
						_tblTemp = 'on';
					}
				} else if (width != 380) {
					$td.find('.th_span').remove();
					_tblTemp = 'off';
				}
			};
		}
		// 더보기 버튼
		$more.bind('click',function(){
			bookAjax('more');
			return false;
		});
		if ($('.tbl_book_1').length){
			if (_winWid < 380 ){
				moMore();
			}
			$(window).resize(function(){
				if (_winWid > 380 ){
					return;
				} else {
					moMore();
				}
			});
		}
		function moMore(){
			$( window ).bind('scroll',function(){
				var _scrollTop = $(window).scrollTop() + _winHgt,
					_docHgt = $('body, html').height();
				if ((_docHgt - 70) <= _scrollTop ){
					bookAjax('more');
					_tblTemp = 'off';
				}
			});
		}
		if ($('.tbl_book_1').length){
			bookAjax();
		}
		function bookAjax(type){
			$('body').append('<p class="p_loading"><img src="/SPA-2001/asan/kor/images/common/ajax-loader.gif" alt="loading" /></p>');
			$.ajax({
				type:"GET",
				url:'book.jsp',
				dataType : 'json',
				success:function(json){
					$('.p_loading').remove();
					$base.find('.tr_first').remove();
					_old = _cur;
					_max = _old + _page;
					var ajax_list = json.BOOK_LIST,
						ajax_counter = ajax_list.length;
					if (_max > ajax_counter){
						_max = ajax_counter;
						$more.remove();
						_temp = true;
					}
					for (var i = _old; i < _max; i++){
						var book_list = ajax_list[i],
							book_td1 = book_list.td1,
							book_td2 = book_list.td2,
							book_td3 = book_list.td3,
							book_td4 = book_list.td4;
						$base.find('tbody').append('<tr><td>' + book_td1 + '</td><td>' + book_td2 + '</td><td>' + book_td3 + '</td><td>' + book_td4 + '</td></tr>');
						$base.find('tr').eq(i).css({ opacity : ' 0' });
						$base.find('tr').eq(i).animate({ opacity : '1'});
					}
					_cur = _cur + _page;
					startResize(_winWid);
				}
			});
		};
	}());
	// photo list
	var PHOTOASAN = (function(){
		var $base = $('#photoList'),
			$more = $base.next('.btn_more_view');
		var _page = 12,
			_old = 0,
			_cur = 0,
			_size = 0,
			_max,
			_arr = [];
		var _old_1 = 0,
			_cur_1 = 0,
			_temp = false;
		// 더보기 버튼
		if ($('#photoList').length){
			if (_winWid < 380 ){
				moMore();
			}
			$(window).resize(function(){
				if (_winWid > 380 ){
					return;
				} else {
					moMore();
				}
			});
		}
		function moMore(){
			$( window ).bind('scroll',function(){
				if (_temp){
					return;
				}
				var _scrollTop = $(window).scrollTop() + _winHgt,
					_docHgt = $('body, html').height();
				if ((_docHgt - 70) <= _scrollTop ){
					photoAjax('more',$(window).scrollTop());
				}
			});
		}
		// 더보기 버튼
		$more.bind('click',function(){
			var _scrollTop = $(window).scrollTop();
			photoAjax('more',_scrollTop);
			return false;
		});
		if ($('#photoList').length){
			// 사진 리스트
			photoAjax();
			// url 바로 확인
			var _url = location.href.split('?')[1];
			if (typeof _url != 'undefined'){
				_url = _url.split('=')[1];
				viewContent(_url);
			}
		}
		function photoAjax(type,scrollT){
			$('body').append('<p class="p_loading"><img src="/SPA-2001/asan/kor/images/common/ajax-loader.gif" alt="loading" /></p>');
			_temp = true;
			$.ajax({
				type:"GET",
				url:'photo.jsp',
				dataType : 'json',
				success:function(json){
					$base.find('.li_first').remove();
					_old = _cur;
					_max = _old + _page;
					var ajax_list = json.PHOTO_LIST,
						ajax_counter = ajax_list.length;
					_size = ajax_counter;
					if (_max > ajax_counter){
						_max = ajax_counter;
						$more.remove();
						_temp = true;
					}
					for (var i = 0; i < ajax_counter; i++){
						var photo_list = ajax_list[i],
							photo_type = photo_list.type,
							_txt = i;
						if (photo_type == 'title'){
							_txt = 'tit';
						}
						_arr.push(_txt);
					}
					for (var i = _old; i < _max; i++){
						var photo_list = ajax_list[i],
							photo_type = photo_list.type,
							photo_tit = photo_list.tit,
							photo_category = photo_list.category,
							photo_img1 = photo_list.img1,
							photo_img2 = photo_list.img2,
							photo_content = photo_list.content;
						if (photo_type == 'title'){
							$base.append('<div class="item cate_tit cate_tit' + photo_category + '"><div><h3>' + photo_tit + '</h3><p class="p_img"><img src="/SPA-2001/asan/kor/images/history/thumb/' + photo_img1 + '.jpg" alt="' + photo_tit + '" /></p></div></div>');
						} else {
							$base.append('<div class="item"><p><img src="/SPA-2001/asan/kor/images/history/thumb/' + photo_img1 + '.jpg" alt="' + photo_tit + '" /><a href="#wrap" class="openMask">View more</a></p></div>');
						}
						$base.find('.item').eq(i).css({ opacity : ' 0' });
						$base.find('.item').eq(i).animate({ opacity : '1'});
					}
					if (type == 'more'){
						$base.find('.item').eq(_old).find(' .openMask').focus();
					}
					_cur = _cur + _page;
				},
				complete:function(){
					$( '#photoList' ).imagesLoaded( function() {
						photoSet();
					})
					scrollCurrent(scrollT);
				}
			});
		};
		function scrollCurrent(scrollT){
			$('body, html').scrollTop(scrollT);
		}
		function photoSet(){
			var container = document.querySelector('#photoList');
			var msnry = new Masonry( container, {
				itemSelector: '.item',
				columnWidth:1
			});
			$('.p_loading').remove();
			_temp = false;
		}
		// 레이어 열기
		$(document).on('click','#photoList .openMask',function(){
			var _idx = $(this).closest('div').index();
			viewContent(_idx);
			return false;
		});
		// 닫기 버튼
		$(document).on('click','#photoList .btn_close a',function(){
			delLayer('close');
			return false;
		});
		// 레이어 종료
		function delLayer(type){
			var $div = $('#photodivst > div .layer_part').filter(':visible').closest('div');
			$('#photoList > div .layer_part').filter(':visible').fadeOut(function(){
				$(this).remove();
			});
			if (type == 'close'){
				$div.find(' .openMask').focus();
			}
		}
		$(document).on('click','#photoList .btn_arrow a',function(){
			var $this = $(this),
				_class = $this.attr('class');
			switch(_class){
				case 'btn_prev':
					_cur_1--;
				break;
				case 'btn_next':
					_cur_1++;
				break;
			}
			if (_arr[_cur_1] == 'tit' && _class == 'btn_prev'){
				_cur_1--;
			} else if (_arr[_cur_1] == 'tit' && _class == 'btn_next'){
				_cur_1++;
			}
			if(_cur_1 > _size - 1){
				_cur_1 = _size - 1;
				return false;
			} else if (_cur_1 < 0 ){
				_cur_1 = 0;
				return false;
			}
			viewContent(_cur_1,'on');
			return false;
		})
		// 레이어 팝업
		function viewContent(idx, type){
			delLayer();
			$('body').append('<p class="p_loading"><img src="/SPA-2001/asan/kor/images/common/ajax-loader.gif" alt="loading" /></p>');
			// 현재 불러온 페이지 이외의 레이어 호출 시
			var _div = $base.find(' > div').size();
			if (_div <= idx || _div <= _cur_1) {
				var _num = Math.ceil(idx / _page);
				for (var i = 0; i < _num; i++){
					photoAjax('more');
				}
			}
			$.ajax({
				type:"GET",
				url:'photo.jsp',
				dataType : 'json',
				success:function(json){
					$('.p_loading').remove();
					_cur_1 = idx;
					var _hgt = $(window).height() - 80;
					var ajax_list = json.PHOTO_LIST,
						ajax_counter = ajax_list.length;
					var photo_list = ajax_list[idx],
						photo_type = photo_list.type,
						photo_tit = photo_list.tit,
						photo_category = photo_list.category,
						photo_img1 = photo_list.img1,
						photo_content = photo_list.content;
//					$base.find(' > div').eq(idx).append('<div id="mask" class="layer_part"></div><div class="layer_part layer_photo_pop window"><p class="btn_arrow"><a href="#wrap" class="btn_prev"><span class="blind">이전</span></a><a href="#wrap" class="btn_next"><span class="blind">다음</span></a></p><div class="content_pop"><p class="img_area"><img src="/SPA-2001/asan/kor/images/history/' + photo_img2 + '.jpg" alt="' + photo_tit + '" /></p><div class="txt_area"><div>' + photo_content + '</div></div><p class="sns_area_w"><a href="#wrap" class="sns_1"><span lass="blind">페이스북</span></a><a href="#wrap" class="sns_2"><span class="blind">트위터</span></a><a href="#wrap" class="sns_3"><span class="blind">인스타그램</span></a><a href="#wrap" class="sns_4"><span class="blind">글플러스</span></a><a href="#wrap" class="sns_5"><span class="blind">핀터레스트</span></a></p><p class="btn_close"><a href="#wrap">레이어 팝업 닫기</a></p></div></div>')
					$base.find(' > div').eq(idx).append('<div id="mask" class="layer_part"></div><div class="layer_part layer_photo_pop window"><p class="btn_arrow"><a href="#wrap" class="btn_prev"><span class="blind">Prev</span></a><a href="#wrap" class="btn_next"><span class="blind">Next</span></a></p><div class="content_pop"><p class="img_area"><img src="/SPA-2001/asan/kor/images/history/' + photo_img1 + '.jpg" alt="' + photo_tit + '" /></p><div class="txt_area"><div>' + photo_content + '</div></div><p class="sns_area_w"><a href="#wrap" class="sns_1" onclick="shareFB(' + idx + ', \'photo\')"><span lass="blind">Facebook</span></a><a href="#wrap" class="sns_2" onclick="shareTwitter(\'' + idx + '\', \'' + photo_content + '\', \'photo\')"><span class="blind">Twitter</span></a><a href="#wrap" class="sns_3" onclick="shareGooglePlus(' + idx + ', \'photo\')"><span class="blind">KakaoStory</span></a><a href="#wrap" class="sns_4" onclick="shareKakaoStory(' + idx + ', \'photo\')"><span class="blind">Google plus</span></a><a href="#wrap" class="sns_5" onclick="sharePinterest(\'' + idx + '|' + photo_img1 + '\',\'' + photo_tit + ' ' + photo_content + '\', \'photo\')"><span class="blind">Pinterest</span></a></p><p class="btn_close"><a href="#wrap">Layer popup close</a></p></div></div>')
					$base.find(' > div').eq(idx).find('.layer_photo_pop').css({ height : _hgt , marginTop : (-1 * (_hgt / 2)) + 30 + 'px' });
					$base.find(' > div').eq(idx).find('.layer_photo_pop .content_pop').css({ height : _hgt - 120 + 'px' });
					$base.find(' > div').eq(idx).find('.layer_photo_pop .img_area').css({ height : (_hgt * 0.7) + 'px' });
					var _txtHgt = $base.find(' > div').eq(idx).find('.layer_photo_pop .txt_area > div').height();
					if (_txtHgt > _hgt * 0.15 ){
						$base.find(' > div').eq(idx).find('.layer_photo_pop .txt_area > div').css({ overflowY : 'scroll' });
					} else {
						$base.find(' > div').eq(idx).find('.layer_photo_pop .txt_area > div').css({ overflowY : 'hidden' });
					}
					$base.find(' > div').eq(idx).find('.layer_photo_pop .txt_area > div').css({ height : (_hgt * 0.13) + 'px' });
					$base.find('.layer_part').css({ opacity : ' 0' });
					$base.find('#mask').animate({ opacity : '0.7'});
					$base.find('.layer_photo_pop').animate({ opacity : '1'});
					if (type != 'on'){
						$base.find(' > div').eq(idx).find('.layer_part').css({ opacity : ' 0' });
						$base.find(' > div').eq(idx).find('#mask').animate({ opacity : '0.7'});
					} else {
						$base.find(' > div').eq(idx).find('#mask').css({ opacity : '0.7'});
						$base.find(' > div').eq(idx).find('.layer_part .btn_prev').focus();
					}
					$base.find(' > div').eq(idx).find('.layer_history_pop').animate({ opacity : '1'});
				},
			});
		}
	}());
	// dream list
	var DERAMPHOTO = (function(){
		var $base = $('.dream_list'),
			$box = $base.find(' > li');
		$box.bind('mouseenter mouseleave',function(e){
			var $this = $(this),
				$photo = $this.find('.p_photo');
			switch(e.type){
				case 'mouseenter':
					$photo.css({ '-webkit-transform' : 'scale(1.1)' , '-o-transform' : 'scale(1.1)' , '-moz-transform' : 'scale(1.1)' , '-ms-transform' : 'scale(1.1)' , 'transform' : 'scale(1.1)' , '-webkit-transition' : 'all 0.2s ease-out', '-o-transition' : 'all 0.2s ease-out', '-moz-transition' : 'all 0.2s ease-out', '-ms-transition' : 'all 0.2s ease-out', 'transition' : 'all 0.2s ease-out' });
				break;
				case 'mouseleave':
					$photo.css({ '-webkit-transform' : 'scale(1)' , '-o-transform' : 'scale(1)' , '-moz-transform' : 'scale(1)' , '-ms-transform' : 'scale(1)' , 'transform' : 'scale(1)' , '-webkit-transition' : 'all 0.2s ease-out', '-o-transition' : 'all 0.2s ease-out', '-moz-transition' : 'all 0.2s ease-out', '-ms-transition' : 'all 0.2s ease-out', 'transition' : 'all 0.2s ease-out' });
				break;
			}
		})
	}());
});