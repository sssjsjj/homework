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
	// $("#header").load("/kor/html/header.html"); 
	// $("#footer").load("/kor/html/footer.html"); 

	// history_main
	var HISTORYMAIN = (function(){
		var $base = $('.histroy_list_1'),
			$li = $base.find(' > li'),
			$link = $li.find('a');
		$link.bind('mouseenter mouseleave',function(e){
			var $this = $(this),
				$img1 = $this.find('.img_1 img');
				$img2 = $this.find('.img_2 img');
			switch(e.type){
				case 'mouseenter':
					$img1.delay(100).animate({ top : '-100%'},300);
					$img2.animate({ top : '-107%'},300);
				break;
				case 'mouseleave':
					$img1.animate({ top : '0'},300);
					$img2.delay(100).animate({ top : '0'},300);
				break;
			}
		})
	}());
	// h1 등장
	var HEADING = (function(){
		var $heading = $('.sub_visual h1');
		if ($('.sub_visual').length){
			$heading.css({ display : 'block' , opacity : '0' }).delay(500).animate({ paddingTop : '74px' , opacity : '1' });
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
			_cur = 0;
		if ($('.img_navi_area').length){
			$ul.css({ width : _wid * _size + 'px' });
			if (_size < 6){
				$arrow.remove();
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
		}
		function viewContent(idx){
			var _winWid = 1240,
				// _left = -1 * idx * _winWid;
				_left = -1 * _winWid;
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
			if (_current < (-1 * _wid * _size) + 1240 ){
				_current = (-1 * _wid * _size) + 1240 ;
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
			_max;
		// 더보기 버튼
		$more.bind('click',function(){
			echoAjax('more');
			return false;
		});
		if ($('.echo_ajax').length){
			echoAjax();
		}
		function echoAjax(type){
			$.ajax({
				type:"GET",
				url:'echo.html',
				dataType : 'json',
				success:function(json){
					$base.find('.li_first').remove();
					$('.p_loading').remove();
					_old = _cur;
					_max = _old + _page;
					var ajax_list = json.ECHO_LIST,
						ajax_counter = ajax_list.length;
					if (_max > ajax_counter){
						_max = ajax_counter;
						$more.remove();
					}
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
							$base.append('<li><div class="box_wrap"><div class="li_div"><h4><strong>' + echo_tit + '</strong></h4><span class="span_subtit">' + echo_subtit + '</span><p class="txt_area">' + echo_content + '</p></div><a href="#wrap" class="openMask"><strong>자세히 보기</strong></a></div></li>');
						}
						$base.find('li').eq(i).css({ opacity : ' 0' });
						$base.find('li').eq(i).animate({ opacity : '1'});
					}
					if (type == 'more'){
						$base.find('li').eq(_old).find(' > div > a').focus();
					}
					_cur = _cur + _page;
				}
			});
		};
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
		// 레이어 종료
		function delLayer(type){
			var $li = $('.echo_ajax li .layer_part').filter(':visible').closest('li');
			$('.echo_ajax li .layer_part').filter(':visible').fadeOut(function(){
				$(this).remove();
			});
			if (type == 'close'){
				$li.find(' > div > a').focus();
			}
		}
		// 레이어 팝업
		function viewContent(idx){
			delLayer()
			var $target = $('.echo_ajax li').eq(idx),
				_tit = $target.find('h4 strong').html(),
				_subtit = $target.find('.span_subtit').html(),
				_content = $target.find('.txt_area').html();
			$target.append('<div id="mask" class="layer_part"></div><div class="layer_echo_pop layer_part"><div class="content_pop"><h4><strong>' +  _tit + '</strong></h4><p class="p_subtit">' +  _subtit + '<span></span></p><p class="txt_area">' +  _content + '</p><p class="sns_area_w"><a href="#wrap" class="sns_1"><span lass="blind">페이스북</span></a><a href="#wrap" class="sns_2"><span class="blind">트위터</span></a><a href="#wrap" class="sns_3"><span class="blind">인스타그램</span></a><a href="#wrap" class="sns_4"><span class="blind">글플러스</span></a><a href="#wrap" class="sns_5"><span class="blind">핀터레스트</span></a></p><p class="btn_close"><a href="#wrap">레이어 팝업 닫기</a></p></div></div>')
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
			var _idx = $(this).closest('li').index();
			historyAjax(_idx);
			_cur = _idx;
			return false;
		});
		function historyAjax(idx,type){
			$.ajax({
				type:"GET",
				url:'history.html',
				dataType : 'json',
				success:function(json){
					var ajax_list = json.HISTORY_LIST,
						ajax_counter = ajax_list.length;
					var history_list = ajax_list[idx],
						history_tit = history_list.tit,
						history_img = history_list.img,
						history_content = history_list.content;
					var _hgt = $(window).height() - 100;
					delLayer();
					$li.eq(idx).append('<div id="mask" class="layer_part"></div><div class="layer_history_pop layer_part window"><p class="btn_arrow"><a href="#" class="btn_prev"><span class="blind">이전</span></a><a href="#" class="btn_next"><span class="blind">다음</span></a></p><div class="content_pop"><h4>' + history_tit +'</h4><p class="img"><img src="/SPA-2001/asan/kor/images/history/' + history_img + '.jpg" alt="'+ history_tit +'" /></p><p class="txt_area">' + history_content + '</p><p class="btn_close"><a href="#wrap">레이어 팝업 닫기</a></p></div></div>')
					$li.eq(idx).find('.layer_history_pop').css({ height : _hgt , marginTop : -1 * (_hgt / 2) + 'px' });
					$li.eq(idx).find('.layer_history_pop .content_pop').css({ height : _hgt - 120 + 'px' });
					$li.eq(idx).find('.layer_history_pop .txt_area').css({ height : _hgt - 460 + 'px' });
					if (type != 'on'){
						$li.eq(idx).find('.layer_part').css({ opacity : ' 0' });
						$li.eq(idx).find('#mask').animate({ opacity : '0.7'});
					} else {
						$li.eq(idx).find('#mask').css({ opacity : '0.7'});
					}
					$li.eq(idx).find('.layer_history_pop').animate({ opacity : '1'});
				}
			});
		};
		// 닫기 버튼
		$(document).on('click','.history_ajax .btn_close a',function(){
			delLayer('close');
			return false;
		});
		// 레이어 종료
		function delLayer(type){
			var $li = $('.history_ajax li .layer_part').filter(':visible').closest('li');
			$('.history_ajax li .layer_part').filter(':visible').fadeOut(function(){
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
		// 더보기 버튼
		$more.bind('click',function(){
			bookAjax('more');
			return false;
		});
		if ($('.tbl_book_1').length){
			bookAjax();
		}
		function bookAjax(type){
			$.ajax({
				type:"GET",
				url:'book.html',
				dataType : 'json',
				success:function(json){
					$base.find('.tr_first').remove();
					_old = _cur;
					_max = _old + _page;
					var ajax_list = json.BOOK_LIST,
						ajax_counter = ajax_list.length;
					if (_max > ajax_counter){
						_max = ajax_counter;
						$more.remove();
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
			_max;
		var _old_1 = 0,
			_cur_1 = 0;
		// 더보기 버튼
		$more.bind('click',function(){
			photoAjax('more');
			return false;
		});
		if ($('#photoList').length){
			photoAjax();
		}
		function photoAjax(type){
			$.ajax({
				type:"GET",
				url:'photo.html',
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
							$base.append('<div class="item cate_tit cate_tit' + photo_category + '"><h3>' + photo_tit + '</h3><p class="p_img"><img src="/SPA-2001/asan/kor/images/history/' + photo_img1 + '.jpg" alt="' + photo_tit + '" /></p></div>');
						} else {
							$base.append('<div class="item"><p><img src="/SPA-2001/asan/kor/images/history/' + photo_img1 + '.jpg" alt="' + photo_tit + '" /></p><a href="#wrap" class="openMask">자세히 보기</a></div>');
						}
						$base.find('.item').eq(i).css({ opacity : ' 0' });
						$base.find('.item').eq(i).animate({ opacity : '1'});
					}
					_cur = _cur + _page;
				},
				complete:function(){
					$( '#photoList' ).imagesLoaded( function() {
						photoSet();
					})
				}
			});
		};
		function photoSet(){
			var container = document.querySelector('#photoList');
			var msnry = new Masonry( container, {
				itemSelector: '.item',
				columnWidth:1
			});
		}
		//  레이어 열기
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
				$div.find(' > div > a').focus();
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
			$.ajax({
				type:"GET",
				url:'photo.html',
				dataType : 'json',
				success:function(json){
					$base.find('.li_first').remove();
					var _hgt = $(window).height() - 100;
					var ajax_list = json.PHOTO_LIST,
						ajax_counter = ajax_list.length;
					var photo_list = ajax_list[idx],
						photo_type = photo_list.type,
						photo_tit = photo_list.tit,
						photo_category = photo_list.category,
						photo_img1 = photo_list.img1,
						photo_img2 = photo_list.img2,
						photo_content = photo_list.content;
					$base.find(' > div').eq(idx).append('<div id="mask" class="layer_part"></div><div class="layer_part layer_photo_pop window"><p class="btn_arrow"><a href="#wrap" class="btn_prev"><span class="blind">이전</span></a><a href="#wrap" class="btn_next"><span class="blind">다음</span></a></p><div class="content_pop"><p class="img_area"><img src="/SPA-2001/asan/kor/images/history/' + photo_img1 + '.jpg" alt="' + photo_tit + '" /></p><p class="txt_area">' + photo_content + '</p><p class="sns_area_w"><a href="#wrap" class="sns_1"><span lass="blind">페이스북</span></a><a href="#wrap" class="sns_2"><span class="blind">트위터</span></a><a href="#wrap" class="sns_3"><span class="blind">인스타그램</span></a><a href="#wrap" class="sns_4"><span class="blind">글플러스</span></a><a href="#wrap" class="sns_5"><span class="blind">핀터레스트</span></a></p><p class="btn_close"><a href="#wrap">레이어 팝업 닫기</a></p></div></div>')
					$base.find(' > div').eq(idx).find('.layer_photo_pop').css({ height : _hgt , marginTop : -1 * (_hgt / 2) + 'px' });
					$base.find(' > div').eq(idx).find('.layer_photo_pop .content_pop').css({ height : _hgt - 120 + 'px' });
					$base.find(' > div').eq(idx).find('.layer_photo_pop .txt_area').css({ height : _hgt - 460 + 'px' });
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




// 2001
// gnb
