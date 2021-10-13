
var photoTitle ="[Chung Juyung] Photos";
var echoTitle ="[Chung Juyung] Quotes";

		var shareURL = "http://asan01.ipartners.co.kr/eng/html/main.jsp";
		var shareDesc = "Chung Juyung";
		var shareDetail = "A creative challenger, Asan Chung Juyoung. His philosophy and achievements will be seen through the dreams he had, the footsteps he went along and the quotes he said.";
//		var shareImg = "http://asan01.ipartners.co.kr/kor/images/common/SNS.jpg";
		var shareImgBase = "http://asan01.ipartners.co.kr/eng/images/"
		var shareImg = shareImgBase + "common/SNS.jpg";
		var shareImgRandBase ="http://asan01.ipartners.co.kr/eng/images/";


		var currURL = window.location.href;
		if(window.location.href.indexOf('#') > 0)
			currURL = window.location.href.substring(0, window.location.href.indexOf('#'));


		function getQueryString(title, content) {
			var queryString = "";
			if(currURL.indexOf('?') >0)
				queryString += "&";
			else
				queryString += "?";
			queryString += "shareTitle=" + encodeURIComponent(title);

			if(typeof content != "undefined")
				queryString += "&shareContent=" + encodeURIComponent(content);
			return queryString;	
		}


		function shareFB(idx, type) {
			if(typeof idx == "undefined"){
				window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(shareURL));
				return;
			}
			if(type == 'photo') {
				window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(currURL+getQueryString(idx)));
			}
			else if(type == 'echo') {
				var $target = $('.echo_ajax li').eq(idx),
					_tit = $target.find('h4 strong').html(),
					_subtit = $target.find('.span_subtit').html(),
					_content = $target.find('.txt_area').html();
//				window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(currURL+getQueryString(_tit,_subtit)));
				window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(currURL+getQueryString(idx)));
			}
		}

		function shareTwitter(idx, idx2, type) {
			if(typeof idx == "undefined"){
				var url = "https://twitter.com/intent/tweet?url=" + encodeURIComponent(shareURL ) + "&text=" + encodeURIComponent(shareDesc + " " + shareDetail.replace(",", " ").replace("'", "")) + "&original_referer=" + encodeURIComponent(shareURL) ;
				window.open( url , "_blank" );
				return;
			}
			if(type == 'photo') {
				var msg = photoTitle + " - " + idx2;
				if(msg.length > 140)
					msg = msg.substring(0,140-23); //오버되는 글자 자르기
				var url = "https://twitter.com/intent/tweet?url=" + encodeURIComponent(currURL+getQueryString(idx)) + "&text=" + encodeURIComponent(msg) + "&original_referer=" + encodeURIComponent(currURL+getQueryString(idx)) ;
				window.open( url , "_blank" );
			}
			else if(idx2 == 'echo') {
				var $target = $('.echo_ajax li').eq(idx),
					_tit = $target.find('h4 strong').html(),
					_subtit = $target.find('.span_subtit').html(),
					_content = $target.find('.txt_area').html();
//				var msg = _tit + " " + _subtit + " " + _content;
				var msg = echoTitle + " - " + _content;

				var totalLength = msg.length;//+ currURL+.length;
				if(msg.length > 140)
					msg = msg.substring(0,140-23); //오버되는 글자 자르기
				
				var url = "https://twitter.com/intent/tweet?url=" + encodeURIComponent(currURL+getQueryString(idx)) + "&text=" + encodeURIComponent(msg) + "&original_referer=" + encodeURIComponent(currURL+getQueryString(idx)) ;
				window.open( url , "_blank" );
			}
		}


		function shareGooglePlus(idx, type) {
			if(typeof idx == "undefined"){
				window.open("https://plusone.google.com/_/+1/confirm?hl=ko&url=" + encodeURIComponent(shareURL) + "&title=" + "MYTITLE" , "_blank");
				return;
			}
			if(type == 'photo') {
//				window.open("https://plusone.google.com/_/+1/confirm?hl=ko&url=" + encodeURIComponent(currURL+getQueryString(idx)));
				window.open("https://plus.google.com/share?url=" + encodeURIComponent(currURL+getQueryString(idx)));
			}
			else if(type == 'echo') {
				var $target = $('.echo_ajax li').eq(idx),
					_tit = $target.find('h4 strong').html(),
					_subtit = $target.find('.span_subtit').html(),
					_content = $target.find('.txt_area').html();
				window.open("https://plusone.google.com/_/+1/confirm?hl=ko&url=" + encodeURIComponent(currURL+getQueryString(idx))  , "_blank");
			}
		}



		function sharePinterest(idx, idx2, type) {
			if(typeof idx == "undefined"){
				var url = 'https://pinterest.com/pin/create/button/?url=' + encodeURIComponent(shareURL) + '&media=' + encodeURIComponent(shareImg) + '&description=' + encodeURIComponent("[" + shareDesc + "]" + shareDetail);
				window.open(url , "_blank");
				return;
			}
			if(type == 'photo') {
				var img = shareImgBase + "/history/" + idx.split('|')[1] + ".jpg";
				var url = 'https://pinterest.com/pin/create/button/?url=' + encodeURIComponent(currURL+getQueryString(idx.split('|')[0])) + '&media=' + img + '&description=' + encodeURIComponent(photoTitle + " - " + idx2);
				window.open(url , "_blank");
			}
			else if(idx2 == 'echo') {
				var rand = Math.floor(Math.random() * 10) + 1;
				var img = shareImgRandBase + "sns/asan_" + rand + ".jpg";

				var $target = $('.echo_ajax li').eq(idx),
					_tit = $target.find('h4 strong').html(),
					_subtit = $target.find('.span_subtit').html(),
					_content = $target.find('.txt_area').html();
//				var url = 'https://pinterest.com/pin/create/button/?url=' + encodeURIComponent(currURL+getQueryString(idx)) + '&media=' + shareImg + '&description=' + encodeURIComponent(_tit + ' ' + _subtit + ' ' + _content);
				var url = 'https://pinterest.com/pin/create/button/?url=' + encodeURIComponent(currURL+getQueryString(idx)) + '&media=' + img + '&description=' + encodeURIComponent(echoTitle + ' - ' + _content);
				window.open(url , "_blank");
			}
		}


		function shareKakaoStory(idx, type) {
			if(typeof idx == "undefined"){
				var url = 'https://story.kakao.com/share?url=' + encodeURIComponent(shareURL + "?type=kakao");
				window.open(url, 'KakaoStoryPopup','width=600, height=460, resizable=no, scrollbars=yes, status=no');
				return;
			}
			if(type == 'photo') {
				window.open("https://story.kakao.com/share?url=" + encodeURIComponent(currURL+getQueryString(idx) + "&type=kakao") ,'KakaoStoryPopup','width=600, height=460, resizable=no, scrollbars=yes, status=no');
//				window.open('https://story.kakao.com/share?url=' + _Url,'KakaoStoryPopup','width=600, height=460, resizable=no, scrollbars=yes, status=no');
			}
			else if(type == 'echo') {
				var $target = $('.echo_ajax li').eq(idx),
					_tit = $target.find('h4 strong').html(),
					_subtit = $target.find('.span_subtit').html(),
					_content = $target.find('.txt_area').html();
				window.open("https://story.kakao.com/share?url=" + encodeURIComponent(currURL+getQueryString(idx) + "&type=kakao"),'KakaoStoryPopup','width=600, height=460, resizable=no, scrollbars=yes, status=no');

			}

		}