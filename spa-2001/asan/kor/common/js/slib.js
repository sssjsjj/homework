/*jshint esversion: 6*/

/************
  생성자 함수들
************/
//버튼 클릭 생성자 함수
function ClickElem(elems) {
  this.elems = elems;
}
ClickElem.prototype.click = function(callback) {
  this.elems.forEach(el => {
    el.addEventListener("click", (e, a)=>{
      callback(el);      
    });
  });    
};


/************
  미니 함수들
************/
// 클래스명 추가
function addClass(elem, className){
  elem.className += " " + className;
}
// 클래스명 제거
function removeClass(elem, className){
  elem.className = elem.className.replace(" " + className,"");
}
// 클래스값 가지고 있는지 체크
function hasClass(elem, className){
  let arr = elem.className.split(" ");
  if(arr.indexOf(className) > -1){
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
// css 셀럭터로 엘리먼트 선택 - Array
function qSelector(cssSelector){
  const nodeList =  Array.from(document.querySelectorAll(cssSelector));
  // 한개밖에 없을때는
  if( nodeList.length === 1 ){
    return nodeList[0];
  }else{
    return nodeList;
  }
}
