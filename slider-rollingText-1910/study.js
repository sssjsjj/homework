/*jshint esversion: 6 */
function log(code) {
  console.log(code);
}

// START: 롤링 텍스트 이벤트
(function startRollingText(){
  const texts = document.querySelectorAll("[data-text]");
  // 롤링 텍스트 json 배열 생성
  const rollingTexts = upData(upData(upData(elemList(texts),
                      "cont", el => el.el.dataset.text),
                      "scrollRange", () => false),
                      "done", () => false);
  log(rollingTexts);
  
  // 텍스트 롤링 시작!
  rollingTexts.forEach((rollingText) => {
    fireRolling(rollingText);
  
    let scrolling = false;
    window.addEventListener("scroll", () => {
      scrolling = true;
    });
  
    setInterval(() => {
      if (scrolling) {
        scrolling = false;
        fireRolling(rollingText);
      }
    }, 150);
  });
})();
// END: 롤링 텍스트 이벤트

// START: 슬라이더
// 페이저, 컨트롤러, 루프, 프랙션, 오토
(function startSlider(){
  const $sliderWraps = document.querySelectorAll("[data-slider]");
  // 롤링 텍스트 json 배열 생성
  const sliderWraps = upData(upData(upData(upData(upData(
                  elemList($sliderWraps),              
                  "type", elem => elem.el.dataset.slider),
                  "slider", elem => elem.el.querySelector(".slider")),
                  "slides", elem => elem.el.querySelectorAll(".slide")),
                  "activeNum", () => 0),
                  "loop", () => true);
  log(sliderWraps);

  // let i = 0;
  sliderWraps.forEach((sliderWrap) => {    
    const view = sliderWrap.el.querySelector(".view-slider"),
          slider = sliderWrap.slider,
          slides = sliderWrap.slides,
          btnArrows = sliderWrap.el.parentNode.querySelectorAll(".arrow button");
    let _activeNum = sliderWrap.activeNum;
    setDataPrevNext(slides, _activeNum);

    //슬라이더 가로 사이즈 셋팅
    slider.style = "width: "+view.offsetWidth * slides.length + "px; transform: translateX(-"+ view.offsetWidth +"px); transition: 0.5s ease;";
    
    // loop일경우 처음과 끝 이어지게
    if(sliderWrap.loop){
      let clonePrev = slides[slides.length-1].cloneNode(true),
          cloneNext = slides[0].cloneNode(true);
      clonePrev.className += " clone";
      cloneNext.className += " clone";
      clonePrev.dataset.slide = "clone";
      cloneNext.dataset.slide = "clone";

      slider.insertBefore(cloneNext, slider.children[slides.length - 1].nextElementSibling);
      slider.insertBefore(clonePrev, slider.children[0]);      
    }

    // 이전 다음 버튼 클릭 했을 때
    btnArrows.forEach((btnArrow) => {
      btnArrow.addEventListener("click", (e) => {
        const btnData = btnArrow.dataset.btn;
        let activeNum = newActiveNum(btnData, slides.length - 1, _activeNum);
        _activeNum = activeNum;  //클릭한 버튼에 따라 active 슬라이드 index값 변환
        
        resetDataset(slides, "slide"); //슬라이드 dataset 초기화 
        setDataPrevNext(slides, _activeNum); //active 슬라이드 셋팅
        slider.style.transform = "translateX(-"+ view.offsetWidth * (_activeNum+1) +"px)"; //슬라이더 슬라이딩
      });
    });
  });
})();
// END: 슬라이더

// prev, next 클릭시 변하는 active 넘버 반환
function newActiveNum(data, last, activeNum){
  if(activeNum == last && data == "next"){
    activeNum = 0;
  }else if (activeNum == 0 && data == "prev"){
    activeNum = last;
  }else if(data == "next"){
    activeNum = activeNum + 1;
  }else if(data == "prev"){
    activeNum = activeNum - 1;
  }
  return activeNum;
}

// active 넘버에 따라 slide dataset 셋팅.
function setDataPrevNext(slides, _activeNum){
  const activePrevNum = _activeNum != 0 ? _activeNum - 1 : slides.length - 1,
        activeNextNum = _activeNum != slides.length - 1 ? _activeNum + 1 : 0;

  slides[_activeNum].dataset.slide = "active";
  slides[activePrevNum].dataset.slide = "prev";
  slides[activeNextNum].dataset.slide = "next";
}

// dataset 초기화
function resetDataset(elems, datasetName){
  for(const elem of elems){
    elem.dataset[datasetName] = "";
  }
}

// 해당 엘리먼트 오브젝트 포함하여 배열 생성
function elemList(elems) {
  let new_list = [],
    i = 0;
  for (const elem of elems) {
    new_list[i] = {},
      new_list[i].el = elem;
    i++;
  }
  return new_list;
}

// 오브젝트 리스트에 원하는 key, value값 삽입하여 데이터 완성
function upData(objList, key, value) {
  let new_list = objList;
  new_list.forEach(elem => {
    elem[key] = value(elem);
  });
  return new_list;
}

// 숫자라면 true를 줘
function chkNum(value) {
  if (Number(value)) {
    return true
  } else if (isNaN(Number(value))) {
    return false;
  }
}

// 스크롤 범위 맞으면 true를 줘
function chkScrRange(list) {
  let winH = window.innerHeight,
    winScrY = window.scrollY,
    bodyScrH = document.querySelector("body").scrollHeight,
    elemScrTop = list.el.offsetTop;
  
  if (elemScrTop - winH / 2 < winScrY && winScrY < elemScrTop - 20) {
    // 스크롤이 엘리먼트 범위에 들어올 때(엘리먼트 스크롤높이 기준 상하로 winH/2 범위)
    return true;
  } else if (bodyScrH - winH / 2 < elemScrTop && bodyScrH - 20 <= winScrY + winH) {
    // 엘리먼트가 하단에 붙어있을 때(엘리먼트 위치가 바디 스크롤 하단 영역인지 구분 & 스크롤이 하단영역으로 왔는지 구분)
    return true;
  } else {
    return false;
  }
}

// 조건 체크 후 텍스트 롤링
function fireRolling(text) {
  const commonIf = !text.done && chkScrRange(text);
  if (chkNum(text.cont) && commonIf) {
    drawNumber(text.el, 0, text.cont);
    text.done = true;
  } else if (!chkNum(text.cont) && commonIf) {
    drawNaN(text.el, text.cont, 0);
    showNaN(text.el, text.cont, 0);
    text.done = true;
  }
}

// 숫자 카운팅 하면서 그려 ( Number )
function drawNumber(elem, start, limitNum) {
  if (start <= limitNum) {
    setTimeout(() => {
      elem.textContent = start;
      start++;
      drawNumber(elem, start, limitNum);
    }, 1500 / limitNum);
  }
}

// 한 글자씩 셋팅 ( NaN )
function drawNaN(elem, text, start) {
  if (start < text.length) {
    elem.innerHTML += `<span style="opacity:0;">${text.substring(start,start+1)}</span>`;
    start++;
    drawNaN(elem, text, start);
  }
}

// 한 글자씩 show ( NaN )
function showNaN(elem, text, start) {
  if (start < text.length) {
    setTimeout(() => {
      elem.querySelectorAll("span")[start].style = "opacity: 1";
      start++;
      showNaN(elem, text, start);
    }, 800 / text.length);
  }
}