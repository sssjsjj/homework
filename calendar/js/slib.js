/*jshint esversion: 6*/

/************
  생성자 함수들
************/

/************
  미니 함수들
************/
// 클래스명 추가
function addClass(elem, className){
  elem.classList.add(className);
}
// 클래스명 제거
function removeClass(elem, className){
  elem.classList.remove(className);
}
// 클래스명 제거 후 추가
function changeClass(elem, className1, className2){
  elem.classList.remove(className1);
  elem.classList.add(className2);
}
// 클래스값 가지고 있는지 체크
function hasClass(elem, className){
  if(elem.classList.contains(className)){
    return true;
  }else{
    return false;
  }
}
// 모든 엘리먼트 속성 제거
function removeAttrAll(elems, attr){
  elems.forEach(elem => {
    let thisAttr = elem.attributes[attr];
    if(thisAttr){      
      thisAttr.value = ""
    }
  });
}
// 속성값 가지고 있는 엘리먼트 겥
function getElByAttr(elems, attrName, attrValue){
  let that;
  elems.forEach(el => {
    if(el.attributes[attrName].value === attrValue){
      that = el;
    }
  });
  return that;
}
// 클릭 후 콜백
function clickEvent(elems, callBack){
  elems.forEach(elem => {
    elem.addEventListener("click", e => {
      callBack(e);
    });
  });
}
// http request get 실행 함수
function httpGet(url, callBack, catchFun) {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", url);
  xhr.onload = (e) => {
    if(xhr.status == 200) {
      callBack(xhr.responseText);
    } else {
      console.log(url + '' + xhr.status + " / request error.");
    }
  }
  xhr.send();
}
function show(target){
  target.classList.remove("hide");
  target.classList.add("show");
}
function hide(target){
  target.classList.remove("show");
  target.classList.add("hide");
}
function innerHTMLAll(elems, html){
  elems.forEach(elem => {
    elem.innerHTML = html;
  });
}